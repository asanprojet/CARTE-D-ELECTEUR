import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import {
  CardFields,
  DocxMode,
  TEMPLATE_HEIGHT,
  TEMPLATE_WIDTH,
} from '../types/card';
import { dataUrlToUint8Array, renderCardToDataUrl } from './renderCardCanvas';

const BORDER_LIGHT = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: 'CBD5E1',
};

const BORDER_NONE = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF',
};

function makeFieldRow(label: string, value: string, shaded = false): TableRow {
  const cellShading = shaded
    ? { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' }
    : undefined;

  return new TableRow({
    children: [
      new TableCell({
        width: { size: 36, type: WidthType.PERCENTAGE },
        shading: cellShading,
        margins: { top: 90, bottom: 90, left: 140, right: 140 },
        borders: {
          top: BORDER_LIGHT,
          bottom: BORDER_LIGHT,
          left: BORDER_LIGHT,
          right: BORDER_LIGHT,
        },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                font: 'Calibri',
                color: '334155',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 64, type: WidthType.PERCENTAGE },
        shading: cellShading,
        margins: { top: 90, bottom: 90, left: 140, right: 140 },
        borders: {
          top: BORDER_LIGHT,
          bottom: BORDER_LIGHT,
          left: BORDER_LIGHT,
          right: BORDER_LIGHT,
        },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value.trim() ? value.trim() : '........................................................',
                bold: Boolean(value.trim()),
                size: 20,
                font: 'Calibri',
                color: value.trim() ? '0F172A' : '94A3B8',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildEditableCardReplica(
  fields: CardFields,
  photoBytes: Uint8Array | null,
  qrBytes: Uint8Array | null
): Table {
  // Reconstitution 100 % modifiable de la structure de la carte dans Word
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 10, color: '0284C7' },
      bottom: { style: BorderStyle.SINGLE, size: 10, color: '0284C7' },
      left: { style: BorderStyle.SINGLE, size: 10, color: '0284C7' },
      right: { style: BorderStyle.SINGLE, size: 10, color: '0284C7' },
      insideHorizontal: BORDER_LIGHT,
      insideVertical: BORDER_LIGHT,
    },
    rows: [
      // En-tête République & CENI
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            shading: { type: ShadingType.CLEAR, fill: 'E0F2FE', color: 'auto' },
            margins: { top: 140, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO',
                    bold: true,
                    size: 24,
                    font: 'Calibri',
                    color: '0F172A',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: 'COMMISSION ÉLECTORALE NATIONALE INDÉPENDANTE (CENI)',
                    bold: true,
                    size: 18,
                    font: 'Calibri',
                    color: '1E293B',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "CARTE D'ÉLECTEUR",
                    bold: true,
                    size: 26,
                    font: 'Calibri',
                    color: '0284C7',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Bande tricolore RDC (Bleu / Rouge / Jaune)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: '007FFF', color: 'auto' },
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
            borders: { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'CE1021', color: 'auto' },
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
            borders: { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'F7D618', color: 'auto' },
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
            borders: { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE },
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
      // Ligne Code CI / Nom CI / NN
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F0F9FF', color: 'auto' },
            margins: { top: 90, bottom: 90, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'CODE CI : ', bold: true, size: 18, color: '475569' }),
                  new TextRun({ text: fields.codeCi || '6031029', bold: true, size: 19, color: '0F172A' }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F0F9FF', color: 'auto' },
            margins: { top: 90, bottom: 90, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'NOM CI : ', bold: true, size: 18, color: '475569' }),
                  new TextRun({ text: fields.nomCi || 'INSTITUT MIKENO', bold: true, size: 19, color: '0F172A' }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F0F9FF', color: 'auto' },
            margins: { top: 90, bottom: 90, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'NN : ', bold: true, size: 18, color: '475569' }),
                  new TextRun({ text: fields.nn || '33663829302', bold: true, size: 19, color: '0F172A' }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Corps principal : Photo + Identité + QR
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 140, right: 140 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              photoBytes
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: 'png',
                        data: photoBytes,
                        transformation: { width: 120, height: 140 },
                      }),
                    ],
                  })
                : new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400, after: 400 },
                    children: [
                      new TextRun({
                        text: 'PHOTO\nIDENTITÉ',
                        bold: true,
                        size: 18,
                        color: '94A3B8',
                      }),
                    ],
                  }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: fields.numeroCarte || 'A58392266',
                    bold: true,
                    size: 19,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: 'Nom : ', bold: true, size: 20, color: '1E293B' }),
                  new TextRun({ text: fields.nom || '________________________', bold: Boolean(fields.nom.trim()), size: 20, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: 'Postnom/Prénom : ', bold: true, size: 20, color: '1E293B' }),
                  new TextRun({ text: fields.postnomPrenom || '__________________', bold: Boolean(fields.postnomPrenom.trim()), size: 20, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: 'Date/Lieu de naissance : ', bold: true, size: 20, color: '1E293B' }),
                  new TextRun({ text: fields.dateLieuNaissance || '_______________', bold: Boolean(fields.dateLieuNaissance.trim()), size: 20, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: 'Sexe : ', bold: true, size: 20, color: '1E293B' }),
                  new TextRun({ text: fields.sexe || '__________', bold: Boolean(fields.sexe.trim()), size: 20, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: 'Adresse : ', bold: true, size: 20, color: '1E293B' }),
                  new TextRun({ text: fields.adresse || '______________________', bold: Boolean(fields.adresse.trim()), size: 20, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Origine : ', bold: true, size: 20, color: '1E293B' }),
                  new TextRun({ text: fields.origine || '______________________', bold: Boolean(fields.origine.trim()), size: 20, color: '0F172A' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              qrBytes
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: 'png',
                        data: qrBytes,
                        transformation: { width: 96, height: 96 },
                      }),
                    ],
                  })
                : new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 320, after: 320 },
                    children: [
                      new TextRun({
                        text: 'CODE QR',
                        bold: true,
                        size: 16,
                        color: '94A3B8',
                      }),
                    ],
                  }),
            ],
          }),
        ],
      }),
      // Pied de carte : Filiation & délivrance
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({ text: 'Nom du père : ', italics: true, size: 18, color: '334155' }),
                  new TextRun({ text: fields.nomPere || '______________', italics: Boolean(fields.nomPere.trim()), size: 18, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Nom de la mère : ', italics: true, size: 18, color: '334155' }),
                  new TextRun({ text: fields.nomMere || '____________', italics: Boolean(fields.nomMere.trim()), size: 18, color: '0F172A' }),
                ],
              }),
            ],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({ text: 'Lieu et date de délivrance', bold: true, size: 18, color: '334155' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      `${fields.lieuDelivrance || 'Goma ville'}  ${fields.dateDelivrance || '12/04/2023'}`.trim(),
                    bold: true,
                    size: 18,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: fields.signataire || 'SIRADJI NYALAMBA KIVU',
                    bold: true,
                    size: 16,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildStructuredFieldsTable(fields: CardFields): Table {
  const rowsData: Array<[string, string]> = [
    ['CODE CI', fields.codeCi],
    ['NOM CI', fields.nomCi],
    ['Numéro National (NN)', fields.nn],
    ['Numéro de carte', fields.numeroCarte],
    ['Nom', fields.nom],
    ['Postnom / Prénom', fields.postnomPrenom],
    ['Date / Lieu de naissance', fields.dateLieuNaissance],
    ['Sexe', fields.sexe],
    ['Adresse', fields.adresse],
    ['Origine', fields.origine],
    ['Nom du père', fields.nomPere],
    ['Nom de la mère', fields.nomMere],
    [
      'Lieu et date de délivrance',
      `${fields.lieuDelivrance}  ${fields.dateDelivrance}`.trim(),
    ],
    ['Autorité / Signataire', fields.signataire],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rowsData.map(([label, value], idx) =>
      makeFieldRow(label, value, idx % 2 === 0)
    ),
  });
}

async function normalizeImageToPngBytes(dataUrl: string | null): Promise<Uint8Array | null> {
  if (!dataUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(dataUrlToUint8Array(canvas.toDataURL('image/png')));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function exportCardToDocx(
  fields: CardFields,
  mode: DocxMode
): Promise<void> {
  const cardDataUrl = await renderCardToDataUrl(fields, 2);
  const cardBytes = dataUrlToUint8Array(cardDataUrl);

  // Largeur A4 utile ≈ 560 px (environ 148 mm) pour une lisibilité parfaite dans Word
  const displayWidthPx = 560;
  const displayHeightPx = Math.round((displayWidthPx * TEMPLATE_HEIGHT) / TEMPLATE_WIDTH);

  const children: Array<Paragraph | Table> = [];

  if (mode === 'image-only') {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 280 },
        children: [
          new ImageRun({
            type: 'png',
            data: cardBytes,
            transformation: {
              width: displayWidthPx,
              height: displayHeightPx,
            },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: 'Format carte standard : 85,6 × 56,2 mm (exemplaire prêt à imprimer ci-dessous)',
            size: 18,
            color: '64748B',
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new ImageRun({
            type: 'png',
            data: cardBytes,
            transformation: {
              width: 324,
              height: 213,
            },
          }),
        ],
      })
    );
  } else if (mode === 'editable-only') {
    const [photoBytes, qrBytes] = await Promise.all([
      normalizeImageToPngBytes(fields.photoDataUrl),
      normalizeImageToPngBytes(fields.qrDataUrl),
    ]);

    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: "CARTE D'ÉLECTEUR — MODÈLE WORD MODIFIABLE",
            bold: true,
            size: 26,
            font: 'Calibri',
            color: '0F172A',
          }),
        ],
      }),
      buildEditableCardReplica(fields, photoBytes, qrBytes),
      new Paragraph({
        spacing: { before: 320, after: 120 },
        children: [
          new TextRun({
            text: 'Tableau récapitulatif des champs',
            bold: true,
            size: 22,
            font: 'Calibri',
            color: '1E293B',
          }),
        ],
      }),
      buildStructuredFieldsTable(fields)
    );
  } else {
    // mode === 'combined'
    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: "CARTE D'ÉLECTEUR — MODÈLE VISUEL ET FICHE MODIFIABLE",
            bold: true,
            size: 24,
            font: 'Calibri',
            color: '0F172A',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 280 },
        children: [
          new ImageRun({
            type: 'png',
            data: cardBytes,
            transformation: {
              width: displayWidthPx,
              height: displayHeightPx,
            },
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 160, after: 120 },
        children: [
          new TextRun({
            text: 'Informations détaillées (champs modifiables dans Word)',
            bold: true,
            size: 22,
            font: 'Calibri',
            color: '1E293B',
          }),
        ],
      }),
      buildStructuredFieldsTable(fields)
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    mode === 'editable-only'
      ? 'carte-electeur-modifiable.docx'
      : mode === 'image-only'
      ? 'carte-electeur-modele.docx'
      : 'carte-electeur-complet.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
