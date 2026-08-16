const CACHE_TTL_SECONDS = 300;

function cacheablePath(url) {
  return url.pathname === "/api/careers" || url.pathname === "/api/news";
}

function cacheKey(url) {
  return new Request(url.toString(), { method: "GET" });
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
  if (!cacheablePath(url)) return context.next();

  const cache = caches.default;
  const key = cacheKey(url);
  const cached = await cache.match(key);
  if (cached) return withCacheHeader(cached, "HIT");

  const response = await context.next();
  if (!response.ok) return response;

  const headers = new Headers(response.headers);
  headers.set("cache-control", `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}`);
  headers.set("x-bl-cache", "MISS");

  const cacheable = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  context.waitUntil(cache.put(key, cacheable.clone()));
  return cacheable;
}
