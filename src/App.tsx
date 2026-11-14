import { ChangeEvent, useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Printer,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { CardPreview } from './components/CardPreview';
import { WordDocumentPreview } from './components/WordDocumentPreview';
import {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  CardFields,
  DEFAULT_CARD_FIELDS,
  DocxMode,
  PdfFormat,
  PreviewTab,
  TEMPLATE_HEIGHT,
  TEMPLATE_WIDTH,
} from './types/card';
import { exportCardToDocx } from './utils/exportDocx';
import { exportCardToPdf } from './utils/exportPdf';
import {
  PhotoProcessOptions,
  processPortraitPhoto,
} from './utils/processPortraitPhoto';

const PDF_OPTIONS: Array<{ id: PdfFormat; label: string; detail: string }> = [
  { id: 'cr80', label: 'Carte seule', detail: 'Sans contour ni marge' },
  { id: 'a4-large', label: 'A4 + Fiche', detail: 'Carte agrandie + tableau' },
  { id: 'a4-cr80', label: 'A4 Taille réelle', detail: '85,6 × 55,5 mm centrée' },
  { id: 'a4-grid', label: 'Planche A4 (4×)', detail: '4 cartes avec découpe' },
];

const DOCX_OPTIONS: Array<{ id: DocxMode; label: string; detail: string }> = [
  { id: 'combined', label: 'Visuel + Tableau', detail: 'Image + champs éditables' },
  { id: 'image-only', label: 'Image seule', detail: 'Modèle visuel prêt à imprimer' },
  { id: 'editable-only', label: '100 % Modifiable', detail: 'Tableaux Word éditables' },
];

export default function App() {
  const [fields, setFields] = useState<CardFields>(DEFAULT_CARD_FIELDS);
  const [pdfFormat, setPdfFormat] = useState<PdfFormat>('cr80');
  const [docxMode, setDocxMode] = useState<DocxMode>('combined');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('card');
  const [showAdminRefs, setShowAdminRefs] = useState(false);

  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const updateField = <K extends keyof CardFields>(key: K, value: CardFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const updatePhotoOption = <K extends keyof PhotoProcessOptions>(
    key: K,
    value: PhotoProcessOptions[K]
  ) => {
    setFields((prev) => ({
      ...prev,
      photoOptions: { ...prev.photoOptions, [key]: value },
    }));
  };

  // Re-traite automatiquement la photo (N&B dégradé + suppression arrière-plan)
  useEffect(() => {
    if (!fields.rawPhotoDataUrl) return;
    let active = true;
    setProcessingPhoto(true);
    processPortraitPhoto(fields.rawPhotoDataUrl, fields.photoOptions)
      .then((processed) => {
        if (active) {
          setFields((prev) => ({ ...prev, photoDataUrl: processed }));
        }
      })
      .catch(() => {
        if (active) {
          setFields((prev) => ({ ...prev, photoDataUrl: prev.rawPhotoDataUrl }));
        }
      })
      .finally(() => {
        if (active) setProcessingPhoto(false);
      });

    return () => {
      active = false;
    };
  }, [fields.rawPhotoDataUrl, fields.photoOptions]);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('rawPhotoDataUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQrUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('qrDataUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearPhoto = () => {
    setFields((prev) => ({
      ...prev,
      rawPhotoDataUrl: null,
      photoDataUrl: null,
    }));
  };

  const handleReset = () => {
    setFields(DEFAULT_CARD_FIELDS);
    setFeedback({
      type: 'success',
      message: 'Les champs ont été réinitialisés au modèle d’origine.',
    });
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    setFeedback(null);
    try {
      await exportCardToPdf(fields, pdfFormat);
      setFeedback({
        type: 'success',
        message: 'Fichier PDF généré et téléchargé avec succès.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la génération du fichier PDF.',
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setExportingDocx(true);
    setFeedback(null);
    try {
      await exportCardToDocx(fields, docxMode);
      setFeedback({
        type: 'success',
        message: 'Fichier Microsoft Word (.docx) généré et téléchargé avec succès.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la génération du document Word.',
      });
    } finally {
      setExportingDocx(false);
    }
  };

  const hasCustomContent = Boolean(
    fields.nom ||
      fields.postnomPrenom ||
      fields.dateLieuNaissance ||
      fields.sexe ||
      fields.adresse ||
      fields.origine ||
      fields.nomPere ||
      fields.nomMere ||
      fields.lieuDelivrance !== DEFAULT_CARD_FIELDS.lieuDelivrance ||
      fields.dateDelivrance !== DEFAULT_CARD_FIELDS.dateDelivrance ||
      fields.rawPhotoDataUrl ||
      fields.qrDataUrl
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract : 1 ligne, 3 zones */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#apercu"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            DocuCarte Studio
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#apercu"
              onClick={() => setPreviewTab('card')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Carte
            </a>
            <a
              href="#champs-modele"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Saisie directe
            </a>
            <a
              href="#formats-export"
              onClick={() => setPreviewTab('card')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Version PDF
            </a>
            <a
              href="#formats-export"
              onClick={() => setPreviewTab('word')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Version Word
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{exportingPdf ? 'Export PDF...' : 'Télécharger PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barre d'espace de travail */}
      <div className="no-print bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Remplissage automatique &amp; Export PDF / Word
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span>{TEMPLATE_WIDTH} × {TEMPLATE_HEIGHT} px</span>
              <span aria-hidden="true">·</span>
              <span>{CARD_WIDTH_MM.toFixed(1)} × {CARD_HEIGHT_MM.toFixed(1)} mm</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">
                Photo N&amp;B dégradé sans arrière-plan · Champs synchronisés
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="Type d'aperçu"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200"
            >
              <button
                type="button"
                role="tab"
                aria-selected={previewTab === 'card'}
                onClick={() => setPreviewTab('card')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  previewTab === 'card'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aperçu Carte / PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={previewTab === 'word'}
                onClick={() => setPreviewTab('word')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  previewTab === 'word'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aperçu Word (.docx)
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={exportingDocx}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>{exportingDocx ? 'Export Word...' : 'Télécharger Word (.docx)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal : Carte à gauche + Zones à saisir juste à côté */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {feedback && (
          <div
            role="status"
            className={`no-print mb-6 px-4 py-3 rounded-lg border text-sm flex items-center justify-between gap-4 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2.5 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne gauche : Carte en direct */}
          <section
            id="apercu"
            className="lg:col-span-6 lg:sticky lg:top-20 bg-slate-100/80 border border-slate-200 rounded-xl p-4 sm:p-6"
          >
            <div className="no-print flex items-center justify-between gap-4 pb-4 mb-2 border-b border-slate-200/80">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                {previewTab === 'card'
                  ? 'Aperçu en direct de la carte'
                  : 'Aperçu du document Microsoft Word (.docx)'}
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {previewTab === 'card'
                  ? PDF_OPTIONS.find((o) => o.id === pdfFormat)?.label
                  : DOCX_OPTIONS.find((o) => o.id === docxMode)?.label}
              </span>
            </div>

            {previewTab === 'card' ? (
              <CardPreview fields={fields} pdfFormat={pdfFormat} />
            ) : (
              <WordDocumentPreview fields={fields} docxMode={docxMode} />
            )}
          </section>

          {/* Colonne droite : Zones à saisir juste à côté de la carte + Options d'export */}
          <aside className="no-print lg:col-span-6 space-y-6">
            {/* Section 1 : Zones à saisir */}
            <section
              id="champs-modele"
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Zones à saisir (remplissage automatique)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    La photo importée est automatiquement convertie en noir et blanc dégradé sans arrière-plan.
                  </p>
                </div>
                {hasCustomContent && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>

              {/* Photo & QR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700">
                    Photo (N&amp;B dégradé · sans fond)
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors whitespace-nowrap">
                      <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {processingPhoto
                          ? 'Traitement...'
                          : fields.rawPhotoDataUrl
                          ? 'Changer la photo'
                          : 'Importer une photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                    {fields.rawPhotoDataUrl && (
                      <button
                        type="button"
                        aria-label="Supprimer la photo"
                        onClick={handleClearPhoto}
                        className="p-2 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700">
                    Code QR / Vignette
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors whitespace-nowrap">
                      <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                      <span>{fields.qrDataUrl ? 'Changer le QR' : 'Ajouter un QR'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="sr-only"
                      />
                    </label>
                    {fields.qrDataUrl && (
                      <button
                        type="button"
                        aria-label="Supprimer le code QR"
                        onClick={() => updateField('qrDataUrl', null)}
                        className="p-2 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Réglages du détourage & N&B dégradé lorsque la photo est chargée */}
              {fields.rawPhotoDataUrl && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-4 items-center">
                  {fields.photoDataUrl && (
                    <img
                      src={fields.photoDataUrl}
                      alt="Portrait traité en N&B"
                      className="w-16 h-20 object-cover bg-white border border-slate-200 rounded shrink-0"
                    />
                  )}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <label className="inline-flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fields.photoOptions.grayscaleGradient}
                          onChange={(e) =>
                            updatePhotoOption('grayscaleGradient', e.target.checked)
                          }
                          className="accent-sky-600"
                        />
                        <span>Noir &amp; blanc dégradé</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fields.photoOptions.removeBackground}
                          onChange={(e) =>
                            updatePhotoOption('removeBackground', e.target.checked)
                          }
                          className="accent-sky-600"
                        />
                        <span>Supprimer arrière-plan</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fields.photoOptions.edgeFade}
                          onChange={(e) =>
                            updatePhotoOption('edgeFade', e.target.checked)
                          }
                          className="accent-sky-600"
                        />
                        <span>Fondu bas</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fields.photoOptions.removeBackground && (
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                            <span>Sensibilité fond</span>
                            <span className="font-mono tabular-nums">
                              {fields.photoOptions.bgTolerance}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={12}
                            max={90}
                            value={fields.photoOptions.bgTolerance}
                            onChange={(e) =>
                              updatePhotoOption('bgTolerance', Number(e.target.value))
                            }
                            className="w-full accent-sky-600 cursor-pointer"
                          />
                        </div>
                      )}

                      {fields.photoOptions.grayscaleGradient && (
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                            <span>Contraste dégradé</span>
                            <span className="font-mono tabular-nums">
                              {fields.photoOptions.contrast.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.8}
                            max={1.6}
                            step={0.05}
                            value={fields.photoOptions.contrast}
                            onChange={(e) =>
                              updatePhotoOption('contrast', Number(e.target.value))
                            }
                            className="w-full accent-sky-600 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Champs texte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="field-nom"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nom
                  </label>
                  <input
                    id="field-nom"
                    type="text"
                    value={fields.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    placeholder="Ex. KABONGO"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-sexe"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Sexe
                  </label>
                  <select
                    id="field-sexe"
                    value={fields.sexe}
                    onChange={(e) => updateField('sexe', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  >
                    <option value="">Vierge</option>
                    <option value="M">M (Masculin)</option>
                    <option value="F">F (Féminin)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-postnom"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Postnom / Prénom
                  </label>
                  <input
                    id="field-postnom"
                    type="text"
                    value={fields.postnomPrenom}
                    onChange={(e) => updateField('postnomPrenom', e.target.value)}
                    placeholder="Ex. MUKENDI JEAN"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-naissance"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Date / Lieu de naissance
                  </label>
                  <input
                    id="field-naissance"
                    type="text"
                    value={fields.dateLieuNaissance}
                    onChange={(e) => updateField('dateLieuNaissance', e.target.value)}
                    placeholder="Ex. 14/05/1995 à Goma"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-adresse"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Adresse
                  </label>
                  <input
                    id="field-adresse"
                    type="text"
                    value={fields.adresse}
                    onChange={(e) => updateField('adresse', e.target.value)}
                    placeholder="Ex. Q. Himbi, Av. du Lac N° 12"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-origine"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Origine
                  </label>
                  <input
                    id="field-origine"
                    type="text"
                    value={fields.origine}
                    onChange={(e) => updateField('origine', e.target.value)}
                    placeholder="Ex. Nord-Kivu / Masisi"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-pere"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nom du père
                  </label>
                  <input
                    id="field-pere"
                    type="text"
                    value={fields.nomPere}
                    onChange={(e) => updateField('nomPere', e.target.value)}
                    placeholder="Ex. KABONGO PIERRE"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-mere"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nom de la mère
                  </label>
                  <input
                    id="field-mere"
                    type="text"
                    value={fields.nomMere}
                    onChange={(e) => updateField('nomMere', e.target.value)}
                    placeholder="Ex. BAHATI MARIE"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-lieu-delivrance"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Lieu de délivrance
                  </label>
                  <input
                    id="field-lieu-delivrance"
                    type="text"
                    value={fields.lieuDelivrance}
                    onChange={(e) => updateField('lieuDelivrance', e.target.value)}
                    placeholder="Ex. Goma ville"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-date-delivrance"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Date de délivrance
                  </label>
                  <input
                    id="field-date-delivrance"
                    type="text"
                    value={fields.dateDelivrance}
                    onChange={(e) => updateField('dateDelivrance', e.target.value)}
                    placeholder="Ex. 12/04/2023"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              {/* Mentions de référence pour Word / Fiche */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdminRefs((v) => !v)}
                  className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <span>Mentions pré-imprimées (fiche Word / PDF)</span>
                  {showAdminRefs ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showAdminRefs && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        CODE CI
                      </label>
                      <input
                        type="text"
                        value={fields.codeCi}
                        onChange={(e) => updateField('codeCi', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        NOM CI
                      </label>
                      <input
                        type="text"
                        value={fields.nomCi}
                        onChange={(e) => updateField('nomCi', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Numéro National (NN)
                      </label>
                      <input
                        type="text"
                        value={fields.nn}
                        onChange={(e) => updateField('nn', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        value={fields.numeroCarte}
                        onChange={(e) => updateField('numeroCarte', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Signataire
                      </label>
                      <input
                        type="text"
                        value={fields.signataire}
                        onChange={(e) => updateField('signataire', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Section 2 : Formats PDF & Word */}
            <section
              id="formats-export"
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Télécharger en PDF ou Word
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choisissez la mise en page et générez votre fichier.
                </p>
              </div>

              {/* Format PDF */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Mise en page PDF
                  </label>
                  <span className="text-xs font-mono text-slate-400">.pdf</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PDF_OPTIONS.map((opt) => {
                    const active = pdfFormat === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPdfFormat(opt.id);
                          setPreviewTab('card');
                        }}
                        className={`text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold whitespace-nowrap truncate">
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {opt.detail}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Word */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Structure Microsoft Word
                  </label>
                  <span className="text-xs font-mono text-slate-400">.docx</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DOCX_OPTIONS.map((opt) => {
                    const active = docxMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setDocxMode(opt.id);
                          setPreviewTab('word');
                        }}
                        className={`text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-100 text-slate-900'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold whitespace-nowrap truncate">
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {opt.detail}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boutons d'export directs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={exportingPdf}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{exportingPdf ? 'Création...' : 'Exporter en PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={exportingDocx}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>{exportingDocx ? 'Création...' : 'Exporter en Word'}</span>
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
