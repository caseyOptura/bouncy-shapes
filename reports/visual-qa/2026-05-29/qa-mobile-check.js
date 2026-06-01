const { chromium } = require('/Users/casey/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const path = require('path');

const REPORT_DIR = '/Users/casey/Documents/git/bouncy-shapes/reports/visual-qa/2026-05-29';
const BASE_URL = 'http://localhost:8765/';

async function screenshot(page, name, description) {
  const filepath = path.join(REPORT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`SCREENSHOT: ${name}.png — ${description}`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--no-sandbox']
  });

  // Test mobile fresh — start with mobile viewport from scratch
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await wait(2000);

  // Confirm panel starts hidden
  const panelInitiallyHidden = await page.evaluate(() => {
    const panel = document.getElementById('settings-panel');
    return panel ? panel.hidden : null;
  });
  console.log('Panel initially hidden:', panelInitiallyHidden);

  await screenshot(page, '20-mobile-fresh-load', 'Mobile 375x812 fresh load — panel closed');

  // Open settings panel on mobile
  await page.click('#settings-toggle');
  await wait(400);

  const panelOpenOnMobile = await page.evaluate(() => {
    const panel = document.getElementById('settings-panel');
    return panel ? !panel.hidden : false;
  });
  console.log('Panel open on mobile after click:', panelOpenOnMobile);

  await screenshot(page, '21-mobile-settings-panel', 'Mobile 375x812 — settings panel opened');

  // Check if panel is fully visible (not cut off)
  const panelRect = await page.evaluate(() => {
    const panel = document.getElementById('settings-panel');
    if (!panel) return null;
    const rect = panel.getBoundingClientRect();
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      bottom: Math.round(rect.bottom),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      overflowsRight: rect.right > window.innerWidth,
      overflowsBottom: rect.bottom > window.innerHeight,
    };
  });
  console.log('Panel rect on mobile:', panelRect);

  // Check gear button touch target size
  const gearRect = await page.evaluate(() => {
    const btn = document.getElementById('settings-toggle');
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  });
  console.log('Gear button touch target size:', gearRect);

  // Check horizontal scroll
  const hasHorizScroll = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  console.log('Has horizontal scroll:', hasHorizScroll);

  // Close panel by clicking outside
  await page.mouse.click(100, 500);
  await wait(300);

  const panelClosedAfterOutsideClick = await page.evaluate(() => {
    const panel = document.getElementById('settings-panel');
    return panel ? panel.hidden : null;
  });
  console.log('Panel closed after outside click:', panelClosedAfterOutsideClick);

  await screenshot(page, '22-mobile-panel-closed', 'Mobile — settings panel closed by outside click');

  console.log('\n=== Console Errors ===');
  consoleErrors.forEach(e => console.log(' -', e));

  console.log('\nMobile test summary:');
  console.log(`Panel starts hidden: ${panelInitiallyHidden}`);
  console.log(`Panel opens on click: ${panelOpenOnMobile}`);
  console.log(`Panel overflows right: ${panelRect?.overflowsRight}`);
  console.log(`Panel overflows bottom: ${panelRect?.overflowsBottom}`);
  console.log(`Panel width: ${panelRect?.width}px, viewport: 375px`);
  console.log(`Gear button touch target: ${gearRect?.width}x${gearRect?.height}px (min 44px recommended)`);
  console.log(`No horizontal scroll: ${!hasHorizScroll}`);
  console.log(`Panel closes on outside click: ${panelClosedAfterOutsideClick}`);

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
