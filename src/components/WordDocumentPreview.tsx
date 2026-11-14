import { useEffect, useState } from 'react';
import {
  CardFields,
  DocxMode,
  TEMPLATE_HEIGHT,
  TEMPLATE_WIDTH,
} from '../types/card';
import { renderCardToDataUrl } from '../utils/renderCardCanvas';

interface WordDocumentPreviewProps {
  fields: CardFields;
  docxMode: DocxMode;
}

export function WordDocumentPreview({
  fields,
  docxMode,
}: WordDocumentPreviewProps) {
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

  const cardImg = renderedSrc ? (
    <img
      src={renderedSrc}
      alt="Modèle de carte dans Word"
      referrerPolicy="no-referrer"
      className="w-full h-auto block select-none"
    />
  ) : (
    <div
      className="w-full bg-sky-50/70 rounded-xl animate-pulse"
      style={{ aspectRatio: `${TEMPLATE_WIDTH} / ${TEMPLATE_HEIGHT}` }}
    />
  );

  const tableRows: Array<[string, string]> = [
    ['CODE CI', fields.codeCi],
    ['NOM CI', fields.nomCi],
    ['Numéro National (NN)', fields.nn],
    ['Numéro de carte', fields.numeroCarte],
    ['Nom', fields.nom],
    ['Postnom / Prénom', fields.postnomPrenom],
    [
      'Date / Lieu de naissance',
      [fields.dateNaissance.trim(), fields.lieuNaissance.trim()]
        .filter(Boolean)
        .join(' — '),
    ],
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

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 sm:px-4">
      <div
        className="w-full max-w-[540px] bg-white shadow-sm p-6 sm:p-8 flex flex-col gap-4 print-only-sheet"
        style={{ minHeight: '700px' }}
      >
        {docxMode === 'image-only' && (
          <div className="flex flex-col items-center gap-6 my-auto">
            {cardImg}
            <p className="text-[11px] text-slate-500 text-center">
              Format carte standard : 85,6 × 55,5 mm (exemplaire prêt à imprimer ci-dessous)
            </p>
            <div className="w-[54%]">{cardImg}</div>
          </div>
        )}

        {docxMode === 'combined' && (
          <>
            <p className="text-xs font-bold tracking-tight text-slate-900">
              CARTE D&apos;ÉLECTEUR — MODÈLE VISUEL ET FICHE MODIFIABLE
            </p>
            <div>{cardImg}</div>
            <p className="text-[11px] font-semibold text-slate-800 pt-1">
              Informations détaillées (champs modifiables dans Word)
            </p>
            <div className="border border-slate-300 text-[11px]">
              {tableRows.map(([label, val], idx) => (
                <div
                  key={label}
                  className={`grid grid-cols-12 border-b last:border-b-0 border-slate-200 ${
                    idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <div className="col-span-5 px-2.5 py-1 font-semibold text-slate-700 border-r border-slate-200">
                    {label}
                  </div>
                  <div
                    className={`col-span-7 px-2.5 py-1 ${
                      val.trim() ? 'font-semibold text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {val.trim() || '...........................................'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {docxMode === 'editable-only' && (
          <>
            <p className="text-xs font-bold tracking-tight text-slate-900">
              CARTE D&apos;ÉLECTEUR — MODÈLE WORD MODIFIABLE
            </p>
            <div className="border border-sky-600 text-[11px]">
              <div className="bg-sky-50 px-3 py-2.5 text-center border-b border-slate-200">
                <div className="font-bold text-slate-900 text-xs">
                  RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </div>
                <div className="font-semibold text-slate-700 text-[10px] mt-0.5">
                  COMMISSION ÉLECTORALE NATIONALE INDÉPENDANTE (CENI)
                </div>
                <div className="font-bold text-sky-600 text-sm mt-1">
                  CARTE D&apos;ÉLECTEUR
                </div>
              </div>
              <div className="grid grid-cols-3 h-1.5">
                <div className="bg-[#007FFF]" />
                <div className="bg-[#CE1021]" />
                <div className="bg-[#F7D618]" />
              </div>
              <div className="grid grid-cols-3 bg-sky-50/60 border-b border-slate-200 divide-x divide-slate-200 text-[10px]">
                <div className="px-2 py-1.5">
                  <span className="font-semibold text-slate-500">CODE CI : </span>
                  <span className="font-bold text-slate-900">{fields.codeCi || '6031029'}</span>
                </div>
                <div className="px-2 py-1.5">
                  <span className="font-semibold text-slate-500">NOM CI : </span>
                  <span className="font-bold text-slate-900">{fields.nomCi || 'INSTITUT MIKENO'}</span>
                </div>
                <div className="px-2 py-1.5">
                  <span className="font-semibold text-slate-500">NN : </span>
                  <span className="font-bold text-slate-900">{fields.nn || '33663829302'}</span>
                </div>
              </div>
              <div className="grid grid-cols-12 border-b border-slate-200 divide-x divide-slate-200">
                <div className="col-span-3 p-2.5 flex flex-col items-center justify-between gap-2">
                  {fields.photoDataUrl ? (
                    <img
                      src={fields.photoDataUrl}
                      alt="Photo"
                      className="w-20 h-24 object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-20 h-24 border border-dashed border-slate-300 flex items-center justify-center text-[10px] font-semibold text-slate-400 text-center">
                      PHOTO
                    </div>
                  )}
                  <span className="font-mono font-semibold text-[10px] text-slate-900">
                    {fields.numeroCarte || 'A58392266'}
                  </span>
                </div>
                <div className="col-span-6 p-2.5 space-y-1.5 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-800">Nom : </span>
                    <span className="font-bold text-slate-900">{fields.nom || '_________________'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Postnom/Prénom : </span>
                    <span className="font-bold text-slate-900">{fields.postnomPrenom || '___________'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Date/Lieu de naissance : </span>
                    <span className="font-bold text-slate-900">{fields.dateNaissance || '___________'}</span>
                    {fields.lieuNaissance.trim() && (
                      <div className="font-bold text-slate-900 mt-0.5">
                        {fields.lieuNaissance.trim().toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Sexe : </span>
                    <span className="font-bold text-slate-900">{fields.sexe || '_______'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Adresse : </span>
                    <span className="font-bold text-slate-900">{fields.adresse || '_______________'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Origine : </span>
                    <span className="font-bold text-slate-900">{fields.origine || '_______________'}</span>
                  </div>
                </div>
                <div className="col-span-3 p-2.5 flex items-center justify-center">
                  {fields.qrDataUrl ? (
                    <img
                      src={fields.qrDataUrl}
                      alt="Code QR"
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-[9px] font-semibold text-slate-400 text-center">
                      CODE QR
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-200 text-[10px]">
                <div className="col-span-5 p-2 space-y-0.5">
                  <div>
                    <span className="italic text-slate-600">Nom du père : </span>
                    <span className="italic text-slate-900">{fields.nomPere || '_________'}</span>
                  </div>
                  <div>
                    <span className="italic text-slate-600">Nom de la mère : </span>
                    <span className="italic text-slate-900">{fields.nomMere || '________'}</span>
                  </div>
                </div>
                <div className="col-span-4 p-2">
                  <div className="font-semibold text-slate-700">Lieu et date de délivrance</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {`${fields.lieuDelivrance || 'Goma ville'} ${fields.dateDelivrance || '12/04/2023'}`.trim()}
                  </div>
                </div>
                <div className="col-span-3 p-2 flex items-end justify-center font-bold text-[9px] text-slate-900 text-center">
                  {fields.signataire || 'SIRADJI NYALAMBA KIVU'}
                </div>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-800 pt-2">
              Tableau récapitulatif des champs
            </p>
            <div className="border border-slate-300 text-[11px]">
              {tableRows.slice(4, 12).map(([label, val], idx) => (
                <div
                  key={label}
                  className={`grid grid-cols-12 border-b last:border-b-0 border-slate-200 ${
                    idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <div className="col-span-5 px-2.5 py-1 font-semibold text-slate-700 border-r border-slate-200">
                    {label}
                  </div>
                  <div className="col-span-7 px-2.5 py-1 text-slate-700">
                    {val.trim() || '...........................................'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs font-mono tabular-nums text-slate-500">
        Document Microsoft Word (.docx) · Page A4 · Éditable dans Word, LibreOffice et Google Docs
      </p>
    </div>
  );
}
