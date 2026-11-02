import http from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const FRONT_ORIGIN = 'https://rwppp.github.io';
const MAX_BODY = 2100000;
const GET_PATHS = new Set(['/', '/health', '/supabase-test', '/vk/start', '/vk/callback']);
const POST_PATHS = new Set([
 '/vk/exchange', '/club-api/auth/v1/signup', '/club-api/auth/v1/token',
 '/club-api/auth/v1/logout', '/club-api/rest/v1/rpc/club_api',
 '/club-api/rest/v1/rpc/club_portal', '/club-api/rest/v1/rpc/club_maintenance'
]);
const REQUEST_HEADERS = ['content-type', 'authorization', 'apikey', 'cookie'];
const OMIT_RESPONSE_HEADERS = new Set([
 'connection', 'keep-alive', 'transfer-encoding', 'content-length', 'content-encoding',
 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'upgrade', 'set-cookie',
 'access-control-allow-origin', 'access-control-allow-headers',
 'access-control-allow-methods', 'access-control-allow-credentials'
]);

export function createGateway({upstream = 'https://krokodil-proxy-test.onrender.com', timeoutMs = 150000} = {}) {
 const upstreamOrigin = new URL(upstream).origin;
 return http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const reply = (status, message) => {
   res.statusCode = status;
   res.setHeader('Content-Type', 'application/json; charset=utf-8');
   res.end(JSON.stringify({message}));
  };
  const origin = req.headers.origin;
  if (origin && origin !== FRONT_ORIGIN) return reply(403, 'Запрос должен идти с сайта клуба');
  if (origin === FRONT_ORIGIN) {
   res.setHeader('Access-Control-Allow-Origin', FRONT_ORIGIN);
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
   res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
   res.setHeader('Vary', 'Origin');
  }
  if (!req.url?.startsWith('/') || req.url.startsWith('//')) return reply(400, 'Неверный адрес');
  let target;
  try { target = new URL(req.url, upstreamOrigin); }
  catch { return reply(400, 'Неверный адрес'); }
  if (target.origin !== upstreamOrigin) return reply(400, 'Неверный адрес');
  const paths = req.method === 'GET' ? GET_PATHS : POST_PATHS;
  if (!GET_PATHS.has(target.pathname) && !POST_PATHS.has(target.pathname)) return reply(404, 'Not found');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (!['GET', 'POST'].includes(req.method) || !paths.has(target.pathname)) return reply(405, 'Неверный метод');
  if (Number(req.headers['content-length'] || 0) > MAX_BODY) return reply(413, 'Слишком большой запрос');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const disconnected = () => { if (!res.writableEnded) controller.abort(); };
  res.once('close', disconnected);
  req.once('aborted', disconnected);
  try {
   let length = 0;
   const chunks = [];
   for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) return reply(413, 'Слишком большой запрос');
    chunks.push(chunk);
   }
   const headers = new Headers();
   for (const name of REQUEST_HEADERS) {
    const value = req.headers[name];
    if (typeof value === 'string') headers.set(name, value);
   }
   if (origin) headers.set('Origin', origin);
   const result = await fetch(target, {
    method: req.method, headers, redirect: 'manual', signal: controller.signal,
    ...(req.method === 'POST' ? {body: Buffer.concat(chunks)} : {})
   });
   res.statusCode = result.status;
   for (const [name, value] of result.headers) {
    if (!OMIT_RESPONSE_HEADERS.has(name)) res.setHeader(name, value);
   }
   const cookies = result.headers.getSetCookie();
   if (cookies.length) res.setHeader('Set-Cookie', cookies);
   if (result.body) await pipeline(Readable.fromWeb(result.body), res);
   else res.end();
  } catch {
   if (!res.headersSent && !res.destroyed) reply(502, 'Не удалось связаться с сервером. Повторите позже.');
   else if (!res.writableEnded) res.destroy();
  } finally {
   clearTimeout(timer);
   res.removeListener('close', disconnected);
   req.removeListener('aborted', disconnected);
  }
 });
}
