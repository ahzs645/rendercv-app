import { viewer } from './viewer-state.svelte';
import { downloadBlob } from '$lib/utils/download';
import { SECTION_KEYS, type CvFileSections } from '$lib/features/cv-files/types';
import JSZip from 'jszip';

export async function downloadPdf(sections: CvFileSections, filename: string) {
  const pdfBytes = await viewer.renderToPdf(sections);
  if (!pdfBytes) return;
  await downloadBlob(
    new Blob([pdfBytes as BlobPart], { type: 'application/octet-stream' }),
    filename
  );
}

export async function downloadTypst(sections: CvFileSections, filename: string) {
  const typst = await viewer.renderToTypst(sections);
  if (!typst) return;
  await downloadBlob(new Blob([typst], { type: 'application/octet-stream' }), filename);
}

export async function downloadYamlsAsZip(sections: CvFileSections, filename: string) {
  const zip = new JSZip();
  for (const key of SECTION_KEYS) {
    zip.file(`${key}.yaml`, sections[key]);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, filename);
}
