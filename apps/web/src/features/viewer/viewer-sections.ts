import type { CvFile, CvFileSections, CvVariantDefinition } from '@rendercv/contracts';
import { resolveFileSections } from '@rendercv/core';
import YAML from 'yaml';
import {
  normalizeCompatibilityCvYaml,
  stripPositionMarkersFromCvYaml
} from './normalize-compat-cv';

const LEGACY_DESIGN_KEY_PATTERN =
  /^\s*(font_size|page_size|keep_sections_together|keep_entries_together|prevent_orphaned_headers|section_heading_size)\s*:/m;

function looksLikeLegacyDesignSchema(design: string) {
  return LEGACY_DESIGN_KEY_PATTERN.test(design);
}

function readThemeName(designContent: string | undefined) {
  if (!designContent?.trim()) {
    return undefined;
  }

  try {
    const parsed = YAML.parse(designContent);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'design' in parsed &&
      parsed.design &&
      typeof parsed.design === 'object' &&
      'theme' in parsed.design &&
      typeof parsed.design.theme === 'string'
    ) {
      return parsed.design.theme;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function normalizeLegacyDesignYaml(designContent: string | undefined) {
  if (!designContent?.trim() || !looksLikeLegacyDesignSchema(designContent)) {
    return designContent;
  }

  try {
    const parsed = YAML.parse(designContent);
    if (!parsed || typeof parsed !== 'object' || !('design' in parsed)) {
      return designContent;
    }

    const root = parsed as Record<string, unknown> & { design?: Record<string, unknown> };
    if (!root.design || typeof root.design !== 'object') {
      return designContent;
    }

    const design = { ...root.design };
    let changed = false;

    if (typeof design.font_size === 'string') {
      const typography =
        design.typography && typeof design.typography === 'object'
          ? { ...(design.typography as Record<string, unknown>) }
          : {};
      const fontSize =
        typography.font_size && typeof typography.font_size === 'object'
          ? { ...(typography.font_size as Record<string, unknown>) }
          : {};

      if (fontSize.body !== design.font_size) {
        fontSize.body = design.font_size;
      }

      typography.font_size = fontSize;
      design.typography = typography;
      delete design.font_size;
      changed = true;
    }

    if (typeof design.page_size === 'string') {
      const page =
        design.page && typeof design.page === 'object'
          ? { ...(design.page as Record<string, unknown>) }
          : {};

      if (page.size !== design.page_size) {
        page.size = design.page_size;
      }

      design.page = page;
      delete design.page_size;
      changed = true;
    }

    if (!changed) {
      return designContent;
    }

    return YAML.stringify({
      ...root,
      design
    });
  } catch {
    return designContent;
  }
}

export function resolveViewerSections(file: CvFile): CvFileSections {
  const sections = resolveFileSections(file);
  const variant =
    file.selectedVariant && file.variants?.[file.selectedVariant]
      ? file.variants[file.selectedVariant]
      : undefined;

  return prepareViewerSections(sections, variant);
}

export function prepareViewerSections(
  sections: CvFileSections,
  variant?: CvVariantDefinition | null
): CvFileSections {
  const design = normalizeLegacyDesignYaml(sections.design) ?? sections.design;
  const normalizedCv = normalizeCompatibilityCvYaml(sections.cv, { variant: variant ?? undefined });
  const themeName = readThemeName(design);

  return {
    ...sections,
    cv: themeName === 'ahmadstyle' ? normalizedCv : stripPositionMarkersFromCvYaml(normalizedCv),
    design
  };
}
