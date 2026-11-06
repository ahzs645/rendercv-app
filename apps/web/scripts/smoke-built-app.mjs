// Opens the built app in a real browser, as a first-time visitor, and walks the
// onboarding tour. Unit tests and typechecks cannot see a bundle that throws on
// load: this is the check that stands between a build and users.
//
//   pnpm build:web && pnpm --filter @rendercv/web test:smoke
//
// Set SMOKE_CHROME_CHANNEL=chrome to use an installed Chrome.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4287;
const URL_ROOT = `http://localhost:${PORT}/rendercv-app/`;
const VIEWPORTS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  // Below the sidebar's breakpoint on a screen too wide to be a phone.
  { name: 'tablet', viewport: { width: 1000, height: 800 } },
  { name: 'desktop', viewport: { width: 1440, height: 900 } }
];
const CARD = '.rcv-tour-popover';
const NEXT = '.rcv-tour-next';
const CRASH_TEXT = /Unexpected Application Error|Something went wrong/;

function startServer() {
  const server = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: true
  });
  return { stop: () => process.kill(-server.pid) };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if ((await fetch(URL_ROOT)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`The built app did not come up at ${URL_ROOT}.`);
}

/** What is on top of the highlighted control, when it is not the control. */
const coveringElement = (page) =>
  page.evaluate(() => {
    const control = document.querySelector('.driver-active-element');
    if (!control) return null;
    const box = control.getBoundingClientRect();
    const x = Math.min(innerWidth - 2, Math.max(1, box.left + box.width / 2));
    const y = Math.min(innerHeight - 2, Math.max(1, box.top + box.height / 2));
    const top = document.elementFromPoint(x, y);
    if (!top || control.contains(top) || top.contains(control) || top.closest('[data-testid="tutorial-overlay"]')) {
      return null;
    }
    return `${top.tagName.toLowerCase()}.${String(top.className).slice(0, 60)}`;
  });

async function walkTour(browser, { name, ...options }) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (response.status() >= 400 && url.host === `localhost:${PORT}`) {
      failures.push(`${response.status()} ${url.pathname}`);
    }
  });

  await page.goto(URL_ROOT, { waitUntil: 'domcontentloaded' });
  await page.locator(CARD).waitFor({ timeout: 30_000 });

  let steps = 0;
  for (; steps < 12; steps += 1) {
    const next = page.locator(NEXT);
    await next.waitFor({ timeout: 10_000 });
    await page.waitForFunction((selector) => !document.querySelector(selector)?.disabled, NEXT, { timeout: 10_000 });
    await page.waitForTimeout(400);
    const covering = await coveringElement(page);
    if (covering) failures.push(`step ${steps + 1}: the highlighted control is covered by ${covering}`);
    const label = await next.textContent();
    await next.click();
    if (label === 'Done') {
      steps += 1;
      break;
    }
  }
  await page.locator(CARD).waitFor({ state: 'detached', timeout: 5_000 });

  const finished = await page.evaluate(
    () => JSON.parse(localStorage.getItem('rendercv_preferences') ?? '{}').onboardingCompletedAt
  );
  if (!finished) failures.push('finishing the tour did not record onboarding as complete');
  if (steps < 5) failures.push(`the tour ended after only ${steps} steps`);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Product Tour' }).first().waitFor({ state: 'attached', timeout: 15_000 });
  if (await page.locator(CARD).count()) failures.push('the tour restarted for a returning visitor');
  if (CRASH_TEXT.test(await page.locator('body').innerText())) failures.push('the error page is showing');

  await context.close();
  console.log(`${failures.length ? 'FAIL' : 'ok  '} ${name}: ${steps} steps`);
  return failures.map((failure) => `${name}: ${failure}`);
}

/**
 * The app must never rewrite a visitor's YAML on its own: repairs that go through
 * a YAML parser drop comments, and render-only output loses tags and positions.
 */
async function keepsDocumentIntact(browser) {
  const authored = [
    'cv:',
    '  # a note the author wants to keep',
    '  name: Smoke Test',
    '  headline:',
    '  sections:',
    '    experience:',
    '      - company: Example',
    '        tags: [research]',
    '        positions:',
    '          - title: Engineer',
    '            start_date: 2020-01',
    '            end_date: present',
    ''
  ].join('\n');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    if (localStorage.getItem('rendercv_preferences')) return;
    localStorage.setItem('rendercv_preferences', JSON.stringify({ onboardingCompletedAt: '2026-01-01T00:00:00Z' }));
  });
  const page = await context.newPage();
  await page.goto(URL_ROOT, { waitUntil: 'domcontentloaded' });

  // An untouched sample is not stored, so make an edit to get the file saved.
  await page.locator('.monaco-editor').first().click({ timeout: 30_000 });
  await page.keyboard.type(' ');
  await page.waitForFunction(() => localStorage.getItem('rendercv_guest_files'), null, { timeout: 10_000 });
  await page.evaluate((cv) => {
    const files = JSON.parse(localStorage.getItem('rendercv_guest_files'));
    files[0].cv = cv;
    localStorage.setItem('rendercv_guest_files', JSON.stringify(files));
  }, authored);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8_000);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rendercv_guest_files'))[0].cv);
  const undo = page.getByRole('button', { name: /^undo/i }).first();
  const undoIdle = await undo.isDisabled();
  await context.close();

  const failures = [];
  if (saved !== authored) failures.push(`document: loading it rewrote the YAML:\n${saved}`);
  if (!undoIdle) failures.push('document: loading it left something to undo');
  console.log(`${failures.length ? 'FAIL' : 'ok  '} document survives a reload`);
  return failures;
}

const server = startServer();
let browser;
let failures = [];
try {
  await waitForServer();
  browser = await chromium.launch({ channel: process.env.SMOKE_CHROME_CHANNEL });
  for (const viewport of VIEWPORTS) {
    failures.push(
      ...(await walkTour(browser, viewport).catch((error) => [`${viewport.name}: ${error.message}`]))
    );
  }
  failures.push(...(await keepsDocumentIntact(browser).catch((error) => [`document: ${error.message}`])));
} catch (error) {
  failures.push(error.message);
} finally {
  await browser?.close();
  server.stop();
}

if (failures.length) {
  console.error(`\nThe built app failed its smoke test:\n${[...new Set(failures)].map((line) => `  - ${line}`).join('\n')}`);
  process.exit(1);
}
