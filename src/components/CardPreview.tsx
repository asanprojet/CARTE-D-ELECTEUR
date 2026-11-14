import { useEffect, useState } from 'react';
import {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  CardFields,
  PdfFormat,
  TEMPLATE_HEIGHT,
  TEMPLATE_WIDTH,
} from '../types/card';
import { renderCardToDataUrl } from '../utils/renderCardCanvas';

interface CardPreviewProps {
  fields: CardFields;
  pdfFormat: PdfFormat;
}

export function CardPreview({ fields, pdfFormat }: CardPreviewProps) {
  const [renderedSrc, setRenderedSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    renderCardToDataUrl(fields, 1.5)
      .then((url) => {
        if (active) setRenderedSrc(url);
      })
      .catch(() => {
        // Keep previous rendered frame if any
      });

    return () => {
      active = false;
    };
  }, [fields]);

  const cardImageEl = renderedSrc ? (
    <img
      src={renderedSrc}
      alt="Aperçu du modèle de carte d'électeur"
      referrerPolicy="no-referrer"
      className="block w-full h-auto select-none drop-shadow-sm"
    />
  ) : (
    <div
      className="w-full bg-sky-50/70 rounded-xl animate-pulse"
      style={{ aspectRatio: `${TEMPLATE_WIDTH} / ${TEMPLATE_HEIGHT}` }}
    />
  );

  if (pdfFormat === 'cr80') {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-3">
        <div className="w-full max-w-[540px] print-only-sheet">
          {cardImageEl}
        </div>
        <p className="mt-4 text-xs font-mono tabular-nums text-slate-500">
          Page PDF exacte : {CARD_WIDTH_MM.toFixed(1)} × {CARD_HEIGHT_MM.toFixed(1)} mm · Sans bordure
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 sm:px-4">
      {/* Feuille A4 proportionnelle (210 × 297) */}
      <div
        className="w-full max-w-[540px] bg-white shadow-sm p-6 sm:p-8 flex flex-col justify-between print-only-sheet"
        style={{ aspectRatio: '210 / 297' }}
      >
        {pdfFormat === 'a4-large' && (
          <div className="flex flex-col h-full justify-start gap-5">
            <div>{cardImageEl}</div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-900 uppercase mb-2.5">
                Fiche de référence — Carte d&apos;électeur (RDC / CENI)
              </p>
              <div className="grid grid-cols-1 divide-y divide-slate-100 border border-slate-200 text-[11px]">
                {[
                  ['Code CI / Centre', `${fields.codeCi || '—'} · ${fields.nomCi || '—'}`],
                  ['Numéro National', fields.nn || '—'],
                  ['N° Carte', fields.numeroCarte || '—'],
                  ['Nom', fields.nom || '..........................................'],
                  ['Postnom / Prénom', fields.postnomPrenom || '..........................................'],
                  ['Naissance', fields.dateLieuNaissance || '..........................................'],
                  ['Sexe', fields.sexe || '................'],
                  ['Adresse', fields.adresse || '..........................................'],
                  ['Origine', fields.origine || '..........................................'],
                  ['Parents (Père / Mère)', `${fields.nomPere || '........'} / ${fields.nomMere || '........'}`],
                ].map(([label, val], idx) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-4 px-2.5 py-1.5 ${
                      idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                    }`}
                  >
                    <span className="font-medium text-slate-600 shrink-0">{label}</span>
                    <span className="text-slate-900 truncate text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {pdfFormat === 'a4-cr80' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-[46%]">{cardImageEl}</div>
            <p className="text-[11px] font-mono tabular-nums text-slate-500 text-center">
              Échelle 1:1 ({CARD_WIDTH_MM.toFixed(1)} × {CARD_HEIGHT_MM.toFixed(1)} mm) sur A4 (210 × 297 mm)
            </p>
          </div>
        )}

        {pdfFormat === 'a4-grid' && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="grid grid-cols-2 gap-4 w-[92%]">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx}>{cardImageEl}</div>
              ))}
            </div>
            <p className="mt-5 text-[11px] font-mono tabular-nums text-slate-500 text-center">
              4 exemplaires × ({CARD_WIDTH_MM.toFixed(1)} × {CARD_HEIGHT_MM.toFixed(1)} mm) · Repères de découpe inclus
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-mono tabular-nums text-slate-500">
        Format A4 Portrait · 210 × 297 mm · Résolution export 300 DPI
      </p>
    </div>
  );
}
