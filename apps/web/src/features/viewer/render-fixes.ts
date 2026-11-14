import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import YAML, { isMap } from 'yaml';
import { CV_YAML_STRINGIFY_OPTIONS } from '@rendercv/core';

/**
 * A change the renderer knows will fix (or make permanent) a problem it found,
 * for example writing a color name's hex value into `design.website_link_color`
 * or removing a design key the theme does not support.
 */
export type RenderFix = {
  section: SectionKey;
  op: 'set' | 'remove';
  path: Array<string | number>;
  value?: unknown;
  description: string;
};

export type AppliedRenderFixes = {
  sections: Partial<CvFileSections>;
  applied: RenderFix[];
  skipped: RenderFix[];
};

const SECTION_KEYS = new Set<SectionKey>(['cv', 'design', 'locale', 'settings']);
const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function isUsablePath(fix: RenderFix) {
  return (
    SECTION_KEYS.has(fix.section) &&
    fix.path.length > 1 &&
    fix.path[0] === fix.section &&
    fix.path.every((segment) => !FORBIDDEN_SEGMENTS.has(String(segment)))
  );
}

/**
 * Apply fixes to the user's own section text. The YAML is edited as a
 * document, so comments and formatting outside the changed keys survive. A fix
 * whose target no longer exists (the user already changed it) is skipped
 * rather than recreated.
 */
export function applyRenderFixes(
  sections: Partial<CvFileSections>,
  fixes: RenderFix[]
): AppliedRenderFixes {
  const documents = new Map<SectionKey, YAML.Document>();
  const applied: RenderFix[] = [];
  const skipped: RenderFix[] = [];

  for (const fix of fixes) {
    const text = sections[fix.section];
    if (!isUsablePath(fix) || typeof text !== 'string') {
      skipped.push(fix);
      continue;
    }

    let document = documents.get(fix.section);
    if (!document) {
      document = YAML.parseDocument(text);
      if (document.errors.length > 0 || !isMap(document.contents)) {
        skipped.push(fix);
        continue;
      }
      documents.set(fix.section, document);
    }

    const parentPath = fix.path.slice(0, -1);
    const parent = parentPath.length ? document.getIn(parentPath, true) : document.contents;
    if (!isMap(parent) || !document.hasIn(fix.path)) {
      skipped.push(fix);
      continue;
    }

    if (fix.op === 'remove') {
      document.deleteIn(fix.path);
    } else {
      document.setIn(fix.path, fix.value);
    }
    applied.push(fix);
  }

  const nextSections: Partial<CvFileSections> = {};
  for (const [section, document] of documents) {
    if (applied.some((fix) => fix.section === section)) {
      nextSections[section] = document.toString(CV_YAML_STRINGIFY_OPTIONS);
    }
  }

  return { sections: nextSections, applied, skipped };
}
