import YAML from 'yaml';

const PREFERRED_FLAVORS = ['consulting_onepage', 'default'];
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

type UnknownRecord = Record<string, unknown>;

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

function pickFlavorValue(value: unknown): unknown {
  if (!isRecord(value) || !('flavors' in value) || !isRecord(value.flavors)) {
    return value;
  }

  for (const flavorName of PREFERRED_FLAVORS) {
    const selected = value.flavors[flavorName];
    if (selected !== undefined && selected !== null && selected !== '') {
      if (!Array.isArray(selected) || selected.length > 0) {
        return selected;
      }
    }
  }

  return Object.values(value.flavors)[0] ?? value;
}

function normalizeFlavoredFields(entry: unknown): unknown {
  if (!isRecord(entry)) {
    return entry;
  }

  const normalized: UnknownRecord = { ...entry };
  for (const [fieldName, fieldValue] of Object.entries(normalized)) {
    if (isRecord(fieldValue) && 'flavors' in fieldValue) {
      normalized[fieldName] = pickFlavorValue(fieldValue);
    }
  }

  return normalized;
}

function stripCompatFields(entry: unknown): unknown {
  if (!isRecord(entry)) {
    return entry;
  }

  const normalized: UnknownRecord = { ...entry };
  delete normalized.itags;
  delete normalized.tags;
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
  let normalized = stripCompatFields(normalizeFlavoredFields(entry));
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
  let normalized = stripCompatFields(normalizeFlavoredFields(entry));
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
  let normalized = stripCompatFields(normalizeFlavoredFields(entry));
  if (!isRecord(normalized)) {
    return entry;
  }

  const normalizedRecord = appendSummary(normalized, [
    normalized.amount ? `Amount: ${normalized.amount}` : undefined
  ]);

  delete normalizedRecord.amount;
  return cleanMapping(normalizedRecord);
}

function expandNestedPositions(entry: unknown): UnknownRecord[] {
  if (!isRecord(entry)) {
    return [];
  }

  const normalizedEntry = normalizeExperienceEntry(entry);
  const positions = normalizedEntry.positions;
  if (!Array.isArray(positions)) {
    return [normalizedEntry];
  }

  const visiblePositions = positions
    .map((position) => normalizeExperienceEntry(isRecord(position) ? position : {}))
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

function normalizePublications(entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const item = stripCompatFields(normalizeFlavoredFields(entry));
    if (!isRecord(item)) {
      return [];
    }

    let authors = item.authors;
    if (isRecord(authors) && 'flavors' in authors) {
      authors = pickFlavorValue(authors);
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

function normalizeSupervisoryActivities(entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    if ('label' in entry && 'details' in entry) {
      return [cleanMapping(entry)];
    }

    return Object.entries(entry)
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

function normalizeMediaEntries(entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const normalized = stripCompatFields(normalizeFlavoredFields(entry));
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

function normalizeMembershipEntries(entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const normalized = stripCompatFields(normalizeFlavoredFields(entry));
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

function normalizeEventAdministrationEntries(entries: unknown[]) {
  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const normalized = stripCompatFields(normalizeFlavoredFields(entry));
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

function normalizeSectionEntries(sectionName: string, entries: unknown[]) {
  switch (sectionName) {
    case 'experience':
    case 'volunteer':
      return entries.flatMap((entry) => expandNestedPositions(entry));
    case 'education':
      return entries.flatMap((entry) =>
        isRecord(entry) ? [normalizeEducationEntry(entry)] : []
      );
    case 'awards':
      return entries.flatMap((entry) => (isRecord(entry) ? [normalizeAwardEntry(entry)] : []));
    case 'publications':
      return normalizePublications(entries);
    case 'supervisory_activities':
      return normalizeSupervisoryActivities(entries);
    case 'media':
      return normalizeMediaEntries(entries);
    case 'memberships':
      return normalizeMembershipEntries(entries);
    case 'event_administration':
      return normalizeEventAdministrationEntries(entries);
    case 'research_keywords':
      return normalizeResearchKeywords(entries);
    default:
      return entries.flatMap((entry) =>
        isRecord(entry) ? [cleanMapping(stripCompatFields(normalizeFlavoredFields(entry)) as UnknownRecord)] : []
      );
  }
}

export function normalizeCompatibilityCvYaml(yamlText: string) {
  const parsed = YAML.parse(yamlText);
  if (!isRecord(parsed)) {
    return yamlText;
  }

  const cvData = parsed.cv;
  if (!isRecord(cvData)) {
    return yamlText;
  }

  normalizeSocialConnections(cvData);

  const sections = cvData.sections;
  if (isRecord(sections)) {
    for (const [sectionName, entries] of Object.entries(sections)) {
      if (!Array.isArray(entries)) {
        continue;
      }

      sections[sectionName] = normalizeSectionEntries(sectionName, entries);
    }
  }

  return YAML.stringify(stringifyNumbers(parsed));
}
