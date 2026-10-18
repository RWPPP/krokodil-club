/* Административное распределение: все изменения повторно проверяет сервер. */
function drumSlotInfo(slotId,monday=selectedMonday()){
 const slot=getSlot(slotId);if(!slot)return null;
 const date=new Date(monday+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+slot.day);
 const day=date.toISOString().slice(0,10),start=slot.time.split(/[–—-]/)[0].trim();
 return {...slot,date:day,label:`${DAYS[slot.day]}, ${dateLabel(day)} · ${slot.time}`,past:Date.parse(day+'T'+start+':00+03:00')<=Date.now()};
}
function drumSlotLabel(slotId,monday){return slotId?(drumSlotInfo(slotId,monday)?.label||'Неизвестный слот'):'Без назначения'}
function drumPreferenceList(booking,monday){
 return [...new Set(booking.preferences||[])].map(id=>({id,info:drumSlotInfo(id,monday)})).sort((a,b)=>(a.info?.date||'').localeCompare(b.info?.date||'')||(a.info?.time||'').localeCompare(b.info?.time||''));
}
function renderDrumsRequests(root,bookings){
 root.innerHTML='';if(!bookings.length){root.innerHTML='<div class="empty">Заявок пока нет.</div>';return}
 const monday=selectedMonday();
 for(const b of [...bookings].sort((a,b)=>a.created-b.created)){
  const slot=b.slotId?getSlot(b.slotId):null,status=b.status==='assigned'?'Записан':b.status==='pending'?'Не распределён':'Ожидание';
  const row=document.createElement('div');row.className='person drum-request';
  const details=document.createElement('div');details.className='drum-details';
  details.innerHTML=`<strong>${esc(b.name)}</strong><small>${esc(INSTR[b.instrument])}${b.own?' · свой инструмент':''}</small><small>${esc(b.slotId?drumSlotLabel(b.slotId,monday):status)}</small>`;
  if(b.instrument==='drums'){
   const choices=drumPreferenceList(b,monday),days=new Set(choices.map(c=>c.info?.date).filter(Boolean)).size;
   const availability=document.createElement('details');availability.className='drum-availability';
   availability.innerHTML=`<summary>Доступность: ${days} дн. · ${choices.length} слотов</summary><ul>${choices.map(({id,info})=>{
    const occupant=bookings.find(x=>x.instrument==='drums'&&x.status==='assigned'&&x.slotId===id&&x.id!==b.id);
    const note=!info?'слот отсутствует':info.past?'уже началось / прошло':id===b.slotId?'назначен сюда':occupant?'занято: '+occupant.name:'свободно';
    return `<li>${esc(info?.label||id)}<small>${esc(note)}</small></li>`
   }).join('')}</ul>`;details.appendChild(availability);
   if(b.status!=='assigned'){const note=document.createElement('small');note.className='drum-wait';note.textContent=choices.some(c=>c.info&&!c.info.past)?'В ожидании: проверьте перераспределение с перестановками.':'Подходящих будущих слотов не осталось.';details.appendChild(note)}
  }
  const actions=document.createElement('div');actions.className='person-actions';
  if(b.instrument==='drums'){const button=document.createElement('button');button.className='small secondary';button.textContent=b.status==='assigned'?'Переназначить':'Назначить';button.onclick=()=>assignOne(b.id);actions.appendChild(button)}
  const remove=document.createElement('button');remove.className='small danger';remove.textContent='Удалить';remove.onclick=()=>removeBooking(b.id);actions.appendChild(remove);
  row.appendChild(details);row.appendChild(actions);root.appendChild(row);
 }
}
function openDrumsDialog(title){
 let dialog=document.getElementById('drumsDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='drumsDialog';document.body.appendChild(dialog)}
 dialog.innerHTML='<div class="drum-dialog-head"><h3></h3><button class="small secondary" type="button">Закрыть</button></div><div class="drum-dialog-body"></div>';
 dialog.querySelector('h3').textContent=title;dialog.querySelector('button').onclick=()=>dialog.close();
 if(!dialog.open)dialog.showModal();return {dialog,body:dialog.querySelector('.drum-dialog-body')};
}
async function assignOne(id){
 if(!isAdmin||busy)return;
 await refreshData();if(!onlineReady||!isAdmin)return;
 const b=db.bookings.find(x=>x.id===id);if(!b)return;const monday=selectedMonday();
 const {dialog,body}=openDrumsDialog('Назначение: '+b.name),current=drumSlotInfo(b.slotId,monday);
 const intro=document.createElement('p');intro.textContent='Сейчас: '+drumSlotLabel(b.slotId,monday);body.appendChild(intro);
 if(current?.past){const p=document.createElement('p');p.textContent='Занятие уже началось или прошло. Его нельзя переносить.';body.appendChild(p);return}
 const choices=drumPreferenceList(b,monday);
 for(const {id:slotId,info} of choices){
  const other=db.bookings.find(x=>x.id!==id&&x.instrument==='drums'&&x.status==='assigned'&&x.slotId===slotId),swap=other&&b.slotId&&(other.preferences||[]).includes(b.slotId)&&current&&!current.past;
  const box=document.createElement('div');box.className='drum-choice';
  const label=document.createElement('div');label.textContent=info?.label||slotId;box.appendChild(label);
  const note=document.createElement('small');note.textContent=slotId===b.slotId?'Текущее назначение':info?.past?'Занятие уже началось / прошло':other?'Занято: '+other.name:'Свободно';box.appendChild(note);
  const button=document.createElement('button');button.className='small secondary';button.textContent=other?(swap?'Обменять местами':'Занято — нужен пересчёт'):'Назначить сюда';
  button.disabled=!info||info.past||slotId===b.slotId||!!(other&&!swap);
  button.onclick=async()=>{
   const message=other?`Обменять занятия?\n${b.name} → ${info.label}\n${other.name} → ${current.label}`:`${b.name}\n${drumSlotLabel(b.slotId,monday)} → ${info.label}\nПодтвердить назначение?`;
   if(!confirm(message))return;
   if(selectedMonday()!==monday){alert('Выбрана другая неделя. Откройте назначение заново.');dialog.close();return}
   button.disabled=true;const ok=await mutate('reassign_drums',{id,slotId,expectedSlotId:b.slotId||null,...(other?{swapId:other.id}:{})});
   if(ok)dialog.close();else button.disabled=false;
  };box.appendChild(button);body.appendChild(box);
 }
 if(!choices.length){const p=document.createElement('p');p.textContent='У ученика не сохранены подходящие слоты.';body.appendChild(p)}
 const hint=document.createElement('p');hint.className='sub';hint.textContent='Если все варианты заняты, закройте окно и нажмите «Распределить барабаны»: алгоритм проверит цепочки перестановок. Вручную можно обменять два занятия, если оба ученика выбирали соответствующие слоты.';body.appendChild(hint);
}
async function autoAssignDrums(){
 if(!isAdmin||busy)return;busy=true;const monday=selectedMonday();
 try{
  await ensureSession();const result=await request('/rest/v1/rpc/club_api',{action:'preview_drums',payload:{monday}},authSession.access_token);
  if(monday!==selectedMonday()){alert('Выбрана другая неделя. Откройте распределение заново.');return}
  applySnapshot(result);const plan=result.drumsPlan;if(!plan)throw Error('Сначала выполните drums-update.sql в Supabase');
  const {dialog,body}=openDrumsDialog('Распределение — неделя с '+dateLabel(monday));
  const before=plan.rows.filter(r=>r.oldStatus==='assigned'&&r.oldSlotId).length,after=plan.rows.filter(r=>r.status==='assigned'&&r.slotId).length,changes=plan.rows.filter(r=>r.changed),waiting=plan.rows.filter(r=>r.status!=='assigned');
  const summary=document.createElement('p');summary.textContent=`Было назначено: ${before}. Будет: ${after}. Изменений: ${changes.length}. Без назначения: ${waiting.length}.`;body.appendChild(summary);
  const explanation=document.createElement('p');explanation.className='sub';explanation.textContent='Пока ничего не сохранено. Начавшиеся занятия и отмеченные посещения сохраняются. Существующие назначения меняются, когда это позволяет разместить ещё человека.';body.appendChild(explanation);
  for(const row of plan.rows){
   const box=document.createElement('div');box.className='drum-choice'+(row.changed?' drum-changed':'');
   const name=document.createElement('strong');name.textContent=row.name;box.appendChild(name);
   const p=document.createElement('p');p.textContent=row.changed?`${drumSlotLabel(row.oldSlotId,monday)} → ${drumSlotLabel(row.slotId,monday)}`:drumSlotLabel(row.slotId,monday);box.appendChild(p);
   if(row.reason){const reason=document.createElement('small');reason.textContent=row.reason;box.appendChild(reason)}
   body.appendChild(box);
  }
  const button=document.createElement('button');button.textContent=changes.length?'Применить изменения':'Изменений нет';button.disabled=!changes.length;
  button.onclick=async()=>{if(selectedMonday()!==monday){alert('Выбрана другая неделя. Откройте предпросмотр заново.');dialog.close();return}if(busy)return;button.disabled=true;const ok=await mutate('apply_drums',{planToken:plan.token});if(ok)dialog.close();else{button.disabled=true;const note=document.createElement('p');note.textContent='Не удалось применить. Закройте окно и получите новый предпросмотр.';body.appendChild(note)}};
  body.appendChild(button);
 }catch(e){alert(e.message)}finally{busy=false;updateBookingState()}
}
