import type { UIMessage } from '@ai-sdk/react';
import { SECTION_KEYS, type SectionKey } from '@rendercv/contracts';

const SECTION_KEY_SET = new Set<string>(SECTION_KEYS);

export type AiEditProposalStatus = 'pending' | 'accepted' | 'rejected';

export type AiEditProposal = {
  id: string;
  file: SectionKey;
  oldText: string;
  newText: string;
  status: AiEditProposalStatus;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === 'string' && SECTION_KEY_SET.has(value);
}

function readToolName(part: UnknownRecord) {
  if (part.type === 'dynamic-tool' && typeof part.toolName === 'string') {
    return part.toolName;
  }

  if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
    return part.type.slice('tool-'.length);
  }

  return undefined;
}

function readEditProposal(part: unknown, fallbackId: string): AiEditProposal | undefined {
  if (!isRecord(part) || readToolName(part) !== 'editYaml' || part.state !== 'output-available') {
    return undefined;
  }

  const output = part.output;
  const input = part.input;
  if (!isRecord(output) || output.success !== true || !isRecord(input)) {
    return undefined;
  }

  if (
    !isSectionKey(input.file) ||
    typeof input.oldText !== 'string' ||
    typeof input.newText !== 'string' ||
    input.oldText === input.newText
  ) {
    return undefined;
  }

  const toolCallId = typeof part.toolCallId === 'string' ? part.toolCallId : fallbackId;
  return {
    id: toolCallId,
    file: input.file,
    oldText: input.oldText,
    newText: input.newText,
    status: 'pending'
  };
}

export function extractEditProposals(messages: UIMessage[]): AiEditProposal[] {
  const proposals = new Map<string, AiEditProposal>();

  for (const message of messages) {
    if (message.role !== 'assistant') continue;

    message.parts.forEach((part, index) => {
      const proposal = readEditProposal(part, `${message.id}:${index}`);
      if (!proposal) return;

      const duplicateKey = `${proposal.file}\n${proposal.oldText}\n${proposal.newText}`;
      if ([...proposals.values()].some((existing) => `${existing.file}\n${existing.oldText}\n${existing.newText}` === duplicateKey)) {
        return;
      }

      proposals.set(proposal.id, proposal);
    });
  }

  return [...proposals.values()];
}

export function applyEditProposalToSection(currentContent: string, proposal: AiEditProposal) {
  if (!proposal.oldText) {
    return proposal.newText;
  }

  if (!currentContent.includes(proposal.oldText)) {
    return proposal.newText;
  }

  return currentContent.replace(proposal.oldText, proposal.newText);
}
