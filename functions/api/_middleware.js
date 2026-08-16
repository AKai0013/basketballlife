const CACHE_TTL_SECONDS = 300;

function cacheablePath(url) {
  return url.pathname === "/api/careers" || url.pathname === "/api/news";
}

function cacheKey(url) {
  const keyUrl = new URL(url.toString());
  keyUrl.searchParams.set("_bl_cache", "v5");
  return new Request(keyUrl.toString(), { method: "GET" });
}

function maskSeed(value) {
  const seed = String(value ?? "");
  if (!seed) return seed;
  if (seed.length <= 5) return `${seed.slice(0, 1)}${"•".repeat(Math.max(1, seed.length - 2))}${seed.slice(-1)}`;
  return `${seed.slice(0, 3)}${"•".repeat(Math.max(3, seed.length - 5))}${seed.slice(-2)}`;
}

function sanitizeCareerSummary(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const out = { ...row };
  delete out.seed_tier;
  if (!out.weekly_active && "seed" in out) out.seed = maskSeed(out.seed);
  return out;
}

function sanitizeCareerDetail(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const out = { ...row };
  const era = String(out.ranking_era || out.career_data?.ranking_era || "");
  if (era === "v750") {
    if ("seed" in out) out.seed = maskSeed(out.seed);
    delete out.seed_tier;
    return out;
  }
  // V8 integrity checks include both the original Seed and seed_tier in the
  // checksum. They must stay in the detail payload until the browser finishes
  // verification. The presentation layer hides both after validation.
  return out;
}

function sanitizePayload(payload, url) {
  if (url.pathname === "/api/careers") {
    if (Array.isArray(payload?.rows)) return { ...payload, rows: payload.rows.map(sanitizeCareerSummary) };
    return payload;
  }
  if (url.pathname.startsWith("/api/careers/")) return sanitizeCareerDetail(payload);
  return payload;
}

async function sanitizeResponse(response, url, cacheStatus) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return withCacheHeader(response, cacheStatus);

  const payload = await response.clone().json().catch(() => null);
  if (payload === null) return withCacheHeader(response, cacheStatus);

  const headers = new Headers(response.headers);
  headers.set("x-bl-cache", cacheStatus);
  return new Response(JSON.stringify(sanitizePayload(payload, url)), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withCacheHeader(response, value) {
  const headers = new Headers(response.headers);
  headers.set("x-bl-cache", value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const request = context.request;
  if (request.method !== "GET") return context.next();

  const url = new URL(request.url);
  const isCareerGet = url.pathname === "/api/careers" || url.pathname.startsWith("/api/careers/");
  if (!cacheablePath(url) && !isCareerGet) return context.next();

  if (cacheablePath(url)) {
    const cache = caches.default;
    const key = cacheKey(url);
    const cached = await cache.match(key);
    if (cached) return sanitizeResponse(cached, url, "HIT");

    const response = await context.next();
    if (!response.ok) return response;

    const sanitized = await sanitizeResponse(response, url, "MISS");
    const headers = new Headers(sanitized.headers);
    headers.set("cache-control", `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}`);

    const cacheable = new Response(sanitized.body, {
      status: sanitized.status,
      statusText: sanitized.statusText,
      headers,
    });

    context.waitUntil(cache.put(key, cacheable.clone()));
    return cacheable;
  }

  const response = await context.next();
  if (!response.ok) return response;
  return sanitizeResponse(response, url, "BYPASS");
}
