function leaderboardReturnPatchScript() {
  return String.raw`<script id="bl-leaderboard-return-patch">
(() => {
  function installLeaderboardReturnPatch() {
    const bl = window.BasketballLifeOnline;
    if (!bl || !bl.state || typeof bl.openCareer !== "function" || typeof bl.openLeaderboard !== "function" || bl.__leaderboardReturnPatched) return false;

    const state = bl.state;
    const originalOpenCareer = bl.openCareer;
    let returnState = null;
    let restoring = false;

    function leaderboardUrl(saved) {
      const url = new URL(location.href);
      url.search = "";
      url.hash = "";
      url.searchParams.set("leaderboard", saved.metric || "power");
      url.searchParams.set("era", saved.era || "v8");
      return url.pathname + url.search;
    }

    function isLeaderboardView() {
      const url = new URL(location.href);
      if (url.searchParams.has("leaderboard")) return true;
      const content = document.getElementById("communityContent");
      return !!content?.querySelector(".rankTabs,.rankEraTabs,.rankMetricTabs,.rankMetricGrid,#leaderboardList,.rankList");
    }

    bl.openCareer = async function (...args) {
      if (!restoring && isLeaderboardView()) {
        returnState = {
          era: state.activeLeaderboardEra || "v8",
          metric: state.activeMetric || "power",
          scrollY: Math.max(0, window.scrollY || document.documentElement.scrollTop || 0),
        };
      }
      return originalOpenCareer.apply(this, args);
    };

    async function restoreLeaderboard() {
      if (!returnState || restoring) return false;
      const saved = returnState;
      returnState = null;
      restoring = true;
      try {
        state.activeLeaderboardEra = saved.era || "v8";
        state.activeMetric = saved.metric || "power";
        history.replaceState({ bl: "leaderboard" }, "", leaderboardUrl(saved));
        // openLeaderboard(false) reuses the existing in-memory leaderboard cache,
        // so returning from a public career normally causes zero new API reads.
        await bl.openLeaderboard(saved.metric || "power", false);
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved.scrollY || 0, left: 0, behavior: "auto" });
        });
        return true;
      } finally {
        restoring = false;
      }
    }

    document.addEventListener("click", (event) => {
      if (!returnState || restoring) return;
      const control = event.target?.closest?.("button,a");
      if (!control) return;
      const text = String(control.textContent || "").replace(/\s+/g, " ").trim();
      if (!/返回/.test(text)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void restoreLeaderboard();
    }, true);

    window.addEventListener("popstate", () => {
      if (!returnState || restoring) return;
      const url = new URL(location.href);
      if (url.searchParams.has("leaderboard")) void restoreLeaderboard();
    });

    bl.__leaderboardReturnPatched = true;
    return true;
  }

  if (!installLeaderboardReturnPatch()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installLeaderboardReturnPatch() || tries >= 100) clearInterval(timer);
    }, 50);
  }
})();
</script>`;
}

export async function onRequest(context) {
  const response = await context.next();
  if (context.request.method !== "GET") return response;

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes("bl-leaderboard-return-patch")) return response;

  const patch = leaderboardReturnPatchScript();
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
