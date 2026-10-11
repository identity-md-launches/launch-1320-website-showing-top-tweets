import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { PNG } from 'pngjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = resolve(root, 'dist');
const evidence = resolve(root, 'docs/screenshots');
await mkdir(evidence, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/preview/')) throw new Error('Subpath required');
    const file = resolve(dist, pathname.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(dist + sep)) throw new Error('Outside export');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];
const checks = [];
const report = { url: '/preview/', browser: await browser.version(), checks, axe: [], contrast: [], heroContrast: [], errors, screenshots: [] };
function passed(name) { checks.push(name); console.log(`PASS ${name}`); }

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  async function capture(name, fullPage = false) {
    await page.screenshot({ path: resolve(evidence, name), type: 'jpeg', quality: 82, fullPage });
    report.screenshots.push(`docs/screenshots/${name}`);
  }
  async function audit(label) {
    await page.evaluate(axe.source);
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
    report.axe.push({ label, violations: result.violations, incomplete: result.incomplete.map(item => ({ id: item.id, nodes: item.nodes.length })) });
    assert.equal(result.violations.length, 0, `${label} axe violations: ${JSON.stringify(result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })))}`);
    passed(`axe: ${label}`);
  }
  async function noOverflow(label) {
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.width, `${label} overflow: ${JSON.stringify(dimensions)}`);
    passed(`no horizontal overflow: ${label}`);
  }
  async function measureHero(label) {
    // Isolate glyph pixels by comparing the rendered hero with the same text
    // transparent. Sample the real background at each changed pixel, including
    // the illustration and gradient; compare with the specified full text color.
    for (const [selector, threshold] of [['.hero-pill', 4.5], ['#hero-title', 3], ['#hero-title span', 3], ['.hero p', 4.5]]) {
      const foreground = await page.locator(selector).evaluate(element => getComputedStyle(element).color);
      const before = PNG.sync.read(await page.locator('.hero').screenshot());
      const style = await page.addStyleTag({ content: `${selector}, ${selector} * { color: transparent !important; text-shadow: none !important; }` });
      const background = PNG.sync.read(await page.locator('.hero').screenshot());
      await style.evaluate(element => element.remove());
      let minimum = Infinity;
      let sampled = 0;
      for (let i = 0; i < before.data.length; i += 4) {
        const changed = Math.abs(before.data[i] - background.data[i]) + Math.abs(before.data[i + 1] - background.data[i + 1]) + Math.abs(before.data[i + 2] - background.data[i + 2]);
        if (changed <= 12) continue;
        const bg = `rgb(${background.data[i]}, ${background.data[i + 1]}, ${background.data[i + 2]})`;
        const [low, high] = [luminance(foreground), luminance(bg)].sort((a, b) => a - b);
        minimum = Math.min(minimum, (high + 0.05) / (low + 0.05));
        sampled++;
      }
      report.heroContrast.push({ label, selector, foreground, threshold, sampledPixels: sampled, minimumRatio: Number(minimum.toFixed(2)) });
      assert.ok(sampled > 0 && minimum >= threshold, `${label} ${selector} measured contrast ${minimum} < ${threshold}`);
    }
    passed(`rendered hero text/background contrast: ${label}`);
  }

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.title(), 'The Pond — Top tweets about identity.md');
  assert.equal(await page.locator('article').count(), 5);
  assert.ok(await page.locator('h1').innerText().then(text => text.includes('Good signal.')));
  assert.ok(await page.evaluate(() => document.fonts.check('700 16px Manrope')));
  assert.equal(await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || img.naturalWidth === 0).length), 0);
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), './art/social-card.png');
  const social = await context.request.get(`${url}art/social-card.png`);
  assert.equal(social.status(), 200);
  passed('relative assets, metadata, font, and first five posts load at /preview/');
  await noOverflow('1440px');
  const contrastPairs = await page.evaluate(() => {
    const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
    return [
      ['Post title', color('.post-copy h3', 'color'), color('.post-card', 'backgroundColor'), 4.5],
      ['Secondary metadata', color('.metrics', 'color'), color('.post-card', 'backgroundColor'), 4.5],
      ['Editorial summary', color('.post-summary', 'color'), color('.post-card', 'backgroundColor'), 4.5],
      ['Primary action', color('.primary-button', 'color'), color('.primary-button', 'backgroundColor'), 4.5],
      ['Search boundary, inner edge', color('.search-box', 'borderTopColor'), color('.search-box', 'backgroundColor'), 3],
      ['Search boundary, outer edge', color('.search-box', 'borderTopColor'), color(':root', 'backgroundColor'), 3],
      ['Secondary text, raised panel', color('.collection-card > p', 'color'), color('.collection-card', 'backgroundColor'), 4.5],
    ];
  });
  function luminance(rgb) {
    const values = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  }
  for (const [label, foreground, background, threshold] of contrastPairs) {
    const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
    const ratio = (high + 0.05) / (low + 0.05);
    report.contrast.push({ label, foreground, background, ratio: Number(ratio.toFixed(2)), threshold });
    assert.ok(ratio >= threshold, `${label}: ${ratio} < ${threshold}`);
  }
  passed('seven computed foreground/background and control-boundary contrast pairs');
  await capture('desktop.jpg');
  if (process.argv.includes('--capture-only')) {
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('mobile.jpg');
  } else {
    await measureHero('1440px');
    await audit('desktop feed');
    await page.getByRole('button', { name: 'Show 3 more posts', exact: true }).click();
    assert.equal(await page.locator('article').count(), 8);
    assert.ok(await page.getByText('You’re all caught up with this collection.').isVisible());
    passed('load more reveals the remaining three posts and terminates');

    await page.getByRole('button', { name: 'Latest', exact: true }).click();
    const dates = await page.locator('article time').evaluateAll(elements => elements.map(e => Date.parse(e.getAttribute('datetime'))));
    assert.ok(dates.every((date, index) => index === 0 || dates[index - 1] >= date));
    await page.getByRole('button', { name: 'Discussion', exact: true }).click();
    const discussionIds = await page.locator('article').evaluateAll(elements => elements.map(e => e.id));
    assert.equal(discussionIds[2], 'post-2099914270888559088');
    passed('Latest and Discussion reorder the actual posts');

    await page.locator('.topic-filters').getByRole('button', { name: 'Protocol', exact: true }).click();
    assert.equal(await page.locator('article').count(), 2);
    await page.getByRole('searchbox', { name: 'Search posts' }).fill('Pool4');
    assert.equal(await page.locator('article').count(), 1);
    await page.getByRole('searchbox', { name: 'Search posts' }).fill('no-such-pond-post');
    assert.equal(await page.locator('article').count(), 0);
    assert.ok(await page.getByText('No ripples here yet.').isVisible());
    await audit('search empty state');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    assert.equal(await page.locator('article').count(), 5);
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    passed('combined topic/search filtering and empty-state recovery');

    await page.getByRole('button', { name: 'Top tweets', exact: true }).click();
    const saveName = 'Save A software factory, powered by agents';
    await page.getByRole('button', { name: saveName, exact: true }).click();
    await page.locator('.main-nav').getByRole('link', { name: /Bookmarks/ }).click();
    assert.equal(await page.locator('article').count(), 1);
    await page.reload();
    assert.equal(await page.locator('article').count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Unsave A software factory, powered by agents', exact: true }).getAttribute('aria-pressed'), 'true');
    await capture('bookmarks.jpg');
    await page.getByRole('button', { name: 'Unsave A software factory, powered by agents', exact: true }).click();
    assert.equal(await page.locator('article').count(), 0);
    assert.ok(await page.getByText('A good find deserves a bookmark.').isVisible());
    await page.getByRole('link', { name: 'Explore the feed', exact: true }).click();
    passed('bookmark add, route, reload persistence, removal, and empty recovery');

    await page.locator('.main-nav').getByRole('link', { name: 'Explore topics', exact: true }).click();
    assert.equal(await page.locator('.topic-card').count(), 4);
    await page.locator('.topic-card').filter({ has: page.getByRole('heading', { name: 'AI agents' }) }).click();
    assert.equal(await page.locator('article').count(), 3);
    assert.equal(await page.locator('.filter-chip.active').innerText(), 'AI agents');
    passed('topics navigation opens a filtered collection');

    await page.locator('.main-nav').getByRole('link', { name: /The feed/ }).click();
    await page.getByRole('button', { name: 'Copy link to A software factory, powered by agents', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'https://x.com/surfcoderepeat/status/2105853348188459389');
    passed('copy writes the original X URL to the clipboard');

    const aboutTrigger = page.getByRole('button', { name: 'About the feed', exact: true });
    await aboutTrigger.click();
    assert.ok(await page.getByRole('dialog').isVisible());
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close about collection');
    await audit('about dialog');
    await capture('about.jpg');
    // Native dialogs may let focus enter browser chrome at the Tab boundary.
    // They must never allow a background page control to receive focus.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest('dialog')));
    }
    await page.keyboard.press('Escape');
    assert.ok(!(await page.getByRole('dialog').isVisible()));
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'About the feed');
    passed('native modal focus, containment, Escape, and focus return');

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
    await page.getByRole('button', { name: 'Explore the feed', exact: true }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('name')), 'search');
    await page.keyboard.type('pegzeus');
    assert.equal(await page.locator('article').count(), 1);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    await capture('keyboard-focus.jpg');
    passed('keyboard skip, main action, search, and clear');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await noOverflow('390px');
    const actionBox = await page.getByRole('button', { name: 'Explore the feed', exact: true }).boundingBox();
    assert.ok(actionBox.y + actionBox.height < 844);
    assert.ok(await page.getByRole('heading', { level: 1 }).isVisible());
    passed(`390px first-screen product and primary action (button bottom ${Math.round(actionBox.y + actionBox.height)}px)`);
    await capture('mobile.jpg');
    await audit('390px feed');
    await measureHero('390px');
    await page.getByRole('button', { name: 'Explore the feed', exact: true }).click();
    await page.getByRole('searchbox').fill('pegzeus');
    assert.equal(await page.locator('article').count(), 1);
    await page.getByRole('button', { name: 'Save A company without a company', exact: true }).click();
    await page.locator('.main-nav').getByRole('link', { name: /Bookmarks/ }).click();
    assert.equal(await page.locator('article').count(), 1);
    passed('mobile primary interaction and bookmarks');

    for (const width of [320, 760, 900, 1100, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(url, { waitUntil: 'networkidle' });
      await noOverflow(`${width}px`);
      if (width === 320) { await capture('mobile-320.jpg'); await audit('320px feed'); await measureHero('320px'); }
      if (width === 900) await capture('tablet.jpg');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await noOverflow('390px at 200% text size');
    await capture('text-enlargement.jpg');
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transition = await page.locator('.primary-button').evaluate(element => getComputedStyle(element).transitionDuration);
    assert.equal(transition, '0s');
    passed('reduced-motion preference removes interaction transitions');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.getByRole('button', { name: 'Explore the feed', exact: true }).focus();
    await capture('forced-colors.jpg');
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });

    await page.evaluate(() => { localStorage.setItem('identity-pond:bookmarks:v1', '{bad json'); });
    await page.goto(`${url}#saved`, { waitUntil: 'networkidle' });
    await page.reload();
    assert.ok(await page.getByText('A good find deserves a bookmark.').isVisible());
    passed('corrupt bookmark storage recovers without crashing');

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Denied', 'SecurityError'); }; });
    await page.getByRole('button', { name: saveName, exact: true }).click();
    assert.ok(await page.getByText('Browser storage is unavailable.', { exact: false }).isVisible());
    await page.locator('.main-nav').getByRole('link', { name: /Bookmarks/ }).click();
    assert.equal(await page.locator('article').count(), 1);
    passed('blocked storage retains session bookmarks and explains the limit');

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } }); });
    await page.getByRole('button', { name: 'Copy link to A software factory, powered by agents', exact: true }).click();
    assert.equal(await page.getByLabel('Copy this original post link').inputValue(), 'https://x.com/surfcoderepeat/status/2105853348188459389');
    await page.getByRole('button', { name: 'Dismiss copy link', exact: true }).click();
    assert.equal(await page.locator('.copy-fallback').count(), 0);
    passed('clipboard denial exposes a selectable link and dismiss control');

    const externalLinks = await page.locator('a[target="_blank"]').evaluateAll(links => links.map(link => ({ href: link.href, rel: link.rel })));
    assert.ok(externalLinks.every(link => link.rel.includes('noopener') && link.rel.includes('noreferrer') && link.href.startsWith('https://')));
    assert.equal(errors.length, 0, JSON.stringify(errors));
    passed('external-link destinations and no console/resource failures');
  }
  await context.close();
} finally {
  await writeFile(resolve(root, 'docs/browser-results.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  await new Promise(done => server.close(done));
}
console.log(`${checks.length} browser checks passed.`);
