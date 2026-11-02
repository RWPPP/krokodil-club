import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../docs/admin-v1.js',import.meta.url),'utf8');
function setup({admin=true,count=3,confirmed=true}={}){
 const calls=[];
 const context={isAdmin:admin,busy:false,authSession:{access_token:'fixture'},
  document:{getElementById:()=>({value:'2026-11-09'})},dateLabel:d=>d,
  ensureSession:async()=>{},alert:m=>calls.push({alert:m}),confirm:m=>{calls.push({confirm:m});return confirmed},
  request:async(path,body)=>{calls.push({preview:body});return {cancelDayPlan:{count,token:'reviewed-plan'}}},
  mutate:async(action,payload)=>{calls.push({action,payload});return true}
 };
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function cancelBookingsForDay()')),context);
 return {calls,run:()=>context.cancelBookingsForDay()};
}
test('day cancellation previews and confirms the date and count before submitting the reviewed plan',async()=>{
 const {calls,run}=setup();await run();
 assert.equal(calls[0].preview.action,'preview_cancel_day');assert.equal(calls[0].preview.payload.date,'2026-11-09');
 assert.match(calls[1].confirm,/2026-11-09 \(3\)/);assert.match(calls[1].confirm,/все инструменты/);
 assert.equal(calls[2].action,'cancel_day');assert.equal(calls[2].payload.planToken,'reviewed-plan');assert.equal(calls[2].payload.date,'2026-11-09');
});
test('declining confirmation does not cancel bookings',async()=>{
 const {calls,run}=setup({confirmed:false});await run();assert.equal(calls.filter(c=>c.action).length,0);
});
test('empty days and non-admin UI calls do not submit cancellation',async()=>{
 const empty=setup({count:0});await empty.run();assert.equal(empty.calls.filter(c=>c.action).length,0);
 const student=setup({admin:false});await student.run();assert.equal(student.calls.length,0);
});
