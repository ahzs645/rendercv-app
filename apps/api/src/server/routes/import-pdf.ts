import pdf from 'pdf-parse';
import { Hono } from 'hono';
import { jsonError } from '../errors';

const MAX_PDF_SIZE = 5 * 1024 * 1024;

export const importPdfRouter = new Hono().post('/', async (context) => {
  const formData = await context.req.formData().catch(() => null);
  const uploaded = formData?.get('pdf');

  if (!(uploaded instanceof File)) {
    return jsonError(context, 'invalid_pdf', 'Attach a PDF file to import.', 400);
  }

  if (uploaded.size === 0 || uploaded.size > MAX_PDF_SIZE) {
    return jsonError(context, 'invalid_pdf', 'PDF must be between 1 byte and 5 MB.', 400);
  }

  try {
    const parsed = await pdf(Buffer.from(await uploaded.arrayBuffer()));
    const text = normalizePdfText(parsed.text);

    if (text.length < 80) {
      return jsonError(context, 'incomplete_pdf', 'The uploaded PDF did not contain enough readable text.', 422);
    }

    return context.json({
      cv: buildImportedCv(text, uploaded.name)
    });
  } catch {
    return jsonError(
      context,
      'pdf_parse_error',
      'The uploaded file could not be parsed as a readable PDF.',
      422
    );
  }
});

function normalizePdfText(value: string) {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function buildImportedCv(text: string, fileName: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? '';
  const phone =
    text.match(/(?:\+\d{1,3}\s*)?(?:\(?\d{2,4}\)?[\s.-]*)?\d{3}[\s.-]*\d{4,}/)?.[0] ?? '';
  const urls = [...text.matchAll(/https?:\/\/[^\s)]+/gi)].map((match) => trimPunctuation(match[0]));

  const socialNetworks = urls
    .map((url) => detectSocialNetwork(url))
    .filter((network): network is { network: string; username: string } => network !== null);

  const website = urls.find((url) => detectSocialNetwork(url) === null) ?? '';
  const name = guessName(lines, fileName);
  const headline = guessHeadline(lines, name, email, phone);
  const location = guessLocation(lines);
  const highlights = collectHighlights(lines, { name, headline, email, phone, website });

  return [
    'cv:',
    `  name: ${yamlScalar(name)}`,
    `  headline: ${yamlScalar(headline)}`,
    `  location: ${yamlScalar(location)}`,
    `  email: ${yamlScalar(email)}`,
    '  photo:',
    `  phone: ${yamlScalar(phone)}`,
    `  website: ${yamlScalar(website)}`,
    '  social_networks:',
    ...serializeSocialNetworks(socialNetworks),
    '  custom_connections:',
    '  sections:',
    '    imported_highlights:',
    ...serializeTextEntries(highlights)
  ].join('\n');
}

function guessName(lines: string[], fileName: string) {
  const candidate = lines.find((line) => /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line) && line.split(' ').length <= 5);
  if (candidate) {
    return candidate;
  }

  const stem = fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
  return stem ? toTitleCase(stem) : 'Imported Resume';
}

function guessHeadline(lines: string[], name: string, email: string, phone: string) {
  const candidate = lines.find((line) => {
    if (line === name || line.includes(email) || line.includes(phone)) {
      return false;
    }

    if (line.length < 4 || line.length > 100) {
      return false;
    }

    return !/^https?:\/\//i.test(line) && !/@/.test(line);
  });

  return candidate ?? '';
}

function guessLocation(lines: string[]) {
  const candidate = lines.find((line) => /,/.test(line) && line.length < 60 && !/@/.test(line) && !/^https?:\/\//i.test(line));
  return candidate ?? '';
}

function collectHighlights(
  lines: string[],
  excluded: { name: string; headline: string; email: string; phone: string; website: string }
) {
  const seen = new Set<string>();
  const highlights: string[] = [];

  for (const line of lines) {
    const normalized = line.replace(/^[\u2022\-*]\s*/, '').trim();
    if (!normalized) {
      continue;
    }

    if (
      normalized === excluded.name ||
      normalized === excluded.headline ||
      normalized === excluded.email ||
      normalized === excluded.phone ||
      normalized === excluded.website
    ) {
      continue;
    }

    if (/^https?:\/\//i.test(normalized) || normalized.includes('@')) {
      continue;
    }

    if (normalized.length < 18 || normalized.length > 180) {
      continue;
    }

    if (seen.has(normalized)) {
      continue;
    }

    highlights.push(normalized);
    seen.add(normalized);

    if (highlights.length === 8) {
      break;
    }
  }

  if (highlights.length > 0) {
    return highlights;
  }

  return ['Imported from PDF. Review and structure this content in the editor.'];
}

function serializeSocialNetworks(entries: Array<{ network: string; username: string }>) {
  if (entries.length === 0) {
    return ['    []'];
  }

  return entries.flatMap((entry) => [
    `    - network: ${yamlScalar(entry.network)}`,
    `      username: ${yamlScalar(entry.username)}`
  ]);
}

function serializeTextEntries(entries: string[]) {
  if (entries.length === 0) {
    return ['      - Imported from PDF. Review and structure this content in the editor.'];
  }

  return entries.map((entry) => `      - ${yamlScalar(entry)}`);
}

function detectSocialNetwork(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const username = pathParts.at(-1)?.replace(/^@/, '') ?? '';

    if (host.includes('linkedin.com') && username) {
      return { network: 'LinkedIn', username };
    }

    if (host.includes('github.com') && username) {
      return { network: 'GitHub', username };
    }

    if (host.includes('gitlab.com') && username) {
      return { network: 'GitLab', username };
    }

    if (host.includes('scholar.google')) {
      return { network: 'Google Scholar', username: parsed.searchParams.get('user') ?? url };
    }
  } catch {
    return null;
  }

  return null;
}

function yamlScalar(value: string) {
  if (!value) {
    return '';
  }

  if (/^[A-Za-z0-9 .,:/+@()-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function trimPunctuation(value: string) {
  return value.replace(/[),.;]+$/g, '');
}
