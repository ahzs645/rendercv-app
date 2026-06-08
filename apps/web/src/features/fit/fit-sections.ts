import YAML from 'yaml';
import { entryFingerprint } from '@rendercv/core';
import type { FitEntry } from './fit-content';

/** Priority a user assigns to a section when fitting. */
export type FitWeight = 'pin' | 'high' | 'normal' | 'low';

export const FIT_WEIGHT_VALUE: Record<Exclude<FitWeight, 'pin'>, number> = {
  high: 3,
  normal: 2,
  low: 1
};

export const FIT_WEIGHT_OPTIONS: { value: FitWeight; label: string }[] = [
  { value: 'pin', label: 'Keep all' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' }
];

// Sections that are almost always the backbone of a resume — kept longest.
const MAIN_SECTION_HINTS = ['experience', 'education', 'project', 'work', 'employment'];

export interface FitSectionInfo {
  sectionKey: string;
  title: string;
  entryCount: number;
}

function titleFromKey(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(' ');
}

function readSections(cvYaml: string): Record<string, unknown[]> {
  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return {};
  }

  const sections =
    parsed && typeof parsed === 'object' && 'cv' in parsed
      ? (parsed as { cv?: { sections?: unknown } }).cv?.sections
      : undefined;

  if (!sections || typeof sections !== 'object' || Array.isArray(sections)) {
    return {};
  }

  const result: Record<string, unknown[]> = {};
  for (const [key, value] of Object.entries(sections as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      result[key] = value;
    }
  }
  return result;
}

/** List the CV's sections (with entry counts) for the Fit weights UI. */
export function listFitSections(cvYaml: string): FitSectionInfo[] {
  return Object.entries(readSections(cvYaml)).map(([sectionKey, entries]) => ({
    sectionKey,
    title: titleFromKey(sectionKey),
    entryCount: entries.length
  }));
}

function isMainSection(sectionKey: string): boolean {
  const lower = sectionKey.toLowerCase();
  return MAIN_SECTION_HINTS.some((hint) => lower.includes(hint));
}

/** Default weights: main sections start High, everything else Normal. */
export function defaultFitWeights(sections: FitSectionInfo[]): Record<string, FitWeight> {
  return Object.fromEntries(
    sections.map((section) => [section.sectionKey, isMainSection(section.sectionKey) ? 'high' : 'normal'])
  );
}

/** Build the flat entry list the optimizer consumes. */
export function buildFitEntries(
  cvYaml: string,
  weights: Record<string, FitWeight>
): FitEntry[] {
  const sections = readSections(cvYaml);
  const entries: FitEntry[] = [];

  for (const [sectionKey, sectionEntries] of Object.entries(sections)) {
    const weight = weights[sectionKey] ?? 'normal';
    const pinned = weight === 'pin';
    const numericWeight = pinned ? FIT_WEIGHT_VALUE.high : FIT_WEIGHT_VALUE[weight];

    sectionEntries.forEach((entry, position) => {
      entries.push({
        sectionKey,
        fingerprint: entryFingerprint(entry),
        position,
        weight: numericWeight,
        pinned
      });
    });
  }

  return entries;
}
