function publicReadPatchScript() {
  return String.raw`<script>
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
        if (/^🎴\s*/.test(String(el.textContent || "").trim())) el.remove();
      });

      const seedBox = document.querySelector(".legacySeed");
      const seedValue = seedBox?.querySelector("b");
      if (seedValue) {
        seedValue.textContent = maskSeed(String(seedValue.textContent || "").trim());
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
  const output = html.includes("</body>") ? html.replace("</body>", `${patch}</body>`) : `${html}${patch}`;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-cache");

  return new Response(output, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
