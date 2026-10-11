import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
export const UPSTREAM='https://vfuhtmpjcshnsjticuzu.supabase.co';
export const PUBLIC_KEY='sb_publishable_krImotWHN9WdJriG2p60eQ_tk_xLbHi';
export const COOKIE='__Host-krokodil_vk_flow';
export function settings(){
 const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!service)throw Error('В Render не настроен SUPABASE_SERVICE_ROLE_KEY');
 return {service,site:'https://krokodil-proxy-test.onrender.com',app:'54816699'};
}
export function seal(data,key){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',createHash('sha256').update(key).digest(),iv);const ciphertext=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),ciphertext]).toString('base64url')}
export function unseal(value,key){const raw=Buffer.from(value,'base64url');if(raw.length<29)throw Error('Invalid cookie');const cipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(key).digest(),raw.subarray(0,12));cipher.setAuthTag(raw.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(raw.subarray(28)),cipher.final()]).toString('utf8'))}
export function cookie(value,maxAge=600){return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`}
export function readCookie(req){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||''}
export function safeJSON(data){return JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')}
export async function jsonRequest(url,options={}){
 const res=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(15000)});
 let data;try{data=await res.json()}catch{throw Error('Сервис входа временно недоступен')}
 if(!res.ok||data.error)throw Error('Сервис входа не подтвердил запрос');return data;
}
export function adminRequest(path,method='POST',body){const {service}=settings();return jsonRequest(UPSTREAM+path,{method,headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})})}

export const FRONTEND='https://rwppp.github.io/krokodil-club/';
export const FRONT_ORIGIN=new URL(FRONTEND).origin;
