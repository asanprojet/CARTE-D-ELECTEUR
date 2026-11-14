import { DEFAULT_PHOTO_OPTIONS, PhotoProcessOptions } from '../utils/processPortraitPhoto';

export interface CardFields {
  nom: string;
  postnomPrenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  adresse: string;
  origine: string;
  nomPere: string;
  nomMere: string;
  lieuDelivrance: string;
  dateDelivrance: string;
  // Champs de référence visibles sur le modèle (utilisés dans la fiche Word modifiable)
  codeCi: string;
  nomCi: string;
  nn: string;
  numeroCarte: string;
  signataire: string;
  rawPhotoDataUrl: string | null;
  photoDataUrl: string | null;
  photoOptions: PhotoProcessOptions;
  qrDataUrl: string | null;
}

export type PdfFormat = 'a4-large' | 'a4-cr80' | 'cr80' | 'a4-grid';

export type DocxMode = 'combined' | 'image-only' | 'editable-only';

export type PreviewTab = 'card' | 'word';

export const DEFAULT_CARD_FIELDS: CardFields = {
  nom: '',
  postnomPrenom: '',
  dateNaissance: '',
  lieuNaissance: '',
  sexe: '',
  adresse: '',
  origine: '',
  nomPere: '',
  nomMere: '',
  lieuDelivrance: 'Goma ville',
  dateDelivrance: '12/04/2023',
  codeCi: '6031029',
  nomCi: 'INSTITUT MIKENO',
  nn: '33663829302',
  numeroCarte: 'A58392266',
  signataire: 'SIRADJI NYALAMBA KIVU',
  rawPhotoDataUrl: null,
  photoDataUrl: null,
  photoOptions: DEFAULT_PHOTO_OPTIONS,
  qrDataUrl: null,
};

export const TEMPLATE_IMAGE_PATH = '/assets/aistudio/image_0893c3bf.png';
export const TEMPLATE_CROP_X = 22;
export const TEMPLATE_CROP_Y = 20;
export const TEMPLATE_WIDTH = 1245;
export const TEMPLATE_HEIGHT = 807;
export const TEMPLATE_CORNER_RADIUS = 38;
export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = Number(((85.6 * TEMPLATE_HEIGHT) / TEMPLATE_WIDTH).toFixed(2)); // 55.49 mm
