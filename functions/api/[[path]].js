const BACKEND_ORIGIN = 'https://man-ak-bae.onrender.com';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_ORIGIN}${url.pathname}${url.search}`;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'origin' ||
      lower === 'referer' ||
      lower.startsWith('cf-') ||
      lower === 'x-forwarded-host' ||
      lower === 'x-forwarded-proto'
    ) {
      continue;
    }
    headers.set(key, value);
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const backendResponse = await fetch(targetUrl, init);
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete('content-encoding');

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}
