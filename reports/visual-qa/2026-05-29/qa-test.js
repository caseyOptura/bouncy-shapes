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

async function isSettingsPanelVisible(page) {
  return await page.evaluate(() => {
    const panel = document.getElementById('settings-panel');
    return panel ? !panel.hidden : false;
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
  // TEST 1: Initial Load + HUD Visibility
  // =============================================
  console.log('\n=== TEST 1: Initial Load ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await wait(2500);

  await screenshot(page, '03-initial-load-desktop', 'Initial load at 1440x900 desktop');

  const initialStorage = await getStorage(page);
  console.log('Initial storage state:', initialStorage);

  const hudText = await getHUDText(page);
  console.log('HUD text:', hudText);

  const hudVisible = await page.evaluate(() => {
    const hud = document.getElementById('hud');
    if (!hud) return false;
    const rect = hud.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(hud).display !== 'none';
  });

  const settingsToggleVisible = await page.evaluate(() => {
    const btn = document.getElementById('settings-toggle');
    if (!btn) return false;
    const rect = btn.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  const canvasVisible = await page.evaluate(() => {
    const canvas = document.getElementById('canvas');
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  console.log('HUD visible:', hudVisible);
  console.log('Settings toggle visible:', settingsToggleVisible);
  console.log('Canvas visible:', canvasVisible);

  results.push({
    test: 'Initial Load',
    passed: hudVisible && settingsToggleVisible && canvasVisible,
    notes: `HUD: ${hudVisible}, Settings toggle: ${settingsToggleVisible}, Canvas: ${canvasVisible}, HUD text: "${hudText}"`
  });

  // =============================================
  // TEST 2: Open Settings Panel + Verify Controls
  // =============================================
  console.log('\n=== TEST 2: Settings Panel ===');
  await page.click('#settings-toggle');
  await wait(300);

  const panelOpen = await isSettingsPanelVisible(page);
  console.log('Settings panel visible after click:', panelOpen);

  await screenshot(page, '04-settings-panel-open', 'Settings panel opened via gear button');

  const panelContents = await page.evaluate(() => {
    const panel = document.getElementById('settings-panel');
    if (!panel) return null;
    return {
      themeName: document.getElementById('theme-name')?.textContent,
      themeNextExists: !!document.getElementById('theme-next'),
      shapesDecExists: !!document.getElementById('shapes-dec'),
      shapesCountText: document.getElementById('shapes-count')?.textContent,
      shapesIncExists: !!document.getElementById('shapes-inc'),
      soundToggleText: document.getElementById('sound-toggle')?.textContent,
      scoreResetExists: !!document.getElementById('score-reset'),
    };
  });
  console.log('Settings panel contents:', panelContents);

  results.push({
    test: 'Settings Panel Controls',
    passed: panelOpen && panelContents.themeNextExists && panelContents.shapesDecExists &&
            panelContents.shapesIncExists && !!panelContents.soundToggleText,
    notes: `Panel open: ${panelOpen}, Theme: ${panelContents?.themeName}, Count: ${panelContents?.shapesCountText}, Sound: ${panelContents?.soundToggleText}`
  });

  // =============================================
  // TEST 3: Theme Cycling
  // =============================================
  console.log('\n=== TEST 3: Theme Cycling ===');

  const storageBeforeTheme = await getStorage(page);
  const themeBeforeIndex = storageBeforeTheme?.themeIndex ?? 0;
  console.log('Theme index before:', themeBeforeIndex);

  // Click theme "Next" button
  await page.click('#theme-next');
  await wait(400);

  const storageAfterTheme1 = await getStorage(page);
  const themeAfter1 = storageAfterTheme1?.themeIndex ?? 0;
  console.log('Theme index after first click:', themeAfter1);

  await screenshot(page, '05-theme-cycle-1', 'After first theme cycle click');

  const bodyBg1 = await page.evaluate(() => document.body.style.background);
  console.log('Body background after theme 1:', bodyBg1);

  // Click again
  await page.click('#theme-next');
  await wait(400);
  await screenshot(page, '06-theme-cycle-2', 'After second theme cycle click');

  const storageAfterTheme2 = await getStorage(page);
  const themeAfter2 = storageAfterTheme2?.themeIndex ?? 0;
  const bodyBg2 = await page.evaluate(() => document.body.style.background);
  console.log('Theme index after second click:', themeAfter2);
  console.log('Body background after theme 2:', bodyBg2);

  // Click third time
  await page.click('#theme-next');
  await wait(400);
  await screenshot(page, '07-theme-cycle-3', 'After third theme cycle click');

  const storageAfterTheme3 = await getStorage(page);
  const themeAfter3 = storageAfterTheme3?.themeIndex ?? 0;
  console.log('Theme index after third click:', themeAfter3);

  const themeProgressed = themeAfter1 !== themeBeforeIndex &&
    themeAfter2 !== themeAfter1;

  results.push({
    test: 'Theme Cycling',
    passed: themeProgressed,
    notes: `Theme indices: ${themeBeforeIndex} → ${themeAfter1} → ${themeAfter2} → ${themeAfter3}. BG after change 1: ${bodyBg1}`
  });

  // =============================================
  // TEST 4: Shape Count Control
  // =============================================
  console.log('\n=== TEST 4: Shape Count Control ===');

  const storageBeforeShapes = await getStorage(page);
  const countBefore = storageBeforeShapes?.shapeCount ?? 6;
  console.log('Shape count before:', countBefore);

  // Click increase
  await page.click('#shapes-inc');
  await wait(300);
  const storageAfterInc = await getStorage(page);
  const countAfterInc = storageAfterInc?.shapeCount ?? 0;
  const labelAfterInc = await page.evaluate(() => document.getElementById('shapes-count')?.textContent);
  console.log('Shape count after increment:', countAfterInc, 'Label:', labelAfterInc);

  await screenshot(page, '08-shape-count-increased', 'Shape count after increment');

  // Click decrease
  await page.click('#shapes-dec');
  await wait(300);
  const storageAfterDec = await getStorage(page);
  const countAfterDec = storageAfterDec?.shapeCount ?? 0;
  const labelAfterDec = await page.evaluate(() => document.getElementById('shapes-count')?.textContent);
  console.log('Shape count after decrement:', countAfterDec, 'Label:', labelAfterDec);

  await screenshot(page, '09-shape-count-decreased', 'Shape count after decrement');

  const shapeCountWorked = countAfterInc === countBefore + 1 && countAfterDec === countBefore;

  results.push({
    test: 'Shape Count Control',
    passed: shapeCountWorked,
    notes: `Count: ${countBefore} → +1 → ${countAfterInc} (label: ${labelAfterInc}) → -1 → ${countAfterDec} (label: ${labelAfterDec})`
  });

  // =============================================
  // TEST 5: Sound Toggle
  // =============================================
  console.log('\n=== TEST 5: Sound Toggle ===');

  const storageBeforeSound = await getStorage(page);
  const soundBefore = storageBeforeSound?.soundOn;
  const soundLabelBefore = await page.evaluate(() => document.getElementById('sound-toggle')?.textContent);
  console.log('Sound state before:', soundBefore, 'Label:', soundLabelBefore);

  await screenshot(page, '10-before-sound-toggle', 'Before sound toggle');

  await page.click('#sound-toggle');
  await wait(300);

  const storageAfterSound = await getStorage(page);
  const soundAfter = storageAfterSound?.soundOn;
  const soundLabelAfter = await page.evaluate(() => document.getElementById('sound-toggle')?.textContent);
  console.log('Sound state after:', soundAfter, 'Label:', soundLabelAfter);

  await screenshot(page, '11-after-sound-toggle', 'After sound toggle');

  // Toggle back
  await page.click('#sound-toggle');
  await wait(300);
  const storageAfterToggleBack = await getStorage(page);
  const soundLabelBack = await page.evaluate(() => document.getElementById('sound-toggle')?.textContent);
  console.log('Sound state after toggle back:', storageAfterToggleBack?.soundOn, 'Label:', soundLabelBack);

  const soundWorked = soundBefore !== soundAfter && soundAfter !== storageAfterToggleBack?.soundOn;

  results.push({
    test: 'Sound Toggle',
    passed: soundWorked,
    notes: `Sound: ${soundBefore} → ${soundAfter} → ${storageAfterToggleBack?.soundOn}. Labels: "${soundLabelBefore}" → "${soundLabelAfter}" → "${soundLabelBack}"`
  });

  // =============================================
  // TEST 6: High Score Persistence
  // =============================================
  console.log('\n=== TEST 6: High Score Persistence ===');

  // Get current state before reload
  const preReloadStorage = await getStorage(page);
  const highScoreBefore = preReloadStorage?.highScore ?? 0;
  const themeBefore = preReloadStorage?.themeIndex;
  console.log('State before reload:', preReloadStorage);

  await screenshot(page, '12-before-reload', 'State before page reload');

  // Close settings panel first, then reload
  await page.keyboard.press('Escape');
  await wait(200);
  await page.reload({ waitUntil: 'networkidle' });
  await wait(2500);

  const postReloadStorage = await getStorage(page);
  const highScoreAfter = postReloadStorage?.highScore ?? 0;
  const hudAfterReload = await getHUDText(page);
  console.log('State after reload:', postReloadStorage);
  console.log('HUD after reload:', hudAfterReload);

  await screenshot(page, '13-after-reload-high-score', 'After page reload — checking high score persistence');

  const highScorePersisted = highScoreBefore === highScoreAfter;
  const themePersistedAfterReload = themeBefore === postReloadStorage?.themeIndex;

  results.push({
    test: 'High Score Persistence',
    passed: highScorePersisted,
    notes: `High score before: ${highScoreBefore}, after reload: ${highScoreAfter}. HUD: "${hudAfterReload}"`
  });

  // =============================================
  // TEST 7: Full Settings Persistence
  // =============================================
  console.log('\n=== TEST 7: Settings Persistence ===');

  // Open settings, change theme and shape count, then reload
  await page.click('#settings-toggle');
  await wait(300);

  // Change theme once
  await page.click('#theme-next');
  await wait(400);

  // Increment shapes
  await page.click('#shapes-inc');
  await wait(300);

  const settingsBeforeReload = await getStorage(page);
  console.log('Settings before reload:', settingsBeforeReload);

  await screenshot(page, '14-settings-before-reload', 'Settings changed before reload');

  await page.reload({ waitUntil: 'networkidle' });
  await wait(2500);

  const settingsAfterReload = await getStorage(page);
  console.log('Settings after reload:', settingsAfterReload);

  await screenshot(page, '15-settings-after-reload', 'Settings after reload — persistence check');

  // Open panel to verify UI shows persisted values
  await page.click('#settings-toggle');
  await wait(300);
  const uiAfterReload = await page.evaluate(() => ({
    themeName: document.getElementById('theme-name')?.textContent,
    shapesCount: document.getElementById('shapes-count')?.textContent,
    soundLabel: document.getElementById('sound-toggle')?.textContent,
  }));
  console.log('UI after reload:', uiAfterReload);

  await screenshot(page, '16-settings-panel-after-reload', 'Settings panel open after reload');

  const settingsPersisted =
    settingsBeforeReload?.themeIndex === settingsAfterReload?.themeIndex &&
    settingsBeforeReload?.shapeCount === settingsAfterReload?.shapeCount &&
    settingsBeforeReload?.soundOn === settingsAfterReload?.soundOn;

  results.push({
    test: 'Settings Persistence (Theme + Shape Count)',
    passed: settingsPersisted,
    notes: `Before: theme=${settingsBeforeReload?.themeIndex}, shapes=${settingsBeforeReload?.shapeCount}, sound=${settingsBeforeReload?.soundOn}. After: theme=${settingsAfterReload?.themeIndex}, shapes=${settingsAfterReload?.shapeCount}, sound=${settingsAfterReload?.soundOn}. UI theme name: "${uiAfterReload?.themeName}", count: ${uiAfterReload?.shapesCount}`
  });

  // =============================================
  // MOBILE LAYOUT TEST (375x812)
  // =============================================
  console.log('\n=== Mobile Layout Test (375x812) ===');

  // Close panel first
  await page.keyboard.press('Escape');
  await wait(200);
  await page.setViewportSize({ width: 375, height: 812 });
  await wait(800);

  await screenshot(page, '17-mobile-375x812', 'Mobile layout at 375x812');

  const hasHorizScroll = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  console.log('Has horizontal scroll on mobile:', hasHorizScroll);

  // Check if settings panel is accessible on mobile
  await page.click('#settings-toggle');
  await wait(400);
  await screenshot(page, '18-mobile-settings-open', 'Mobile: settings panel opened');

  const mobileSettingsVisible = await isSettingsPanelVisible(page);
  console.log('Settings panel visible on mobile:', mobileSettingsVisible);

  results.push({
    test: 'Mobile Layout (375px)',
    passed: !hasHorizScroll && mobileSettingsVisible,
    notes: `Horizontal scroll: ${hasHorizScroll}, Settings accessible: ${mobileSettingsVisible}`
  });

  // Back to desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await wait(500);
  await page.keyboard.press('Escape');
  await wait(200);
  await screenshot(page, '19-desktop-final', 'Final desktop state 1440x900');

  // =============================================
  // CONSOLE ERROR SUMMARY
  // =============================================
  console.log('\n=== Console Errors ===');
  console.log('Total errors captured:', consoleErrors.length);
  consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

  // =============================================
  // FINAL RESULTS
  // =============================================
  console.log('\n=== FINAL TEST RESULTS ===');
  const allPassed = results.every(r => r.passed);
  results.forEach(r => {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.test}`);
    console.log(`       ${r.notes}`);
  });

  // Output JSON for report
  console.log('\nJSON_RESULTS_START');
  console.log(JSON.stringify({
    results,
    consoleErrors,
    allPassed,
    totalPassed: results.filter(r => r.passed).length,
    totalTests: results.length,
  }, null, 2));
  console.log('JSON_RESULTS_END');

  await browser.close();
  console.log('\nAll tests complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
