import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from 'ai';
import { Hono } from 'hono';
import type { CvFileSections } from '@rendercv/contracts';
import { coverLetterTemplate, type CoverLetterData } from '@rendercv/core';
import { jsonError } from '../errors';
import { persistState, serverState } from '../persistence';

type ChatPayload = {
  messages?: UIMessage[];
  fileContext?: Partial<CvFileSections>;
  model?: string;
};

export const chatRouter = new Hono().post('/', async (context) => {
  if (serverState.aiUsage.used >= serverState.aiUsage.limit) {
    return jsonError(context, 'quota_exceeded', 'AI usage limit reached for this workspace.', 402);
  }

  const payload = (await context.req.json().catch(() => ({}))) as ChatPayload;
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const prompt = getLastUserMessage(messages);

  if (!prompt) {
    return jsonError(context, 'invalid_request', 'A user message is required to continue the chat.', 400);
  }

  const fileContext = normalizeSections(payload.fileContext);
  serverState.aiUsage.used += 1;
  persistState();

  const responseText = createAssistantReply(prompt, fileContext, payload.model ?? 'gpt-5-mini');
  const generatedDocument = maybeGenerateCoverLetter(prompt, fileContext);
  const usage = { ...serverState.aiUsage };

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = crypto.randomUUID();

      writer.write({ type: 'start' });
      writer.write({ type: 'text-start', id: textId });

      for (const chunk of chunkText(responseText)) {
        writer.write({ type: 'text-delta', id: textId, delta: chunk });
        await sleep(16);
      }

      writer.write({ type: 'text-end', id: textId });
      if (generatedDocument) {
        writer.write({
          type: 'data-document',
          data: generatedDocument
        } as Parameters<typeof writer.write>[0]);
      }
      writer.write({ type: 'data-usage', data: usage });
      writer.write({ type: 'finish' });
    }
  });

  return createUIMessageStreamResponse({ stream });
});

function normalizeSections(fileContext?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: fileContext?.cv ?? '',
    design: fileContext?.design ?? '',
    locale: fileContext?.locale ?? '',
    settings: fileContext?.settings ?? ''
  };
}

function getLastUserMessage(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  if (!lastUserMessage) {
    return '';
  }

  return lastUserMessage.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join(' ')
    .trim();
}

function createAssistantReply(prompt: string, fileContext: CvFileSections, model: string) {
  const name = extractScalar(fileContext.cv, 'name') || 'this CV';
  const headline = extractScalar(fileContext.cv, 'headline');
  const sectionNames = extractSectionNames(fileContext.cv);
  const promptLower = prompt.toLowerCase();
  const intro = `Using ${model}, here is a focused pass on ${name}.`;

  if (promptLower.includes('cover letter')) {
    const companyName = inferCompanyName(prompt) || 'Target Company';
    return [
      intro,
      '',
      `I generated a Typst cover letter draft for ${companyName}. Download it from the document card below, then adjust the recipient details and job-specific claims before sending.`
    ].join('\n');
  }

  if (promptLower.includes('headline')) {
    const basis = headline || inferRoleFromSections(sectionNames) || 'technical leadership';
    return [
      intro,
      '',
      'Recommended headline directions:',
      `1. ${buildHeadlineVariant(basis, 'impact')}`,
      `2. ${buildHeadlineVariant(basis, 'scope')}`,
      `3. ${buildHeadlineVariant(basis, 'clarity')}`,
      '',
      'Keep the headline to one line, lead with role and seniority, and add one differentiator such as scale, domain, or outcomes.'
    ].join('\n');
  }

  if (
    promptLower.includes('bullet') ||
    promptLower.includes('experience') ||
    promptLower.includes('rewrite')
  ) {
    return [
      intro,
      '',
      'Rewrite guidance:',
      '1. Start each bullet with a strong action verb.',
      '2. Add a metric, scope, or business outcome whenever possible.',
      '3. Trim tool lists unless they explain the achievement.',
      '',
      'Example pattern:',
      '"Built X" -> "Built X that reduced Y by Z% for N users."',
      '',
      `Prioritize the sections ${sectionNames.slice(0, 3).join(', ') || 'experience and projects'} first.`
    ].join('\n');
  }

  return [
    intro,
    '',
    'Highest-value improvements:',
    `1. Tighten the top section so the first screen immediately explains the target role${headline ? ` instead of repeating "${headline}".` : '.'}`,
    `2. Reorder sections to keep the strongest proof near the top${sectionNames.length > 0 ? `: ${sectionNames.join(', ')}.` : '.'}`,
    '3. Convert vague statements into quantified impact with team size, revenue, latency, cost, or adoption numbers.',
    '',
    'If you want, ask for one of these next:',
    '- rewrite my headline',
    '- improve my experience bullets',
    '- suggest a better section order'
  ].join('\n');
}

function maybeGenerateCoverLetter(prompt: string, fileContext: CvFileSections) {
  if (!prompt.toLowerCase().includes('cover letter')) {
    return null;
  }

  const senderName = extractScalar(fileContext.cv, 'name') || 'Your Name';
  const companyName = inferCompanyName(prompt) || 'Target Company';
  const data: CoverLetterData = {
    senderName,
    senderEmail: extractScalar(fileContext.cv, 'email') || undefined,
    senderPhone: extractScalar(fileContext.cv, 'phone') || undefined,
    senderAddress: extractScalar(fileContext.cv, 'location') || undefined,
    companyName,
    date: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date()),
    subject: `Application for ${inferRoleFromPrompt(prompt) || 'the open role'}`,
    salutation: 'Dear Hiring Manager,',
    paragraphs: [
      `I am writing to express my interest in ${inferRoleFromPrompt(prompt) || 'the open role'} at ${companyName}. My background aligns with the role through a combination of focused execution, clear communication, and measurable impact.`,
      `In my recent work, I have built experience across ${extractSectionNames(fileContext.cv).slice(0, 3).join(', ') || 'relevant projects and professional experience'}. I would bring that same structured approach to your team.`,
      `I would welcome the opportunity to discuss how my experience can support ${companyName}'s goals. Thank you for your time and consideration.`
    ],
    closing: 'Sincerely,'
  };

  return {
    label: coverLetterTemplate.label,
    filename: `${coverLetterTemplate.defaultFilename(data)}.typ`,
    mediaType: 'text/plain;charset=utf-8',
    content: coverLetterTemplate.render(data)
  };
}

function inferCompanyName(prompt: string) {
  const match = prompt.match(/\b(?:at|for|with)\s+([A-Z][A-Za-z0-9&.,' -]{1,50})(?:[.!?\n]|$)/);
  return match?.[1]?.trim().replace(/\s+(role|job|position)$/i, '') ?? '';
}

function inferRoleFromPrompt(prompt: string) {
  const match = prompt.match(/\b(?:for|as)\s+(?:a|an|the)?\s*([A-Za-z][A-Za-z0-9 /+-]{2,60}?(?:engineer|designer|manager|scientist|researcher|developer|analyst|role|position))/i);
  return match?.[1]?.trim() ?? '';
}

function extractScalar(yaml: string, key: string) {
  const match = yaml.match(new RegExp(`^\\s*${escapeForRegex(key)}:\\s*(.*)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function extractSectionNames(yaml: string) {
  const sectionsRoot = yaml.match(/^\s*sections:\s*$/m);
  if (!sectionsRoot) {
    return [];
  }

  return [...yaml.matchAll(/^ {4}([^:\n][^:\n]*):\s*$/gm)].map((match) => match[1]!.trim());
}

function inferRoleFromSections(sectionNames: string[]) {
  if (sectionNames.some((section) => /research|publication/i.test(section))) {
    return 'research and applied AI';
  }

  if (sectionNames.some((section) => /project/i.test(section))) {
    return 'product-minded engineering';
  }

  if (sectionNames.some((section) => /experience/i.test(section))) {
    return 'technical leadership';
  }

  return '';
}

function buildHeadlineVariant(basis: string, style: 'impact' | 'scope' | 'clarity') {
  const cleaned = basis.replace(/["']/g, '').trim();

  switch (style) {
    case 'impact':
      return `Senior ${cleaned} leader delivering measurable product and platform outcomes`;
    case 'scope':
      return `${cleaned} operator across engineering, product, and execution`;
    case 'clarity':
      return `${cleaned} focused on shipping reliable systems and visible business impact`;
  }
}

function chunkText(text: string) {
  const chunks = text.match(/.{1,80}(?:\s|$)/g);
  return chunks && chunks.length > 0 ? chunks : [text];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
