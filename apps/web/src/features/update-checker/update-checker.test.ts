import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initUpdateChecker, type UpdateInfo } from './update-checker';

// The checker short-circuits on dev servers, which is exactly what vitest looks
// like, so every test opts back in through the escape hatch the module exposes.
function serve(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body } as Response);
}

// This jsdom setup ships without a Storage implementation, so supply one.
function memoryStorage(): Storage {
  let entries: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(entries).length;
    },
    key: (index) => Object.keys(entries)[index] ?? null,
    getItem: (key) => entries[key] ?? null,
    setItem: (key, value) => {
      entries[key] = String(value);
    },
    removeItem: (key) => {
      delete entries[key];
    },
    clear: () => {
      entries = {};
    }
  };
}

describe('update checker', () => {
  let stop: () => void = () => {};

  beforeEach(() => {
    vi.stubEnv('VITE_ENABLE_DEV_UPDATE_CHECKS', 'true');
    vi.stubGlobal('localStorage', memoryStorage());
    vi.useFakeTimers();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function run(onUpdate: (info: UpdateInfo) => void, ms = 2000) {
    stop = initUpdateChecker(onUpdate);
    await vi.advanceTimersByTimeAsync(ms);
  }

  it('seeds the stored build on first run instead of announcing an update', async () => {
    vi.stubGlobal('fetch', serve({ version: '1.0.0', buildNumber: 'abc123' }));
    const onUpdate = vi.fn();

    await run(onUpdate);

    expect(onUpdate).not.toHaveBeenCalled();
    expect(localStorage.getItem('rendercv-build-number')).toBe('abc123');
  });

  it('stays quiet while the served build matches the stored one', async () => {
    localStorage.setItem('rendercv-version', '1.0.0');
    localStorage.setItem('rendercv-build-number', 'abc123');
    vi.stubGlobal('fetch', serve({ version: '1.0.0', buildNumber: 'abc123' }));
    const onUpdate = vi.fn();

    await run(onUpdate);

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('announces a new build once, not on every poll', async () => {
    localStorage.setItem('rendercv-version', '1.0.0');
    localStorage.setItem('rendercv-build-number', 'abc123');
    vi.stubGlobal('fetch', serve({ version: '1.1.0', buildNumber: 'def456' }));
    const onUpdate = vi.fn();

    // Past the 2s kickoff and two further 5-minute polls.
    await run(onUpdate, 2000 + 10 * 60 * 1000);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toMatchObject({ version: '1.1.0', buildNumber: 'def456' });
  });

  it('ignores an unreachable or malformed version.json', async () => {
    localStorage.setItem('rendercv-build-number', 'abc123');
    vi.stubGlobal('fetch', serve({ version: '1.1.0' })); // no buildNumber
    const onUpdate = vi.fn();

    await run(onUpdate);

    expect(onUpdate).not.toHaveBeenCalled();
    expect(localStorage.getItem('rendercv-build-number')).toBe('abc123');
  });

  it('stops polling once disposed', async () => {
    localStorage.setItem('rendercv-build-number', 'abc123');
    const fetchMock = serve({ version: '1.0.0', buildNumber: 'abc123' });
    vi.stubGlobal('fetch', fetchMock);

    const dispose = initUpdateChecker(vi.fn());
    dispose();
    await vi.advanceTimersByTimeAsync(2000 + 10 * 60 * 1000);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
