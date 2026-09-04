import { entryFingerprint, fileStore, resolveFileSections } from '@rendercv/core';
import type { CvFile, SectionKey } from '@rendercv/contracts';
import YAML from 'yaml';

type JsonSchema = Record<string, unknown>;

type ToolAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
};

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
};

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: ToolAnnotations;
  execute: (input: Record<string, unknown>) => ToolResult | Promise<ToolResult>;
};

type ModelContext = {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): Promise<void>;
};

declare global {
  interface Document {
    readonly modelContext?: ModelContext;
  }
}

type PatchOperation = {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value?: unknown;
};

type ResumeDocument = {
  cv?: Record<string, unknown>;
};

const SECTION_KEYS: SectionKey[] = ['cv', 'design', 'locale', 'settings'];
const FORBIDDEN_POINTER_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function toolResult(payload: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
  };
}

function toolError(message: string, details?: unknown): ToolResult {
  return toolResult({ ok: false, error: message, ...(details === undefined ? {} : { details }) });
}

function activeWritableFile(): CvFile | ToolResult {
  const file = fileStore.selectedFile;
  if (!file) {
    return toolError('No resume is currently selected. Ask the user to select or create one first.');
  }
  if (file.isReadOnly) {
    return toolError(`The selected resume "${file.name}" is read-only.`);
  }
  return file;
}

function isToolResult(value: CvFile | ToolResult): value is ToolResult {
  return 'content' in value;
}

function emitActivity(message: string) {
  window.dispatchEvent(new CustomEvent('rendercv:webmcp-activity', { detail: { message } }));
}

function parseCvDocument(cvYaml: string): ResumeDocument {
  const parsed = YAML.parse(cvYaml) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The active CV YAML is not an object.');
  }
  const documentValue = parsed as ResumeDocument;
  if (!documentValue.cv || typeof documentValue.cv !== 'object' || Array.isArray(documentValue.cv)) {
    throw new Error('The active CV YAML does not contain a valid top-level cv object.');
  }
  return documentValue;
}

function resumeSections(documentValue: ResumeDocument): Record<string, unknown[]> {
  const sections = documentValue.cv?.sections;
  if (!sections || typeof sections !== 'object' || Array.isArray(sections)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(sections as Record<string, unknown>).filter(
      (entry): entry is [string, unknown[]] => Array.isArray(entry[1])
    )
  );
}

function decodePointer(path: string): string[] {
  if (!path.startsWith('/') || path === '/') {
    throw new Error('Patch paths must be non-root JSON Pointers such as /cv/headline.');
  }

  const segments = path
    .slice(1)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

  if (segments.some((segment) => FORBIDDEN_POINTER_SEGMENTS.has(segment))) {
    throw new Error('The patch path contains a forbidden segment.');
  }
  if (segments[0] !== 'cv') {
    throw new Error('Resume patches must stay within the /cv object.');
  }
  return segments;
}

function arrayIndex(segment: string, length: number, allowAppend: boolean): number {
  if (allowAppend && segment === '-') {
    return length;
  }
  if (!/^(0|[1-9]\d*)$/.test(segment)) {
    throw new Error(`"${segment}" is not a valid array index.`);
  }
  const index = Number(segment);
  if (index < 0 || index >= length + (allowAppend ? 1 : 0)) {
    throw new Error(`Array index ${index} is out of bounds.`);
  }
  return index;
}

export function applyResumePatch(
  documentValue: ResumeDocument,
  operations: PatchOperation[]
): ResumeDocument {
  const next = structuredClone(documentValue);

  for (const operation of operations) {
    if (!['add', 'replace', 'remove'].includes(operation.op)) {
      throw new Error(`Unsupported patch operation: ${String(operation.op)}`);
    }
    if (typeof operation.path !== 'string') {
      throw new Error('Every patch operation requires a string path.');
    }
    if (operation.op !== 'remove' && !Object.hasOwn(operation, 'value')) {
      throw new Error(`${operation.op} operations require a value.`);
    }
    const segments = decodePointer(operation.path);
    let parent: unknown = next;

    for (const segment of segments.slice(0, -1)) {
      if (Array.isArray(parent)) {
        parent = parent[arrayIndex(segment, parent.length, false)];
      } else if (parent && typeof parent === 'object') {
        if (!(segment in parent)) {
          throw new Error(`Patch parent path does not exist: ${operation.path}`);
        }
        parent = (parent as Record<string, unknown>)[segment];
      } else {
        throw new Error(`Patch parent path is not a container: ${operation.path}`);
      }
    }

    const finalSegment = segments.at(-1)!;
    if (Array.isArray(parent)) {
      const index = arrayIndex(finalSegment, parent.length, operation.op === 'add');
      if (operation.op === 'add') {
        parent.splice(index, 0, structuredClone(operation.value));
      } else if (operation.op === 'replace') {
        parent[index] = structuredClone(operation.value);
      } else {
        parent.splice(index, 1);
      }
      continue;
    }

    if (!parent || typeof parent !== 'object') {
      throw new Error(`Patch target parent is not an object: ${operation.path}`);
    }

    const record = parent as Record<string, unknown>;
    if (operation.op !== 'add' && !(finalSegment in record)) {
      throw new Error(`Patch target does not exist: ${operation.path}`);
    }
    if (operation.op === 'remove') {
      delete record[finalSegment];
    } else {
      record[finalSegment] = structuredClone(operation.value);
    }
  }

  return next;
}

function validateRevision(file: CvFile, expectedLastEdited: unknown): ToolResult | undefined {
  if (
    expectedLastEdited !== undefined &&
    (!Number.isInteger(expectedLastEdited) || expectedLastEdited !== file.lastEdited)
  ) {
    return toolError(
      'The resume changed after it was inspected. Inspect it again before applying edits.',
      { expectedLastEdited, actualLastEdited: file.lastEdited }
    );
  }
  return undefined;
}

function snapshotFor(file: CvFile) {
  const sections = resolveFileSections(file);
  const documentValue = parseCvDocument(sections.cv);
  const cv = documentValue.cv ?? {};
  const sectionEntries = resumeSections(documentValue);
  const profile = Object.fromEntries(Object.entries(cv).filter(([key]) => key !== 'sections'));

  return {
    ok: true,
    resume: {
      id: file.id,
      name: file.name,
      lastEdited: file.lastEdited,
      readOnly: file.isReadOnly,
      selectedTheme: file.selectedTheme,
      selectedLocale: file.selectedLocale,
      selectedVariant: file.selectedVariant ?? null,
      profile,
      sections: Object.entries(sectionEntries).map(([key, entries]) => ({
        key,
        entries: entries.map((value, index) => ({
          index,
          fingerprint: entryFingerprint(value),
          value
        }))
      })),
      variants: file.variants ?? {}
    }
  };
}

export function createResumeWebMcpTools(): WebMcpTool[] {
  return [
    {
      name: 'inspect_active_resume',
      description:
        'Read the active RenderCV resume, including profile fields, section entries, stable entry fingerprints, variants, theme, and revision. Call this before proposing edits or tailoring a resume.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute() {
        const file = fileStore.selectedFile;
        if (!file) {
          return toolError('No resume is currently selected.');
        }
        try {
          return toolResult(snapshotFor(file));
        } catch (error) {
          return toolError(error instanceof Error ? error.message : 'Could not inspect the resume.');
        }
      }
    },
    {
      name: 'patch_active_resume',
      description:
        'Apply targeted JSON Patch-style edits to the active resume and update the visible editor and PDF preview. Use the lastEdited revision returned by inspect_active_resume to avoid overwriting concurrent human edits. Changes are undoable.',
      inputSchema: {
        type: 'object',
        properties: {
          expectedLastEdited: {
            type: 'integer',
            description: 'The lastEdited revision from the most recent inspect_active_resume result.'
          },
          summary: {
            type: 'string',
            description: 'Short human-readable description of the edits, shown in the app.'
          },
          operations: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                op: { type: 'string', enum: ['add', 'replace', 'remove'] },
                path: {
                  type: 'string',
                  description: 'JSON Pointer within /cv, for example /cv/headline or /cv/sections/skills/0/details.'
                },
                value: { description: 'Value for add or replace operations.' }
              },
              required: ['op', 'path'],
              additionalProperties: false
            }
          }
        },
        required: ['expectedLastEdited', 'summary', 'operations'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        const file = activeWritableFile();
        if (isToolResult(file)) return file;
        const revisionError = validateRevision(file, input.expectedLastEdited);
        if (revisionError) return revisionError;

        if (!Array.isArray(input.operations) || input.operations.length === 0) {
          return toolError('At least one patch operation is required.');
        }

        try {
          const current = parseCvDocument(resolveFileSections(file).cv);
          const patched = applyResumePatch(current, input.operations as PatchOperation[]);
          const nextYaml = YAML.stringify(patched);
          fileStore.updateSection('cv', nextYaml);
          const summary = typeof input.summary === 'string' ? input.summary.trim() : '';
          emitActivity(summary || 'The agent updated the active resume.');
          return toolResult({
            ok: true,
            message: summary || 'Resume updated.',
            lastEdited: fileStore.selectedFile?.lastEdited,
            undoAvailable: true
          });
        } catch (error) {
          return toolError(error instanceof Error ? error.message : 'The resume patch failed.');
        }
      }
    },
    {
      name: 'replace_resume_yaml_section',
      description:
        'Replace one complete RenderCV YAML section (cv, design, locale, or settings), updating the live editor and preview. Prefer patch_active_resume for targeted content edits. Use this for coordinated design, locale, or settings changes. Changes are undoable.',
      inputSchema: {
        type: 'object',
        properties: {
          expectedLastEdited: { type: 'integer' },
          section: { type: 'string', enum: SECTION_KEYS },
          yaml: { type: 'string', description: 'Complete valid YAML with the matching top-level key.' },
          summary: { type: 'string', description: 'Short description shown to the user.' }
        },
        required: ['expectedLastEdited', 'section', 'yaml', 'summary'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        const file = activeWritableFile();
        if (isToolResult(file)) return file;
        const revisionError = validateRevision(file, input.expectedLastEdited);
        if (revisionError) return revisionError;
        if (!SECTION_KEYS.includes(input.section as SectionKey) || typeof input.yaml !== 'string') {
          return toolError('A valid section and YAML string are required.');
        }

        try {
          const section = input.section as SectionKey;
          const parsed = YAML.parse(input.yaml) as unknown;
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !(section in parsed)) {
            return toolError(`The YAML must contain a top-level ${section} key.`);
          }
          fileStore.updateSection(section, input.yaml);
          const summary = typeof input.summary === 'string' ? input.summary.trim() : '';
          emitActivity(summary || `The agent updated the ${section} section.`);
          return toolResult({
            ok: true,
            section,
            lastEdited: fileStore.selectedFile?.lastEdited,
            undoAvailable: true
          });
        } catch (error) {
          return toolError(error instanceof Error ? error.message : 'The YAML could not be parsed.');
        }
      }
    },
    {
      name: 'create_tailored_resume_variant',
      description:
        'Create and activate a non-destructive tailored resume variant by excluding sections or specific entries using fingerprints from inspect_active_resume. The original resume content stays intact and the preview updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: 'Variant name, usually a role or company.' },
          expectedLastEdited: {
            type: 'integer',
            description: 'The lastEdited revision from the most recent inspect_active_resume result.'
          },
          description: { type: 'string' },
          excludeSections: { type: 'array', items: { type: 'string' }, default: [] },
          excludeEntries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                section: { type: 'string' },
                fingerprints: { type: 'array', items: { type: 'string' }, minItems: 1 }
              },
              required: ['section', 'fingerprints'],
              additionalProperties: false
            },
            default: []
          }
        },
        required: ['name', 'expectedLastEdited'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        const file = activeWritableFile();
        if (isToolResult(file)) return file;
        const revisionError = validateRevision(file, input.expectedLastEdited);
        if (revisionError) return revisionError;
        const name = typeof input.name === 'string' ? input.name.trim() : '';
        if (!name) return toolError('Variant name is required.');

        try {
          const documentValue = parseCvDocument(resolveFileSections(file).cv);
          const sections = resumeSections(documentValue);
          const excludeSections = Array.isArray(input.excludeSections)
            ? input.excludeSections.filter((value): value is string => typeof value === 'string')
            : [];
          const unknownSections = excludeSections.filter((key) => !(key in sections));
          if (unknownSections.length > 0) {
            return toolError('Some excluded sections do not exist.', { unknownSections });
          }

          const excludeEntries: Record<string, string[]> = {};
          const requestedEntries = Array.isArray(input.excludeEntries) ? input.excludeEntries : [];
          for (const requested of requestedEntries) {
            if (!requested || typeof requested !== 'object') continue;
            const section = (requested as { section?: unknown }).section;
            const fingerprints = (requested as { fingerprints?: unknown }).fingerprints;
            if (typeof section !== 'string' || !Array.isArray(fingerprints) || !(section in sections)) {
              return toolError('Each excluded entry group must name an existing section.');
            }
            const validFingerprints = new Set(sections[section]!.map((entry) => entryFingerprint(entry)));
            const values = fingerprints.filter((value): value is string => typeof value === 'string');
            const unknownFingerprints = values.filter((value) => !validFingerprints.has(value));
            if (unknownFingerprints.length > 0) {
              return toolError('Some entry fingerprints are stale or invalid.', {
                section,
                unknownFingerprints
              });
            }
            if (values.length > 0) excludeEntries[section] = values;
          }

          const key = fileStore.createVariant(file.id, name, {
            description:
              typeof input.description === 'string' && input.description.trim()
                ? input.description.trim()
                : name,
            exclude_sections: excludeSections,
            exclude_entries: excludeEntries
          });
          if (!key) return toolError('The variant could not be created.');
          emitActivity(`The agent created and opened the “${name}” resume variant.`);
          return toolResult({ ok: true, variantKey: key, selectedVariant: key, undoAvailable: true });
        } catch (error) {
          return toolError(error instanceof Error ? error.message : 'The variant could not be created.');
        }
      }
    },
    {
      name: 'activate_resume_variant',
      description:
        'Switch the visible RenderCV preview to an existing tailored variant. Use inspect_active_resume to discover variant keys.',
      inputSchema: {
        type: 'object',
        properties: { variantKey: { type: 'string' } },
        required: ['variantKey'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false },
      execute(input) {
        const file = activeWritableFile();
        if (isToolResult(file)) return file;
        if (typeof input.variantKey !== 'string' || !file.variants?.[input.variantKey]) {
          return toolError('That variant does not exist.', { availableVariants: Object.keys(file.variants ?? {}) });
        }
        fileStore.setSelectedVariant(file.id, input.variantKey);
        emitActivity(`The agent opened the “${input.variantKey}” resume variant.`);
        return toolResult({ ok: true, selectedVariant: input.variantKey });
      }
    },
    {
      name: 'undo_last_resume_change',
      description:
        'Undo the most recent change in the RenderCV workspace, including an agent-authored edit or variant change. The editor and preview update immediately.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
      execute() {
        const undone = fileStore.undo();
        if (!undone) return toolError('There is no resume change to undo.');
        emitActivity('The agent undid the most recent resume change.');
        return toolResult({ ok: true, message: 'Most recent resume change undone.' });
      }
    }
  ];
}

export function registerResumeWebMcpTools(signal: AbortSignal): Promise<void[]> {
  // `document.modelContext` is the WebMCP browser API. Unsupported browsers simply
  // keep the normal RenderCV interface; no polyfill or backend is required.
  if (!document.modelContext) {
    return Promise.resolve([]);
  }

  return Promise.all(
    createResumeWebMcpTools().map((tool) => document.modelContext!.registerTool(tool, { signal }))
  );
}
