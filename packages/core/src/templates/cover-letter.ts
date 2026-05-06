import type { TemplateModule } from './types';

export interface CoverLetterData {
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  senderAddress?: string;
  recipientName?: string;
  recipientTitle?: string;
  companyName: string;
  companyAddress?: string;
  date: string;
  subject?: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
}

function escapeTypst(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/@/g, '\\@')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_');
}

function cleanFilenamePart(value: string) {
  return value.trim().replace(/[^\w -]+/g, '').replace(/\s+/g, '_') || 'Document';
}

function render(data: CoverLetterData): string {
  const lines: string[] = [];

  lines.push('#set page(margin: (top: 1.5cm, bottom: 1.5cm, left: 2cm, right: 2cm))');
  lines.push('#set text(font: "Source Sans 3", size: 11pt)');
  lines.push('#set par(justify: true, leading: 0.65em)');
  lines.push('');
  lines.push('#align(right)[');
  lines.push(`  #text(weight: "bold", size: 13pt)[${escapeTypst(data.senderName)}] \\`);
  if (data.senderEmail) lines.push(`  ${escapeTypst(data.senderEmail)} \\`);
  if (data.senderPhone) lines.push(`  ${escapeTypst(data.senderPhone)} \\`);
  if (data.senderAddress) lines.push(`  ${escapeTypst(data.senderAddress)}`);
  lines.push(']');
  lines.push('');
  lines.push('#v(0.5cm)');
  lines.push(escapeTypst(data.date));
  lines.push('');

  if (data.recipientName || data.companyName) {
    lines.push('#v(0.3cm)');
    if (data.recipientName) lines.push(`${escapeTypst(data.recipientName)} \\`);
    if (data.recipientTitle) lines.push(`${escapeTypst(data.recipientTitle)} \\`);
    lines.push(`${escapeTypst(data.companyName)} \\`);
    if (data.companyAddress) lines.push(escapeTypst(data.companyAddress));
    lines.push('');
  }

  if (data.subject) {
    lines.push('#v(0.3cm)');
    lines.push(`#text(weight: "bold")[${escapeTypst(data.subject)}]`);
    lines.push('');
  }

  lines.push('#v(0.3cm)');
  lines.push(escapeTypst(data.salutation));
  lines.push('');
  lines.push('#v(0.2cm)');

  for (const paragraph of data.paragraphs) {
    lines.push(escapeTypst(paragraph));
    lines.push('');
  }

  lines.push('#v(0.3cm)');
  lines.push(escapeTypst(data.closing));
  lines.push('');
  lines.push('#v(0.5cm)');
  lines.push(escapeTypst(data.senderName));

  return lines.join('\n');
}

function defaultFilename(data: CoverLetterData): string {
  return `Cover_Letter_${cleanFilenamePart(data.senderName)}_${cleanFilenamePart(data.companyName)}`;
}

export const coverLetterTemplate: TemplateModule<CoverLetterData> = {
  id: 'cover-letter',
  label: 'Cover Letter',
  schemaDescription: `## Cover Letter Template

Required fields:
- \`senderName\` (string): Full name of the sender, usually from the CV.
- \`companyName\` (string): Name of the company being applied to.
- \`date\` (string): Formatted date, e.g. "March 15, 2026".
- \`salutation\` (string): Opening greeting, e.g. "Dear Hiring Manager,".
- \`paragraphs\` (string[]): Body paragraphs. Use 3-4 paragraphs for most letters.
- \`closing\` (string): Closing phrase, e.g. "Sincerely,".

Optional fields:
- \`senderEmail\`, \`senderPhone\`, \`senderAddress\`
- \`recipientName\`, \`recipientTitle\`, \`companyAddress\`
- \`subject\`, e.g. "Application for Senior Engineer"`,
  exampleYaml: `senderName: John Doe
senderEmail: john.doe@email.com
senderPhone: "+1 (555) 123-4567"
senderAddress: San Francisco, CA
recipientName: Jane Smith
recipientTitle: Director of Engineering
companyName: Acme Corp
companyAddress: 123 Main St, New York, NY
date: March 15, 2026
subject: Application for Senior Software Engineer
salutation: "Dear Ms. Smith,"
paragraphs:
  - "I am writing to express my strong interest in the Senior Software Engineer position at Acme Corp."
  - "In my current role, I led projects that improved reliability, delivery speed, and customer outcomes."
  - "I would welcome the opportunity to discuss how my experience can contribute to your team."
closing: "Sincerely,"`,
  render,
  defaultFilename
};

