import { describe, expect, it } from 'vitest';
import type { UIMessage } from '@ai-sdk/react';
import { applyEditProposalToSection, extractEditProposals } from './proposals';

describe('AI chat proposal extraction', () => {
  it('extracts editYaml tool outputs from assistant messages', () => {
    const messages = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          {
            type: 'dynamic-tool',
            toolName: 'editYaml',
            toolCallId: 'tool-1',
            state: 'output-available',
            input: {
              file: 'cv',
              oldText: 'old bullet',
              newText: 'new bullet'
            },
            output: { success: true, file: 'cv' }
          }
        ]
      }
    ] as UIMessage[];

    expect(extractEditProposals(messages)).toEqual([
      {
        id: 'tool-1',
        file: 'cv',
        oldText: 'old bullet',
        newText: 'new bullet',
        status: 'pending'
      }
    ]);
  });

  it('applies proposal text as a targeted replacement when possible', () => {
    expect(
      applyEditProposalToSection('before\nold bullet\nafter', {
        id: 'tool-1',
        file: 'cv',
        oldText: 'old bullet',
        newText: 'new bullet',
        status: 'pending'
      })
    ).toBe('before\nnew bullet\nafter');
  });
});
