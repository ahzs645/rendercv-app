import { coverLetterTemplate } from './cover-letter';
import type { TemplateModule } from './types';

const templates: Record<string, TemplateModule<unknown>> = {
  'cover-letter': coverLetterTemplate as TemplateModule<unknown>
};

export function getTemplate(id: string): TemplateModule<unknown> | undefined {
  return templates[id];
}

export function getTemplateIds(): string[] {
  return Object.keys(templates);
}

export function getTemplateSchemaDescriptions(): string {
  return Object.values(templates)
    .map((template) => {
      return `${template.schemaDescription}\n\n### Example YAML\n\n\`\`\`yaml\n${template.exampleYaml}\n\`\`\``;
    })
    .join('\n\n---\n\n');
}

