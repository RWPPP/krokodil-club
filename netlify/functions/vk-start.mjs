import {randomBytes,createHash} from 'node:crypto';
import {settings,seal,cookie,jsonRequest,UPSTREAM,PUBLIC_KEY} from '../lib/auth-utils.mjs';
export default async function(req){
 const noStore={'Cache-Control':'no-store'};
 if(req.method!=='POST')return Response.json({message:'Используйте кнопку входа на сайте'},{status:405,headers:noStore});
 const origin=req.headers.get('origin');if(origin!==new URL(req.url).origin)return Response.json({message:'Неверный источник запроса'},{status:403,headers:noStore});
 try{
  const {service,site,app}=settings();if(new URL(req.url).origin!==site)return Response.json({message:'Вход через ВК доступен на основном адресе клуба'},{status:400,headers:noStore});
  let guest=null;const token=req.headers.get('authorization');
  if(token){try{const u=await jsonRequest(UPSTREAM+'/auth/v1/user',{headers:{apikey:PUBLIC_KEY,Authorization:token}});if(u.is_anonymous)guest=u.id}catch{}}
  const state=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url');
  const flow={state,verifier,guest,expires:Date.now()+600000};
  const url=new URL('https://id.vk.com/authorize');
  url.search=new URLSearchParams({response_type:'code',client_id:app,redirect_uri:site+'/vk/callback',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
  return Response.json({url:url.href},{headers:{...noStore,'Set-Cookie':cookie(seal(flow,service))}});
 }catch(e){return Response.json({message:process.env.SUPABASE_SERVICE_ROLE_KEY?'Вход временно недоступен':e.message},{status:503,headers:noStore})}
}
export const config={path:'/vk/start'};
