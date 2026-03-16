export function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/.test(text);
}

/**
 * Insert or toggle formatting markers around the selected text in a textarea.
 * Mirrors the 3-case logic in EditorState.insertText but for plain <textarea> elements.
 */
export function insertTextInTextarea(
  el: HTMLTextAreaElement,
  prefix: string,
  suffix: string
): void {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = el.value.substring(start, end);

  // Case 1: Selected text is already wrapped with prefix+suffix → unwrap
  if (
    text.length >= prefix.length + suffix.length &&
    text.startsWith(prefix) &&
    text.endsWith(suffix)
  ) {
    const unwrapped = text.slice(prefix.length, suffix.length ? -suffix.length : undefined);
    el.setRangeText(unwrapped, start, end, 'select');
    el.selectionStart = start;
    el.selectionEnd = start + unwrapped.length;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    return;
  }

  // Case 2: Surrounding text (outside selection) already has prefix+suffix → unwrap
  const preStart = Math.max(0, start - prefix.length);
  const postEnd = Math.min(el.value.length, end + suffix.length);
  const preText = el.value.substring(preStart, start);
  const postText = el.value.substring(end, postEnd);

  if (preText === prefix && postText === suffix) {
    el.setRangeText(text, preStart, postEnd, 'select');
    el.selectionStart = preStart;
    el.selectionEnd = preStart + text.length;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    return;
  }

  // Case 3: Wrap with prefix+suffix
  const wrapped = prefix + text + suffix;
  el.setRangeText(wrapped, start, end, 'select');

  if (text.length > 0) {
    el.selectionStart = start + prefix.length;
    el.selectionEnd = start + prefix.length + text.length;
  } else {
    const cursor = start + prefix.length;
    el.selectionStart = cursor;
    el.selectionEnd = cursor;
  }

  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}
