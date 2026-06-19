import type { CvVariants } from '@rendercv/contracts';
import YAML from 'yaml';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

/** Per-section content fingerprints hidden from a variant (`exclude_entries`). */
function readExcludeEntries(value: unknown): Record<string, string[]> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const result: Record<string, string[]> = {};
  for (const [sectionKey, fingerprints] of Object.entries(value)) {
    const list = readStringList(fingerprints);
    if (list) {
      result[sectionKey] = list;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function parseCvVariantsYaml(content: string): CvVariants {
  const parsed = YAML.parse(content);
  const variantsRoot =
    isRecord(parsed) && isRecord(parsed.variants)
      ? parsed.variants
      : isRecord(parsed)
        ? parsed
        : undefined;

  if (!variantsRoot) {
    throw new Error('Expected a variants file with a top-level variants: mapping.');
  }

  const variants = Object.fromEntries(
    Object.entries(variantsRoot).flatMap(([key, value]) => {
      if (!isRecord(value)) {
        return [];
      }

      return [
        [
          key,
          {
            description: typeof value.description === 'string' ? value.description : undefined,
            exclude_sections: readStringList(value.exclude_sections),
            tags: readStringList(value.tags),
            flavors: readStringList(value.flavors),
            exclude_entries: readExcludeEntries(value.exclude_entries)
          }
        ]
      ];
    })
  );

  if (Object.keys(variants).length === 0) {
    throw new Error('This variants file does not define any usable variants.');
  }

  return variants;
}

/**
 * Serialize authored variants to a portable `variants.yaml`. Round-trips back
 * through {@link parseCvVariantsYaml}, including the app-managed `exclude_entries`
 * fingerprints, so a user can back up and re-import their variants. Empty fields
 * are omitted to keep the file readable.
 */
export function serializeCvVariantsYaml(variants: CvVariants): string {
  const cleaned: Record<string, Record<string, unknown>> = {};

  for (const [key, definition] of Object.entries(variants)) {
    const entry: Record<string, unknown> = {};

    if (definition.description?.trim()) {
      entry.description = definition.description.trim();
    }
    if (definition.tags?.length) {
      entry.tags = definition.tags;
    }
    if (definition.flavors?.length) {
      entry.flavors = definition.flavors;
    }
    if (definition.exclude_sections?.length) {
      entry.exclude_sections = definition.exclude_sections;
    }
    if (definition.exclude_entries) {
      const excludeEntries: Record<string, string[]> = {};
      for (const [sectionKey, fingerprints] of Object.entries(definition.exclude_entries)) {
        if (fingerprints.length > 0) {
          excludeEntries[sectionKey] = fingerprints;
        }
      }
      if (Object.keys(excludeEntries).length > 0) {
        entry.exclude_entries = excludeEntries;
      }
    }

    cleaned[key] = entry;
  }

  return YAML.stringify({ variants: cleaned });
}
