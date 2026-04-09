const CACHE_TTL = 120; // Cache for 2 minutes (seconds)

export async function onRequest(context) {
  const request = context.request;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const apiPath = url.pathname.replace(/^\/awc-api/, '/api');
  const targetUrl = 'https://aviationweather.gov' + apiPath + url.search;

  // Use Cloudflare Cache API
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);

  // Check cache first
  let cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // Not cached — fetch from AWC
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'MetroWXBoard/1.0',
      'Accept': request.headers.get('Accept') || '*/*',
    },
  });

  // Build response with CORS and cache headers
  const body = await response.text();
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  newHeaders.set('Cache-Control', 's-maxage=' + CACHE_TTL);

  const cachedResponse = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });

  // Store in cache (non-blocking)
  context.waitUntil(cache.put(cacheKey, cachedResponse.clone()));

  return cachedResponse;
}
