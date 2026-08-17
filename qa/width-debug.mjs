import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.env.PREVIEW_URL || 'https://preview-growth-ui-v1.basketballlife.pages.dev/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  locale: 'zh-TW',
  timezoneId: 'Asia/Taipei',
});
const page = await context.newPage();

await page.goto(`${url}?qa_width_debug=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.BasketballLifeFunnel && !!document.querySelector('#weeklyChallenge .weeklyChallengeTiming'), null, { timeout: 30000 });
await page.locator('#playerNameInput').fill('QA寬度追蹤');
await page.locator('#startCareerBtn').click();
await page.waitForFunction(() => !document.getElementById('game')?.classList.contains('hidden') && document.getElementById('next')?.textContent.includes('開始高中生涯'), null, { timeout: 15000 });
await page.waitForTimeout(900);

const result = await page.evaluate(() => {
  function selector(el) {
    if (el === document.documentElement) return 'html';
    if (el === document.body) return 'body';
    const parts = [];
    let node = el;
    for (let depth = 0; node && node.nodeType === 1 && depth < 5; depth += 1) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part += `#${node.id}`;
        parts.unshift(part);
        break;
      }
      const classes = Array.from(node.classList || []).slice(0, 3);
      if (classes.length) part += `.${classes.join('.')}`;
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  }

  const viewport = document.documentElement.clientWidth;
  const all = [document.documentElement, document.body, ...document.querySelectorAll('body *')];
  const entries = all.map((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    const after = getComputedStyle(el, '::after');
    return {
      selector: selector(el),
      tag: el.tagName,
      id: el.id || '',
      className: typeof el.className === 'string' ? el.className : '',
      text: String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160),
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      offsetWidth: el.offsetWidth,
      offsetLeft: el.offsetLeft,
      rectLeft: Math.round(rect.left * 10) / 10,
      rectRight: Math.round(rect.right * 10) / 10,
      rectWidth: Math.round(rect.width * 10) / 10,
      display: style.display,
      visibility: style.visibility,
      position: style.position,
      overflowX: style.overflowX,
      width: style.width,
      minWidth: style.minWidth,
      maxWidth: style.maxWidth,
      marginLeft: style.marginLeft,
      marginRight: style.marginRight,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      transform: style.transform,
      whiteSpace: style.whiteSpace,
      contain: style.contain,
      beforeContent: before.content,
      beforePosition: before.position,
      afterContent: after.content,
      afterPosition: after.position,
    };
  });

  const suspicious = entries
    .filter((item) => item.scrollWidth > viewport + 1 || item.rectRight > viewport + 1 || item.rectLeft < -1 || item.scrollWidth > item.clientWidth + 1)
    .sort((a, b) => {
      const aScore = Math.max(a.scrollWidth, a.rectRight) - viewport;
      const bScore = Math.max(b.scrollWidth, b.rectRight) - viewport;
      return bScore - aScore;
    });

  return {
    viewport,
    documentElement: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offsetWidth: document.documentElement.offsetWidth,
    },
    body: {
      clientWidth: document.body.clientWidth,
      scrollWidth: document.body.scrollWidth,
      offsetWidth: document.body.offsetWidth,
      rect: document.body.getBoundingClientRect().toJSON(),
      computedWidth: getComputedStyle(document.body).width,
      overflowX: getComputedStyle(document.body).overflowX,
    },
    bodyChildren: Array.from(document.body.children).map((el) => entries[all.indexOf(el)]),
    suspicious,
  };
});

await fs.mkdir('qa-artifacts', { recursive: true });
await fs.writeFile('qa-artifacts/mobile-width-debug.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  documentElement: result.documentElement,
  body: result.body,
  top: result.suspicious.slice(0, 35),
}, null, 2));

await context.close();
await browser.close();
