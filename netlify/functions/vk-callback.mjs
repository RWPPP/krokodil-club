import {randomBytes} from 'node:crypto';
import {settings,unseal,readCookie,cookie,safeJSON,jsonRequest,adminRequest,UPSTREAM,PUBLIC_KEY} from '../lib/auth-utils.mjs';
function page(status,body,nonce){return new Response(body,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Set-Cookie':cookie('',0),'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`}})}
export default async function(req){
 const nonce=randomBytes(18).toString('base64url');
 try{
  if(req.method!=='GET')throw Error('Неверный запрос');
  const {service,site,app}=settings(),url=new URL(req.url);
  if(url.origin!==site)throw Error('Неверный адрес');
  const flow=unseal(readCookie(req),service);
  if(flow.expires<Date.now()||!flow.state||url.searchParams.get('state')!==flow.state)throw Error('Срок входа истёк');
  const code=url.searchParams.get('code'),device=url.searchParams.get('device_id');
  if(url.searchParams.get('error')||!code||!device)throw Error('Вход отменён');
  const query=new URLSearchParams({grant_type:'authorization_code',client_id:app,redirect_uri:site+'/vk/callback',code_verifier:flow.verifier,state:flow.state,device_id:device});
  const body=new URLSearchParams({code});if(process.env.VK_CLIENT_SECRET)body.set('client_secret',process.env.VK_CLIENT_SECRET);
  const tokens=await jsonRequest('https://id.vk.com/oauth2/auth?'+query,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  if(tokens.state!==flow.state||!tokens.access_token)throw Error('Не подтверждён вход');
  const info=await jsonRequest('https://id.vk.com/oauth2/user_info?client_id='+app,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({access_token:tokens.access_token})});
  const vk=info.user||info;const id=String(vk.user_id??tokens.user_id??'');
  if(!/^\d+$/.test(id)||String(tokens.user_id)!==id)throw Error('Неверный пользователь');
  const name=([vk.first_name,vk.last_name].filter(x=>typeof x==='string').join(' ').trim()||'Студент ВК').slice(0,120);
  const avatar=typeof vk.avatar==='string'&&vk.avatar.startsWith('https://')?vk.avatar:'';
  const existing=await adminRequest('/rest/v1/club_vk_identities?vk_id=eq.'+id+'&select=user_id','GET');
  let candidate=null;
  if(!existing.length){
   const email='vk-'+randomBytes(24).toString('hex')+'@accounts.krokodil.invalid';
   const created=await adminRequest('/auth/v1/admin/users','POST',{email,email_confirm:true,password:randomBytes(48).toString('base64url'),app_metadata:{club_identity:'vk'}});
   candidate=(created.user||created).id;if(!candidate)throw Error('Не удалось создать кабинет');
  }
  let target;
  try{target=await adminRequest('/rest/v1/rpc/club_bind_vk','POST',{vk:id,candidate,display:name,photo:avatar,guest:flow.guest})}
  catch(e){if(candidate)try{await adminRequest('/auth/v1/admin/users/'+candidate,'DELETE')}catch{}throw e}
  if(candidate&&candidate!==target)try{await adminRequest('/auth/v1/admin/users/'+candidate,'DELETE')}catch{}
  const userData=await adminRequest('/auth/v1/admin/users/'+target,'GET'),user=userData.user||userData;
  if(user.app_metadata?.club_identity!=='vk'||!user.email?.endsWith('@accounts.krokodil.invalid'))throw Error('Неверный профиль');
  const link=await adminRequest('/auth/v1/admin/generate_link','POST',{type:'magiclink',email:user.email});
  if(!link.hashed_token)throw Error('Не удалось создать сессию');
  const session=await jsonRequest(UPSTREAM+'/auth/v1/verify',{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({token_hash:link.hashed_token,type:'magiclink'})});
  if(session.user?.id!==target||!session.access_token)throw Error('Неверная сессия');
  const client={access_token:session.access_token,refresh_token:session.refresh_token,expires_at:Date.now()/1000+session.expires_in};
  return page(200,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Вход в Крокодил</title><body><p>Вход выполнен. Открываем кабинет…</p><script nonce="${nonce}">try{localStorage.setItem('krokodil_session_v1',JSON.stringify(${safeJSON(client)}));location.replace('/?cabinet=1')}catch(e){document.body.textContent='Разрешите хранение данных сайта в браузере и повторите вход.'}</script></body></html>`,nonce);
 }catch{return page(400,'<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Вход не завершён</title><body><h1>Не удалось завершить вход</h1><p>Вернитесь на сайт и повторите. Если ошибка повторяется, сообщите администратору: нужно проверить настройки VK ID и серверного ключа.</p><a href="/">Вернуться в Крокодил</a></body></html>',nonce)}
}
export const config={path:'/vk/callback'};
