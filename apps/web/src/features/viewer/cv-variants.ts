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
            flavors: readStringList(value.flavors)
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
