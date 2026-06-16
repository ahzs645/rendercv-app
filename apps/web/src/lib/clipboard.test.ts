import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

const originalExecCommand = (document as { execCommand?: unknown }).execCommand;

function stubExecCommand(impl: () => boolean) {
  const fn = vi.fn(impl);
  (document as unknown as { execCommand: () => boolean }).execCommand = fn;
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  (document as { execCommand?: unknown }).execCommand = originalExecCommand;
});

describe('copyTextToClipboard', () => {
  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await copyTextToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when the clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const execCommand = stubExecCommand(() => true);

    await copyTextToClipboard('fallback text');

    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when the clipboard API is missing', async () => {
    vi.stubGlobal('navigator', {});
    const execCommand = stubExecCommand(() => true);

    await copyTextToClipboard('mobile text');

    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('throws when no copy mechanism succeeds', async () => {
    vi.stubGlobal('navigator', {});
    stubExecCommand(() => false);

    await expect(copyTextToClipboard('nope')).rejects.toThrow(/clipboard/i);
  });
});
