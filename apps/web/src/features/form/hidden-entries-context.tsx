import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { entryFingerprint } from '@rendercv/core';

interface HiddenEntriesValue {
  hidden: Record<string, string[]>;
  toggle: (sectionKey: string, fingerprint: string) => void;
}

const HiddenEntriesContext = createContext<HiddenEntriesValue | null>(null);

export function HiddenEntriesProvider({
  hidden,
  toggle,
  children
}: {
  hidden: Record<string, string[]>;
  toggle: (sectionKey: string, fingerprint: string) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);
  return <HiddenEntriesContext.Provider value={value}>{children}</HiddenEntriesContext.Provider>;
}

export interface EntryHiddenState {
  hidden: boolean;
  toggle: () => void;
}

/**
 * Returns the hidden state for a section entry, or null when hiding isn't
 * available (no provider, or not a CV section entry). Safe to call
 * unconditionally — it obeys the rules of hooks.
 */
export function useEntryHidden(
  sectionKey: string | undefined,
  entry: unknown
): EntryHiddenState | null {
  const context = useContext(HiddenEntriesContext);
  const fingerprint = useMemo(
    () => (sectionKey ? entryFingerprint(entry) : ''),
    [sectionKey, entry]
  );

  if (!context || !sectionKey) {
    return null;
  }

  const hidden = (context.hidden[sectionKey] ?? []).includes(fingerprint);
  return { hidden, toggle: () => context.toggle(sectionKey, fingerprint) };
}
