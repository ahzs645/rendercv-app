import YAML from 'yaml';

export interface SvgTextBox {
  text: string;
  topRatio: number;
}

export interface SvgSectionHit {
  entryIndex: number;
}

interface SvgEntryCandidate {
  entryIndex: number;
  texts: string[];
}

interface SvgSectionCandidates {
  title: string;
  entries: SvgEntryCandidate[];
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function sectionKeyToTitle(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(' ');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueTexts(values: string[]) {
  return Array.from(new Set(values.map(normalizeText).filter(Boolean)));
}

function entryAnchorTexts(entry: unknown): string[] {
  if (typeof entry === 'string') {
    return uniqueTexts([entry]);
  }

  const record = asRecord(entry);
  const priorityKeys = [
    'company',
    'institution',
    'name',
    'title',
    'label',
    'position',
    'degree',
    'area',
    'summary'
  ];

  return uniqueTexts(
    priorityKeys
      .map((key) => record[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  );
}

function entryYamlSearchTerms(entry: unknown): string[] {
  if (typeof entry === 'string') {
    return uniqueTexts([entry]);
  }

  const record = asRecord(entry);
  const priorityPairs = [
    ['company', 'company'],
    ['institution', 'institution'],
    ['name', 'name'],
    ['title', 'title'],
    ['label', 'label'],
    ['position', 'position'],
    ['degree', 'degree'],
    ['area', 'area'],
    ['summary', 'summary']
  ] as const;

  return uniqueTexts(
    priorityPairs
      .map(([field, prefix]) => {
        const value = record[field];
        return typeof value === 'string' && value.trim().length > 0
          ? `${prefix}: ${value}`
          : '';
      })
  );
}

function matchesCandidate(boxText: string, candidateTexts: string[]) {
  const normalizedBox = normalizeText(boxText);
  return candidateTexts.some((text) => normalizedBox.includes(normalizeText(text)));
}

export function buildSvgSectionCandidates(cvYaml: string, sectionKey: string): SvgSectionCandidates | null {
  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return null;
  }

  const cvRoot = asRecord(asRecord(parsed).cv);
  const sections = asRecord(cvRoot.sections);
  const entries = asArray(sections[sectionKey]);
  if (entries.length === 0) {
    return {
      title: sectionKeyToTitle(sectionKey),
      entries: []
    };
  }

  return {
    title: sectionKeyToTitle(sectionKey),
    entries: entries.map((entry, entryIndex) => ({
      entryIndex,
      texts: entryAnchorTexts(entry)
    }))
  };
}

export function buildYamlEntrySearchTerms(
  cvYaml: string,
  sectionKey: string,
  entryIndex: number
): string[] {
  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return [];
  }

  const cvRoot = asRecord(asRecord(parsed).cv);
  const sections = asRecord(cvRoot.sections);
  const entries = asArray(sections[sectionKey]);
  return entryYamlSearchTerms(entries[entryIndex]);
}

export function detectSvgSectionHit(
  boxes: SvgTextBox[],
  candidates: SvgSectionCandidates,
  clickYRatio: number
): SvgSectionHit | null {
  if (boxes.length === 0) {
    return null;
  }

  const anchors: Array<{ entryIndex: number; topRatio: number }> = [];
  let cursor = 0;

  const headingIndex = boxes.findIndex((box) =>
    matchesCandidate(box.text, [candidates.title])
  );
  if (headingIndex >= 0) {
    anchors.push({ entryIndex: -1, topRatio: boxes[headingIndex]!.topRatio });
    cursor = headingIndex + 1;
  }

  for (const entry of candidates.entries) {
    if (entry.texts.length === 0) {
      continue;
    }

    const boxIndex = boxes.findIndex((box, index) =>
      index >= cursor && matchesCandidate(box.text, entry.texts)
    );
    if (boxIndex === -1) {
      continue;
    }

    anchors.push({
      entryIndex: entry.entryIndex,
      topRatio: boxes[boxIndex]!.topRatio
    });
    cursor = boxIndex + 1;
  }

  if (anchors.length === 0) {
    return null;
  }

  let selected: { entryIndex: number; topRatio: number } | null = null;
  for (const anchor of anchors) {
    if (anchor.topRatio > clickYRatio) {
      break;
    }
    selected = anchor;
  }

  return selected ? { entryIndex: selected.entryIndex } : null;
}

export async function measureSvgTextBoxesFromUrl(pageUrl: string): Promise<SvgTextBox[]> {
  const svgText = await (await fetch(pageUrl)).text();
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-20000px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.innerHTML = svgText;
  document.body.append(host);

  try {
    const svg = host.querySelector('svg');
    if (!svg) {
      return [];
    }

    const svgRect = svg.getBoundingClientRect();
    if (svgRect.height <= 0) {
      return [];
    }

    return Array.from(host.querySelectorAll('foreignObject'))
      .map((node) => {
        const text = normalizeText(node.textContent || '');
        const rect = node.getBoundingClientRect();
        return {
          text,
          topRatio: (rect.top - svgRect.top) / svgRect.height
        };
      })
      .filter((box) => box.text.length > 0 && Number.isFinite(box.topRatio))
      .sort((a, b) => a.topRatio - b.topRatio);
  } finally {
    host.remove();
  }
}
