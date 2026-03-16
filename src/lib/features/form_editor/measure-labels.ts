/**
 * Compute the ideal label column width for a set of field labels.
 * Uses canvas text measurement to match the actual rendered width
 * at text-xs (12px) with the system font stack.
 */

export function computeLabelWidth(fields: { label: string }[]): string {
  if (typeof document === 'undefined' || fields.length === 0) return '8rem';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '8rem';
  ctx.font = '12px ui-sans-serif, system-ui, -apple-system, sans-serif';
  let max = 0;
  for (const field of fields) {
    const w = ctx.measureText(field.label).width;
    if (w > max) max = w;
  }
  return `${Math.ceil(max) + 16}px`;
}
