import http from 'node:http';
import api from './handlers/club-api.mjs';
import start from './handlers/vk-start.mjs';
import callback from './handlers/vk-callback.mjs';
import {redeemTicket} from './lib/handoff.mjs';
import {FRONTEND,FRONT_ORIGIN,UPSTREAM} from './lib/auth-utils.mjs';
const SITE='https://krokodil-proxy-test.onrender.com';
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin,path=new URL(req.url,SITE).pathname;
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(origin===FRONT_ORIGIN){res.setHeader('Access-Control-Allow-Origin',FRONT_ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,apikey');res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS')}
 try{
  if(origin&&origin!==FRONT_ORIGIN&&origin!==SITE){res.writeHead(403);res.end('Forbidden origin');return}
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  if((path==='/'||path==='/health')&&req.method==='GET'){res.setHeader('Content-Type','text/plain; charset=utf-8');res.end('Сервер Render доступен 💚');return}
  if(path==='/supabase-test'&&req.method==='GET'){const r=await fetch(UPSTREAM+'/auth/v1/health',{redirect:'error',signal:AbortSignal.timeout(15000)});await r.body?.cancel();res.setHeader('Content-Type','text/plain; charset=utf-8');res.end('Render получил ответ Supabase 💚 HTTP '+r.status);return}
  if(!(path.startsWith('/club-api/')||['/vk/start','/vk/callback','/vk/exchange'].includes(path))){res.writeHead(404);res.end('Not found');return}
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2100000){res.writeHead(413);res.end('Request too large');return}chunks.push(chunk)}
  const body=Buffer.concat(chunks),headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);
  const request=new Request(new URL(req.url,SITE),{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body}:{})});
  let response;
  if(path==='/vk/exchange'){
   if(req.method!=='POST'||origin!==FRONT_ORIGIN)response=Response.json({message:'Неверный запрос'},{status:403});
   else{try{if(body.length>4096)throw Error('Неверный запрос');const input=JSON.parse(body.toString());response=Response.json(redeemTicket(input.ticket,input.verifier))}catch(e){response=Response.json({message:e.message},{status:400})}}
  }else response=await (path.startsWith('/club-api/')?api:path==='/vk/start'?start:callback)(request);
  res.statusCode=response.status;for(const [k,v]of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.setHeader('Content-Type','application/json');res.writeHead(502);res.end(JSON.stringify({message:'Сервер временно недоступен. Попробуй ещё раз.'}))}
});
server.requestTimeout=180000;
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Krokodil server ready'));
