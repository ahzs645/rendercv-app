import { useEffect, useRef } from 'react';
import { fileStore } from '@rendercv/core';
import { toast } from 'sonner';
import { parseCvVariantsYaml } from '../features/viewer/cv-variants';
import { deriveName, fetchYamlText } from './cv-url-import';

/**
 * Auto-loads a CV (and optional variants) from query params on first mount:
 *   ?url=<cv.yaml>&variants=<variants.yaml>
 *
 * Used by the builds launcher (projects.ahmadjalil.com) to open a hosted resume
 * directly in the editor. Consumes the params via replaceState so a reload or
 * StrictMode double-invoke does not re-import.
 */
export function useUrlCvLoader(
  importYamlFile: (file: File, source?: { url: string }) => Promise<void>,
  ready: boolean
): void {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !ready) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const cvUrl = params.get('url');
    if (!cvUrl) {
      return;
    }

    startedRef.current = true;
    const variantsUrl = params.get('variants');

    // Strip the params so reloads keep the user's edits instead of re-importing.
    params.delete('url');
    params.delete('variants');
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
    );

    void (async () => {
      try {
        const cvText = await fetchYamlText(cvUrl, 'resume');
        const cvFile = new File([cvText], `${deriveName(cvUrl, 'CV')}.yaml`, {
          type: 'text/yaml'
        });
        await importYamlFile(cvFile, { url: cvUrl });

        if (variantsUrl) {
          const variantsText = await fetchYamlText(variantsUrl, 'variants');
          const variants = parseCvVariantsYaml(variantsText);
          const fileId = fileStore.selectedFileId;
          if (fileId) {
            fileStore.setVariants(fileId, variants);
            toast.success(`Loaded resume with ${Object.keys(variants).length} variants.`);
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load resume from URL.');
      }
    })();
  }, [importYamlFile, ready]);
}
