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

const safeName = (value) => String(value).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const writeJson = async (name, value) => fs.writeFile(path.join(outDir, `${safeName(name)}.json`), JSON.stringify(value, null, 2));

async function installQaGuards(context) {
  await context.addInitScript(() => {
    window.__BL_QA_BLOCKED_WRITES__ = [];
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function qaFetch(input, init = {}) {
      let url = '';
      let method = 'GET';
      try {
        const request = input instanceof Request ? input : null;
        url = request?.url || String(input || '');
        method = String(init.method || request?.method || 'GET').toUpperCase();
      } catch (_) {}
      let parsed = null;
      try { parsed = new URL(url, location.href); } catch (_) {}
      if (parsed && parsed.origin === location.origin && parsed.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const entry = { at: new Date().toISOString(), method, path: parsed.pathname };
        window.__BL_QA_BLOCKED_WRITES__.push(entry);
        return new Response(JSON.stringify({ error: 'QA blocked API write' }), {
          status: 503,
          headers: { 'content-type': 'application/json', 'x-bl-qa-blocked': '1' },
        });
      }
      return nativeFetch(input, init);
    };
  });
}

async function visibleControls(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    return Array.from(document.querySelectorAll('button,a,[role="button"],input,select,textarea'))
      .filter(visible)
      .slice(0, 260)
      .map((el) => ({
        tag: el.tagName,
        type: el.getAttribute('type') || '',
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        text: String(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 180),
      }));
  });
}

async function diagnostics(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const hasHorizontalOverflowGuard = (el) => {
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (['hidden', 'clip', 'auto', 'scroll'].includes(overflowX)) return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const overflowOffenders = Array.from(document.querySelectorAll('body *'))
      .filter(visible)
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
          parentOverflowX: el.parentElement ? getComputedStyle(el.parentElement).overflowX : '',
          contained: hasHorizontalOverflowGuard(el),
        };
      })
      .filter((item) => item.left < -2 || item.right > viewportWidth + 2)
      .sort((a, b) => b.width - a.width)
      .slice(0, 80);
    const uncontainedOverflowOffenders = overflowOffenders.filter((item) => !item.contained);

    let funnel = null;
    try { funnel = window.BasketballLifeFunnel?.snapshot?.() || JSON.parse(localStorage.getItem('bl_growth_funnel_v1') || 'null'); } catch (_) {}

    const weeklyButton = document.getElementById('weeklyChallenge');
    const weeklyTiming = weeklyButton?.querySelector('.weeklyChallengeTiming');
    const fanEcho = document.querySelector('.fanEchoSection') || document.querySelector('.fanEchoIntro')?.closest('.legacySection');
    const seedBox = document.querySelector('.legacySeed');
    const currentSeed = (() => { try { return window.eval('p?.seed || ""'); } catch (_) { return ''; } })();
    const relation = fanEcho && seedBox ? fanEcho.compareDocumentPosition(seedBox) : 0;

    return {
      title: document.title,
      url: location.href,
      bodyClasses: document.body.className,
      viewportWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 1 || uncontainedOverflowOffenders.length > 0,
      overflowOffenders,
      uncontainedOverflowOffenders,
      touchAction: {
        html: getComputedStyle(document.documentElement).touchAction,
        body: getComputedStyle(document.body).touchAction,
        game: document.getElementById('game') ? getComputedStyle(document.getElementById('game')).touchAction : '',
        next: document.getElementById('next') ? getComputedStyle(document.getElementById('next')).touchAction : '',
      },
      weekly: {
        text: String(weeklyButton?.innerText || '').trim().replace(/\s+/g, ' '),
        timing: String(weeklyTiming?.textContent || '').trim(),
        start: weeklyButton?.dataset.weeklyStart || '',
        end: weeklyButton?.dataset.weeklyEnd || '',
        title: weeklyButton?.title || '',
        ariaLabel: weeklyButton?.getAttribute('aria-label') || '',
      },
      funnel,
      blockedWrites: window.__BL_QA_BLOCKED_WRITES__ || [],
      retirement: {
        active: document.body.classList.contains('retirementMode'),
        fanEchoExists: !!fanEcho,
        fanEchoVisible: fanEcho ? visible(fanEcho) : false,
        seedExists: !!seedBox,
        seedText: String(seedBox?.innerText || '').trim().replace(/\s+/g, ' '),
        currentSeed,
        seedVisibleRaw: !!currentSeed && String(seedBox?.textContent || '').includes(currentSeed),
        seedMasked: /•/.test(String(seedBox?.textContent || '')),
        fanEchoBeforeSeed: !!(relation & Node.DOCUMENT_POSITION_FOLLOWING),
        fanEchoImmediatelyBeforeSeed: !!(fanEcho && seedBox && fanEcho.nextElementSibling === (seedBox.closest('.legacySection') || seedBox)),
      },
      share: {
        previewExists: !!document.querySelector('.careerImagePreview img'),
        status: String(document.getElementById('publicCareerStatus')?.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 500),
      },
      bodyText: String(document.body.innerText || '').slice(0, 30000),
    };
  });
}

async function snapshot(page, run, label, fullPage = true) {
  await page.waitForTimeout(350);
  const base = `${run.name}-${label}`;
  await page.screenshot({ path: path.join(outDir, `${safeName(base)}.png`), fullPage });
  await fs.writeFile(path.join(outDir, `${safeName(base)}.html`), await page.content());
  const data = await diagnostics(page);
  const controls = await visibleControls(page);
  await writeJson(`${base}-diagnostics`, data);
  await writeJson(`${base}-controls`, controls);
  run.snapshots.push({ label, diagnostics: data, controls });
  return data;
}

async function waitForPreviewPatch(page) {
  await page.waitForFunction(() => !!window.BasketballLifeFunnel && !!document.querySelector('#weeklyChallenge .weeklyChallengeTiming'), null, { timeout: 30000 });
}

async function preparePlayer(page) {
  await page.locator('#playerNameInput').fill('QA人氣驗證球員');
  const sg = page.locator('#posgrid button').filter({ hasText: 'SG' }).first();
  if (await sg.count()) await sg.click();
  const city = page.locator('.birthplaceChip').filter({ hasText: /臺北市|台北市/ }).first();
  if (await city.count()) await city.click();
}

async function startCareer(page, run) {
  await preparePlayer(page);
  await snapshot(page, run, 'player-create');
  await page.locator('#startCareerBtn').click();
  await page.waitForFunction(() => !document.getElementById('game')?.classList.contains('hidden') && document.getElementById('next')?.textContent.includes('開始高中生涯'), null, { timeout: 15000 });
  await snapshot(page, run, 'career-start');
}

async function verifyDoubleTapNoZoom(page, run) {
  const button = page.locator('#quickRestartBtn');
  await button.waitFor({ state: 'visible' });
  const box = await button.boundingBox();
  if (!box) throw new Error('quickRestartBtn has no bounding box');
  const before = await page.evaluate(() => ({ scale: visualViewport?.scale || 1, width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(80);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(450);
  const after = await page.evaluate(() => ({ scale: visualViewport?.scale || 1, width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  run.doubleTap = { before, after, passed: Math.abs(after.scale - 1) < 0.01 && after.width === before.width };
  await page.evaluate(() => document.getElementById('quickRestartMenu')?.classList.add('hidden'));
}

async function enterTraining(page) {
  await page.locator('#next').click();
  await page.waitForFunction(() => {
    try { return window.eval('p?.stage') === 'training'; } catch (_) { return false; }
  }, null, { timeout: 15000 });
}

async function forceMajorEvent(page) {
  await page.evaluate(() => {
    const player = window.eval('p');
    const def = window.eval('offCourtEventDefinition("socialMediaStorm")');
    player.specialQueue = [{ kind: 'socialMediaStorm', title: def.title, desc: def.desc, offCourt: true }];
    player.specialIndex = 0;
    window.eval('showSpecialEvent()');
  });
  await page.waitForSelector('#currentPanel.eventRare.eventOffCourt .choice', { state: 'visible', timeout: 15000 });
}

async function resolveMajorEvent(page) {
  await page.locator('#currentPanel.eventRare.eventOffCourt .choice').first().click();
  await page.waitForFunction(() => !document.querySelector('#choices .choice') && !document.querySelector('#special .choice'), null, { timeout: 15000 }).catch(() => {});
}

async function forceRetirement(page) {
  await page.evaluate(() => {
    const player = window.eval('p');
    const teams = ['能人家商', '政大雄鷹', '新北國王', '臺北戰神', '新北國王'];
    const paths = ['HBL', 'UBA 強權', '台灣職業', '台灣職業', '台灣職業'];
    const starts = [2026, 2029, 2033, 2037, 2041];
    const seasons = [];
    for (let i = 0; i < 19; i += 1) {
      const year = 2026 + i;
      const block = year < starts[1] ? 0 : year < starts[2] ? 1 : year < starts[3] ? 2 : year < starts[4] ? 3 : 4;
      const professional = block >= 2;
      const games = professional ? 58 + (i % 5) * 4 : block === 1 ? 24 : 18;
      seasons.push({
        year,
        age: 16 + i,
        team: teams[block],
        path: paths[block],
        scheduledGames: games + (i % 4 === 0 ? 3 : 0),
        games,
        missedGames: i % 4 === 0 ? 3 : 0,
        mins: professional ? 24 + (i % 7) : 20 + (i % 5),
        pts: Number((professional ? 11.5 + i * 0.55 : 9 + i * 0.4).toFixed(1)),
        reb: Number((3.4 + (i % 5) * 0.4).toFixed(1)),
        ast: Number((4.1 + (i % 4) * 0.5).toFixed(1)),
        stl: Number((1.0 + (i % 3) * 0.2).toFixed(1)),
        blk: Number((0.2 + (i % 2) * 0.1).toFixed(1)),
        fg: Number((44 + (i % 6) * 0.8).toFixed(1)),
        three: Number((33 + (i % 5) * 1.1).toFixed(1)),
      });
    }
    const proSeasons = seasons.filter((season) => !['HBL', 'UBA', 'UBA 強權', 'NCAA D1', 'NCAA D2', '日本大學'].includes(season.path));
    player.age = 34;
    player.year = 2044;
    player.path = '台灣職業';
    player.team = '新北國王';
    player.seasonHistory = seasons;
    player.careerGames = proSeasons.reduce((sum, season) => sum + season.games, 0);
    player.careerPtsTotal = Math.round(proSeasons.reduce((sum, season) => sum + season.games * season.pts, 0));
    player.careerRebTotal = Math.round(proSeasons.reduce((sum, season) => sum + season.games * season.reb, 0));
    player.careerAstTotal = Math.round(proSeasons.reduce((sum, season) => sum + season.games * season.ast, 0));
    player.careerBasketballSalary = 18600;
    player.careerSalary = 22400;
    player.careerRating = 28750;
    player.peakOverall = 88;
    player.peakAge = 28;
    player.rep = 48;
    player.championships = 2;
    player.nationalCaps = 12;
    player.careerAwards = [
      { year: 2036, name: '年度第一隊', league: '台灣職業' },
      { year: 2038, name: '年度MVP', league: '台灣職業' },
      { year: 2040, name: '總冠軍賽MVP', league: '台灣職業' },
    ];
    player.championshipHistory = [
      { year: 2038, league: '台灣職業', team: '新北國王' },
      { year: 2040, league: '台灣職業', team: '臺北戰神' },
    ];
    player.internationalHistory = [
      { year: 2034, level: 'SENIOR', event: 'FIBA 亞洲盃', finish: '八強', team: '成人國家隊' },
      { year: 2038, level: 'SENIOR', event: 'FIBA 世界盃亞洲區資格賽', finish: '晉級會內賽', team: '成人國家隊' },
    ];
    player.storyBeats = [
      { year: 2029, team: '政大雄鷹', text: '從高中走進大學強權，第一次站上更大的舞台', importance: 3 },
      { year: 2033, team: '新北國王', text: '正式踏入職業聯盟並站穩輪替', importance: 4 },
      { year: 2038, team: '新北國王', text: '拿下年度 MVP，完成生涯代表球季', importance: 5 },
      { year: 2040, team: '臺北戰神', text: '在冠軍賽最後一戰完成關鍵逆轉', importance: 5 },
    ];
    if (window.BasketballLifeOnline) {
      window.BasketballLifeOnline.scheduleRetirementAutoPublish = () => {};
      window.BasketballLifeOnline.retryCareerUpload = () => {};
    }
    window.eval('retireCareer("完成完整人氣版瀏覽器驗證後正式引退")');
  });
  await page.waitForFunction(() => document.body.classList.contains('retirementMode') && !!document.querySelector('.legacyMain .legacySeed'), null, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector('.fanEchoSection') || !!document.querySelector('.fanEchoIntro'), null, { timeout: 15000 });
}

async function generateShare(page, run) {
  const button = page.locator('button').filter({ hasText: '生成生涯紀念圖' }).first();
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await page.waitForFunction(() => !!document.querySelector('.careerImagePreview img') || /圖片產生失敗/.test(document.getElementById('publicCareerStatus')?.innerText || ''), null, { timeout: 60000 });
  const failed = await page.locator('#publicCareerStatus').getByText(/圖片產生失敗/).count();
  if (failed) throw new Error(`share image generation failed: ${await page.locator('#publicCareerStatus').innerText()}`);
  const downloadButton = page.locator('.careerImagePreviewActions button').filter({ hasText: '下載 PNG' }).first();
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await downloadButton.click();
  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  await download.saveAs(path.join(outDir, `${run.name}-${safeName(suggested || 'career.png')}`));
  run.shareDownload = suggested;
}

function validateWeekly(data) {
  const timing = data.weekly.timing || '';
  const start = Date.parse(data.weekly.start || '');
  const end = Date.parse(data.weekly.end || '');
  return Boolean(
    /週榜/.test(timing)
    && /每週一\s*08:00/.test(timing)
    && /結算換週/.test(timing)
    && Number.isFinite(start)
    && Number.isFinite(end)
    && end - start === 7 * 86400000
  );
}

function validateFunnel(data) {
  const funnel = data.funnel;
  const totals = funnel?.totals || {};
  const current = Array.isArray(funnel?.sessions) ? funnel.sessions[funnel.sessions.length - 1] : null;
  return Boolean(
    funnel?.storage === 'browser-local-only'
    && ['home_view', 'player_create', 'career_start', 'major_event', 'retirement', 'share'].every((stage) => Number(totals[stage] || 0) >= 1 && current?.milestones?.[stage])
  );
}

async function runScenario(config) {
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
    await waitForPreviewPatch(page);
    await page.waitForTimeout(1400);
    const home = await snapshot(page, run, 'home');
    run.weeklyPassed = validateWeekly(home);

    if (config.fullFlow) {
      await startCareer(page, run);
      await verifyDoubleTapNoZoom(page, run);
      await enterTraining(page);
      await forceMajorEvent(page);
      await page.waitForFunction(() => !!window.BasketballLifeFunnel?.snapshot?.().sessions?.at(-1)?.milestones?.major_event, null, { timeout: 10000 });
      await snapshot(page, run, 'major-event');
      await resolveMajorEvent(page);
      await forceRetirement(page);
      await page.waitForFunction(() => !!window.BasketballLifeFunnel?.snapshot?.().sessions?.at(-1)?.milestones?.retirement, null, { timeout: 10000 });
      const retirement = await snapshot(page, run, 'retirement');
      run.retirementPassed = retirement.retirement.active
        && retirement.retirement.fanEchoExists
        && retirement.retirement.fanEchoVisible
        && retirement.retirement.seedExists
        && retirement.retirement.seedVisibleRaw
        && !retirement.retirement.seedMasked
        && retirement.retirement.fanEchoBeforeSeed;
      await generateShare(page, run);
      await page.waitForFunction(() => !!window.BasketballLifeFunnel?.snapshot?.().sessions?.at(-1)?.milestones?.share, null, { timeout: 10000 });
      const share = await snapshot(page, run, 'share');
      run.sharePassed = share.share.previewExists;
      run.funnelPassed = validateFunnel(share);
      run.noApiWrites = (share.blockedWrites || []).length === 0;
    }

    run.final = await diagnostics(page);
    run.overflowPassed = !run.snapshots.some((item) => item.diagnostics.horizontalOverflow);
    run.touchActionPassed = !config.mobile || ['manipulation', 'pan-x pan-y pinch-zoom'].includes(run.final.touchAction.body) || run.final.touchAction.body.includes('manipulation');
  } catch (error) {
    run.error = String(error?.stack || error);
    report.overallErrors.push(`${config.name}: ${run.error}`);
    try { await snapshot(page, run, 'fatal'); } catch (_) {}
  } finally {
    await context.close();
  }
}

await runScenario({ name: 'desktop-1440', viewport: { width: 1440, height: 1000 }, mobile: false, fullFlow: false });
await runScenario({ name: 'mobile-390', viewport: { width: 390, height: 844 }, mobile: true, fullFlow: true });
await runScenario({ name: 'mobile-430', viewport: { width: 430, height: 932 }, mobile: true, fullFlow: true });

report.finishedAt = new Date().toISOString();
await writeJson('qa-report', report);
await browser.close();

const failed = report.overallErrors.length > 0 || report.runs.some((run) => {
  if (run.error || run.pageErrors.length || !run.weeklyPassed || !run.overflowPassed) return true;
  if (!run.name.startsWith('mobile')) return false;
  return !run.doubleTap?.passed || !run.retirementPassed || !run.sharePassed || !run.funnelPassed || !run.noApiWrites || !run.touchActionPassed;
});

console.log(JSON.stringify({
  target,
  failed,
  runs: report.runs.map((run) => ({
    name: run.name,
    weeklyPassed: run.weeklyPassed,
    overflowPassed: run.overflowPassed,
    doubleTapPassed: run.doubleTap?.passed,
    retirementPassed: run.retirementPassed,
    sharePassed: run.sharePassed,
    funnelPassed: run.funnelPassed,
    noApiWrites: run.noApiWrites,
    touchActionPassed: run.touchActionPassed,
    consoleErrors: run.consoleErrors.length,
    pageErrors: run.pageErrors.length,
    error: run.error || null,
  })),
}, null, 2));

if (failed) process.exitCode = 1;