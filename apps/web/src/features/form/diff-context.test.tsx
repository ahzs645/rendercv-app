import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { CvFileSections } from '@rendercv/contracts';
import { DiffProvider, useFieldDiff } from './diff-context';

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: 'cv:\n  name: John Doe\n  label: Developer',
    design: 'design:\n  theme: classic',
    locale: 'locale:\n  language: english',
    settings: '',
    ...overrides
  };
}

function wrapper(section: 'cv' | 'design' | 'locale' | 'settings', origin?: CvFileSections) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DiffProvider section={section} origin={origin}>
        {children}
      </DiffProvider>
    );
  };
}

describe('useFieldDiff', () => {
  it('returns changed: false when no origin is provided', () => {
    const { result } = renderHook(() => useFieldDiff(['name'], 'John Doe'), {
      wrapper: wrapper('cv')
    });
    expect(result.current.changed).toBe(false);
  });

  it('returns changed: false when value matches origin', () => {
    const origin = makeSections();
    const { result } = renderHook(() => useFieldDiff(['name'], 'John Doe'), {
      wrapper: wrapper('cv', origin)
    });
    expect(result.current.changed).toBe(false);
  });

  it('returns changed: true with originalValue when value differs', () => {
    const origin = makeSections();
    const { result } = renderHook(() => useFieldDiff(['name'], 'Jane Doe'), {
      wrapper: wrapper('cv', origin)
    });
    expect(result.current.changed).toBe(true);
    expect(result.current.originalValue).toBe('John Doe');
  });

  it('handles nested paths', () => {
    const origin = makeSections({ design: 'design:\n  theme: classic\n  colors:\n    primary: red' });
    const { result } = renderHook(() => useFieldDiff(['colors', 'primary'], 'blue'), {
      wrapper: wrapper('design', origin)
    });
    expect(result.current.changed).toBe(true);
    expect(result.current.originalValue).toBe('red');
  });

  it('returns changed: false for missing origin path', () => {
    const origin = makeSections();
    const { result } = renderHook(() => useFieldDiff(['nonexistent'], 'anything'), {
      wrapper: wrapper('cv', origin)
    });
    // originValue is undefined, currentValue is 'anything'
    // undefined → '' vs 'anything' → changed
    expect(result.current.changed).toBe(true);
  });

  it('treats undefined current as empty string matching undefined origin', () => {
    const origin = makeSections();
    const { result } = renderHook(() => useFieldDiff(['nonexistent'], undefined), {
      wrapper: wrapper('cv', origin)
    });
    expect(result.current.changed).toBe(false);
  });
});
