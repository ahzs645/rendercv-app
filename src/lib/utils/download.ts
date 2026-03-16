export function downloadBlob(blob: Blob, filename: string): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // If the browser shows a "Save As" dialog, the window loses then regains focus.
    // Wait for that cycle so callers stay in a loading state during the dialog.
    let didBlur = false;
    const cleanup = () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      clearTimeout(timer);
      resolve();
    };
    const onBlur = () => {
      didBlur = true;
      // Dialog appeared — wait for it to close instead of the short fallback
      clearTimeout(timer);
      timer = setTimeout(cleanup, 60_000);
    };
    const onFocus = () => {
      if (didBlur) cleanup();
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    // Short fallback: resolve quickly if no dialog appeared (auto-download)
    let timer = setTimeout(cleanup, 500);
  });
}
