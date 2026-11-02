import {mkdir, copyFile, writeFile} from 'node:fs/promises';

const output = new URL('./dist/', import.meta.url);
await mkdir(new URL('server/', output), {recursive:true});
await mkdir(new URL('.onreza/', output), {recursive:true});
for (const name of ['gateway.mjs', 'server.mjs']) {
 await copyFile(new URL('../deplexo-gateway/'+name, import.meta.url), new URL('server/'+name, output));
}
await writeFile(new URL('server/package.json', output), JSON.stringify({private:true,type:'module',engines:{node:'22.x'}})+'\n');
const manifest = {
 version:2,
 layers:[{
  name:'gateway',target:'COMPUTE',directory:'server',entry:'server.mjs',
  runtime:{
   timeoutMs:180000,memoryMb:128,
   network:{
    schemaVersion:'COMPUTE_NETWORK_V1',exposure:'PUBLIC',
    ports:[{name:'http',protocol:'http',port:3000,binding:'primary'}],
    readiness:{protocol:'tcp',port:'http'},allowFrom:[]
   }
  }
 }],
 routes:[{pattern:'^/.*$',layer:'gateway',priority:0}],
 meta:{name:'Krokodil fixed-upstream gateway'}
};
await writeFile(new URL('.onreza/manifest.json', output), JSON.stringify(manifest,null,2)+'\n');
console.log('ONREZA gateway artifact ready; no credentials included');
