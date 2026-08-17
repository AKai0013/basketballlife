import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const target = process.env.PREVIEW_URL || 'https://preview-growth-ui-v1.basketballlife.pages.dev/';
const outDir = path.resolve('qa-artifacts');
await fs.mkdir(outDir, { recursive: true });

const report = {
  target,
  startedAt: new Date().toISOString(),
  runs: [],
  overallErrors: [],
};

const browser = await chromium.launch({ headless: true });

function safeName(value) {
  return String(value).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function writeJson(name, value) {
  await fs.writeFile(path.join(outDir, `${safeName(name)}.json`), JSON.stringify(value, null, 2));
}

async function installQaGuards(context) {
  await context.addInitScript(() => {
    window.__BL_QA_BLOCKED_WRITES__ = [];
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function qaFetch(input, init = {}) {
      let url = '';
      let method = 'GET';
      try {
        const req = input instanceof Request ? input : null;
        url = req?.url || String(input || '');
        method = String(init.method || req?.method || 'GET').toUpperCase();
      } catch (_) {}
      let parsed = null;
      try { parsed = new URL(url, location.href); } catch (_) {}
      if (parsed && parsed.origin === location.origin && parsed.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const entry = { at: new Date().toISOString(), method, path: parsed.pathname };
        window.__BL_QA_BLOCKED_WRITES__.push(entry);
        return new Response(JSON.stringify({ ok: true, qaBlocked: true }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'x-bl-qa-blocked': '1' },
        });
      }
      return nativeFetch(input, init);
    };
  });
}

async function visibleControlSummary(page) {
  return page.evaluate(() => {
    const isVisible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    return Array.from(document.querySelectorAll('button,a,[role="button"],input,select,textarea'))
      .filter(isVisible)
      .slice(0, 240)
      .map((el) => ({
        tag: el.tagName,
        type: el.getAttribute('type') || '',
        id: el.id || '',
        name: el.getAttribute('name') || '',
        className: typeof el.className === 'string' ? el.className : '',
        text: String(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 180),
      }));
  });
}

async function pageDiagnostics(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const isVisible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const overflowOffenders = Array.from(document.querySelectorAll('body *'))
      .filter(isVisible)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          id: el.id || '',
          className: typeof el.className === 'string' ? el.className : '',
          text: String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        };
      })
      .filter((item) => item.left < -2 || item.right > viewportWidth + 2)
      .sort((a, b) => b.width - a.width)
      .slice(0, 80);

    const seedNodes = Array.from(document.querySelectorAll('body *'))
      .filter((el) => /本週\s*Seed|每週\s*Seed|世界種子|Seed\s*挑戰/i.test(String(el.textContent || '')))
      .filter((el) => !Array.from(el.children).some((child) => /本週\s*Seed|每週\s*Seed|世界種子|Seed\s*挑戰/i.test(String(child.textContent || ''))))
      .slice(0, 40)
      .map((el) => ({
        tag: el.tagName,
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        text: String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 500),
      }));

    const touchTargets = Array.from(document.querySelectorAll('body,#game,#game button,#game a,#game .btn,#game .choice'))
      .filter((el, index, arr) => arr.indexOf(el) === index)
      .slice(0, 80)
      .map((el) => ({
        tag: el.tagName,
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        touchAction: getComputedStyle(el).touchAction,
      }));

    let funnel = null;
    try {
      funnel = window.BasketballLifeFunnel?.snapshot?.() || JSON.parse(localStorage.getItem('bl_growth_funnel_v1') || 'null');
    } catch (_) {}

    const storage = {};
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && /funnel|growth|career|seed/i.test(key)) storage[key] = String(localStorage.getItem(key) || '').slice(0, 4000);
      }
    } catch (_) {}

    return {
      title: document.title,
      url: location.href,
      bodyClasses: document.body.className,
      htmlClientWidth: document.documentElement.clientWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 2,
      overflowOffenders,
      seedNodes,
      touchTargets,
      funnel,
      selectedStorage: storage,
      blockedWrites: window.__BL_QA_BLOCKED_WRITES__ || [],
      bodyText: String(document.body.innerText || '').slice(0, 30000),
    };
  });
}

async function snapshot(page, run, label, fullPage = true) {
  await page.waitForTimeout(350);
  const base = `${run.name}-${label}`;
  await page.screenshot({ path: path.join(outDir, `${safeName(base)}.png`), fullPage });
  await fs.writeFile(path.join(outDir, `${safeName(base)}.html`), await page.content());
  const diagnostics = await pageDiagnostics(page);
  const controls = await visibleControlSummary(page);
  await writeJson(`${base}-diagnostics`, diagnostics);
  await writeJson(`${base}-controls`, controls);
  run.snapshots.push({ label, diagnostics, controls });
  return diagnostics;
}

async function fillLikelyPlayerFields(page) {
  const inputs = page.locator('input:visible, textarea:visible');
  const count = await inputs.count();
  for (let i = 0; i < count; i += 1) {
    const input = inputs.nth(i);
    const type = String(await input.getAttribute('type') || 'text').toLowerCase();
    if (!['text', 'search', ''].includes(type)) continue;
    const hint = `${await input.getAttribute('name') || ''} ${await input.getAttribute('id') || ''} ${await input.getAttribute('placeholder') || ''}`;
    if (/search|搜尋|查詢|seed/i.test(hint)) continue;
    try {
      await input.fill('QA測試球員');
      return true;
    } catch (_) {}
  }
  return false;
}

async function clickFirstText(page, patterns, options = {}) {
  const controls = page.locator('button:visible,a:visible,[role="button"]:visible');
  const count = await controls.count();
  for (const pattern of patterns) {
    for (let i = 0; i < count; i += 1) {
      const control = controls.nth(i);
      let text = '';
      try { text = String(await control.innerText()).trim().replace(/\s+/g, ' '); } catch (_) { continue; }
      if (!pattern.test(text)) continue;
      if (options.exclude && options.exclude.test(text)) continue;
      try {
        await control.scrollIntoViewIfNeeded();
        await control.click({ timeout: 2500 });
        return { clicked: true, text, pattern: String(pattern) };
      } catch (_) {}
    }
  }
  return { clicked: false };
}

async function chooseVisibleEventOption(page) {
  const selectorGroups = [
    '.eventOptions button:visible,.eventChoices button:visible,.choiceList button:visible,.choices button:visible',
    '.modal button:visible,.dialog button:visible,[class*="event"] button:visible,[class*="choice"] button:visible',
  ];
  for (const selector of selectorGroups) {
    const options = page.locator(selector);
    const count = await options.count();
    for (let i = 0; i < count; i += 1) {
      const option = options.nth(i);
      let text = '';
      try { text = String(await option.innerText()).trim().replace(/\s+/g, ' '); } catch (_) { continue; }
      if (!text || /關閉|取消|返回|上一頁|排行榜|公開生涯|刪除|重開|重新開始/i.test(text)) continue;
      try {
        await option.scrollIntoViewIfNeeded();
        await option.click({ timeout: 2200 });
        return { clicked: true, text };
      } catch (_) {}
    }
  }
  return { clicked: false };
}

async function stateFlags(page) {
  return page.evaluate(() => {
    const text = String(document.body.innerText || '');
    const visibleMajor = Array.from(document.querySelectorAll('h1,h2,h3,.modal,.dialog,[class*="event"],[class*="major"]'))
      .some((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && /重大事件|命運抉擇|關鍵抉擇|場外風暴|重大傷病/.test(String(el.textContent || ''));
      });
    return {
      retirement: document.body.classList.contains('retirementMode') || (!!document.querySelector('.legacyDashboard') && /生涯總評|退休專題|引退之夜/.test(text)),
      majorEvent: visibleMajor,
      hasGame: !!document.querySelector('#game'),
      text: text.slice(0, 1200),
    };
  });
}

async function runFlow(page, run) {
  await fillLikelyPlayerFields(page);
  let action = await clickFirstText(page, [
    /建立球員/i,
    /創建球員/i,
    /開始新生涯/i,
    /開啟新生涯/i,
    /開始遊戲/i,
  ]);
  if (action.clicked) {
    run.actions.push({ step: 'open-create', ...action });
    await page.waitForTimeout(500);
    await fillLikelyPlayerFields(page);
    await clickFirstText(page, [/台北市|臺北市/]);
    await snapshot(page, run, 'player-create');
  }

  action = await clickFirstText(page, [
    /開始生涯/i,
    /踏上球場/i,
    /確認建立/i,
    /確認開始/i,
    /開啟生涯/i,
    /^開始$/i,
  ], { exclude: /排行榜|Seed/i });
  if (action.clicked) {
    run.actions.push({ step: 'career-start', ...action });
    await page.waitForTimeout(700);
    await snapshot(page, run, 'career-start');
  }

  let majorCaptured = false;
  let retirementCaptured = false;
  let stalled = 0;
  let previousSignature = '';

  for (let turn = 0; turn < 220; turn += 1) {
    const flags = await stateFlags(page);
    if (flags.majorEvent && !majorCaptured) {
      await snapshot(page, run, 'major-event');
      majorCaptured = true;
    }
    if (flags.retirement) {
      if (!retirementCaptured) await snapshot(page, run, 'retirement');
      retirementCaptured = true;
      break;
    }

    let clicked = await chooseVisibleEventOption(page);
    if (!clicked.clicked) {
      clicked = await clickFirstText(page, [
        /^繼續/i,
        /下一步/i,
        /進入下一/i,
        /模擬.*賽季/i,
        /開始.*賽季/i,
        /進行.*賽季/i,
        /完成.*賽季/i,
        /進入.*生涯/i,
        /確認/i,
        /確定/i,
        /接受/i,
        /簽約/i,
        /加入/i,
        /選擇/i,
        /訓練/i,
        /出賽/i,
        /退休/i,
      ], { exclude: /排行榜|公開生涯|分享|下載|刪除|重開|重新開始|回首頁|返回首頁|說明|關於/i });
    }

    if (!clicked.clicked) {
      stalled += 1;
      if (stalled >= 3) {
        run.stalledAt = { turn, flags, controls: await visibleControlSummary(page) };
        await snapshot(page, run, `stalled-${turn}`);
        break;
      }
      await page.waitForTimeout(500);
      continue;
    }

    run.actions.push({ step: 'advance', turn, text: clicked.text });
    await page.waitForTimeout(260);
    const signature = await page.evaluate(() => `${document.body.className}|${String(document.body.innerText || '').slice(0, 600)}`);
    if (signature === previousSignature) stalled += 1;
    else stalled = 0;
    previousSignature = signature;
  }

  const finalFlags = await stateFlags(page);
  run.majorEventReached = majorCaptured || finalFlags.majorEvent;
  run.retirementReached = retirementCaptured || finalFlags.retirement;

  if (run.retirementReached) {
    const downloadPromise = page.waitForEvent('download', { timeout: 3500 }).catch(() => null);
    const share = await clickFirstText(page, [
      /分享.*生涯/i,
      /產生.*退休/i,
      /退休.*圖片/i,
      /下載.*退休/i,
      /分享/i,
    ]);
    if (share.clicked) {
      run.actions.push({ step: 'share', ...share });
      const download = await downloadPromise;
      if (download) {
        const suggested = download.suggestedFilename();
        await download.saveAs(path.join(outDir, `share-${safeName(suggested || 'retirement')}`));
        run.shareDownload = suggested || true;
      }
      await page.waitForTimeout(900);
      await snapshot(page, run, 'share');
      run.shareReached = true;
    } else {
      run.shareReached = false;
    }
  }
}

async function executeRun(config) {
  const run = {
    name: config.name,
    viewport: config.viewport,
    actions: [],
    snapshots: [],
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    responseErrors: [],
  };
  report.runs.push(run);

  const context = await browser.newContext({
    viewport: config.viewport,
    screen: config.viewport,
    isMobile: config.mobile,
    hasTouch: config.mobile,
    deviceScaleFactor: 1,
    acceptDownloads: true,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
  });
  await installQaGuards(context);
  const page = await context.newPage();

  page.on('console', (message) => {
    if (message.type() === 'error') run.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => run.pageErrors.push(String(error?.stack || error)));
  page.on('requestfailed', (request) => run.requestFailures.push({ url: request.url(), failure: request.failure()?.errorText || '' }));
  page.on('response', (response) => {
    if (response.status() >= 400) run.responseErrors.push({ status: response.status(), url: response.url() });
  });

  try {
    const url = new URL(target);
    url.searchParams.set('qa_growth', config.name);
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1800);
    await snapshot(page, run, 'home');
    if (config.fullFlow) await runFlow(page, run);
    run.final = await pageDiagnostics(page);
  } catch (error) {
    run.error = String(error?.stack || error);
    report.overallErrors.push(`${config.name}: ${run.error}`);
    try { await snapshot(page, run, 'fatal'); } catch (_) {}
  } finally {
    await context.close();
  }
}

await executeRun({ name: 'desktop-1440', viewport: { width: 1440, height: 1000 }, mobile: false, fullFlow: false });
await executeRun({ name: 'mobile-390', viewport: { width: 390, height: 844 }, mobile: true, fullFlow: true });
await executeRun({ name: 'mobile-430', viewport: { width: 430, height: 932 }, mobile: true, fullFlow: false });

report.finishedAt = new Date().toISOString();
await writeJson('qa-report', report);
await browser.close();

const failed = report.overallErrors.length > 0 || report.runs.some((run) => run.pageErrors.length || run.snapshots.some((snap) => snap.diagnostics.horizontalOverflow));
console.log(JSON.stringify({
  target,
  failed,
  runs: report.runs.map((run) => ({
    name: run.name,
    majorEventReached: run.majorEventReached,
    retirementReached: run.retirementReached,
    shareReached: run.shareReached,
    consoleErrors: run.consoleErrors.length,
    pageErrors: run.pageErrors.length,
    horizontalOverflow: run.snapshots.some((snap) => snap.diagnostics.horizontalOverflow),
  })),
}, null, 2));

if (failed) process.exitCode = 1;
