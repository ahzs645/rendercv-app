import JSZip from 'jszip';
import { SECTION_KEYS, type CvFileSections } from './types';

export interface ZipFile {
  name: string;
  sections: CvFileSections;
  typst: string;
  pdf: Uint8Array;
  group?: string;
}

self.onmessage = async (event: MessageEvent<{ files: ZipFile[] }>) => {
  try {
    const zip = new JSZip();

    for (const file of event.data.files) {
      const parent = file.group ? zip.folder(file.group)! : zip;
      const folder = parent.folder(file.name)!;
      for (const key of SECTION_KEYS) {
        folder.file(`${key}.yaml`, file.sections[key]);
      }
      folder.file(`${file.name}.typ`, file.typst);
      folder.file(`${file.name}.pdf`, file.pdf);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    self.postMessage({ type: 'SUCCESS', blob });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
