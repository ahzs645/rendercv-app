import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { entryFingerprint } from '@rendercv/core';
import type { VariantVisibility } from '../viewer/variant-visibility';

interface VariantVisibilityValue {
  /** Key of the active variant, or null when none is selected. */
  activeVariantKey: string | null;
  /** Human-friendly label for the active variant. */
  variantLabel: string;
  visibility: VariantVisibility;
}

const VariantVisibilityContext = createContext<VariantVisibilityValue | null>(null);

export function VariantVisibilityProvider({
  activeVariantKey,
  variantLabel,
  visibility,
  children
}: VariantVisibilityValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ activeVariantKey, variantLabel, visibility }),
    [activeVariantKey, variantLabel, visibility]
  );
  return (
    <VariantVisibilityContext.Provider value={value}>{children}</VariantVisibilityContext.Provider>
  );
}

export interface EntryVariantState {
  /** True when the active variant drops this entry from the PDF. */
  hiddenByVariant: boolean;
  /** True when this entry is dropped because it is tagged `archived`. */
  archived: boolean;
  /** Label of the active variant, for tooltips/badges. */
  variantLabel: string;
}

/**
 * Reports whether the active variant (or the always-on `archived` rule) hides a
 * given CV entry. Returns null when variant reflection isn't available. Safe to
 * call unconditionally — obeys the rules of hooks.
 */
export function useEntryVariantState(
  sectionKey: string | undefined,
  entry: unknown
): EntryVariantState | null {
  const context = useContext(VariantVisibilityContext);
  const fingerprint = useMemo(
    () => (sectionKey ? entryFingerprint(entry) : ''),
    [sectionKey, entry]
  );

  if (!context || !sectionKey) {
    return null;
  }

  const hiddenByVariant = context.visibility.hiddenEntries[sectionKey]?.has(fingerprint) ?? false;
  const archived = context.visibility.archivedEntries[sectionKey]?.has(fingerprint) ?? false;
  if (!hiddenByVariant && !archived) {
    return { hiddenByVariant: false, archived: false, variantLabel: context.variantLabel };
  }
  return { hiddenByVariant, archived, variantLabel: context.variantLabel };
}
