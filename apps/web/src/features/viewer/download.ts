export function downloadBlob(blob: Blob, filename: string): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    let didBlur = false;
    const cleanup = () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      clearTimeout(timer);
      resolve();
    };
    const onBlur = () => {
      didBlur = true;
      clearTimeout(timer);
      timer = window.setTimeout(cleanup, 60_000);
    };
    const onFocus = () => {
      if (didBlur) {
        cleanup();
      }
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    let timer = window.setTimeout(cleanup, 500);
  });
}
