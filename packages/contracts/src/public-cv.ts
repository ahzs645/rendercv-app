import type { CvFileSections } from './cv';

export interface PublicCvPayload {
  cvName: string;
  fileId: string;
  sections: CvFileSections;
}
