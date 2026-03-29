import type { CvVariantDefinition } from '@rendercv/contracts';
import YAML from 'yaml';
const SUPPORTED_SOCIAL_NETWORKS = new Set([
  'LinkedIn',
  'GitHub',
  'GitLab',
  'IMDB',
  'Instagram',
  'ORCID',
  'Mastodon',
  'StackOverflow',
  'ResearchGate',
  'YouTube',
  'Google Scholar',
  'Telegram',
  'WhatsApp',
  'Leetcode',
  'X',
  'Bluesky'
]);
const CUSTOM_CONNECTION_ICONS: Record<string, string> = {
  Facebook: 'facebook-f'
};
const POSITION_SPACING_SAME_MARKER = 'RCVSPACINGSAME:';
const POSITION_SPACING_DIFF_MARKER = 'RCVSPACINGDIFF:';
const MONTH_NAMES: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December'
};
const MONTH_NUMBERS_BY_NAME = Object.fromEntries(
  Object.entries(MONTH_NAMES).map(([month, name]) => [name, month])
) as Record<string, string>;

type UnknownRecord = Record<string, unknown>;
type NormalizeCompatibilityOptions = {
  variant?: CvVariantDefinition | null;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function joinParts(parts: unknown[], separator = ' · ') {
  const values: string[] = [];
  for (const part of parts) {
    if (part == null) {
      continue;
    }

    const text = String(part).trim();
    if (text) {
      values.push(text);
    }
  }

  if (values.length === 0) {
    return undefined;
  }

  return values.join(separator);
}

function cleanMapping(mapping: UnknownRecord) {
  const cleaned: UnknownRecord = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

function stringifyNumbers(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stringifyNumbers(item));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, stringifyNumbers(item)])
    );
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return value;
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickFlavorValue(value: unknown, preferredFlavors: string[]): unknown {
  if (!isRecord(value) || !('flavors' in value) || !isRecord(value.flavors)) {
    return value;
  }

  const matchedValues: unknown[] = [];
  for (const flavorName of preferredFlavors) {
    const selected = value.flavors[flavorName];
    if (selected !== undefined && selected !== null && selected !== '') {
      if (Array.isArray(selected)) {
        if (selected.length > 0) {
          matchedValues.push(...selected);
        }
        continue;
      }

      return selected;
    }
  }

  if (matchedValues.length > 0) {
    return matchedValues;
  }

  return Object.values(value.flavors)[0] ?? value;
}

function normalizeFlavoredFields(entry: unknown, preferredFlavors: string[]): unknown {
  if (!isRecord(entry)) {
    return entry;
  }

  const normalized: UnknownRecord = { ...entry };
  for (const [fieldName, fieldValue] of Object.entries(normalized)) {
    if (isRecord(fieldValue) && 'flavors' in fieldValue) {
      normalized[fieldName] = pickFlavorValue(fieldValue, preferredFlavors);
    }
  }

  return normalized;
}

function matchesEntryVariant(entry: UnknownRecord, selectedTags: string[], variantActive: boolean) {
  if (!variantActive) {
    return true;
  }

  const inverseTags = normalizeStringList(entry.itags);
  if (inverseTags.length > 0 && inverseTags.some((tag) => selectedTags.includes(tag))) {
    return false;
  }

  const requiredTags = normalizeStringList(entry.tags);
  if (requiredTags.length > 0 && !requiredTags.some((tag) => selectedTags.includes(tag))) {
    return false;
  }

  return true;
}

function stripCompatFields(entry: unknown): unknown {
  if (!isRecord(entry)) {
    return entry;
  }

  const normalized: UnknownRecord = { ...entry };
  delete normalized.itags;
  delete normalized.tags;
  delete normalized.spacing_after;
  delete normalized.show_date_in_position;
  return normalized;
}

function formatDateForDisplay(dateString: unknown) {
  if (dateString == null) {
    return '';
  }

  const normalized = String(dateString).trim();
  if (!normalized) {
    return '';
  }

  if (normalized.toLowerCase() === 'present') {
    return 'Present';
  }

  const parts = normalized.split('-');
  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length >= 2) {
    const monthName = MONTH_NAMES[parts[1].padStart(2, '0')];
    if (monthName) {
      return `${monthName} ${parts[0]}`;
    }
  }

  return normalized;
}

function formatDateRangeForDisplay(startDate: unknown, endDate: unknown) {
  const start = formatDateForDisplay(startDate);
  const end = formatDateForDisplay(endDate);
  if (start && end) {
    return `${start} – ${end}`;
  }

  return start || end;
}

function selectCompanyStartDate(positions: UnknownRecord[]) {
  const startDates = positions
    .map((position) => position.start_date)
    .filter((date): date is string => date != null && String(date).trim().length > 0)
    .map((date) => String(date));

  if (startDates.length === 0) {
    return undefined;
  }

  return [...startDates].sort()[0];
}

function selectCompanyEndDate(positions: UnknownRecord[]) {
  const endDates = positions
    .map((position) => position.end_date)
    .filter((date): date is string => date != null && String(date).trim().length > 0)
    .map((date) => String(date));

  if (endDates.length === 0) {
    return undefined;
  }

  if (endDates.some((date) => date.toLowerCase() === 'present')) {
    return 'present';
  }

  return [...endDates].sort().at(-1);
}

function normalizePositionTitle(position: UnknownRecord) {
  return String(position.title ?? position.position ?? '').trim();
}

function appendSummary(entry: UnknownRecord, parts: unknown[]) {
  const summary = joinParts([entry.summary, ...parts]);
  if (!summary) {
    return entry;
  }

  return {
    ...entry,
    summary
  };
}

function normalizeExperienceEntry(entry: UnknownRecord) {
  const normalized = stripCompatFields(entry);
  if (!isRecord(normalized)) {
    return entry;
  }

  const normalizedRecord = appendSummary(normalized, [
    normalized.course,
    normalized.course_level ? `Level: ${normalized.course_level}` : undefined,
    normalized.number_of_students ? `Students: ${normalized.number_of_students}` : undefined
  ]);

  delete normalizedRecord.course;
  delete normalizedRecord.course_level;
  delete normalizedRecord.number_of_students;

  return cleanMapping(normalizedRecord);
}

function normalizeEducationEntry(entry: UnknownRecord) {
  const normalized = stripCompatFields(entry);
  if (!isRecord(normalized)) {
    return entry;
  }

  const normalizedRecord = appendSummary(normalized, [
    normalized.supervisor ? `Supervisor: ${normalized.supervisor}` : undefined
  ]);

  delete normalizedRecord.supervisor;
  return cleanMapping(normalizedRecord);
}

function normalizeAwardEntry(entry: UnknownRecord) {
  const normalized = stripCompatFields(entry);
  if (!isRecord(normalized)) {
    return entry;
  }

  const normalizedRecord = appendSummary(normalized, [
    normalized.amount ? `Amount: ${normalized.amount}` : undefined
  ]);

  delete normalizedRecord.amount;
  return cleanMapping(normalizedRecord);
}

function expandNestedPositions(
  entry: unknown,
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
): UnknownRecord[] {
  if (!isRecord(entry)) {
    return [];
  }

  const preparedEntry = normalizeFlavoredFields(entry, preferredFlavors);
  if (!isRecord(preparedEntry) || !matchesEntryVariant(preparedEntry, selectedTags, variantActive)) {
    return [];
  }

  const normalizedEntry = normalizeExperienceEntry(preparedEntry);
  const positions = normalizedEntry.positions;
  if (!Array.isArray(positions)) {
    return [normalizedEntry];
  }

  const visiblePositions = positions
    .map((position) => normalizeFlavoredFields(position, preferredFlavors))
    .filter(isRecord)
    .filter((position) => matchesEntryVariant(position, selectedTags, variantActive))
    .map((position) => normalizeExperienceEntry(position))
    .filter((position) => isRecord(position));

  if (visiblePositions.length === 0) {
    return [];
  }

  const baseEntry: UnknownRecord = { ...normalizedEntry };
  const showDateInPosition = Boolean(entry.show_date_in_position);
  delete baseEntry.positions;
  delete baseEntry.show_date_in_position;

  const companyStartDate = selectCompanyStartDate(visiblePositions);
  const companyEndDate = selectCompanyEndDate(visiblePositions);
  const includePositionDates = visiblePositions.length > 1 || showDateInPosition;

  return visiblePositions.map((position, index) => {
    const item: UnknownRecord = { ...baseEntry };
    const positionTitle = normalizePositionTitle(position) || String(item.position ?? '').trim();
    let positionText = positionTitle;

    if (includePositionDates && positionTitle) {
      const positionDateRange = formatDateRangeForDisplay(position.start_date, position.end_date);
      if (positionDateRange) {
        positionText = `${positionTitle} | ${positionDateRange}`;
      }
    }

    const marker =
      index < visiblePositions.length - 1 ? POSITION_SPACING_SAME_MARKER : POSITION_SPACING_DIFF_MARKER;
    if (positionText) {
      item.position = `${marker}${positionText}`;
    }

    if (index === 0) {
      if (companyStartDate) {
        item.start_date = companyStartDate;
      } else if (position.start_date) {
        item.start_date = position.start_date;
      }

      if (companyEndDate) {
        item.end_date = companyEndDate;
      } else if (position.end_date) {
        item.end_date = position.end_date;
      }
    } else {
      item.company = '';
      if (position.start_date) {
        item.start_date = position.start_date;
      }
      if (position.end_date) {
        item.end_date = position.end_date;
      }
    }

    if (position.summary) {
      item.summary = position.summary;
    }
    if (position.highlights) {
      item.highlights = position.highlights;
    }
    if (position.location) {
      item.location = position.location;
    }

    return cleanMapping(item);
  });
}

function prepareVariantRecord(
  entry: unknown,
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  const normalized = normalizeFlavoredFields(entry, preferredFlavors);
  if (!isRecord(normalized) || !matchesEntryVariant(normalized, selectedTags, variantActive)) {
    return undefined;
  }

  return normalized;
}

function normalizePublications(
  entries: unknown[],
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  return entries.flatMap((entry) => {
    const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
    if (!prepared) {
      return [];
    }

    const item = stripCompatFields(prepared);
    if (!isRecord(item)) {
      return [];
    }

    let authors = item.authors;
    if (isRecord(authors) && 'flavors' in authors) {
      authors = pickFlavorValue(authors, preferredFlavors);
    }
    if (authors && !Array.isArray(authors)) {
      authors = [authors];
    }

    let journal: string | undefined;
    if (item.journal) {
      journal = String(item.journal).trim();
      if (item.volume && item.issue) {
        journal = `${journal}, ${item.volume}(${item.issue})`;
      } else if (item.volume) {
        journal = `${journal}, ${item.volume}`;
      }
    } else {
      journal = joinParts([item.institution, item.type]);
    }

    return [
      cleanMapping({
        title: item.title,
        authors,
        journal,
        date: item.date,
        doi: item.doi,
        summary: joinParts([
          item.summary,
          item.editor ? `Editor: ${item.editor}` : undefined,
          item.publisher,
          item.pages ? `Pages: ${item.pages}` : undefined
        ])
      })
    ];
  });
}

function normalizeSupervisoryActivities(
  entries: unknown[],
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  return entries.flatMap((entry) => {
    const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
    if (!prepared) {
      return [];
    }

    if ('label' in prepared && 'details' in prepared) {
      return [cleanMapping(prepared)];
    }

    return Object.entries(prepared)
      .filter(([, value]) => value != null)
      .map(([key, value]) =>
        cleanMapping({
          label: key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
          details: String(value)
        })
      );
  });
}

function normalizeSocialConnections(cvData: UnknownRecord) {
  if (cvData.social_networks !== undefined) {
    return;
  }

  const socialEntries = cvData.social;
  if (!Array.isArray(socialEntries)) {
    return;
  }

  delete cvData.social;

  const socialNetworks: UnknownRecord[] = [];
  const customConnections = Array.isArray(cvData.custom_connections)
    ? [...(cvData.custom_connections as unknown[]).filter(isRecord)]
    : [];

  for (const entry of socialEntries) {
    if (!isRecord(entry)) {
      continue;
    }

    const network = entry.network;
    const username = entry.username;
    const url = entry.url;

    if (typeof network === 'string' && SUPPORTED_SOCIAL_NETWORKS.has(network) && username) {
      socialNetworks.push({
        network,
        username: String(username)
      });
      continue;
    }

    if (network && (username || url)) {
      customConnections.push({
        fontawesome_icon:
          typeof network === 'string' ? (CUSTOM_CONNECTION_ICONS[network] ?? 'link') : 'link',
        placeholder: String(username ?? network),
        url
      });
    }
  }

  if (socialNetworks.length > 0) {
    cvData.social_networks = socialNetworks;
  }
  if (customConnections.length > 0) {
    cvData.custom_connections = customConnections;
  }
}

function normalizeMediaEntries(
  entries: unknown[],
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  return entries.flatMap((entry) => {
    const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
    if (!prepared) {
      return [];
    }

    const normalized = stripCompatFields(prepared);
    if (!isRecord(normalized)) {
      return [];
    }

    return [
      cleanMapping({
        name: normalized.name,
        location: normalized.location,
        date: normalized.date,
        url: normalized.url,
        summary: joinParts([
          normalized.summary,
          normalized.type,
          normalized.program ?? normalized.forum,
          normalized.network,
          normalized.interviewer ? `Interviewer: ${normalized.interviewer}` : undefined
        ]),
        highlights: normalized.highlights
      })
    ];
  });
}

function normalizeMembershipEntries(
  entries: unknown[],
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  return entries.flatMap((entry) => {
    const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
    if (!prepared) {
      return [];
    }

    const normalized = stripCompatFields(prepared);
    if (!isRecord(normalized)) {
      return [];
    }

    return [
      cleanMapping({
        name: normalized.name,
        date: normalized.start_date,
        summary: joinParts([normalized.role, normalized.organization])
      })
    ];
  });
}

function normalizeEventAdministrationEntries(
  entries: unknown[],
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  return entries.flatMap((entry) => {
    const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
    if (!prepared) {
      return [];
    }

    const normalized = stripCompatFields(prepared);
    if (!isRecord(normalized)) {
      return [];
    }

    return [
      cleanMapping({
        name: normalized.name,
        location: normalized.location,
        date: normalized.date,
        summary: joinParts([normalized.type, normalized.role]),
        highlights: normalized.highlights
      })
    ];
  });
}

function normalizeResearchKeywords(entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (entry == null) {
      return [];
    }

    const text = String(entry).trim();
    if (!text) {
      return [];
    }

    return [
      {
        label: 'Keyword',
        details: text
      }
    ];
  });
}

function normalizeSectionEntries(
  sectionName: string,
  entries: unknown[],
  preferredFlavors: string[],
  selectedTags: string[],
  variantActive: boolean
) {
  switch (sectionName) {
    case 'experience':
    case 'volunteer':
      return entries.flatMap((entry) =>
        expandNestedPositions(entry, preferredFlavors, selectedTags, variantActive)
      );
    case 'education':
      return entries.flatMap((entry) => {
        const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
        return prepared ? [normalizeEducationEntry(prepared)] : [];
      });
    case 'awards':
      return entries.flatMap((entry) => {
        const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
        return prepared ? [normalizeAwardEntry(prepared)] : [];
      });
    case 'publications':
      return normalizePublications(entries, preferredFlavors, selectedTags, variantActive);
    case 'supervisory_activities':
      return normalizeSupervisoryActivities(entries, preferredFlavors, selectedTags, variantActive);
    case 'media':
      return normalizeMediaEntries(entries, preferredFlavors, selectedTags, variantActive);
    case 'memberships':
      return normalizeMembershipEntries(entries, preferredFlavors, selectedTags, variantActive);
    case 'event_administration':
      return normalizeEventAdministrationEntries(entries, preferredFlavors, selectedTags, variantActive);
    case 'research_keywords':
      return normalizeResearchKeywords(entries);
    default:
      return entries.reduce<unknown[]>((normalizedEntries, entry) => {
        if (typeof entry === 'string') {
          const text = entry.trim();
          if (text) {
            normalizedEntries.push(text);
          }
          return normalizedEntries;
        }

        const prepared = prepareVariantRecord(entry, preferredFlavors, selectedTags, variantActive);
        if (prepared) {
          normalizedEntries.push(cleanMapping(stripCompatFields(prepared) as UnknownRecord));
        }

        return normalizedEntries;
      }, []);
  }
}

function stripPositionMarker(position: string) {
  if (position.startsWith(POSITION_SPACING_SAME_MARKER)) {
    return position.slice(POSITION_SPACING_SAME_MARKER.length);
  }

  if (position.startsWith(POSITION_SPACING_DIFF_MARKER)) {
    return position.slice(POSITION_SPACING_DIFF_MARKER.length);
  }

  return position;
}

function parseDisplayDate(dateText: string) {
  const normalized = dateText.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.toLowerCase() === 'present') {
    return 'present';
  }

  if (/^\d{4}$/.test(normalized)) {
    return normalized;
  }

  const monthMatch = normalized.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!monthMatch) {
    return undefined;
  }

  const [, monthName, year] = monthMatch;
  const month = MONTH_NUMBERS_BY_NAME[monthName];
  if (!month) {
    return undefined;
  }

  return `${year}-${month}`;
}

function splitPositionDateSuffix(position: string) {
  const separatorIndex = position.lastIndexOf(' | ');
  if (separatorIndex < 0) {
    return undefined;
  }

  const title = position.slice(0, separatorIndex).trim();
  const rawRange = position.slice(separatorIndex + 3).trim();
  if (!title || !rawRange) {
    return undefined;
  }

  const [rawStart, rawEnd] = rawRange.split(/\s+[–-]\s+/, 2);
  const startDate = rawStart ? parseDisplayDate(rawStart) : undefined;
  const endDate = rawEnd ? parseDisplayDate(rawEnd) : undefined;
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    title,
    startDate,
    endDate
  };
}

function isContinuationEntry(entry: unknown) {
  return (
    isRecord(entry) &&
    typeof entry.position === 'string' &&
    String(entry.company ?? '').trim().length === 0
  );
}

export function stripPositionMarkersFromCvYaml(yamlText: string) {
  let parsed: unknown;
  try {
    parsed = YAML.parse(yamlText);
  } catch {
    return yamlText;
  }
  if (!isRecord(parsed)) {
    return yamlText;
  }

  const cvData = parsed.cv;
  if (!isRecord(cvData)) {
    return yamlText;
  }

  const sections = cvData.sections;
  if (!isRecord(sections)) {
    return yamlText;
  }

  for (const entries of Object.values(sections)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    for (const entry of entries) {
      if (!isRecord(entry) || typeof entry.position !== 'string') {
        continue;
      }

      entry.position = stripPositionMarker(entry.position);
    }
  }

  return YAML.stringify(parsed);
}

export function repairFlattenedPositionDatesInCvYaml(yamlText: string) {
  let parsed: unknown;
  try {
    parsed = YAML.parse(yamlText);
  } catch {
    return yamlText;
  }
  if (!isRecord(parsed)) {
    return yamlText;
  }

  const cvData = parsed.cv;
  if (!isRecord(cvData)) {
    return yamlText;
  }

  const sections = cvData.sections;
  if (!isRecord(sections)) {
    return yamlText;
  }

  for (const entries of Object.values(sections)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    for (const entry of entries) {
      if (!isRecord(entry) || typeof entry.position !== 'string') {
        continue;
      }

      const cleanedPosition = stripPositionMarker(entry.position);
      const parsedPosition = splitPositionDateSuffix(cleanedPosition);
      if (!parsedPosition) {
        entry.position = cleanedPosition;
        continue;
      }

      entry.position = parsedPosition.title;
      if (parsedPosition.startDate) {
        entry.start_date = parsedPosition.startDate;
      }
      if (parsedPosition.endDate) {
        entry.end_date = parsedPosition.endDate;
      }
    }
  }

  return YAML.stringify(parsed);
}

export function restoreAhmadStylePositionMarkersInCvYaml(yamlText: string) {
  let parsed: unknown;
  try {
    parsed = YAML.parse(yamlText);
  } catch {
    return yamlText;
  }
  if (!isRecord(parsed)) {
    return yamlText;
  }

  const cvData = parsed.cv;
  if (!isRecord(cvData)) {
    return yamlText;
  }

  const sections = cvData.sections;
  if (!isRecord(sections)) {
    return yamlText;
  }

  for (const entries of Object.values(sections)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (!isRecord(entry) || typeof entry.position !== 'string') {
        continue;
      }

      const nextEntry = entries[index + 1];
      const cleanedPosition = stripPositionMarker(entry.position);
      entry.position = isContinuationEntry(nextEntry)
        ? `${POSITION_SPACING_SAME_MARKER}${cleanedPosition}`
        : cleanedPosition;
    }
  }

  return YAML.stringify(parsed);
}

export function normalizeCompatibilityCvYaml(
  yamlText: string,
  options?: NormalizeCompatibilityOptions
) {
  let parsed: unknown;
  try {
    parsed = YAML.parse(yamlText);
  } catch {
    return yamlText;
  }
  if (!isRecord(parsed)) {
    return yamlText;
  }

  const cvData = parsed.cv;
  if (!isRecord(cvData)) {
    return yamlText;
  }

  normalizeSocialConnections(cvData);

  const variantActive = Boolean(options?.variant);
  const selectedTags = normalizeStringList(options?.variant?.tags);
  const preferredFlavors = normalizeStringList(options?.variant?.flavors);
  const excludedSections = new Set(
    variantActive ? normalizeStringList(options?.variant?.exclude_sections) : []
  );
  const sections = cvData.sections;
  if (isRecord(sections)) {
    for (const [sectionName, entries] of Object.entries(sections)) {
      if (excludedSections.has(sectionName)) {
        delete sections[sectionName];
        continue;
      }

      if (!Array.isArray(entries)) {
        continue;
      }

      sections[sectionName] = normalizeSectionEntries(
        sectionName,
        entries,
        preferredFlavors,
        selectedTags,
        variantActive
      );
    }
  }

  return YAML.stringify(stringifyNumbers(parsed));
}
