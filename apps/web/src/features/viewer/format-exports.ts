import YAML from 'yaml';

export function cvYamlToJson(yaml: string): string {
  const parsed = YAML.parse(yaml) ?? {};
  return JSON.stringify(parsed, null, 2);
}

interface CvShape {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  email?: string | string[] | null;
  phone?: string | string[] | null;
  website?: string | string[] | null;
  social_networks?: Array<{ network?: string; username?: string }> | null;
  custom_connections?: Array<{ placeholder?: string; url?: string | null }> | null;
  sections?: Record<string, unknown[]> | null;
}

export function cvYamlToMarkdown(yaml: string): string {
  const parsed = (YAML.parse(yaml) ?? {}) as { cv?: CvShape } | CvShape;
  const cv: CvShape = 'cv' in parsed && parsed.cv ? parsed.cv : (parsed as CvShape);
  const lines: string[] = [];

  if (cv.name) {
    lines.push(`# ${cv.name}`);
  }
  if (cv.headline) {
    lines.push(`_${cv.headline}_`);
  }

  const contactParts: string[] = [];
  if (cv.location) contactParts.push(String(cv.location));
  for (const email of toList(cv.email)) contactParts.push(email);
  for (const phone of toList(cv.phone)) contactParts.push(phone);
  for (const website of toList(cv.website)) contactParts.push(website);
  for (const social of cv.social_networks ?? []) {
    if (social?.network && social?.username) {
      contactParts.push(`${social.network}: ${social.username}`);
    }
  }
  for (const custom of cv.custom_connections ?? []) {
    if (custom?.placeholder) {
      contactParts.push(custom.url ? `${custom.placeholder} (${custom.url})` : custom.placeholder);
    }
  }
  if (contactParts.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push(contactParts.join(' · '));
  }

  for (const [sectionKey, entries] of Object.entries(cv.sections ?? {})) {
    const title = humanizeKey(sectionKey);
    lines.push('', `## ${title}`, '');
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      lines.push(...renderEntry(entry));
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function renderEntry(entry: unknown): string[] {
  if (typeof entry === 'string') {
    return [entry, ''];
  }
  if (!entry || typeof entry !== 'object') {
    return [];
  }

  const e = entry as Record<string, unknown>;

  if (typeof e.bullet === 'string') {
    return [`- ${e.bullet}`];
  }
  if (typeof e.number === 'string') {
    return [`- ${e.number}`];
  }
  if (typeof e.reversed_number === 'string') {
    return [`- ${e.reversed_number}`];
  }
  if (typeof e.label === 'string' && typeof e.details === 'string') {
    return [`- **${e.label}:** ${e.details}`];
  }

  const heading = String(e.company ?? e.institution ?? e.title ?? e.name ?? '').trim();
  const subheading = String(e.position ?? e.area ?? e.degree ?? e.journal ?? '').trim();
  const dates = formatDates(e);
  const location = typeof e.location === 'string' ? e.location : '';

  const out: string[] = [];
  if (heading || subheading) {
    const headLine = ['###', heading, subheading ? `— ${subheading}` : '']
      .filter(Boolean)
      .join(' ')
      .trim();
    out.push(headLine);
  }

  const meta = [dates, location].filter(Boolean).join(' · ');
  if (meta) out.push(`_${meta}_`);

  if (typeof e.doi === 'string' && e.doi) out.push(`DOI: ${e.doi}`);
  if (typeof e.url === 'string' && e.url) out.push(`<${e.url}>`);

  const authors = e.authors;
  if (Array.isArray(authors) && authors.length > 0) {
    out.push(authors.filter((a) => typeof a === 'string').join(', '));
  }

  if (typeof e.summary === 'string' && e.summary.trim()) {
    out.push('', e.summary.trim());
  }

  const highlights = e.highlights;
  if (Array.isArray(highlights) && highlights.length > 0) {
    out.push('');
    for (const highlight of highlights) {
      if (typeof highlight === 'string') {
        out.push(`- ${highlight}`);
      }
    }
  }

  out.push('');
  return out;
}

function formatDates(entry: Record<string, unknown>): string {
  if (typeof entry.date === 'string' && entry.date) return entry.date;
  const start = typeof entry.start_date === 'string' ? entry.start_date : '';
  const end = typeof entry.end_date === 'string' ? entry.end_date : '';
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

function humanizeKey(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function toList(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length > 0) : [value];
}
