import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  startSessionRecording: vi.fn()
}));
const loaded = vi.hoisted(() => vi.fn());
vi.mock('posthog-js', () => {
  loaded();
  return { default: client };
});

const load = () => import('./posthog-client');

describe('posthog-client', () => {
  beforeEach(() => {
    // Lets the previous test's copy of the module remove its listeners.
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('downloads nothing and captures nothing without a key', async () => {
    const { capture, initPostHog } = await load();
    await initPostHog(undefined, undefined);
    capture('anything');
    expect(loaded).not.toHaveBeenCalled();
    expect(client.capture).not.toHaveBeenCalled();
  });

  it('keeps events captured while the library downloads', async () => {
    const { capture, initPostHog } = await load();
    const ready = initPostHog('key', 'https://example.test');
    capture('early', { step: 1 });
    await ready;
    capture('late');
    expect(client.init).toHaveBeenCalledWith('key', expect.objectContaining({ api_host: 'https://example.test' }));
    expect(client.capture.mock.calls).toEqual([
      ['early', { step: 1 }],
      ['late', undefined]
    ]);
  });

  it('holds automatic events until the visitor interacts, then starts recording', async () => {
    const { initPostHog } = await load();
    await initPostHog('key', 'https://example.test');
    const { before_send: beforeSend } = client.init.mock.calls[0][1];
    expect(beforeSend({ event: '$pageview', properties: {} })).toBeNull();
    expect(client.capture).not.toHaveBeenCalled();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(client.startSessionRecording).toHaveBeenCalledOnce();
    expect(client.capture).toHaveBeenCalledWith('$pageview', {});
  });
});
