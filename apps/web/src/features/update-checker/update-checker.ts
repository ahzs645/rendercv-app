const VERSION_KEY = 'rendercv-version';
const BUILD_KEY = 'rendercv-build-number';
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export interface UpdateInfo {
  version: string;
  buildNumber: string;
  buildTime?: string;
  onReload: () => void;
}

interface ServerVersion {
  version: string;
  buildNumber: string;
  buildTime?: string;
}

function isLocalDevServer(): boolean {
  if (import.meta.env.VITE_ENABLE_DEV_UPDATE_CHECKS === 'true') {
    return false;
  }
  if (import.meta.env.DEV) {
    return true;
  }
  return LOOPBACK_HOSTNAMES.has(window.location.hostname);
}

function versionJsonUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/version.json`;
}

function getStoredVersion(): { version: string | null; buildNumber: string | null } {
  try {
    return {
      version: localStorage.getItem(VERSION_KEY),
      buildNumber: localStorage.getItem(BUILD_KEY)
    };
  } catch {
    return { version: null, buildNumber: null };
  }
}

function storeVersion(version: string, buildNumber: string): void {
  try {
    localStorage.setItem(VERSION_KEY, version);
    localStorage.setItem(BUILD_KEY, buildNumber);
  } catch {
    // localStorage unavailable
  }
}

async function fetchServerVersion(): Promise<ServerVersion | null> {
  try {
    const response = await fetch(versionJsonUrl(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<ServerVersion>;
    if (data.version && data.buildNumber) {
      return { version: data.version, buildNumber: data.buildNumber, buildTime: data.buildTime };
    }
    return null;
  } catch {
    return null;
  }
}

function applyUpdate(version: string, buildNumber: string): void {
  storeVersion(version, buildNumber);
  const url = new URL(window.location.href);
  url.searchParams.set('_cb', Date.now().toString());
  window.location.href = url.toString();
}

async function checkForUpdates(): Promise<UpdateInfo | null> {
  const serverVersion = await fetchServerVersion();
  if (!serverVersion) return null;

  const stored = getStoredVersion();

  if (!stored.buildNumber) {
    storeVersion(serverVersion.version, serverVersion.buildNumber);
    return null;
  }

  if (serverVersion.buildNumber === stored.buildNumber) {
    return null;
  }

  return {
    version: serverVersion.version,
    buildNumber: serverVersion.buildNumber,
    buildTime: serverVersion.buildTime,
    onReload: () => applyUpdate(serverVersion.version, serverVersion.buildNumber)
  };
}

export function initUpdateChecker(onUpdate: (info: UpdateInfo) => void): () => void {
  if (isLocalDevServer()) {
    return () => {};
  }

  const url = new URL(window.location.href);
  if (url.searchParams.has('_cb')) {
    url.searchParams.delete('_cb');
    window.history.replaceState({}, '', url.toString());
  }

  let notified = false;
  const runCheck = async () => {
    if (notified) return;
    const info = await checkForUpdates();
    if (info) {
      notified = true;
      onUpdate(info);
    }
  };

  const startTimer = window.setTimeout(runCheck, 2000);
  const intervalTimer = window.setInterval(runCheck, UPDATE_CHECK_INTERVAL);

  return () => {
    window.clearTimeout(startTimer);
    window.clearInterval(intervalTimer);
  };
}
