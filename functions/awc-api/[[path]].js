export async function onRequest(context) {
  const url = new URL(context.request.url);
  const apiPath = url.pathname.replace(/^\/awc-api/, '/api');
  const targetUrl = 'https://aviationweather.gov' + apiPath + url.search;

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: {
      'User-Agent': 'MetroWXBoard/1.0',
      'Accept': context.request.headers.get('Accept') || '*/*',
    },
  });

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
