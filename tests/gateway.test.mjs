import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {createGateway} from '../deplexo-gateway/gateway.mjs';
import {publicOrigin} from '../render/lib/public-origin.mjs';
import clubApi from '../render/handlers/club-api.mjs';

const FRONT = 'https://rwppp.github.io';
const large = randomBytes(700000).toString('base64');
const compressed = gzipSync(large);
let calls = 0;
const upstream = http.createServer(async (req, res) => {
 calls++;
 if (req.url === '/vk/start') {
  res.writeHead(302, {Location: 'https://id.vk.com/authorize?test=1', 'Set-Cookie': '__Host-krokodil_vk_flow=fixture; Path=/; HttpOnly; Secure; SameSite=Lax'});
  res.end();
 } else if (req.url === '/club-api/rest/v1/rpc/club_portal') {
  res.writeHead(200, {'Content-Type': 'text/plain', 'Content-Encoding': 'gzip', 'Content-Length': compressed.length});
  res.end(compressed);
 } else if (req.url === '/supabase-test') {
  const timer = setTimeout(() => res.end('late'), 300);
  res.once('close', () => clearTimeout(timer));
 } else if (req.method === 'POST') {
  const parts = [];
  for await (const part of req) parts.push(part);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({method:req.method, body:Buffer.concat(parts).toString(), headers:req.headers}));
 } else res.end('upstream health');
});
upstream.listen(0, '127.0.0.1');
await once(upstream, 'listening');
const gateway = createGateway({upstream:'http://127.0.0.1:'+upstream.address().port, timeoutMs:150});
gateway.listen(0, '127.0.0.1');
await once(gateway, 'listening');
const base = 'http://127.0.0.1:'+gateway.address().port;

try {
 await test('health checks the real upstream and preflight stays restricted to the club', async () => {
  const r = await fetch(base+'/health');
  assert.equal(r.status,200); assert.equal(await r.text(),'upstream health');
  const p = await fetch(base+'/club-api/rest/v1/rpc/club_api',{method:'OPTIONS',headers:{Origin:FRONT}});
  assert.equal(p.status,204); assert.equal(p.headers.get('access-control-allow-origin'),FRONT);
  const before = calls;
  const rejected = await fetch(base+'/health',{headers:{Origin:'https://untrusted.example'}});
  assert.equal(rejected.status,403); assert.equal(calls,before);
 });
 await test('session headers and bodies survive; forwarded host headers cannot change the upstream', async () => {
  const r = await fetch(base+'/vk/exchange',{method:'POST',headers:{Origin:FRONT,'Content-Type':'application/json',Authorization:'Bearer fixture-token',apikey:'fixture-key',Cookie:'fixture=cookie','X-Forwarded-Host':'untrusted.example'},body:'{"ticket":"fixture"}'});
  const echo = await r.json();
  assert.equal(echo.body,'{"ticket":"fixture"}');
  assert.equal(echo.headers.origin,FRONT); assert.equal(echo.headers.authorization,'Bearer fixture-token');
  assert.equal(echo.headers.cookie,'fixture=cookie'); assert.equal(echo.headers.apikey,'fixture-key');
  assert.equal(echo.headers['x-forwarded-host'],undefined);
  assert.equal(r.headers.get('access-control-allow-origin'),FRONT);
 });
 await test('VK redirects are returned to the browser, with secure host cookies', async () => {
  const r = await fetch(base+'/vk/start',{redirect:'manual'});
  assert.equal(r.status,302); assert.equal(r.headers.get('location'),'https://id.vk.com/authorize?test=1');
  assert.match(r.headers.get('set-cookie'),/^__Host-krokodil_vk_flow=/);
  assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure/);
 });
 await test('large compressed responses retain every byte and correct transport headers', async () => {
  const r = await fetch(base+'/club-api/rest/v1/rpc/club_portal',{method:'POST',headers:{Origin:FRONT},body:'{}'});
  assert.equal(r.status,200); assert.equal(r.headers.get('content-encoding'),null);
  assert.equal(await r.text(),large);
 });
 await test('unknown routes and oversized bodies do not reach the upstream', async () => {
  const before = calls;
  assert.equal((await fetch(base+'/unknown')).status,404);
  assert.equal((await fetch(base+'/vk/exchange',{method:'POST',body:'x'.repeat(2100001)})).status,413);
  assert.equal(calls,before);
 });
 await test('absolute-form and backslash URLs cannot turn the gateway into an open proxy', async () => {
  for (const path of ['//untrusted.example/health','/\\untrusted.example/health','https://untrusted.example/health']) {
   const before = calls;
   const status = await new Promise((resolve,reject) => {
    const req = http.request(base,{path,method:'GET'},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
    req.on('error',reject);req.end();
   });
   assert.equal(status,400); assert.equal(calls,before);
  }
 });
 await test('an upstream stall returns a bounded error with club CORS', async () => {
  const r = await fetch(base+'/supabase-test',{headers:{Origin:FRONT}});
  assert.equal(r.status,502); assert.equal(r.headers.get('access-control-allow-origin'),FRONT);
  assert.match((await r.json()).message,/Не удалось связаться/);
 });
 await test('the public server origin is explicit, HTTPS-only, and contains no URL payload', () => {
  assert.equal(publicOrigin('https://krokodil.example/'),'https://krokodil.example');
  for(const value of ['http://krokodil.example','https://user:password@krokodil.example','https://krokodil.example/path','https://krokodil.example/?key=secret','https://krokodil.example/#fragment']) {
   assert.throws(()=>publicOrigin(value));
  }
 });
 await test('a successful sign-out preserves the upstream empty 204 response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null,{status:204});
  try {
   const r = await clubApi(new Request('https://gateway.example/club-api/auth/v1/logout',{
    method:'POST',headers:{Origin:FRONT,Authorization:'Bearer fixture-token'},body:'{}'
   }));
   assert.equal(r.status,204); assert.equal(await r.text(),'');
  } finally { globalThis.fetch = originalFetch; }
 });
 await test('VK authorization uses the configured gateway callback without changing the club frontend', async () => {
  const moduleUrl = new URL('../render/handlers/vk-start.mjs', import.meta.url).href;
  const script = `import startVK from ${JSON.stringify(moduleUrl)};
   const req = new Request('https://gateway.example/vk/start?challenge='+'a'.repeat(43)+'&client_state='+'b'.repeat(43));
   const result = await startVK(req);
   if(result.status!==302)process.exit(1);
   console.log(new URL(result.headers.get('location')).searchParams.get('redirect_uri'));`;
  const result = spawnSync(process.execPath,['--input-type=module','-e',script],{
   env:{...process.env,PUBLIC_SERVER_URL:'https://gateway.example',SUPABASE_SERVICE_ROLE_KEY:'fixture-only-not-a-real-key'},encoding:'utf8'
  });
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stdout.trim(),'https://gateway.example/vk/callback');
 });
} finally {
 gateway.closeAllConnections(); upstream.closeAllConnections();
 await Promise.all([new Promise(r=>gateway.close(r)),new Promise(r=>upstream.close(r))]);
}
