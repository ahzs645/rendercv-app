import type { RenderError } from '$lib/features/viewer/viewer-state.svelte';

/**
 * Provides path-based error lookup for form fields.
 *
 * Maps `RenderError.schema_location` paths to form field paths so each
 * input component can display the relevant validation message.
 */
export interface FormErrors {
  /** Get the first error message for a field at the given path, or undefined if clean. */
  forField(path: string[]): string | undefined;
  /** Whether any error exists under a given array entry (for collapsed indicators). */
  forEntry(arrayPath: string[], index: number): boolean;
  /** Errors that couldn't be matched to any specific field path. */
  unmatched: RenderError[];
  /** Whether there are any errors at all. */
  hasErrors: boolean;
}

/**
 * Create a FormErrors lookup from section-specific errors.
 *
 * @param errors - Errors already filtered by `yaml_source` (one section's worth)
 * @param sectionKey - The section key ('cv', 'design', etc.) used to strip
 *   the optional section prefix from `schema_location`.
 */
export function createFormErrors(
  errors: RenderError[],
  sectionKey: string,
  remapPath?: (path: string[]) => string[]
): FormErrors {
  // Pre-normalize all schema_locations once: strip section prefix, stringify segments,
  // and remap sanitized-output indices back to internal-doc indices.
  const normalized: (string[] | null)[] = errors.map((e) => {
    const loc = e.schema_location;
    if (!loc || loc.length === 0) return null;
    let parts = loc.map((s) => String(s));
    // Strip section prefix if present (e.g., ['cv', 'name'] → ['name'])
    if (parts[0] === sectionKey) parts = parts.slice(1);
    if (remapPath) parts = remapPath(parts);
    return parts;
  });

  function pathEquals(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function pathStartsWith(full: string[], prefix: string[]): boolean {
    if (full.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) {
      if (full[i] !== prefix[i]) return false;
    }
    return true;
  }

  return {
    forField(path: string[]): string | undefined {
      const target = path.map((s) => String(s));
      for (let i = 0; i < errors.length; i++) {
        const loc = normalized[i];
        if (loc && pathEquals(loc, target)) return errors[i].message;
      }
      return undefined;
    },

    forEntry(arrayPath: string[], index: number): boolean {
      const prefix = [...arrayPath.map((s) => String(s)), String(index)];
      for (const loc of normalized) {
        if (loc && pathStartsWith(loc, prefix)) return true;
      }
      return false;
    },

    get unmatched(): RenderError[] {
      return errors.filter((_, i) => normalized[i] === null);
    },

    get hasErrors(): boolean {
      return errors.length > 0;
    }
  };
}
