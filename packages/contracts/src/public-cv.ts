import type { CvFileSections, CvVariants } from './cv';

export interface PublicCvPayload {
  cvName: string;
  fileId: string;
  sections: CvFileSections;
  variants?: CvVariants;
  selectedVariant?: string;
}
