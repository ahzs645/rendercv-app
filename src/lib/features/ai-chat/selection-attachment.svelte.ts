export interface SelectionAttachment {
  id: string;
  source: 'yaml' | 'form';
  text: string;
  context?: string;
}

export interface SelectionChipMeta {
  source: SelectionAttachment['source'];
  lines: number;
  context?: string;
}

export const MAX_SELECTIONS = 5;

/** Delimiter used to embed chip metadata in message text. */
export const SELECTION_MARKER = '\u200B__SEL__';

/**
 * Parse chip metadata and visible user text from a message that may contain
 * embedded selection markers. Returns chips (if any) and the clean display text.
 */
export function parseSelectionChips(text: string): {
  chips: SelectionChipMeta[];
  displayText: string;
} {
  if (!text.startsWith(SELECTION_MARKER)) return { chips: [], displayText: text };

  const endIdx = text.indexOf(SELECTION_MARKER, SELECTION_MARKER.length);
  if (endIdx === -1) return { chips: [], displayText: text };

  try {
    const json = text.slice(SELECTION_MARKER.length, endIdx);
    const chips: SelectionChipMeta[] = JSON.parse(json);

    // The display text is after the last selection block separator
    // Find the user's actual message (after all selection blocks)
    const afterMarker = text.slice(endIdx + SELECTION_MARKER.length);
    // Skip the LLM context blocks — everything up to the last `"""\n\n` is context
    const lastQuoteEnd = afterMarker.lastIndexOf('"""\n\n');
    const displayText =
      lastQuoteEnd !== -1 ? afterMarker.slice(lastQuoteEnd + 5).trim() : afterMarker.trim();

    return { chips, displayText };
  } catch {
    return { chips: [], displayText: text };
  }
}
