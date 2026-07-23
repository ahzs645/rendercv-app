import { describe, expect, it } from 'vitest';
import { diffWords } from './word-diff';

function joinByType(tokens: NonNullable<ReturnType<typeof diffWords>>, type: string) {
  return tokens.filter((token) => token.type === type).map((token) => token.text).join('');
}

describe('diffWords', () => {
  it('marks unchanged text as same', () => {
    const tokens = diffWords('hello world', 'hello world')!;
    expect(tokens).toEqual([{ text: 'hello world', type: 'same' }]);
  });

  it('finds replaced words', () => {
    const tokens = diffWords('Revamped invoicing system', 'Rebuilt invoicing system')!;
    expect(joinByType(tokens, 'removed')).toBe('Revamped');
    expect(joinByType(tokens, 'added')).toBe('Rebuilt');
    expect(joinByType(tokens, 'same')).toContain('invoicing system');
  });

  it('reconstructs the baseline from same+removed and the proposal from same+added', () => {
    const baseline = 'Streamlined and optimized laboratory workflow by implementing new methods';
    const proposed = 'Streamlined the laboratory workflow by rolling out new methods and protocols';
    const tokens = diffWords(baseline, proposed)!;

    const rebuiltBaseline = tokens
      .filter((token) => token.type !== 'added')
      .map((token) => token.text)
      .join('');
    const rebuiltProposed = tokens
      .filter((token) => token.type !== 'removed')
      .map((token) => token.text)
      .join('');

    expect(rebuiltBaseline).toBe(baseline);
    expect(rebuiltProposed).toBe(proposed);
  });

  it('handles pure additions and removals', () => {
    expect(joinByType(diffWords('', 'brand new text')!, 'added')).toBe('brand new text');
    expect(joinByType(diffWords('old text gone', '')!, 'removed')).toBe('old text gone');
  });

  it('bails out on very large inputs', () => {
    const large = Array.from({ length: 600 }, (_, index) => `word${index}`).join(' ');
    expect(diffWords(large, 'short')).toBeNull();
  });
});
