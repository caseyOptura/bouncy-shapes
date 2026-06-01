const { chromium } = require('/Users/casey/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const path = require('path');

const REPORT_DIR = '/Users/casey/Documents/git/bouncy-shapes/reports/visual-qa/2026-05-29';
const BASE_URL = 'http://localhost:8765/';
const LS_KEY = 'bouncy-shapes:v1';

async function screenshot(page, name, description) {
  const filepath = path.join(REPORT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`SCREENSHOT: ${name}.png — ${description}`);
  return filepath;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStorage(page) {
  return await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return raw; }
  }, LS_KEY);
}

async function getHUDText(page) {
  return await page.evaluate(() => {
    const hud = document.getElementById('hud');
    return hud ? hud.innerText : null;
  });
}

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--window-size=1440,900', '--no-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = [];
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // =============================================
  // TEST: High Score Persistence with Non-Zero Score
  // =============================================
  console.log('\n=== TEST: High Score Persistence (Non-Zero) ===');

  // 1. Load the app fresh
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await wait(2000);

  const initialStorage = await getStorage(page);
  console.log('Initial storage:', initialStorage);

  // 2. Inject a non-zero highScore directly into localStorage (simulates having tapped shapes)
  //    This is the reliable way to test persistence: set a known value, reload, verify it survives.
  const TEST_HIGH_SCORE = 7;
  await page.evaluate(({ key, score }) => {
    const raw = localStorage.getItem(key);
    const state = raw ? JSON.parse(raw) : {};
    state.highScore = score;
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: LS_KEY, score: TEST_HIGH_SCORE });

  // Confirm the value was written
  const storageAfterWrite = await getStorage(page);
  console.log('Storage after writing highScore=7:', storageAfterWrite);

  // 3. Reload the page — this exercises loadState() reading the value back
  await page.reload({ waitUntil: 'networkidle' });
  await wait(2000);

  const storageAfterReload = await getStorage(page);
  const hudAfterReload = await getHUDText(page);
  console.log('Storage after reload:', storageAfterReload);
  console.log('HUD after reload:', hudAfterReload);

  await screenshot(page, 'hs-01-after-reload-nonzero-best', 'After reload with Best: 7 in storage — HUD should show Best: 7');

  const highScoreRestored = storageAfterReload?.highScore === TEST_HIGH_SCORE;
  const hudShowsBest = hudAfterReload && hudAfterReload.includes(`Best: ${TEST_HIGH_SCORE}`);

  results.push({
    test: 'High Score Persistence (Non-Zero)',
    passed: highScoreRestored && hudShowsBest,
    notes: `highScore written: ${TEST_HIGH_SCORE}, after reload: ${storageAfterReload?.highScore}, HUD: "${hudAfterReload}", hudShowsBest: ${hudShowsBest}`
  });

  // 4. Verify Reset Score zeroes out the highScore
  console.log('\n=== TEST: Reset Score Clears High Score ===');
  await page.click('#settings-toggle');
  await wait(300);
  await page.click('#score-reset');
  await wait(300);

  const storageAfterReset = await getStorage(page);
  const hudAfterReset = await getHUDText(page);
  console.log('Storage after reset:', storageAfterReset);
  console.log('HUD after reset:', hudAfterReset);

  await screenshot(page, 'hs-02-after-reset', 'After Reset Score — Best should be 0');

  const resetWorked = (storageAfterReset?.highScore === 0 || storageAfterReset?.highScore === undefined)
    && hudAfterReset && hudAfterReset.includes('Best: 0');

  results.push({
    test: 'Reset Score Clears High Score',
    passed: resetWorked,
    notes: `highScore after reset: ${storageAfterReset?.highScore}, HUD: "${hudAfterReset}"`
  });

  // 5. Verify the reset value persists across another reload
  console.log('\n=== TEST: Zeroed High Score Persists After Reload ===');
  await page.keyboard.press('Escape');
  await wait(200);
  await page.reload({ waitUntil: 'networkidle' });
  await wait(2000);

  const storageAfterResetReload = await getStorage(page);
  const hudAfterResetReload = await getHUDText(page);
  console.log('Storage after post-reset reload:', storageAfterResetReload);
  console.log('HUD after post-reset reload:', hudAfterResetReload);

  await screenshot(page, 'hs-03-after-reset-reload', 'After reload following reset — Best should still be 0');

  const zeroPersistedAfterReset = storageAfterResetReload?.highScore === 0
    && hudAfterResetReload && hudAfterResetReload.includes('Best: 0');

  results.push({
    test: 'Zeroed High Score Persists After Reload',
    passed: zeroPersistedAfterReset,
    notes: `highScore after reload: ${storageAfterResetReload?.highScore}, HUD: "${hudAfterResetReload}"`
  });

  // =============================================
  // FINAL RESULTS
  // =============================================
  console.log('\n=== FINAL TEST RESULTS ===');
  const allPassed = results.every(r => r.passed);
  results.forEach(r => {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.test}`);
    console.log(`       ${r.notes}`);
  });

  console.log('\nJSON_RESULTS_START');
  console.log(JSON.stringify({
    results,
    consoleErrors,
    allPassed,
    totalPassed: results.filter(r => r.passed).length,
    totalTests: results.length,
  }, null, 2));
  console.log('JSON_RESULTS_END');

  if (consoleErrors.length > 0) {
    console.log('\nConsole errors:');
    consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  await browser.close();
  console.log('\nAll tests complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
