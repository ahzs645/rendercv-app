import { ENTRY_VISIBILITY_KEYS } from '@rendercv/core';
import { normalizeCompatibilityCvYaml } from '@rendercv/primitives';
import YAML from 'yaml';

// The toolkit's compatibility normalizer folds any scalar field an experience
// entry doesn't know into its summary, so `show: false` came out of an import
// as `summary: "show: false"`: the entry stayed visible with that text printed
// under it. It leaves objects alone, so the flag is wrapped in one for the
// duration of the call and unwrapped afterwards.
// TODO: drop this once rendercv-toolkit lists `show`/`showing` among the fields
// it keeps (EXPERIENCE_SHAPE_FIELDS in normalize-compat-cv.ts).
const WRAPPER_KEY = '__rendercv_visibility_flag__';

type Visitor = (entry: Record<string, unknown>) => boolean;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function visitEntries(root: unknown, visit: Visitor) {
  if (!isRecord(root) || !isRecord(root.cv) || !isRecord(root.cv.sections)) return false;
  let changed = false;
  for (const entries of Object.values(root.cv.sections)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!isRecord(entry)) continue;
      changed = visit(entry) || changed;
      if (Array.isArray(entry.positions)) {
        for (const position of entry.positions) {
          if (isRecord(position)) changed = visit(position) || changed;
        }
      }
    }
  }
  return changed;
}

export function normalizeCompatibilityCvYamlKeepingVisibility(yamlText: string): string {
  if (!/^\s*(?:-\s+)?(?:show|showing)\s*:/m.test(yamlText)) {
    return normalizeCompatibilityCvYaml(yamlText);
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(yamlText);
  } catch {
    return normalizeCompatibilityCvYaml(yamlText);
  }

  const wrapped = visitEntries(parsed, (entry) => {
    let changed = false;
    for (const key of ENTRY_VISIBILITY_KEYS) {
      if (key in entry && !isRecord(entry[key]) && !Array.isArray(entry[key])) {
        entry[key] = { [WRAPPER_KEY]: entry[key] };
        changed = true;
      }
    }
    return changed;
  });
  if (!wrapped) {
    return normalizeCompatibilityCvYaml(yamlText);
  }

  const normalized = normalizeCompatibilityCvYaml(YAML.stringify(parsed));
  let result: unknown;
  try {
    result = YAML.parse(normalized);
  } catch {
    return normalized;
  }

  visitEntries(result, (entry) => {
    let changed = false;
    for (const key of ENTRY_VISIBILITY_KEYS) {
      const value = entry[key];
      if (isRecord(value) && WRAPPER_KEY in value) {
        entry[key] = value[WRAPPER_KEY];
        changed = true;
      }
    }
    return changed;
  });

  return YAML.stringify(result);
}
