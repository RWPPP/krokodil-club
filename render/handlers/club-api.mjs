const UPSTREAM='https://vfuhtmpjcshnsjticuzu.supabase.co';
const PUBLIC_KEY='sb_publishable_krImotWHN9WdJriG2p60eQ_tk_xLbHi';
const routes=new Set(['/auth/v1/signup','/auth/v1/token','/auth/v1/logout','/rest/v1/rpc/club_api','/rest/v1/rpc/club_portal']);
const response=(status,message)=>Response.json({message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async function handler(req){
 if(req.method!=='POST')return response(405,'Используйте POST');
 const url=new URL(req.url),path=url.pathname.slice('/club-api'.length);
 if(!url.pathname.startsWith('/club-api/')||!routes.has(path))return response(404,'Неизвестный запрос');
 const origin=req.headers.get('origin');
 if(origin&&origin!==url.origin&&origin!=='https://rwppp.github.io')return response(403,'Запрос должен идти с сайта клуба');
 const query=url.searchParams;
 if(path==='/auth/v1/token'){
  if([...query.keys()].some(k=>k!=='grant_type')||!['password','refresh_token'].includes(query.get('grant_type')))return response(400,'Неверный способ входа');
 }else if(url.search)return response(400,'Неверные параметры');
 const limit=path==='/rest/v1/rpc/club_portal'?2100000:16384;
 if(Number(req.headers.get('content-length')||0)>limit)return response(413,'Слишком большой запрос');
 const body=await req.text();
 if(new TextEncoder().encode(body).length>limit)return response(413,'Слишком большой запрос');
 try{const parsed=JSON.parse(body);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return response(400,'Неверные данные')}catch{return response(400,'Неверные данные')}
 const headers={'Content-Type':'application/json',apikey:PUBLIC_KEY};
 const authorization=req.headers.get('authorization');
 if(authorization){if(!authorization.startsWith('Bearer ')||authorization.length>8192)return response(400,'Неверная сессия');headers.Authorization=authorization}
 try{
  const upstream=await fetch(UPSTREAM+path+url.search,{method:'POST',headers,body,redirect:'error',signal:AbortSignal.timeout(25000)});
  const data=await upstream.text();
  if(!(upstream.headers.get('content-type')||'').includes('application/json'))return response(502,'База временно недоступна. Повторите позже');
  return new Response(data,{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return response(502,'Не удалось связаться с базой. Обновите страницу через минуту')}
}
export const config={path:'/club-api/*'};
