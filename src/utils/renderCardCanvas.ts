import {
  CardFields,
  TEMPLATE_CORNER_RADIUS,
  TEMPLATE_CROP_X,
  TEMPLATE_CROP_Y,
  TEMPLATE_HEIGHT,
  TEMPLATE_IMAGE_PATH,
  TEMPLATE_WIDTH,
} from '../types/card';

const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Impossible de charger l'image : ${src}`));
    img.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  padding: number
) {
  const innerW = dw - padding * 2;
  const innerH = dh - padding * 2;
  const scale = Math.min(innerW / img.naturalWidth, innerH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = dx + (dw - w) / 2;
  const y = dy + (dh - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const words = trimmed.split(/\s+/);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY, maxWidth);
      lineCount += 1;
      if (lineCount >= maxLines) return;
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY, maxWidth);
  }
}

export async function renderCardToCanvas(
  fields: CardFields,
  scale = 2
): Promise<HTMLCanvasElement> {
  const baseImg = await loadImage(TEMPLATE_IMAGE_PATH);

  const canvas = document.createElement('canvas');
  canvas.width = TEMPLATE_WIDTH * scale;
  canvas.height = TEMPLATE_HEIGHT * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexte graphique 2D indisponible.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);

  // Découpe propre aux coins arrondis pour supprimer tout contour et coin noir
  ctx.beginPath();
  ctx.roundRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT, TEMPLATE_CORNER_RADIUS);
  ctx.clip();

  // Fond du modèle recadré sans bordure noire
  ctx.drawImage(
    baseImg,
    TEMPLATE_CROP_X,
    TEMPLATE_CROP_Y,
    TEMPLATE_WIDTH,
    TEMPLATE_HEIGHT,
    0,
    0,
    TEMPLATE_WIDTH,
    TEMPLATE_HEIGHT
  );

  // Zone photo (rectangle blanc gauche)
  if (fields.photoDataUrl) {
    try {
      const photoImg = await loadImage(fields.photoDataUrl);
      drawCoverImage(ctx, photoImg, 22, 224, 332, 388);
    } catch {
      // Ignore invalid photo data URL
    }
  }

  // Zone QR / cachet (carré blanc droit)
  if (fields.qrDataUrl) {
    try {
      const qrImg = await loadImage(fields.qrDataUrl);
      drawContainImage(ctx, qrImg, 953, 416, 210, 187, 8);
    } catch {
      // Ignore invalid QR data URL
    }
  }

  // Champs texte principaux — même mise en forme (gras, taille, couleur) que leurs titres
  ctx.fillStyle = '#0A0A0A';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 30px "DM Sans", Arial, sans-serif';

  if (fields.nom.trim()) {
    ctx.fillText(fields.nom.trim().toUpperCase(), 486, 249, 420);
  }

  if (fields.sexe.trim()) {
    ctx.fillText(fields.sexe.trim().toUpperCase(), 1072, 258, 130);
  }

  if (fields.postnomPrenom.trim()) {
    ctx.fillText(fields.postnomPrenom.trim().toUpperCase(), 678, 303, 535);
  }

  ctx.font = '700 28px "DM Sans", Arial, sans-serif';
  if (fields.dateLieuNaissance.trim()) {
    ctx.fillText(fields.dateLieuNaissance.trim(), 756, 349, 460);
  }

  if (fields.adresse.trim()) {
    drawWrappedText(ctx, fields.adresse.trim(), 542, 449, 385, 36, 2);
  }

  if (fields.origine.trim()) {
    ctx.fillText(fields.origine.trim(), 528, 580, 395);
  }

  // Bande inférieure (parents) — même style italique que leurs titres
  ctx.font = 'italic 500 21px "DM Sans", Arial, sans-serif';
  if (fields.nomPere.trim()) {
    ctx.fillText(fields.nomPere.trim(), 208, 724, 295);
  }

  if (fields.nomMere.trim()) {
    ctx.fillText(fields.nomMere.trim(), 224, 758, 280);
  }

  // Remplacement propre de "Goma ville" et de la date de délivrance sur la bande blanche (gras)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(538, 744, 315, 34);

  ctx.fillStyle = '#0A0A0A';
  ctx.font = '700 22px "DM Sans", Arial, sans-serif';
  if (fields.lieuDelivrance.trim()) {
    ctx.fillText(fields.lieuDelivrance.trim(), 544, 767, 162);
  }
  if (fields.dateDelivrance.trim()) {
    ctx.fillText(fields.dateDelivrance.trim(), 716, 767, 134);
  }

  return canvas;
}

export async function renderCardToDataUrl(
  fields: CardFields,
  scale = 2
): Promise<string> {
  const canvas = await renderCardToCanvas(fields, scale);
  return canvas.toDataURL('image/png');
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Index = dataUrl.indexOf('base64,');
  const base64 = base64Index !== -1 ? dataUrl.slice(base64Index + 7) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
