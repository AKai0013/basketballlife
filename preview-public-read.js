(() => {
  "use strict";

  function installPublicReadPatch() {
    const bl = window.BasketballLifeOnline;
    if (!bl || !bl.state || bl.__publicReadPatched) return false;

    const state = bl.state;
    const methodNames = ["openLeaderboard", "changeLeaderboardEra", "changeRankMetric", "openCareer"];

    function maskSeed(value) {
      const seed = String(value || "").trim();
      if (!seed || seed.includes("•")) return seed;
      if (seed.length <= 5) {
        return seed.slice(0, 1) + "•".repeat(Math.max(1, seed.length - 2)) + seed.slice(-1);
      }
      return seed.slice(0, 3) + "•".repeat(Math.max(3, seed.length - 5)) + seed.slice(-2);
    }

    function sanitizePublicCareerView() {
      document.querySelectorAll(".publicBadgeRow span").forEach((element) => {
        if (/^🎴\s*/.test(String(element.textContent || "").trim())) element.remove();
      });

      const seedBox = document.querySelector(".legacySeed");
      const seedValue = seedBox?.querySelector("b");
      if (!seedValue) return;

      seedValue.textContent = maskSeed(seedValue.textContent);
      let node = seedValue.nextSibling;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = String(node.nodeValue || "").replace(/^\s*｜[^\r\n]*/, "");
          break;
        }
        if (node.nodeName === "BR") break;
        node = node.nextSibling;
      }
    }

    /* The owner can see the exact Seed on their own retirement page. Only the
       tier suffix is removed there; public career views remain masked above. */
    function sanitizeRetirementSeedTier() {
      if (!document.body.classList.contains("retirementMode")) return;
      document.querySelectorAll(".legacySeed > b").forEach((element) => {
        const value = String(element.textContent || "").trim();
        if (/^🎴\s*世界種子\s*｜/.test(value)) element.textContent = "🎴 世界種子";
      });
    }

    function fanEchoMarkup() {
      try {
        if (typeof window.fanEchoHTML === "function") return window.fanEchoHTML();
        if (typeof fanEchoHTML === "function") return fanEchoHTML();
      } catch (_) {}
      return "";
    }

    function ensureRetirementFanEcho() {
      if (!document.body.classList.contains("retirementMode")) return;
      const main = document.querySelector(".legacyMain");
      if (!main || main.querySelector(".fanEchoIntro")) return;

      const html = fanEchoMarkup();
      if (!html) return;
      const section = document.createElement("section");
      section.className = "legacySection fanEchoSection";
      section.dataset.blRestoredFanEcho = "1";
      section.innerHTML = html;
      main.appendChild(section);
    }

    function relocateRetirementFanEcho() {
      if (!document.body.classList.contains("retirementMode")) return;
      const main = document.querySelector(".legacyMain");
      if (!main) return;

      const echoSection = main.querySelector(".fanEchoSection")
        || main.querySelector(".fanEchoIntro")?.closest(".legacySection");
      const seedBox = main.querySelector(".legacySeed");
      const seedSection = seedBox?.closest(".legacySection") || seedBox;
      if (!echoSection || !seedSection || echoSection === seedSection) return;
      if (echoSection.nextElementSibling === seedSection) return;

      seedSection.before(echoSection);
      echoSection.dataset.blFanEchoBeforeSeed = "1";
    }

    function syncRetirementPatches() {
      sanitizeRetirementSeedTier();
      ensureRetirementFanEcho();
      relocateRetirementFanEcho();
      window.BasketballLifeFunnel?.record?.("retirement");
    }

    function wrapPublicRead(fn, methodName) {
      if (typeof fn !== "function" || fn.__blPublicReadWrapper) return fn;
      const wrapped = async function (...args) {
        const previous = {
          client: state.client,
          user: state.user,
          offline: state.offline,
        };

        let publicId = "";
        try { publicId = localStorage.getItem("bl_d1_client_id") || ""; } catch (_) {}
        if (!publicId) publicId = "public-viewer";

        const injectedClient = !state.client;
        const injectedUser = !state.user;
        const clearedOffline = state.offline === true;
        const publicClient = { backend: "cloudflare-d1-public-read" };
        const publicUser = { id: publicId };

        if (injectedClient) state.client = publicClient;
        if (injectedUser) state.user = publicUser;
        if (clearedOffline) state.offline = false;

        try {
          const result = await fn.apply(this, args);
          if (methodName === "openCareer") sanitizePublicCareerView();
          syncRetirementPatches();
          return result;
        } finally {
          if (injectedClient && state.client === publicClient) state.client = previous.client;
          if (injectedUser && state.user === publicUser) state.user = previous.user;
          if (
            clearedOffline
            && state.offline === false
            && state.user === previous.user
            && state.client === previous.client
          ) state.offline = previous.offline;
        }
      };
      wrapped.__blPublicReadWrapper = true;
      return wrapped;
    }

    for (const name of methodNames) {
      if (typeof bl[name] === "function") bl[name] = wrapPublicRead(bl[name], name);
    }

    syncRetirementPatches();
    const retirementObserver = new MutationObserver(syncRetirementPatches);
    retirementObserver.observe(document.documentElement, { childList: true, subtree: true });

    bl.__publicReadPatched = true;
    window.__blPreviewPublicReadInstalled = true;
    return true;
  }

  if (!installPublicReadPatch()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installPublicReadPatch() || attempts >= 100) clearInterval(timer);
    }, 50);
  }
})();
