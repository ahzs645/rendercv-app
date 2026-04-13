import type { RenderError } from './use-viewer-renderer';

type RenderErrorLike = Pick<
  RenderError,
  'message' | 'schema_location' | 'yaml_location' | 'yaml_source'
>;

function formatSchemaPath(schemaLocation: string[] | null | undefined) {
  if (!schemaLocation || schemaLocation.length === 0) {
    return undefined;
  }

  return schemaLocation.join('.');
}

function formatYamlLocation(
  yamlLocation: [[number, number], [number, number]] | null | undefined
) {
  if (!yamlLocation) {
    return undefined;
  }

  const [[line, column]] = yamlLocation;
  return { line, column };
}

function formatSourceLabel(yamlSource: string | undefined) {
  switch (yamlSource) {
    case 'design':
      return 'design';
    case 'locale':
      return 'locale';
    case 'settings':
      return 'settings';
    default:
      return 'cv';
  }
}

export function formatRenderErrorMessage(error: RenderErrorLike) {
  const path = formatSchemaPath(error.schema_location);
  const location = formatYamlLocation(error.yaml_location);
  const source = formatSourceLabel(error.yaml_source);
  const genericUnknownField =
    error.message.trim() === 'This field is unknown for this object. Please remove it.';

  if (genericUnknownField && path) {
    const lineSuffix = location ? ` at line ${location.line}, column ${location.column}` : '';
    return `Unknown field ${path}${lineSuffix}.`;
  }

  const message = error.message.trim() || 'Validation error.';
  const details: string[] = [];

  if (path) {
    details.push(`field ${path}`);
  } else if (source !== 'cv') {
    details.push(`${source} section`);
  }

  if (location) {
    details.push(`line ${location.line}, column ${location.column}`);
  }

  if (details.length === 0) {
    return message;
  }

  return `${message} (${details.join('; ')})`;
}

export function summarizeRenderErrors(errors: RenderErrorLike[], maxItems = 2) {
  if (errors.length === 0) {
    return 'This file is not valid RenderCV YAML.';
  }

  const formatted = errors.slice(0, maxItems).map((error) => formatRenderErrorMessage(error));
  const suffix = errors.length > maxItems ? ` (+${errors.length - maxItems} more)` : '';
  return `This file is not valid RenderCV YAML. ${formatted.join(' ')}${suffix}`;
}
