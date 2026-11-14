export interface PhotoProcessOptions {
  grayscaleGradient: boolean;
  removeBackground: boolean;
  bgTolerance: number; // 15..85 (default 42)
  contrast: number; // 0.8..1.6 (default 1.15)
  edgeFade: boolean; // léger dégradé vers le blanc sur les bords inférieurs
}

export const DEFAULT_PHOTO_OPTIONS: PhotoProcessOptions = {
  grayscaleGradient: true,
  removeBackground: true,
  bgTolerance: 42,
  contrast: 1.15,
  edgeFade: true,
};

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger la photo."));
    img.src = src;
  });
}

function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
}

/**
 * Supprime l'arrière-plan connecté aux bords (haut, gauche, droite) via BFS
 * avec lissage doux des contours pour préserver le visage et les vêtements.
 */
function computeForegroundAlpha(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance: number
): Uint8Array {
  const total = w * h;
  const alpha = new Uint8Array(total);
  alpha.fill(255);

  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  // Échantillonnage de la couleur moyenne des bords supérieurs et latéraux
  const samples: Array<[number, number, number]> = [];
  const pushSample = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  };

  for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 24))) {
    pushSample(x, 0);
    pushSample(x, Math.min(h - 1, 2));
  }
  const sideMaxY = Math.floor(h * 0.72);
  for (let y = 0; y < sideMaxY; y += Math.max(1, Math.floor(h / 20))) {
    pushSample(0, y);
    pushSample(w - 1, y);
  }

  // Ensemencement BFS depuis le haut, la gauche et la droite
  const enqueue = (idx: number) => {
    if (!visited[idx]) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    enqueue(x);
  }
  for (let y = 0; y < sideMaxY; y++) {
    enqueue(y * w);
    enqueue(y * w + (w - 1));
  }

  const minSampleDist = (r: number, g: number, b: number) => {
    let best = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const d = colorDist(r, g, b, s[0], s[1], s[2]);
      if (d < best) best = d;
    }
    return best;
  };

  const stepThreshold = Math.max(10, tolerance * 0.48);

  while (head < tail) {
    const cur = queue[head++];
    const ci = cur * 4;
    const cr = data[ci];
    const cg = data[ci + 1];
    const cb = data[ci + 2];

    // Considère le pixel comme arrière-plan s'il est proche d'une couleur de bordure
    const dGlobal = minSampleDist(cr, cg, cb);
    if (dGlobal > tolerance) continue;

    alpha[cur] = 0;

    const x = cur % w;
    const y = (cur - x) / w;

    const tryNeighbor = (nx: number, ny: number) => {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) return;
      const nIdx = ny * w + nx;
      if (visited[nIdx]) return;
      const ni = nIdx * 4;
      const dLocal = colorDist(cr, cg, cb, data[ni], data[ni + 1], data[ni + 2]);
      const dEdge = minSampleDist(data[ni], data[ni + 1], data[ni + 2]);
      if (dEdge <= tolerance && dLocal <= stepThreshold) {
        visited[nIdx] = 1;
        queue[tail++] = nIdx;
      }
    };

    tryNeighbor(x + 1, y);
    tryNeighbor(x - 1, y);
    tryNeighbor(x, y + 1);
    tryNeighbor(x, y - 1);
  }

  // Passe de lissage (3x3) pour adoucir la transition contour/fond
  const smoothed = new Uint8Array(total);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (alpha[idx] === 0) {
        smoothed[idx] = 0;
        continue;
      }
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += alpha[ny * w + nx];
          count++;
        }
      }
      const avg = sum / count;
      // Garde l'intérieur opaque, adoucit uniquement la bordure
      smoothed[idx] = avg < 255 ? Math.round(avg) : 255;
    }
  }

  return smoothed;
}

export async function processPortraitPhoto(
  rawDataUrl: string,
  options: PhotoProcessOptions
): Promise<string> {
  const img = await loadHtmlImage(rawDataUrl);

  const maxDim = 560;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return rawDataUrl;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const fgAlpha = options.removeBackground
    ? computeForegroundAlpha(data, w, h, options.bgTolerance)
    : null;

  for (let y = 0; y < h; y++) {
    // Léger dégradé vers le blanc tout en bas et sur les bords latéraux extrêmes (style carte d'électeur)
    const bottomFade = options.edgeFade
      ? y > h * 0.9
        ? Math.max(0, 1 - (y - h * 0.9) / (h * 0.1))
        : 1
      : 1;

    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      const i = pIdx * 4;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const origA = data[i + 3] / 255;

      // Conversion en noir et blanc dégradé (niveaux de gris avec contraste doux)
      if (options.grayscaleGradient) {
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // Courbe tonale douce pour un rendu dégradé réaliste
        gray = (gray - 128) * options.contrast + 132;
        gray = Math.max(12, Math.min(248, gray));
        r = gray;
        g = gray;
        b = gray;
      }

      const maskAlpha = fgAlpha ? fgAlpha[pIdx] / 255 : 1;
      const finalAlpha = origA * maskAlpha * bottomFade;

      // Fusion propre sur fond blanc (#FFFFFF)
      data[i] = Math.round(r * finalAlpha + 255 * (1 - finalAlpha));
      data[i + 1] = Math.round(g * finalAlpha + 255 * (1 - finalAlpha));
      data[i + 2] = Math.round(b * finalAlpha + 255 * (1 - finalAlpha));
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
