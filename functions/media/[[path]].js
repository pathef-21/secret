const BACKEND_ORIGIN = 'https://man-ak-bae.onrender.com';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_ORIGIN}${url.pathname}${url.search}`;

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    redirect: 'follow',
  });

  const headers = new Headers(backendResponse.headers);
  headers.delete('content-encoding');
  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}
