(() => {
  "use strict";

  const FUNNEL_KEY = "bl_growth_funnel_v1";
  const SESSION_KEY = "bl_growth_funnel_session_v1";
  const STAGES = ["home_view", "player_create", "career_start", "major_event", "retirement", "share"];
  const TRAINING_PRIORITY = {
    PG: ["pass", "handle", "iq", "shoot", "defense", "ath", "finish", "rebound"],
    SG: ["shoot", "finish", "handle", "ath", "iq", "defense", "pass", "rebound"],
    SF: ["finish", "defense", "shoot", "ath", "rebound", "iq", "handle", "pass"],
    PF: ["rebound", "defense", "finish", "ath", "iq", "shoot", "pass", "handle"],
    C: ["rebound", "defense", "finish", "ath", "iq", "pass", "shoot", "handle"],
  };
  let syncFrame = 0;
  let liveWrapFrame = 0;
  let boundaryTimer = 0;

  const nowIso = () => new Date().toISOString();

  function sessionId() {
    try {
      let value = sessionStorage.getItem(SESSION_KEY) || "";
      if (!value) {
        value = typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(SESSION_KEY, value);
      }
      return value;
    } catch (_) {
      return `session-${Date.now()}`;
    }
  }

  function viewportBucket() {
    const width = Math.max(0, Math.round(innerWidth || document.documentElement.clientWidth || 0));
    if (width <= 390) return "mobile-390";
    if (width <= 430) return "mobile-430";
    if (width <= 760) return "mobile-wide";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  function emptyFunnel() {
    const at = nowIso();
    return {
      version: 1,
      storage: "browser-local-only",
      firstSeenAt: at,
      updatedAt: at,
      totals: Object.fromEntries(STAGES.map((stage) => [stage, 0])),
      sessions: [],
    };
  }

  function readFunnel() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(FUNNEL_KEY) || "null"); } catch (_) {}
    if (!data || data.version !== 1 || !Array.isArray(data.sessions)) data = emptyFunnel();
    if (!data.totals || typeof data.totals !== "object") data.totals = {};
    for (const stage of STAGES) {
      const value = Number(data.totals[stage]);
      data.totals[stage] = Number.isFinite(value) ? value : 0;
    }
    data.storage = "browser-local-only";
    return data;
  }

  function saveFunnel(data) {
    data.updatedAt = nowIso();
    data.sessions = (data.sessions || []).slice(-20);
    try { localStorage.setItem(FUNNEL_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function record(stage) {
    if (!STAGES.includes(stage)) return false;
    const data = readFunnel();
    const id = sessionId();
    let session = data.sessions.find((item) => item?.id === id);
    if (!session) {
      session = {
        id,
        startedAt: nowIso(),
        updatedAt: nowIso(),
        viewport: viewportBucket(),
        milestones: {},
      };
      data.sessions.push(session);
    }
    if (!session.milestones || typeof session.milestones !== "object") session.milestones = {};
    if (session.milestones[stage]) return false;
    const at = nowIso();
    session.milestones[stage] = at;
    session.updatedAt = at;
    data.totals[stage] += 1;
    saveFunnel(data);
    try {
      dispatchEvent(new CustomEvent("basketballlife:funnel", { detail: { stage, at } }));
    } catch (_) {}
    return true;
  }

  window.BasketballLifeFunnel = {
    key: FUNNEL_KEY,
    localOnly: true,
    stages: STAGES.slice(),
    record,
    snapshot: readFunnel,
    reset() {
      try { localStorage.removeItem(FUNNEL_KEY); } catch (_) {}
      return readFunnel();
    },
  };

  function visible(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function currentPlayer() {
    try { return typeof p !== "undefined" && p ? p : null; } catch (_) { return null; }
  }

  function installQuickStartLayout() {
    const setup = document.getElementById("setup");
    const builder = setup?.querySelector(":scope > .setupBuilder");
    const start = document.getElementById("startCareerBtn");
    if (!setup || !builder || !start || document.getElementById("blAdvancedSetup")) return;

    const identity = setup.querySelector(":scope > .setupIdentity");
    const heroTitle = identity?.querySelector("h1");
    const heroCopy = identity?.querySelector("p");
    const heroKicker = identity?.querySelector(".setupKicker");
    const heroPromise = identity?.querySelector(".setupPromise");
    if (heroKicker) heroKicker.textContent = "BASKETBALLLIFE · CAREER SIMULATOR";
    if (heroTitle) heroTitle.textContent = "從 HBL 開始，打完你的一生。";
    if (heroCopy) heroCopy.textContent = "16 歲上場。每一次選擇，都會把你帶向不同的球隊、舞台與結局。";
    if (heroPromise) heroPromise.innerHTML = "<span>HBL → 職業 → 旅外 → 國家隊 → 引退</span>";

    const quick = document.createElement("div");
    quick.className = "blQuickStartPromise";
    quick.innerHTML = `<b>名字＋位置，就能開始。</b><span>其他設定已自動備妥。</span>`;
    setup.insertBefore(quick, start);
    start.classList.add("blFastStartButton");

    const details = document.createElement("details");
    details.id = "blAdvancedSetup";
    details.className = "blAdvancedSetup";
    details.innerHTML = `<summary><span><b>完整自訂球員</b><small>身材・外觀・出生地・世界 Seed</small></span><em>展開</em></summary><div class="blAdvancedSetupBody"></div>`;
    start.insertAdjacentElement("afterend", details);

    const body = details.querySelector(".blAdvancedSetupBody");
    const seedLabel = setup.querySelector(':scope > label[for="seed"]');
    const seed = setup.querySelector(":scope > .seed");
    const seedError = document.getElementById("seedError");
    const seedHelp = document.getElementById("seedHelp");
    [builder, seedLabel, seed, seedError, seedHelp].forEach((node) => {
      if (node) body.appendChild(node);
    });

    const nameLabel = setup.querySelector(':scope > label[for="playerNameInput"]');
    const nameInput = document.getElementById("playerNameInput");
    const positionLabel = [...setup.children].find((node) => node.tagName === "LABEL" && /選擇場上位置/.test(node.textContent || ""));
    const positionGrid = document.getElementById("posgrid");
    const continuePanel = document.getElementById("continueCareerPanel");
    const creatorCredit = setup.querySelector(":scope > .creatorCredit");
    const quickPanel = document.createElement("div");
    quickPanel.className = "blHomeQuickPanel";
    setup.insertBefore(quickPanel, nameLabel || quick);
    [nameLabel, nameInput, positionLabel, positionGrid, quick, start, details, continuePanel, creatorCredit].forEach((node) => {
      if (node) quickPanel.appendChild(node);
    });

    details.addEventListener("toggle", () => {
      const toggle = details.querySelector("summary em");
      if (toggle) toggle.textContent = details.open ? "收合" : "展開";
    });
  }

  function trainingScore(player, key, credit, priority, priorPicks = 0) {
    const stat = Number(player.stats?.[key] || 0);
    if (stat >= 99) return -Infinity;
    const cap = Number(player.caps?.[key] || 99);
    const progress = Math.max(0, Number(player.trainingProgress?.[key] || 0));
    let cost = 8;
    try { if (typeof pointCost === "function") cost = Math.max(1, Number(pointCost(key)) || 1); } catch (_) {}
    const immediateGain = Math.floor((progress + credit) / cost);
    const priorityIndex = priority.indexOf(key);
    const roleFit = (priority.length - (priorityIndex < 0 ? priority.length : priorityIndex)) * 14;
    const nextStep = ((progress + credit) % cost) / cost;
    const capFit = stat < cap ? 28 : -24;
    return immediateGain * 220 + roleFit + nextStep * 30 + capFit + (99 - stat) * 0.08 - priorPicks * 44;
  }

  function quickAllocateTraining() {
    const player = currentPlayer();
    if (!player || player.stage !== "training" || player.diceRolling) return false;
    const assign = typeof window.assignTraining === "function" ? window.assignTraining : null;
    if (!assign) return false;
    const priority = TRAINING_PRIORITY[player.pos] || TRAINING_PRIORITY.PG;
    let guard = 0;
    while (Array.isArray(player.used) && player.used.some((used) => !used) && guard < 20) {
      guard += 1;
      const index = player.used.findIndex((used) => !used);
      const credit = Math.max(0, Number(player.dice?.[index] || 0));
      const available = Object.keys(player.stats || {}).filter((key) => Number(player.stats[key]) < 99);
      if (!available.length) break;
      const picks = (player.trainingUndo || []).reduce((counts, item) => {
        if (item?.k) counts[item.k] = (counts[item.k] || 0) + 1;
        return counts;
      }, {});
      available.sort((a, b) => trainingScore(player, b, credit, priority, picks[b] || 0) - trainingScore(player, a, credit, priority, picks[a] || 0));
      const before = player.used.filter(Boolean).length;
      assign(available[0]);
      if (player.used.filter(Boolean).length <= before) break;
    }
    const message = document.getElementById("diceMsg");
    if (message && player.used?.every(Boolean)) {
      message.textContent = `已依 ${player.pos} 的位置重點分配本季骰子；可用「返回上一步」逐顆調整。`;
    }
    return !!player.used?.every(Boolean);
  }

  function syncQuickTraining() {
    const player = currentPlayer();
    const dicewrap = document.querySelector('#game[data-stage="training"] .dicewrap');
    if (!dicewrap || !player || player.stage !== "training") return;
    let row = dicewrap.querySelector(".blQuickTrainingRow");
    if (!row) {
      row = document.createElement("div");
      row.className = "blQuickTrainingRow";
      row.innerHTML = `<button type="button" class="blQuickTrainingBtn">⚡ 一鍵推薦分配</button><small>依場上位置與升級進度分配全部骰子；原本逐顆玩法仍保留。</small>`;
      const assign = dicewrap.querySelector("#assign");
      if (assign) dicewrap.insertBefore(row, assign);
      row.querySelector("button")?.addEventListener("click", quickAllocateTraining);
    }
    const button = row.querySelector("button");
    const finished = !!player.used?.length && player.used.every(Boolean);
    if (button) {
      button.disabled = !!player.diceRolling || finished;
      const label = finished ? "✓ 本季特訓已分配" : player.diceRolling ? "🎲 等待骰子落桌" : "⚡ 一鍵推薦分配";
      if (button.textContent !== label) button.textContent = label;
    }
  }

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function retirementStoryText(player, honors = []) {
    const history = Array.isArray(player.seasonHistory) ? player.seasonHistory.filter(Boolean) : [];
    const name = String(player.name || "這名球員").trim();
    if (!history.length) return `${name} 完成了屬於自己的球員生涯，最後一次走下球場時，留下的不只是一份數據。`;

    const first = history[0] || {};
    const last = history[history.length - 1] || {};
    const teamRows = history.filter((season) => String(season.team || "").trim());
    const teamCounts = new Map();
    teamRows.forEach((season) => {
      const team = String(season.team).trim();
      teamCounts.set(team, (teamCounts.get(team) || 0) + 1);
    });
    const teams = [...teamCounts.keys()];
    const adultCounts = new Map();
    teamRows.filter((season) => !/^(HBL|UBA|UBA 強權|NCAA D1|NCAA D2|日本大學)$/.test(String(season.path || ""))).forEach((season) => {
      const team = String(season.team).trim();
      adultCounts.set(team, (adultCounts.get(team) || 0) + 1);
    });
    const longest = [...(adultCounts.size ? adultCounts : teamCounts).entries()].sort((a, b) => b[1] - a[1])[0] || [];
    const peak = [...history].sort((a, b) => Number(b.ovr || 0) - Number(a.ovr || 0) || Number(b.pts || 0) - Number(a.pts || 0))[0] || last;
    const firstTeam = String(first.team || "高中球場").trim();
    const finalTeam = String(last.team || player.team || "最後一支球隊").trim();
    const peakTeam = String(peak.team || longest[0] || finalTeam).trim();
    const peakAge = Number(peak.age || (Number(peak.year || 0) - 2010) || 0);
    const peakOvr = Number(peak.ovr || player.peakOverall || 0);
    const seasons = history.length;

    const opening = `${name}從${firstTeam}出發，${seasons} 個球季一路走過 ${Math.max(1, teams.length)} 支球隊。`;
    const meaningfulBeat = [...(player.storyBeats || [])]
      .filter((item) => {
        const text = String(item?.text || "");
        const narrativeType = ["event", "life"].includes(String(item?.type || ""));
        const flagged = item?.chain || item?.worldShift || item?.major || item?.international || item?.offCourt;
        return text && (narrativeType || flagged) && !/本季獲得|取得.*你繳出|年度第一隊|得分王|籃板王|助攻王/.test(text);
      })
      .sort((a, b) => Number(b.importance || 0) - Number(a.importance || 0))[0];

    let middle = "";
    if (meaningfulBeat) {
      const beatText = String(meaningfulBeat.text).trim().replace(/[。；]+$/, "");
      middle = `${meaningfulBeat.year ? `${meaningfulBeat.year} 年，` : "生涯途中，"}${beatText}；那次轉折，改變了他往後的路。`;
    } else if (longest[0] && longest[1] >= 2) {
      middle = `生涯最長的 ${longest[1]} 年留在${longest[0]}，${peakAge ? `${peakAge} 歲` : "巔峰時"}效力${peakTeam}時攀上 OVR ${peakOvr}。`;
    } else {
      middle = `${peakAge ? `${peakAge} 歲` : "巔峰時"}效力${peakTeam}時，他把能力推到 OVR ${peakOvr}，終於在輪替與競爭中站穩自己的位置。`;
    }

    const topHonor = String(honors[0] || "");
    if (!meaningfulBeat && topHonor) {
      const counted = topHonor.match(/^(.*) ×(\d+)$/);
      if (counted && /明星賽/.test(counted[1])) middle = middle.replace(/。$/, `，並 ${counted[2]} 度入選${counted[1]}。`);
      else if (counted && /年度第一隊/.test(counted[1])) middle = middle.replace(/。$/, `，也 ${counted[2]} 度站上年度第一隊。`);
      else if (Number(player.championships || 0) > 0) middle = middle.replace(/。$/, `，並帶走 ${Number(player.championships)} 座主要冠軍。`);
    }

    const age = Number(player.age || last.age || 0);
    const reason = String(player.retirementReason || "");
    let ending = `${age ? `${age} 歲那年` : "最後"}，他穿著${finalTeam}的球衣打完最後一季，正式走下球場。`;
    if (/合約到期|自由市場|沒有合適|沒有新合約|市場/.test(reason)) ending = `${age ? `${age} 歲那年` : "最後"}，${finalTeam}成了最後一站；合約市場沒有再打開，他選擇把球衣留在那裡。`;
    else if (/大傷|重傷|傷勢|醫療|手術/.test(reason)) ending = `${age ? `${age} 歲那年` : "最後"}，傷勢替他在${finalTeam}的最後一章畫下句點。`;
    else if (player.hallOfFame?.length || player.jerseyRetired?.length) ending = `${age ? `${age} 歲那年` : "最後"}，他在${finalTeam}告別球場；掌聲散去後，名字仍留在球館裡。`;

    return `${opening}${middle}${ending}`;
  }

  function retirementPublicProfile(player) {
    const power = Math.max(0, Number(player.careerRating || 0));
    const tier = power >= 70000 ? "歷史級巨星"
      : power >= 45000 ? "聯盟傳奇"
        : power >= 28000 ? "明星級生涯"
          : power >= 15000 ? "優秀職業球員"
            : "職業旅人";
    const awards = new Map();
    (player.careerAwards || []).forEach((award) => {
      const name = String(award?.name || "").trim();
      if (name) awards.set(name, (awards.get(name) || 0) + 1);
    });
    const honors = [...awards.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
      .slice(0, 4)
      .map(([name, count]) => count > 1 ? `${name} ×${count}` : name);
    if (Number(player.championships || 0) > 0) honors.push(`主要冠軍 ×${Number(player.championships)}`);
    if (Number(player.nationalCaps || 0) > 0) honors.push(`國家隊資歷 ${Number(player.nationalCaps)} 次`);
    const status = [];
    if (player.hallOfFame?.length) status.push(`名人堂：${player.hallOfFame.join("、")}`);
    if (player.jerseyRetired?.length) status.push(`球衣退休：${player.jerseyRetired.join("、")}`);
    return {
      power,
      tier,
      honors: honors.slice(0, 6),
      status: status.join("｜") || "完成一段正式球員生涯",
      beat: retirementStoryText(player, honors),
    };
  }

  function syncRetirementPublicCard() {
    const player = currentPlayer();
    const hero = document.querySelector("body.retirementMode .legacyHero");
    if (!hero || !player?.retired || hero.querySelector(".blRetirementPublicSummary")) return;
    const profile = retirementPublicProfile(player);
    hero.classList.add("blRetirementPublicCard");
    const stamp = hero.querySelector(".legacyPowerStamp");
    const stampLabel = stamp?.querySelector("small");
    const stampTier = stamp?.querySelector(":scope > span");
    if (stampLabel) stampLabel.textContent = "BL POWER";
    if (stampTier) stampTier.textContent = profile.tier;

    const games = Math.max(0, Number(player.careerGames || 0));
    const points = Math.max(0, Math.round(Number(player.careerPtsTotal || 0)));
    const summary = document.createElement("section");
    summary.className = "blRetirementPublicSummary";
    summary.innerHTML = `<div class="blRetirementEvaluation"><small>生涯歷史評價</small><b>${safeText(profile.tier)}</b><span>評價 ${profile.power.toLocaleString()}｜${safeText(profile.status)}</span></div><div class="blRetirementPublicMetrics"><span><small>職業出賽</small><b>${games.toLocaleString()}</b></span><span><small>生涯總得分</small><b>${points.toLocaleString()}</b></span><span><small>巔峰 OVR</small><b>${Number(player.peakOverall || 0).toLocaleString()}</b></span></div><div class="blRetirementPublicSplit"><div><small>主要榮譽</small><div class="blRetirementHonorList">${profile.honors.length ? profile.honors.map((honor) => `<span>${safeText(honor)}</span>`).join("") : "<span>沒有主要個人獎項</span>"}</div></div><div><small>生涯故事</small><p>${safeText(profile.beat)}</p></div></div>`;
    hero.append(summary);
  }

  function syncLiveMarquee() {
    liveWrapFrame = 0;
    const track = document.getElementById("liveTrack");
    if (!track) return;

    const oldWrapper = track.childNodes.length === 1
      && track.firstElementChild?.classList.contains("blLiveMarquee")
      ? track.firstElementChild
      : null;
    if (oldWrapper) {
      const fragment = document.createDocumentFragment();
      while (oldWrapper.firstChild) fragment.appendChild(oldWrapper.firstChild);
      track.replaceChildren(fragment);
    }

    if (!matchMedia("(max-width:760px)").matches) {
      delete track.dataset.blLiveStatic;
      track.style.removeProperty("--bl-live-end");
      track.style.removeProperty("--bl-live-duration");
      track.style.removeProperty("animation");
      track.style.removeProperty("text-indent");
      return;
    }

    track.style.setProperty("animation", "none", "important");
    track.style.setProperty("text-indent", "0px", "important");
    void track.offsetWidth;

    const clientWidth = Math.max(1, track.clientWidth);
    const contentWidth = Math.max(clientWidth, track.scrollWidth);
    const staticText = contentWidth <= clientWidth + 4;
    if (staticText) track.dataset.blLiveStatic = "1";
    else delete track.dataset.blLiveStatic;

    track.style.setProperty("--bl-live-end", `${-Math.ceil(contentWidth + 8)}px`);
    const duration = Math.max(18, Math.min(54, (clientWidth + contentWidth) / 38));
    track.style.setProperty("--bl-live-duration", `${duration.toFixed(2)}s`);
    track.title = String(track.textContent || "").replace(/\s+/g, " ").trim();

    track.style.removeProperty("animation");
    track.style.removeProperty("text-indent");
    void track.offsetWidth;
  }

  function scheduleLiveMarquee() {
    if (!liveWrapFrame) liveWrapFrame = requestAnimationFrame(syncLiveMarquee);
  }

  function syncMilestones() {
    syncFrame = 0;
    const setup = document.getElementById("setup");
    const community = document.getElementById("communityPage");
    const homeVisible = !!setup
      && !setup.classList.contains("hidden")
      && (!community || community.classList.contains("hidden"))
      && !document.body.classList.contains("retirementMode")
      && !visible(document.getElementById("game"));
    document.body.classList.toggle("blHomeMode", homeVisible);
    if (homeVisible) record("home_view");

    const panel = document.getElementById("currentPanel");
    if (panel && (
      panel.classList.contains("eventRare")
      || panel.classList.contains("eventMedical")
      || panel.classList.contains("eventOffCourt")
    )) record("major_event");

    if (document.body.classList.contains("retirementMode")) record("retirement");
    syncQuickTraining();
    syncRetirementPublicCard();
  }

  function scheduleSync() {
    if (!syncFrame) syncFrame = requestAnimationFrame(syncMilestones);
  }

  function installCareerStartWrapper() {
    const original = window.startCareer;
    if (typeof original !== "function" || original.__blGrowthFunnelWrapped) return false;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      setTimeout(() => {
        const game = document.getElementById("game");
        if (game && !game.classList.contains("hidden")) record("career_start");
        scheduleSync();
      }, 0);
      return result;
    };
    wrapped.__blGrowthFunnelWrapped = true;
    window.startCareer = wrapped;
    return true;
  }

  document.addEventListener("input", (event) => {
    if (event.target?.closest?.("#setup")) record("player_create");
  }, true);
  document.addEventListener("change", (event) => {
    if (event.target?.closest?.("#setup")) record("player_create");
  }, true);
  document.addEventListener("click", (event) => {
    const control = event.target?.closest?.("button,a,[role='button']");
    if (!control) return;
    if (control.closest("#setup") && !control.closest("#weeklyChallenge")) record("player_create");
    const label = String(control.textContent || "").replace(/\s+/g, " ").trim();
    if (/生成.*生涯紀念圖|製作.*(?:引退故事圖|生涯紀錄長圖)|下載\s*PNG|複製圖片|分享.*(?:生涯|退休|紀念)/.test(label)) record("share");
    setTimeout(scheduleSync, 0);
  }, true);

  const observer = new MutationObserver(() => {
    scheduleSync();
    scheduleLiveMarquee();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  installQuickStartLayout();
  syncMilestones();
  syncLiveMarquee();
  addEventListener("resize", scheduleLiveMarquee, { passive: true });
  if (!installCareerStartWrapper()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCareerStartWrapper() || attempts >= 100) clearInterval(timer);
    }, 50);
  }

  function weeklyWindow(value = new Date()) {
    const utcMidnight = Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    const isoDay = new Date(utcMidnight).getUTCDay() || 7;
    const start = new Date(utcMidnight - (isoDay - 1) * 86400000);
    return { start, end: new Date(start.getTime() + 7 * 86400000) };
  }

  function taipeiStamp(date) {
    const parts = new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type) => parts.find((item) => item.type === type)?.value || "";
    return `${get("month")}/${get("day")}（${get("weekday").replace(/^週/, "")}）${get("hour")}:${get("minute")}`;
  }

  function syncWeeklyTiming() {
    const button = document.getElementById("weeklyChallenge");
    if (!button) return;

    const label = button.querySelector("small");
    if (label) label.textContent = "本週 Seed 挑戰";

    let timing = button.querySelector(".weeklyChallengeTiming");
    if (!timing) {
      timing = document.createElement("span");
      timing.className = "weeklyChallengeTiming";
      button.appendChild(timing);
    }

    const range = weeklyWindow();
    const finalMinute = new Date(range.end.getTime() - 60000);
    const copy = `週榜 ${taipeiStamp(range.start)}－${taipeiStamp(finalMinute)}｜每週一 08:00 結算換週（台灣）`;
    timing.textContent = copy;
    button.dataset.weeklyStart = range.start.toISOString();
    button.dataset.weeklyEnd = range.end.toISOString();
    button.title = copy;

    const title = String(document.getElementById("weeklyChallengeTitle")?.textContent || "").trim();
    const meta = String(document.getElementById("weeklyChallengeMeta")?.textContent || "").trim();
    button.setAttribute("aria-label", ["本週 Seed 挑戰", title, meta, copy].filter(Boolean).join("｜"));

    clearTimeout(boundaryTimer);
    const delay = Math.max(1000, Math.min(2147483000, range.end.getTime() - Date.now() + 1200));
    boundaryTimer = setTimeout(() => {
      try {
        const setup = document.getElementById("setup");
        if (visible(setup)) {
          if (button.classList.contains("applied") && typeof window.exitWeeklyChallenge === "function") {
            window.exitWeeklyChallenge(false);
          } else if (typeof window.renderWeeklyChallenge === "function") {
            window.renderWeeklyChallenge();
          }
        }
      } catch (_) {}
      syncWeeklyTiming();
    }, delay);
  }

  syncWeeklyTiming();
  document.getElementById("weeklyChallenge")?.addEventListener("click", () => setTimeout(syncWeeklyTiming, 0));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncWeeklyTiming();
      scheduleLiveMarquee();
      scheduleSync();
    }
  });
})();
