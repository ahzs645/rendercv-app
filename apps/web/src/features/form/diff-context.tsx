import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import YAML from 'yaml';

interface DiffContextValue {
  /** Parsed root object from the origin YAML for the current section, or null if no origin. */
  originRoot: Record<string, unknown> | null;
}

const DiffContext = createContext<DiffContextValue>({ originRoot: null });

export function DiffProvider({
  children,
  section,
  origin
}: {
  children: ReactNode;
  section: SectionKey;
  origin?: CvFileSections;
}) {
  const originRoot = useMemo(() => {
    if (!origin) return null;
    const yaml = origin[section];
    if (!yaml) return null;
    try {
      const parsed = YAML.parse(yaml);
      if (parsed && typeof parsed === 'object' && section in parsed) {
        return (parsed as Record<string, Record<string, unknown>>)[section] ?? null;
      }
    } catch {
      // ignore
    }
    return null;
  }, [origin, section]);

  return <DiffContext.Provider value={{ originRoot }}>{children}</DiffContext.Provider>;
}

/**
 * Narrow the diff origin context to a nested path (e.g., an array entry).
 * Field paths inside this provider are resolved relative to the scoped root.
 */
export function DiffScopeProvider({
  children,
  path
}: {
  children: ReactNode;
  path: (string | number)[];
}) {
  const { originRoot: parentRoot } = useContext(DiffContext);

  const scopedRoot = useMemo(() => {
    if (!parentRoot) return null;
    let current: unknown = parentRoot;
    for (const segment of path) {
      if (current && typeof current === 'object') {
        current = (current as Record<string | number, unknown>)[segment];
      } else {
        return null;
      }
    }
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return current as Record<string, unknown>;
    }
    return null;
  }, [parentRoot, path]);

  return <DiffContext.Provider value={{ originRoot: scopedRoot }}>{children}</DiffContext.Provider>;
}

/**
 * Hook to check if a field value differs from the shared origin.
 * Returns `{ changed: true, originalValue }` when the field was modified,
 * or `{ changed: false }` when unchanged or no origin is tracked.
 */
export function useFieldDiff(path: string[], currentValue: unknown): { changed: boolean; originalValue?: unknown } {
  const { originRoot } = useContext(DiffContext);
  if (!originRoot) return { changed: false };

  let originValue: unknown = originRoot;
  for (const segment of path) {
    if (originValue && typeof originValue === 'object' && !Array.isArray(originValue)) {
      originValue = (originValue as Record<string, unknown>)[segment];
    } else {
      return { changed: false };
    }
  }

  const currentStr = currentValue === undefined || currentValue === null ? '' : String(currentValue);
  const originStr = originValue === undefined || originValue === null ? '' : String(originValue);

  if (currentStr === originStr) return { changed: false };

  return { changed: true, originalValue: originValue };
}
