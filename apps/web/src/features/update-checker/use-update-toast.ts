import { useEffect } from 'react';
import { toast } from 'sonner';
import { initUpdateChecker } from './update-checker';

export function useUpdateToast(): void {
  useEffect(() => {
    return initUpdateChecker((info) => {
      toast.message('Update available', {
        description: `A new version of RenderCV is ready (build ${info.buildNumber}).`,
        duration: Infinity,
        action: { label: 'Reload', onClick: () => info.onReload() },
        cancel: { label: 'Later', onClick: () => {} }
      });
    });
  }, []);
}
