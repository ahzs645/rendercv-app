import type { CvFileSections } from '@rendercv/contracts';
import { downloadBlob } from '../viewer/download';
import type { EncodedSharePayload } from './encoded-share';

const RENDERCV_FILE_EXTENSION = '.rendercv.json';
const MAX_IMPORT_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Download the share payload as a `.rendercv.json` file.
 * This always includes origin when available — no URL length limits.
 */
export async function exportShareFile(payload: EncodedSharePayload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  await downloadBlob(blob, `${payload.fileName}${RENDERCV_FILE_EXTENSION}`);
}

/**
 * Prompt the user for a `.rendercv.json` file and parse it.
 */
export function importShareFile(): Promise<EncodedSharePayload | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      if (file.size > MAX_IMPORT_SIZE) {
        throw new Error(`File too large (max ${MAX_IMPORT_SIZE / 1024 / 1024} MB).`);
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as EncodedSharePayload;
          if (!data.sections || typeof data.sections !== 'object') {
            throw new Error('Invalid .rendercv.json — missing sections.');
          }
          resolve({
            version: data.version ?? 1,
            fileName: data.fileName ?? file.name.replace(/\.rendercv\.json$/i, '').replace(/\.json$/i, ''),
            sections: data.sections,
            origin: data.origin
          });
        } catch (err) {
          throw err instanceof Error ? err : new Error('Failed to parse .rendercv.json file.');
        }
      };
      reader.onerror = () => {
        throw new Error('Failed to read file.');
      };
      reader.readAsText(file);
    });

    input.click();
  });
}
