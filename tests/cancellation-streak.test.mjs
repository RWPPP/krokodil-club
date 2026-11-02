import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const source=fs.readFileSync(new URL('../docs/v2.js',import.meta.url),'utf8');
const context={Date,Intl,Map,Set};vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function dayIndex('),source.indexOf('function safeImage')),context);
const streak=(dates,today,windows=[],cancelled=[])=>context.streakInfo(dates,today,windows,cancelled);
test('student cancellation leaves the original counter and deadline',()=>{
 const before=streak(['2026-11-01'],'2026-11-07');
 assert.equal(before.count,1);assert.equal(before.due,'2026-11-08');
 assert.equal(streak(['2026-11-01'],'2026-11-09').count,0);
});
test('admin guitar cancellation extends the deadline without adding a visit',()=>{
 const result=streak(['2026-11-01'],'2026-11-12',[],[{date:'2026-11-07',days:7}]);
 assert.equal(result.count,1);assert.equal(result.total,1);assert.equal(result.best,1);assert.equal(result.due,'2026-11-15');
 assert.equal(streak(['2026-11-01','2026-11-14'],'2026-11-15',[],[{date:'2026-11-07',days:7}]).count,2);
});
test('drum cancellation extends its existing two-week interval by 14 days',()=>{
 const result=streak(['2026-11-01'],'2026-11-25',[{date:'2026-11-01',days:14}],[{date:'2026-11-15',days:14}]);
 assert.equal(result.count,1);assert.equal(result.total,1);assert.equal(result.due,'2026-11-29');
});
test('a cancellation cannot revive an expired series or create a first visit',()=>{
 assert.equal(streak(['2026-11-01'],'2026-11-12',[],[{date:'2026-11-10',days:7}]).count,0);
 assert.equal(streak([],'2026-11-12',[],[{date:'2026-11-10',days:7}]).count,0);
});
