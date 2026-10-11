import {randomBytes,createHash} from 'node:crypto';
import {settings,seal,cookie} from '../lib/auth-utils.mjs';
export default async function(req){
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
 if(req.method!=='GET')return Response.json({message:'Используйте кнопку входа на сайте'},{status:405,headers});
 try{const {service,site,app}=settings(),input=new URL(req.url),challenge=input.searchParams.get('challenge'),clientState=input.searchParams.get('client_state');
 if(!/^[A-Za-z0-9_-]{43}$/.test(challenge||'')||!/^[A-Za-z0-9_-]{43}$/.test(clientState||''))return Response.json({message:'Неверный запрос входа'},{status:400,headers});
 const state=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url');
 const flow={state,verifier,guest:null,challenge,clientState,expires:Date.now()+600000};
 const url=new URL('https://id.vk.com/authorize');url.search=new URLSearchParams({response_type:'code',client_id:app,redirect_uri:site+'/vk/callback',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 return new Response(null,{status:302,headers:{...headers,Location:url.href,'Set-Cookie':cookie(seal(flow,service))}});
 }catch{return Response.json({message:'Вход временно недоступен. Проверь серверный ключ в Render.'},{status:503,headers})}
}
