/**
 * Copy text to the clipboard in a way that works across desktop and mobile.
 *
 * `navigator.clipboard.writeText` is the modern path, but it is unavailable in
 * non-secure contexts and on some older mobile browsers. When it is missing or
 * rejects (e.g. permissions, lack of a user gesture), fall back to a hidden
 * textarea + `document.execCommand('copy')`, which mobile Safari and older
 * Android browsers still support.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  if (!copyWithExecCommand(text)) {
    throw new Error('Clipboard is not available in this browser.');
  }
}

function copyWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Keep it out of view and avoid scroll jumps / zoom on iOS focus.
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.fontSize = '16px';

  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.focus();
  textarea.select();
  // iOS needs an explicit range selection to copy.
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);

  if (previousRange && selection) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }

  return copied;
}
