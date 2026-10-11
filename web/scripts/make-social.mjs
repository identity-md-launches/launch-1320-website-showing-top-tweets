import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const art = await readFile(new URL('../public/art/pepe-squad.svg', import.meta.url), 'utf8');
const font = (await readFile(new URL('../src/fonts/manrope-latin.woff2', import.meta.url))).toString('base64');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>
  @font-face{font-family:Manrope;src:url(data:font/woff2;base64,${font});font-weight:200 800}
  *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#142619;color:#eaf0df;font-family:Manrope,sans-serif;overflow:hidden}
  .frame{position:absolute;inset:24px;border:1px solid #496347;border-radius:24px;background:radial-gradient(ellipse at 82% 60%,#324823 0,transparent 65%)}
  .copy{position:absolute;left:76px;top:66px;z-index:1}.brand{font-weight:800;font-size:34px;letter-spacing:-2px}.brand span{color:#c5ef77}.label{font-size:17px;color:#b3c6a6;margin-top:44px}
  h1{font-size:76px;line-height:1.08;letter-spacing:-4px;margin:20px 0}h1 span{color:#c5ef77}p{font-size:20px;color:#b3c6a6;line-height:1.6;margin:26px 0}
  .art{position:absolute;right:-8px;bottom:32px;width:650px}.tag{position:absolute;bottom:62px;left:76px;font-size:16px;border:1px solid #496347;border-radius:9px;padding:12px 18px}
  </style></head><body><div class="frame"></div><div class="copy"><div class="brand">the pond<span>.</span></div><div class="label">An identity.md outpost</div><h1>Good signal.<br><span>Great frens.</span></h1><p>The top tweets, ideas, and builders<br>around identity.md. All in one pond.</p></div><div class="art">${art}</div><div class="tag">Pepes, armed with AI.</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const image = await page.screenshot({ type: 'png' });
  await writeFile(new URL('../public/art/social-card.png', import.meta.url), image);
  console.log(`Generated social-card.png: ${image.byteLength} bytes, 1200×630`);
} finally { await browser.close(); }
