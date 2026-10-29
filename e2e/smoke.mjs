// End-to-end tests against the production build (vite preview).
// Every flow runs on a desktop and a phone viewport; any page error fails the run.
// Balances are asserted after each purchase so token math can't silently drift.
import { chromium } from 'playwright';

const URL = process.env.URL ?? 'http://localhost:4173/';
const viewports = [
  { name: 'desktop', width: 1280, height: 860 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

let failed = false;
const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('fonts.g') && errors.push(`console: ${m.text()}`));
  const step = async (label, fn) => {
    try {
      await fn();
      console.log(`  ✓ ${label}`);
    } catch (e) {
      failed = true;
      const msg = e.message.split('\n')[0];
      console.log(`  ✗ ${label}: ${msg}`);
      console.log(`::error title=${vp.name}: ${label}::${msg}`);
    }
  };
  const balance = async () => (await page.locator('.balance-val').inputValue()).trim();
  const expectBalance = async (want) => {
    const got = await balance();
    if (got !== String(want)) throw new Error(`balance ${got}, expected ${want}`);
  };
  const setBalance = (n) => page.locator('.balance-val').fill(String(n));
  const choose = async (text) => {
    await page.locator('.seg button', { hasText: text }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
  };
  const reset = async () => {
    await page.locator('.reset').click();
    await page.evaluate(() => window.scrollTo(0, 0));
  };
  const sendAndWait = async (sel) => {
    await page.locator('.suggest').click();
    await page.locator(sel).waitFor({ timeout: 8000 });
  };
  const toggle = (name) => page.locator('.tgl', { hasText: name }).click();

  console.log(`[${vp.name}]`);
  await page.goto(URL);

  // ---------- Free user (Jennifer) ----------
  await step('free: chat renders with the upgrade banner', () => page.locator('.upsell').waitFor({ timeout: 5000 }));
  await step('free: character sends a blurred photo', () => sendAndWait('.media.locked.photo'));
  await step('free: Unlock → Premium paywall about photos & videos', async () => {
    await page.locator('.lk-btn').click();
    await page.locator('.paywall .pw-t2', { hasText: 'Photos & videos from Jennifer' }).waitFor({ timeout: 3000 });
  });
  await step('free: closing the paywall keeps the photo locked', async () => {
    await page.locator('.pw-x').click();
    if (!(await page.locator('.media.locked').count())) throw new Error('photo no longer locked');
  });
  await step('free: cancelling checkout charges nothing and keeps it locked', async () => {
    await page.locator('.lk-btn').click();
    await page.locator('.pw-btn').click();
    await page.locator('.cancel').click();
    await page.locator('.media.locked').waitFor({ timeout: 3000 });
  });
  await step('free: upgrade → photo generated after payment, balance 98 (100 − 2)', async () => {
    await page.locator('.lk-btn').click();
    await page.locator('.pw-btn').click();
    await page.locator('.item', { hasText: 'Premium' }).waitFor({ timeout: 3000 });
    await page.locator('.pay').click();
    await page.locator('.media.generating').waitFor({ timeout: 3000 });
    await page.locator('.media.photo:not(.locked)').waitFor({ timeout: 5000 });
    await expectBalance(98);
    if (await page.locator('.upsell').count()) throw new Error('upgrade banner still shown');
  });

  await choose('Current');
  await step('free, current flow: asking for a photo gets a deflection, no media', async () => {
    await page.locator('.suggest').click();
    await page.locator('.b.h', { hasText: 'my camera is acting up' }).waitFor({ timeout: 8000 });
    await page.waitForTimeout(800);
    if (await page.locator('.media').count()) throw new Error('media sent');
  });

  // ---------- Premium user (Megan) ----------
  await choose('Suggested');
  await choose('Premium user');
  await step('premium: starts with 7 tokens', () => expectBalance(7));
  await step('premium: automatic video arrives blurred (7 < 18)', () => sendAndWait('.media.locked.video'));
  await step('premium: Unlock → "Not Enough Tokens!" sheet with three packs', async () => {
    await page.locator('.lk-btn').click();
    await page.locator('.nets-t').waitFor({ timeout: 3000 });
    const rows = await page.locator('.nrow').count();
    if (rows !== 3) throw new Error(`${rows} packs shown`);
  });
  await step('premium: buy 350 → video generated after payment, balance 339 (7 + 350 − 18)', async () => {
    await page.locator('.buy-now').click();
    await page.locator('.pay').click();
    await page.locator('.media.video:not(.locked) .play').waitFor({ timeout: 5000 });
    await expectBalance(339);
  });

  await step('premium: topping up elsewhere, then Unlock reveals without a sheet (20 → 2)', async () => {
    await reset();
    await sendAndWait('.media.locked.video');
    await setBalance(20);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.lk-btn').click();
    await page.locator('.media.video:not(.locked) .play').waitFor({ timeout: 5000 });
    if (await page.locator('.nets').count()) throw new Error('sheet opened');
    await expectBalance(2);
  });

  await step('premium: with enough tokens the video arrives unlocked, as today (50 → 32)', async () => {
    await setBalance(50);
    await reset();
    await sendAndWait('.media.video:not(.locked) .play');
    await expectBalance(32);
  });

  await step('premium: photos only and 1 token → blurred photo', async () => {
    await setBalance(1);
    await toggle('Videos');
    await reset();
    await sendAndWait('.media.locked.photo');
  });

  await step('premium: nothing allowed → nothing sent', async () => {
    await toggle('Photos');
    await reset();
    await page.locator('.suggest').click();
    await page.locator('.b.h', { hasText: 'nothing much' }).waitFor({ timeout: 8000 });
    await page.waitForTimeout(600);
    if (await page.locator('.media').count()) throw new Error('media sent');
    await toggle('Photos');
    await toggle('Videos');
  });

  await step('premium, current flow: 7 tokens → deflection, no media', async () => {
    await setBalance(7);
    await choose('Current');
    await page.locator('.suggest').click();
    await page.locator('.b.h', { hasText: 'not an option here' }).waitFor({ timeout: 8000 });
    await page.waitForTimeout(600);
    if (await page.locator('.media').count()) throw new Error('media sent');
    await expectBalance(7);
  });

  if (errors.length) {
    failed = true;
    console.log('  page errors:\n' + errors.join('\n'));
    console.log(`::error title=${vp.name}: page errors::${errors.join(' | ').slice(0, 500)}`);
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
