const ALLOWED_HOST = /(^|\.)sooplive\.com$|(^|\.)sooplive\.co\.kr$|(^|\.)afreecatv\.com$|(^|\.)chzzk\.naver\.com$|(^|\.)game\.naver\.com$/i;
const ALLOWED_ORIGINS = new Set([
  'https://golddragon0207.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);
const MAX_BODY_BYTES = 16 * 1024;

function allowedOrigin(request) {
  const origin = request.headers.get('Origin');
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
}

function corsHeaders(origin, extra = {}) {
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  };
}

function textResponse(message, status, origin = '') {
  return new Response(message, {
    status,
    headers: corsHeaders(origin, { 'Content-Type': 'text/plain; charset=utf-8' })
  });
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const origin = allowedOrigin(request);

    if (requestUrl.pathname === '/health') {
      return Response.json(
        { ok: true, service: 'ai-troll-lab-chat-proxy' },
        { headers: corsHeaders(origin, { 'Cache-Control': 'no-store' }) }
      );
    }

    if (request.method === 'OPTIONS') {
      return origin
        ? new Response(null, { status: 204, headers: corsHeaders(origin) })
        : textResponse('Origin not allowed', 403);
    }

    if (!origin) return textResponse('Origin not allowed', 403);
    if (!['GET', 'POST'].includes(request.method)) return textResponse('Method not allowed', 405, origin);

    const target = requestUrl.searchParams.get('url');
    if (!target) return textResponse('Missing ?url= parameter', 400, origin);

    let upstreamUrl;
    try {
      upstreamUrl = new URL(target);
    } catch {
      return textResponse('Invalid target url', 400, origin);
    }

    if (upstreamUrl.protocol !== 'https:' || !ALLOWED_HOST.test(upstreamUrl.hostname)) {
      return textResponse('Host not allowed', 403, origin);
    }

    const declaredLength = Number(request.headers.get('Content-Length') || 0);
    if (declaredLength > MAX_BODY_BYTES) return textResponse('Request body too large', 413, origin);

    const isNaver = /(^|\.)naver\.com$/i.test(upstreamUrl.hostname);
    const referer = isNaver
      ? 'https://chzzk.naver.com/'
      : /(^|\.)sooplive\.com$/i.test(upstreamUrl.hostname)
        ? 'https://play.sooplive.com/'
        : 'https://play.sooplive.co.kr/';

    const init = {
      method: request.method,
      redirect: 'manual',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/x-www-form-urlencoded',
        Referer: referer
      }
    };

    if (request.method === 'POST') {
      const body = await request.arrayBuffer();
      if (body.byteLength > MAX_BODY_BYTES) return textResponse('Request body too large', 413, origin);
      init.body = body;
    }

    let response;
    try {
      response = await fetch(upstreamUrl.toString(), init);
    } catch {
      return textResponse('Upstream fetch failed', 502, origin);
    }

    if (response.status >= 300 && response.status < 400) {
      return textResponse('Upstream redirect blocked', 502, origin);
    }

    return new Response(response.body, {
      status: response.status,
      headers: corsHeaders(origin, {
        'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      })
    });
  }
};
