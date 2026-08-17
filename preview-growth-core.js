(() => {
  "use strict";

  const FUNNEL_KEY = "bl_growth_funnel_v1";
  const SESSION_KEY = "bl_growth_funnel_session_v1";
  const STAGES = ["home_view", "player_create", "career_start", "major_event", "retirement", "share"];
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

  /* Mobile Chromium propagates transformed marquee overflow into body.scrollWidth.
     Keep the headline as direct text inside a fixed-width element and animate its
     text-indent instead, so no DOM node ever becomes wider than the viewport. */
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
    if (visible(document.getElementById("setup"))) record("home_view");

    const panel = document.getElementById("currentPanel");
    if (panel && (
      panel.classList.contains("eventRare")
      || panel.classList.contains("eventMedical")
      || panel.classList.contains("eventOffCourt")
    )) record("major_event");

    if (document.body.classList.contains("retirementMode")) record("retirement");
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
    if (/生成.*生涯紀念圖|下載\s*PNG|複製圖片|分享.*(?:生涯|退休|紀念)/.test(label)) record("share");
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

  /* The existing weekly ID is ISO-week based in UTC. Its real Taiwan boundary is
     Monday 08:00, so the UI must display that exact seven-day window. */
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
