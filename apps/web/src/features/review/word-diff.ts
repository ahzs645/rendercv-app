export type WordDiffToken = {
  text: string;
  type: 'same' | 'added' | 'removed';
};

// Beyond this many tokens per side the O(n*m) LCS table gets expensive and the
// highlighting stops helping anyway — callers should fall back to plain text.
const MAX_TOKENS = 400;

/** Splits into words and whitespace runs, so joins reproduce the input exactly. */
function tokenize(value: string): string[] {
  return value.match(/\s+|\S+/g) ?? [];
}

function mergeAdjacent(tokens: WordDiffToken[]): WordDiffToken[] {
  const merged: WordDiffToken[] = [];
  for (const token of tokens) {
    const last = merged[merged.length - 1];
    if (last && last.type === token.type) {
      last.text += token.text;
    } else {
      merged.push({ ...token });
    }
  }
  return merged;
}

/**
 * Word-level diff of two strings via longest-common-subsequence. Returns null
 * when either side is too large to diff cheaply — render plain text instead.
 * Whitespace is kept as tokens so the output concatenates back to the inputs.
 */
export function diffWords(baseline: string, proposed: string): WordDiffToken[] | null {
  const a = tokenize(baseline);
  const b = tokenize(proposed);

  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    return null;
  }

  // lengths[i][j] = LCS length of a[i..] and b[j..]
  const lengths: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lengths[i]![j] =
        a[i] === b[j]
          ? lengths[i + 1]![j + 1]! + 1
          : Math.max(lengths[i + 1]![j]!, lengths[i]![j + 1]!);
    }
  }

  const tokens: WordDiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      tokens.push({ text: a[i]!, type: 'same' });
      i += 1;
      j += 1;
    } else if (lengths[i + 1]![j]! >= lengths[i]![j + 1]!) {
      tokens.push({ text: a[i]!, type: 'removed' });
      i += 1;
    } else {
      tokens.push({ text: b[j]!, type: 'added' });
      j += 1;
    }
  }
  while (i < a.length) {
    tokens.push({ text: a[i]!, type: 'removed' });
    i += 1;
  }
  while (j < b.length) {
    tokens.push({ text: b[j]!, type: 'added' });
    j += 1;
  }

  return mergeAdjacent(tokens);
}
