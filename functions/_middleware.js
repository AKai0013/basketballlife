function publicReadPatchScript() {
  return String.raw`<style id="bl-mobile-retirement-fix">
/* Mobile interaction: keep fast repeated gameplay taps from triggering browser double-tap zoom. */
html,body,#game,#game button,#game a,#game .btn,#game .choice{touch-action:manipulation}

/* Retirement-night fan reactions are core career content. */
body.retirementMode .fanEchoSection{display:block!important}
body.retirementMode .fanEchoGrid{min-width:0!important}

/* The source stylesheet has a later mobile override that forces the retirement dashboard
   back to a 224px + content desktop grid. Keep retirement genuinely responsive on phones. */
@media(max-width:760px){
  body.retirementMode .legacyPage{
    width:100%!important;
    max-width:100%!important;
    padding:0!important;
    overflow:visible!important;
    border-radius:12px!important;
  }
  body.retirementMode .legacyDashboard{
    display:block!important;
    grid-template-columns:none!important;
    width:100%!important;
    min-width:0!important;
  }
  body.retirementMode .legacyCareerRail{
    display:block!important;
    position:static!important;
    top:auto!important;
    width:100%!important;
    max-width:100%!important;
    max-height:none!important;
    margin:0 0 10px!important;
    padding:10px!important;
    overflow:hidden!important;
  }
  body.retirementMode .legacyRailScroll{
    display:flex!important;
    gap:8px!important;
    width:100%!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    padding:4px 0 7px!important;
    -webkit-overflow-scrolling:touch;
    scroll-snap-type:x proximity;
  }
  body.retirementMode .legacyRailGroup{
    flex:0 0 min(72vw,240px)!important;
    min-width:0!important;
    scroll-snap-align:start;
  }
  body.retirementMode .legacyRailFinish{
    margin-top:4px!important;
  }
  body.retirementMode .legacyMain{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    padding:8px!important;
  }
  body.retirementMode .legacyHero,
  body.retirementMode .legacySection,
  body.retirementMode .retirementFeature{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  body.retirementMode .legacyMoment{
    display:grid!important;
    grid-template-columns:88px minmax(0,1fr)!important;
    gap:10px!important;
    width:100%!important;
    min-width:0!important;
  }
  body.retirementMode .legacyMoment>*{min-width:0!important}
  body.retirementMode .legacyMeta,
  body.retirementMode .legacyMoment,
  body.retirementMode .legacySection,
  body.retirementMode .retirementFeature{
    overflow-wrap:anywhere;
    word-break:normal;
  }
  body.retirementMode .fanEchoGrid{
    grid-template-columns:1fr!important;
    width:100%!important;
    max-width:100%!important;
  }
  body.retirementMode .fanEchoCard{
    min-width:0!important;
    width:100%!important;
    box-sizing:border-box!important;
  }
}

@media(max-width:430px){
  body.retirementMode .legacyMain{padding:6px!important}
  body.retirementMode .legacyHero{padding:12px 10px 10px!important}
  body.retirementMode .legacyCareerRail{padding:9px!important}
  body.retirementMode .legacySection{padding:13px!important}
  body.retirementMode .legacyMoment{grid-template-columns:76px minmax(0,1fr)!important;gap:8px!important}
}
</style><script>
(() => {
  function installPublicReadPatch() {
    const bl = window.BasketballLifeOnline;
    if (!bl || !bl.state || bl.__publicReadPatched) return false;

    const state = bl.state;
    const methodNames = ["openLeaderboard", "changeLeaderboardEra", "changeRankMetric", "openCareer"];

    function maskSeed(value) {
      const seed = String(value || "");
      if (!seed) return seed;
      if (seed.includes("•")) return seed;
      if (seed.length <= 5) {
        return seed.slice(0, 1) + "•".repeat(Math.max(1, seed.length - 2)) + seed.slice(-1);
      }
      return seed.slice(0, 3) + "•".repeat(Math.max(3, seed.length - 5)) + seed.slice(-2);
    }

    function sanitizePublicCareerView() {
      document.querySelectorAll(".publicBadgeRow span").forEach((el) => {
        if (/^🎴\\s*/.test(String(el.textContent || "").trim())) el.remove();
      });

      const seedBox = document.querySelector(".legacySeed");
      const seedValue = seedBox?.querySelector("b");
      if (seedValue) {
        seedValue.textContent = maskSeed(String(seedValue.textContent || "").trim());
        let node = seedValue.nextSibling;
        while (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = String(node.nodeValue || "").replace(/^\\s*｜[^\\r\\n]*/, "");
            break;
          }
          if (node.nodeName === "BR") break;
          node = node.nextSibling;
        }
      }
    }

    function sanitizeRetirementSeedTier() {
      document.querySelectorAll(".legacySeed > b").forEach((el) => {
        const text = String(el.textContent || "").trim();
        if (/^🎴\\s*世界種子\\s*｜/.test(text)) el.textContent = "🎴 世界種子";
      });
    }

    function ensureRetirementFanEcho() {
      if (!document.body.classList.contains("retirementMode")) return;
      const main = document.querySelector(".legacyMain");
      if (!main || main.querySelector(".fanEchoIntro")) return;

      let html = "";
      try {
        if (typeof window.fanEchoHTML === "function") html = window.fanEchoHTML();
        else if (typeof fanEchoHTML === "function") html = fanEchoHTML();
      } catch (_) {
        return;
      }
      if (!html) return;

      const section = document.createElement("section");
      section.className = "legacySection fanEchoSection";
      section.setAttribute("data-bl-restored-fan-echo", "1");
      section.innerHTML = html;
      main.appendChild(section);
    }

    function syncRetirementPatches() {
      sanitizeRetirementSeedTier();
      ensureRetirementFanEcho();
    }

    syncRetirementPatches();
    const retirementObserver = new MutationObserver(() => syncRetirementPatches());
    retirementObserver.observe(document.documentElement, { childList: true, subtree: true });

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
          if (clearedOffline && state.offline === false && state.user === previous.user && state.client === previous.client) {
            state.offline = previous.offline;
          }
        }
      };
      wrapped.__blPublicReadWrapper = true;
      return wrapped;
    }

    for (const name of methodNames) {
      if (typeof bl[name] === "function") bl[name] = wrapPublicRead(bl[name], name);
    }

    bl.__publicReadPatched = true;
    return true;
  }

  if (!installPublicReadPatch()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installPublicReadPatch() || tries >= 100) clearInterval(timer);
    }, 50);
  }
})();
</script>`;
}

export async function onRequest(context) {
  const response = await context.next();
  if (context.request.method !== "GET") return response;

  const url = new URL(context.request.url);
  if (url.pathname.startsWith("/api/")) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes("__publicReadPatched")) return response;

  const patch = publicReadPatchScript();
  const output = html.includes("</body>") ? html.replace("</body>", patch + "</body>") : html + patch;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-cache");

  return new Response(output, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}