import { jsPDF } from 'jspdf';
import {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  CardFields,
  PdfFormat,
} from '../types/card';
import { renderCardToDataUrl } from './renderCardCanvas';

function drawCropMarks(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  markLen = 4,
  gap = 1.5
) {
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);

  // Haut gauche
  doc.line(x - gap - markLen, y, x - gap, y);
  doc.line(x, y - gap - markLen, x, y - gap);

  // Haut droit
  doc.line(x + w + gap, y, x + w + gap + markLen, y);
  doc.line(x + w, y - gap - markLen, x + w, y - gap);

  // Bas gauche
  doc.line(x - gap - markLen, y + h, x - gap, y + h);
  doc.line(x, y + h + gap, x, y + h + gap + markLen);

  // Bas droit
  doc.line(x + w + gap, y + h, x + w + gap + markLen, y + h);
  doc.line(x + w, y + h + gap, x + w, y + h + gap + markLen);
}

export async function exportCardToPdf(
  fields: CardFields,
  format: PdfFormat
): Promise<void> {
  const imageDataUrl = await renderCardToDataUrl(fields, 2);

  if (format === 'cr80') {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
      compress: true,
    });

    doc.addImage(imageDataUrl, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM, undefined, 'FAST');
    doc.save('carte-electeur-format-carte.pdf');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;

  if (format === 'a4-large') {
    const width = 176;
    const height = (width * CARD_HEIGHT_MM) / CARD_WIDTH_MM;
    const x = (pageWidth - width) / 2;
    const y = 26;

    doc.addImage(imageDataUrl, 'PNG', x, y, width, height, undefined, 'FAST');

    // Fiche récapitulative imprimée sous la carte
    const startY = y + height + 18;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(x, startY - 5, x + width, startY - 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('FICHE DE RÉFÉRENCE — CARTE D’ÉLECTEUR (RDC / CENI)', x, startY);

    const rows: Array<[string, string]> = [
      ['Code CI / Centre', `${fields.codeCi || '—'} · ${fields.nomCi || '—'}`],
      ['Numéro National (NN)', fields.nn || '—'],
      ['Numéro de carte', fields.numeroCarte || '—'],
      ['Nom', fields.nom || '............................................................'],
      ['Postnom / Prénom', fields.postnomPrenom || '............................................................'],
      ['Date / Lieu de naissance', fields.dateLieuNaissance || '............................................................'],
      ['Sexe', fields.sexe || '....................'],
      ['Adresse', fields.adresse || '............................................................'],
      ['Origine', fields.origine || '............................................................'],
      ['Nom du père', fields.nomPere || '............................................................'],
      ['Nom de la mère', fields.nomMere || '............................................................'],
      [
        'Lieu et date de délivrance',
        `${fields.lieuDelivrance || '—'}  ${fields.dateDelivrance || ''}`.trim(),
      ],
    ];

    let rowY = startY + 9;
    doc.setFontSize(9.5);

    rows.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, rowY - 4.8, width, 7.4, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(label, x + 3, rowY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(value, x + 62, rowY);

      rowY += 8;
    });

    doc.save('carte-electeur-a4.pdf');
    return;
  }

  if (format === 'a4-cr80') {
    const x = (pageWidth - CARD_WIDTH_MM) / 2;
    const y = (pageHeight - CARD_HEIGHT_MM) / 2 - 20;

    doc.addImage(imageDataUrl, 'PNG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, undefined, 'FAST');
    drawCropMarks(doc, x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Format réel : ${CARD_WIDTH_MM.toFixed(1)} × ${CARD_HEIGHT_MM.toFixed(1)} mm (échelle 1:1 pour impression A4)`,
      pageWidth / 2,
      y + CARD_HEIGHT_MM + 12,
      { align: 'center' }
    );

    doc.save('carte-electeur-taille-reelle-a4.pdf');
    return;
  }

  // format === 'a4-grid' (Planche A4 : 4 exemplaires 2×2)
  const gapX = 12;
  const gapY = 14;
  const gridW = CARD_WIDTH_MM * 2 + gapX;
  const gridH = CARD_HEIGHT_MM * 2 + gapY;
  const startX = (pageWidth - gridW) / 2;
  const startY = (pageHeight - gridH) / 2;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const cx = startX + col * (CARD_WIDTH_MM + gapX);
      const cy = startY + row * (CARD_HEIGHT_MM + gapY);
      doc.addImage(imageDataUrl, 'PNG', cx, cy, CARD_WIDTH_MM, CARD_HEIGHT_MM, undefined, 'FAST');
      drawCropMarks(doc, cx, cy, CARD_WIDTH_MM, CARD_HEIGHT_MM);
    }
  }

  doc.save('carte-electeur-planche-4x-a4.pdf');
}
