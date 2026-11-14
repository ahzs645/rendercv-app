import YAML from 'yaml';

/**
 * Options for every YAML the app writes back into a CV. The `yaml` library
 * folds long strings at 80 columns by default, so a one-line bullet came back
 * as several lines; deleting what looked like one line in the editor then left
 * a continuation line that silently joined the bullet above. Never fold.
 */
export const CV_YAML_STRINGIFY_OPTIONS = { lineWidth: 0, minContentWidth: 0 } as const;

/** Stringify CV data without folding long lines. */
export function stringifyCvYaml(value: unknown): string {
  return YAML.stringify(value, CV_YAML_STRINGIFY_OPTIONS);
}
