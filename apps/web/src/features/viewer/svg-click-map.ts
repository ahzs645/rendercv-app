import YAML from 'yaml';

export interface SvgTextBox {
  text: string;
  topRatio: number;
  bottomRatio?: number;
}

export interface SvgSectionHit {
  entryIndex: number;
}

export interface SvgSectionSegment {
  sectionKey: string;
  startRatio: number;
  endRatio: number;
}

export interface SvgHitZone {
  sectionKey: string;
  entryIndex: number;
  startRatio: number;
  endRatio: number;
}

interface SvgEntryCandidate {
  entryIndex: number;
  texts: string[];
}

export interface SvgSectionCandidates {
  sectionKey: string;
  title: string;
  entries: SvgEntryCandidate[];
}

export interface SvgDocumentCandidates {
  sections: SvgSectionCandidates[];
}

function normalizeText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMatchText(value: string) {
  return normalizeText(value).toLowerCase();
}

function compactMatchText(value: string) {
  return normalizeMatchText(value).replace(/[^a-z0-9]+/g, '');
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
    'details',
    'position',
    'degree',
    'area',
    'summary',
    'journal',
    'doi'
  ];

  return uniqueTexts(
    priorityKeys
      .map((key) => record[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  );
}

function preferDistinctEntryTexts(entries: SvgEntryCandidate[]) {
  const textCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const text of entry.texts) {
      const key = normalizeMatchText(text);
      textCounts.set(key, (textCounts.get(key) ?? 0) + 1);
    }
  }

  return entries.map((entry) => {
    const distinctTexts = entry.texts.filter((text) => (textCounts.get(normalizeMatchText(text)) ?? 0) === 1);
    return {
      ...entry,
      texts: distinctTexts.length > 0 ? distinctTexts : entry.texts
    };
  });
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
    ['details', 'details'],
    ['position', 'position'],
    ['degree', 'degree'],
    ['area', 'area'],
    ['summary', 'summary'],
    ['journal', 'journal'],
    ['doi', 'doi']
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
  return candidateTexts.some((text) => matchesSingleCandidate(boxText, text));
}

function matchesHeading(boxText: string, headingText: string) {
  return normalizeMatchText(boxText) === normalizeMatchText(headingText);
}

function isPunctuationLike(value: string) {
  return /^[,.;:!?()[\]{}\-–—/\\|]+$/.test(normalizeText(value));
}

function isIsolatedHeadingRow(boxes: SvgTextBox[], headingIndex: number) {
  const headingBox = boxes[headingIndex];
  if (!headingBox) {
    return false;
  }

  const ROW_TOLERANCE = 0.0025;
  const rowTexts = boxes
    .filter((box) => Math.abs(box.topRatio - headingBox.topRatio) <= ROW_TOLERANCE)
    .map((box) => normalizeText(box.text))
    .filter((text) => text.length > 0 && !isPunctuationLike(text));

  return rowTexts.length === 1;
}

function findHeadingBoxIndex(boxes: SvgTextBox[], headingText: string) {
  return boxes.findIndex(
    (box, index) => matchesHeading(box.text, headingText) && isIsolatedHeadingRow(boxes, index)
  );
}

function findHeadingAnchors(boxes: SvgTextBox[], documentCandidates: SvgDocumentCandidates) {
  return documentCandidates.sections
    .map((section) => {
      const boxIndex = findHeadingBoxIndex(boxes, section.title);
      return boxIndex >= 0
        ? {
            sectionKey: section.sectionKey,
            topRatio: boxes[boxIndex]!.topRatio
          }
        : null;
    })
    .filter((anchor): anchor is { sectionKey: string; topRatio: number } => anchor !== null)
    .sort((a, b) => a.topRatio - b.topRatio);
}

function maxFuzzyDistance(leftLength: number, rightLength: number) {
  return Math.max(2, Math.min(5, Math.floor(Math.max(leftLength, rightLength) * 0.15)));
}

function boundedLevenshteinDistance(left: string, right: string, maxDistance: number) {
  if (left === right) {
    return 0;
  }

  if (Math.abs(left.length - right.length) > maxDistance) {
    return maxDistance + 1;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    let rowMin = current[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex]! + 1,
        current[rightIndex - 1]! + 1,
        previous[rightIndex - 1]! + cost
      );
      rowMin = Math.min(rowMin, current[rightIndex]!);
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    for (let index = 0; index < current.length; index += 1) {
      previous[index] = current[index]!;
    }
  }

  return previous[right.length]!;
}

function fuzzyEquivalentMatch(boxText: string, candidateText: string) {
  const compactBox = compactMatchText(boxText);
  const compactCandidate = compactMatchText(candidateText);
  if (compactBox.length < 8 || compactCandidate.length < 8) {
    return false;
  }

  const maxDistance = maxFuzzyDistance(compactBox.length, compactCandidate.length);
  return boundedLevenshteinDistance(compactBox, compactCandidate, maxDistance) <= maxDistance;
}

function fuzzyPrefixMatch(boxText: string, candidateText: string) {
  const compactBox = compactMatchText(boxText);
  const compactCandidate = compactMatchText(candidateText);
  if (compactBox.length < 16 || compactCandidate.length <= compactBox.length) {
    return false;
  }

  const maxDistance = maxFuzzyDistance(compactBox.length, compactCandidate.length);
  const candidatePrefix = compactCandidate.slice(0, compactBox.length + maxDistance);
  return boundedLevenshteinDistance(compactBox, candidatePrefix, maxDistance) <= maxDistance;
}

function matchesSingleCandidate(boxText: string, candidateText: string) {
  const normalizedBox = normalizeMatchText(boxText);
  const normalizedText = normalizeMatchText(candidateText);
  if (normalizedBox === normalizedText) {
    return true;
  }

  const boxWordCount = normalizedBox.split(' ').filter(Boolean).length;
  const wordCount = normalizedText.split(' ').filter(Boolean).length;
  if (
    normalizedText.length >= 24 &&
    wordCount >= 4 &&
    normalizedBox.length >= 24 &&
    boxWordCount >= 4 &&
    normalizedText.startsWith(normalizedBox)
  ) {
    return true;
  }

  if (
    normalizedText.length >= 24 &&
    wordCount >= 4 &&
    normalizedBox.length >= 24 &&
    boxWordCount >= 4 &&
    fuzzyPrefixMatch(boxText, candidateText)
  ) {
    return true;
  }

  if (normalizedBox.includes(normalizedText)) {
    return true;
  }

  if (fuzzyEquivalentMatch(boxText, candidateText)) {
    return true;
  }

  if (normalizedText.length < 16 || wordCount < 3) {
    return false;
  }

  return compactMatchText(boxText).includes(compactMatchText(candidateText));
}

function getBoxBottomRatio(box: SvgTextBox) {
  return box.bottomRatio ?? box.topRatio;
}

function collectEntryAnchors(
  boxes: SvgTextBox[],
  candidates: SvgSectionCandidates,
  options?: {
    segmentStartRatio?: number;
    segmentEndRatio?: number;
    includeHeading?: boolean;
  }
) {
  const anchors: Array<{ entryIndex: number; topRatio: number }> = [];
  const segmentStartRatio = options?.segmentStartRatio ?? 0;
  const segmentEndRatio = options?.segmentEndRatio ?? 1.001;
  let cursor = boxes.findIndex((box) => box.topRatio >= segmentStartRatio);
  if (cursor === -1) {
    cursor = boxes.length;
  }

  const headingIndex = options?.includeHeading ? findHeadingBoxIndex(boxes, candidates.title) : -1;
  if (
    headingIndex >= 0 &&
    boxes[headingIndex]!.topRatio >= segmentStartRatio &&
    boxes[headingIndex]!.topRatio < segmentEndRatio
  ) {
    anchors.push({ entryIndex: -1, topRatio: boxes[headingIndex]!.topRatio });
    cursor = headingIndex + 1;
  }

  for (const entry of candidates.entries) {
    if (entry.texts.length === 0) {
      continue;
    }

    const boxIndex = entry.texts.reduce<number>((foundIndex, text) => {
      if (foundIndex >= 0) {
        return foundIndex;
      }

      return boxes.findIndex((box, index) =>
        index >= cursor &&
        box.topRatio >= segmentStartRatio &&
        box.topRatio < segmentEndRatio &&
        matchesSingleCandidate(box.text, text)
      );
    }, -1);
    if (boxIndex === -1) {
      continue;
    }

    anchors.push({
      entryIndex: entry.entryIndex,
      topRatio: boxes[boxIndex]!.topRatio
    });
    cursor = boxIndex + 1;
  }

  return anchors;
}

function resolveSegmentVisualEnd(
  boxes: SvgTextBox[],
  segmentStartRatio: number,
  segmentEndRatio: number
) {
  const hasMeasuredBottoms = boxes.some((box) => typeof box.bottomRatio === 'number');
  if (!hasMeasuredBottoms) {
    return segmentEndRatio;
  }

  const visibleBottoms = boxes
    .filter((box) => box.topRatio >= segmentStartRatio && box.topRatio < segmentEndRatio)
    .map(getBoxBottomRatio)
    .filter((bottomRatio) => Number.isFinite(bottomRatio));

  if (visibleBottoms.length === 0) {
    return segmentEndRatio;
  }

  return Math.min(Math.max(...visibleBottoms), segmentEndRatio);
}

function buildSvgSectionHitZones(
  boxes: SvgTextBox[],
  candidates: SvgSectionCandidates,
  options?: {
    segmentStartRatio?: number;
    segmentEndRatio?: number;
  }
) {
  const segmentStartRatio = options?.segmentStartRatio ?? 0;
  const segmentEndRatio = options?.segmentEndRatio ?? 1.001;
  const segmentVisualEnd = resolveSegmentVisualEnd(boxes, segmentStartRatio, segmentEndRatio);
  const headingIndex = findHeadingBoxIndex(boxes, candidates.title);
  const hasVisibleHeading =
    headingIndex >= 0 &&
    boxes[headingIndex]!.topRatio >= segmentStartRatio &&
    boxes[headingIndex]!.topRatio < segmentEndRatio;
  const anchors = collectEntryAnchors(boxes, candidates, {
    segmentStartRatio,
    segmentEndRatio,
    includeHeading: hasVisibleHeading
  });

  if (anchors.length === 0) {
    return segmentVisualEnd > segmentStartRatio
      ? [
          {
            sectionKey: candidates.sectionKey,
            entryIndex: -1,
            startRatio: segmentStartRatio,
            endRatio: segmentVisualEnd
          }
        ]
      : [];
  }

  const zones: SvgHitZone[] = [];
  if (anchors[0]!.topRatio > segmentStartRatio) {
    zones.push({
      sectionKey: candidates.sectionKey,
      entryIndex: -1,
      startRatio: segmentStartRatio,
      endRatio: Math.min(anchors[0]!.topRatio, segmentVisualEnd)
    });
  }

  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index]!;
    const endRatio = Math.min(anchors[index + 1]?.topRatio ?? segmentVisualEnd, segmentVisualEnd);
    if (endRatio <= anchor.topRatio) {
      continue;
    }

    zones.push({
      sectionKey: candidates.sectionKey,
      entryIndex: anchor.entryIndex,
      startRatio: anchor.topRatio,
      endRatio
    });
  }

  return zones;
}

function findHeadinglessSectionForPage(
  boxes: SvgTextBox[],
  documentCandidates: SvgDocumentCandidates
) {
  const sectionMatches = documentCandidates.sections
    .map((section) => {
      const anchors = collectEntryAnchors(boxes, section);
      const entryAnchors = anchors.filter((anchor) => anchor.entryIndex >= 0);
      if (entryAnchors.length === 0) {
        return null;
      }

      return {
        sectionKey: section.sectionKey,
        firstTopRatio: entryAnchors[0]!.topRatio,
        matchedCount: entryAnchors.length
      };
    })
    .filter(
      (
        match
      ): match is {
        sectionKey: string;
        firstTopRatio: number;
        matchedCount: number;
      } => match !== null
    )
    .sort((a, b) => {
      if (a.matchedCount !== b.matchedCount) {
        return b.matchedCount - a.matchedCount;
      }
      return a.firstTopRatio - b.firstTopRatio;
    });

  return sectionMatches[0] ?? null;
}

function buildSvgPageSectionSegments(
  boxes: SvgTextBox[],
  documentCandidates: SvgDocumentCandidates
): SvgSectionSegment[] {
  const headingAnchors = findHeadingAnchors(boxes, documentCandidates);
  if (headingAnchors.length === 0) {
    const section = findHeadinglessSectionForPage(boxes, documentCandidates);
    return section
      ? [
          {
            sectionKey: section.sectionKey,
            startRatio: 0,
            endRatio: 1.001
          }
        ]
      : [];
  }

  const segments = headingAnchors.map((anchor, index) => ({
    sectionKey: anchor.sectionKey,
    startRatio: anchor.topRatio,
    endRatio: headingAnchors[index + 1]?.topRatio ?? 1.001
  }));

  const firstVisibleHeadingIndex = documentCandidates.sections.findIndex(
    (section) => section.sectionKey === headingAnchors[0]!.sectionKey
  );
  if (firstVisibleHeadingIndex > 0 && headingAnchors[0]!.topRatio > 0) {
    segments.unshift({
      sectionKey: documentCandidates.sections[firstVisibleHeadingIndex - 1]!.sectionKey,
      startRatio: 0,
      endRatio: headingAnchors[0]!.topRatio
    });
  }

  return segments;
}

export function buildSvgDocumentCandidates(cvYaml: string): SvgDocumentCandidates | null {
  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return null;
  }

  const cvRoot = asRecord(asRecord(parsed).cv);
  const sections = asRecord(cvRoot.sections);
  return {
    sections: Object.entries(sections).map(([sectionKey, sectionValue]) => {
      const entries = preferDistinctEntryTexts(
        asArray(sectionValue).map((entry, entryIndex) => ({
          entryIndex,
          texts: entryAnchorTexts(entry)
        }))
      );

      return {
        sectionKey,
        title: sectionKeyToTitle(sectionKey),
        entries
      };
    })
  };
}

export function buildSvgSectionCandidates(cvYaml: string, sectionKey: string): SvgSectionCandidates | null {
  const documentCandidates = buildSvgDocumentCandidates(cvYaml);
  if (!documentCandidates) {
    return null;
  }

  return documentCandidates.sections.find((section) => section.sectionKey === sectionKey) ?? null;
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
  clickYRatio: number,
  options?: {
    segmentStartRatio?: number;
    segmentEndRatio?: number;
  }
): SvgSectionHit | null {
  if (boxes.length === 0) {
    return null;
  }

  const zones = buildSvgSectionHitZones(boxes, candidates, options);
  const zone = zones.find((candidate) => clickYRatio >= candidate.startRatio && clickYRatio < candidate.endRatio);
  return zone ? { entryIndex: zone.entryIndex } : null;
}

export function buildSvgPageHitZones(
  boxes: SvgTextBox[],
  documentCandidates: SvgDocumentCandidates
): SvgHitZone[] {
  const segments = buildSvgPageSectionSegments(boxes, documentCandidates);

  return segments.flatMap((segment) => {
    const candidates =
      documentCandidates.sections.find((section) => section.sectionKey === segment.sectionKey) ?? null;
    if (!candidates) {
      return [];
    }

    return buildSvgSectionHitZones(boxes, candidates, {
      segmentStartRatio: segment.startRatio,
      segmentEndRatio: segment.endRatio
    });
  });
}

export function detectSvgSectionSegment(
  boxes: SvgTextBox[],
  documentCandidates: SvgDocumentCandidates,
  clickYRatio: number
): SvgSectionSegment | null {
  const headingAnchors = findHeadingAnchors(boxes, documentCandidates);
  if (headingAnchors.length === 0) {
    const sectionMatches = documentCandidates.sections
      .map((section) => {
        const anchors = collectEntryAnchors(boxes, section);
        const entryAnchors = anchors.filter((anchor) => anchor.entryIndex >= 0);
        if (entryAnchors.length === 0) {
          return null;
        }

        let lastAnchorBeforeClick: number | null = null;
        for (const anchor of entryAnchors) {
          if (anchor.topRatio > clickYRatio) {
            break;
          }
          lastAnchorBeforeClick = anchor.topRatio;
        }

        return {
          sectionKey: section.sectionKey,
          firstTopRatio: entryAnchors[0]!.topRatio,
          lastAnchorBeforeClick,
          matchedCount: entryAnchors.length
        };
      })
      .filter(
        (
          match
        ): match is {
          sectionKey: string;
          firstTopRatio: number;
          lastAnchorBeforeClick: number | null;
          matchedCount: number;
        } => match !== null
      );

    if (sectionMatches.length === 0) {
      return null;
    }

    const sectionBeforeClick = sectionMatches
      .filter((match) => match.lastAnchorBeforeClick !== null)
      .sort((a, b) => {
        if (a.lastAnchorBeforeClick !== b.lastAnchorBeforeClick) {
          return (b.lastAnchorBeforeClick ?? -1) - (a.lastAnchorBeforeClick ?? -1);
        }
        if (a.matchedCount !== b.matchedCount) {
          return b.matchedCount - a.matchedCount;
        }
        return a.firstTopRatio - b.firstTopRatio;
      })[0];

    if (sectionBeforeClick) {
      return {
        sectionKey: sectionBeforeClick.sectionKey,
        startRatio: 0,
        endRatio: 1.001
      };
    }

    const firstSectionOnPage = sectionMatches.sort((a, b) => a.firstTopRatio - b.firstTopRatio)[0];
    return firstSectionOnPage
      ? {
          sectionKey: firstSectionOnPage.sectionKey,
          startRatio: 0,
          endRatio: 1.001
        }
      : null;
  }

  const anchors = headingAnchors;

  let selectedIndex = -1;
  for (let index = 0; index < anchors.length; index += 1) {
    if (anchors[index]!.topRatio > clickYRatio) {
      break;
    }
    selectedIndex = index;
  }

  if (selectedIndex >= 0) {
    return {
      sectionKey: anchors[selectedIndex]!.sectionKey,
      startRatio: anchors[selectedIndex]!.topRatio,
      endRatio: anchors[selectedIndex + 1]?.topRatio ?? 1.001
    };
  }

  const firstVisibleHeadingIndex = documentCandidates.sections.findIndex(
    (section) => section.sectionKey === headingAnchors[0]!.sectionKey
  );
  if (firstVisibleHeadingIndex > 0) {
    return {
      sectionKey: documentCandidates.sections[firstVisibleHeadingIndex - 1]!.sectionKey,
      startRatio: 0,
      endRatio: headingAnchors[0]!.topRatio
    };
  }

  return null;
}

export function detectSvgSectionKey(
  boxes: SvgTextBox[],
  documentCandidates: SvgDocumentCandidates,
  clickYRatio: number
): string | null {
  return detectSvgSectionSegment(boxes, documentCandidates, clickYRatio)?.sectionKey ?? null;
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
          topRatio: (rect.top - svgRect.top) / svgRect.height,
          bottomRatio: (rect.bottom - svgRect.top) / svgRect.height
        };
      })
      .filter((box) => box.text.length > 0 && Number.isFinite(box.topRatio))
      .sort((a, b) => a.topRatio - b.topRatio);
  } finally {
    host.remove();
  }
}
