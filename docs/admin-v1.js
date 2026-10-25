const adminUI={section:'bookings',portal:null,instrument:'all',period:'future',scope:'selected',search:'',page:0,visitState:'pending',visitInstrument:'all',visitPage:0,noticesOpen:false,notificationsOffset:0,highlight:null};
const ADMIN_PAGE_SIZE=15;
function adminEl(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el}
function adminButton(text,fn,className='small secondary'){const button=adminEl('button',text,className);button.type='button';button.onclick=fn;return button}
function adminInstrumentMatches(instrument,filter){return filter==='all'||(filter==='drums'?instrument==='drums':['acoustic','electric','bass'].includes(instrument))}
function adminLessonInfo(booking){
 const monday=booking.monday||selectedMonday();
 if(booking.slotId){const slot=drumSlotInfo(booking.slotId,monday);if(slot){const end=slot.time.split(/[–—-]/)[1]?.trim();return {...slot,ended:Date.parse(slot.date+'T'+end+':00+03:00')<=Date.now()}}}
 const options=(booking.preferences||[]).map(id=>drumSlotInfo(id,monday)).filter(Boolean);
 const deadlines=options.map(s=>Date.parse(s.date+'T'+s.time.split(/[–—-]/)[1].trim()+':00+03:00'));
 const last=deadlines.length?Math.max(...deadlines):Date.parse(shiftBookingDate(monday,6)+'T23:59:59+03:00');
 return {label:'Неделя с '+dateLabel(monday)+' · '+(booking.status==='waitlist'?'Ожидание':'Ждёт распределения'),ended:last<=Date.now(),past:false};
}
function adminAllBookings(){return Array.isArray(adminUI.portal?.adminBookings)?adminUI.portal.adminBookings:db.bookings.map(b=>({...b,monday:selectedMonday()}))}
function adminFilteredBookings(){
 return adminAllBookings().filter(b=>(adminUI.scope==='all'||b.monday===selectedMonday())&&adminInstrumentMatches(b.instrument,adminUI.instrument)&&(!adminUI.search||b.name.toLocaleLowerCase('ru').includes(adminUI.search.toLocaleLowerCase('ru')))&&
  (adminUI.period==='all'||adminLessonInfo(b).ended===(adminUI.period==='past'))).sort((a,b)=>adminUI.period==='past'?b.monday.localeCompare(a.monday)||b.created-a.created:a.monday.localeCompare(b.monday)||a.created-b.created);
}
function adminPager(root,total,page,onPage){root.replaceChildren();const pages=Math.ceil(total/ADMIN_PAGE_SIZE);if(pages<=1)return;
 const previous=adminButton('← Назад',()=>onPage(page-1)),next=adminButton('Далее →',()=>onPage(page+1));previous.disabled=page<=0;next.disabled=page>=pages-1;root.append(previous,adminEl('span',`${page+1} / ${pages}`),next);
}
function setAdminSection(section){if(!['bookings','attendance','design'].includes(section))return;adminUI.section=section;renderAdminWorkspace()}
function setAdminRequestFilter(key,value){if(!['instrument','period','scope','search'].includes(key))return;adminUI[key]=value;if(key==='period'&&value==='past'){adminUI.scope='all';document.getElementById('requestScope').value='all'}adminUI.page=0;renderAdminRequests()}
function setAdminAttendanceFilter(key,value){if(key==='state')adminUI.visitState=value;else adminUI.visitInstrument=value;adminUI.visitPage=0;renderAdminVisits(adminUI.portal)}
function renderAdminWorkspace(){
 const workspace=document.getElementById('adminWorkspace');workspace.hidden=!isAdmin;document.getElementById('adminUpdateNotice').hidden=!isAdmin||!adminUI.portal?.admin||adminUI.portal.adminVersion===1;
 for(const [key,suffix] of [['bookings','Bookings'],['attendance','Attendance'],['design','Design']]){
  const active=adminUI.section===key;document.getElementById('admin'+suffix+'Tab').hidden=!active;const tab=document.getElementById('adminTab'+suffix);tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.setAttribute('aria-controls','admin'+suffix+'Tab');
 }
 renderAdminBell();
}
async function adminPrepareWeek(monday){
 const offset=(Date.parse(monday)-Date.parse(currentBookingMonday()))/(7*86400000);if(![0,1,2].includes(offset)){alert('Архивная запись доступна только для просмотра.');return false}
 if(selectedMonday()!==monday){setWeek(offset);await refreshData()}
 return onlineReady&&isAdmin;
}
function renderAdminRequests(){
 const root=document.getElementById('requests');if(!root)return;root.replaceChildren();
 if(!isAdmin){document.getElementById('requestCount').textContent='';document.getElementById('requestsPager').replaceChildren();return}
 const rows=adminFilteredBookings();adminUI.page=Math.min(adminUI.page,Math.max(0,Math.ceil(rows.length/ADMIN_PAGE_SIZE)-1));
 document.getElementById('requestCount').textContent=`Найдено заявок: ${rows.length}. ${adminUI.scope==='selected'?'Неделя с '+dateLabel(selectedMonday()):'Все недели и архив за 90 дней'}.`;
 for(const b of rows.slice(adminUI.page*ADMIN_PAGE_SIZE,(adminUI.page+1)*ADMIN_PAGE_SIZE)){
  const monday=b.monday||selectedMonday(),info=adminLessonInfo(b),row=adminEl('div',undefined,'person admin-booking-row');row.dataset.bookingId=b.id;if(adminUI.highlight===b.id)row.classList.add('admin-highlight');
  const details=adminEl('div',undefined,'admin-booking-details');details.append(adminEl('strong',b.name),adminEl('small',INSTR[b.instrument]||b.instrument),adminEl('small',info.label));
  if(b.outcome)details.append(adminEl('small',b.outcome==='missed'?'Пропустил занятие':'✓ Посетил занятие',b.outcome==='missed'?'admin-missed':'admin-attended'));
  else if(info.ended)details.append(adminEl('small','Занятие прошло'));
  if(b.instrument==='drums'){
   const choices=drumPreferenceList(b,monday),availability=adminEl('details',undefined,'drum-availability');availability.appendChild(adminEl('summary',`Доступность: ${new Set(choices.map(c=>c.info?.date).filter(Boolean)).size} дн. · ${choices.length} слотов`));const list=adminEl('ul');
   for(const choice of choices){const li=adminEl('li',choice.info?.label||choice.id);const other=adminAllBookings().find(o=>o.id!==b.id&&o.monday===monday&&o.instrument==='drums'&&o.status==='assigned'&&o.slotId===choice.id);li.appendChild(adminEl('small',choice.info?.past?'Началось / прошло':choice.id===b.slotId?'Назначен сюда':other?'Занято: '+other.name:'Свободно'));list.appendChild(li)}availability.appendChild(list);details.appendChild(availability);
  }
  const actions=adminEl('div',undefined,'person-actions'),offset=(Date.parse(monday)-Date.parse(currentBookingMonday()))/(7*86400000),editable=[0,1,2].includes(offset);
  const manual=portalData.manualBookings?.find(x=>x.id===b.id);
  if(manual){details.appendChild(adminEl('small',manual.userId?'Добавлено администратором':'Добавлено администратором · без аккаунта'));if(editable&&!info.past&&!info.ended&&!b.outcome){const edit=adminButton('Изменить',()=>openManualBooking(b,manual));edit.disabled=busy;actions.appendChild(edit)}}
  if(editable&&b.instrument==='drums'&&!info.ended&&!b.outcome){const button=adminButton(b.slotId?'Переназначить':'Назначить',async()=>{if(await adminPrepareWeek(monday))await assignOne(b.id)});button.disabled=busy||!!(b.slotId&&info.past);actions.appendChild(button)}
  if(editable){const button=adminButton('Удалить',async()=>{if(await adminPrepareWeek(monday))await removeBooking(b.id)},'small danger');button.disabled=busy;actions.appendChild(button)}
  row.append(details,actions);root.appendChild(row);
 }
 if(!rows.length)root.appendChild(adminEl('p','В этом разделе заявок нет. Можно изменить фильтры или выбрать все недели.','sub'));
 adminPager(document.getElementById('requestsPager'),rows.length,adminUI.page,page=>{adminUI.page=page;renderAdminRequests()});
}
renderDrumsRequests=function(){renderAdminRequests()};
function renderAdminVisits(data){
 const root=document.getElementById('attendanceBookings');root.replaceChildren();document.getElementById('attendanceHistory').replaceChildren();
 if(!data?.admin){document.getElementById('attendancePager').replaceChildren();return}
 const linked=new Set((data.recentBookings||[]).map(b=>b.id));
 const orphaned=(data.attendance||[]).filter(a=>!a.bookingId||!linked.has(a.bookingId)).map(a=>({id:'visit:'+a.id,name:a.name,date:a.date,time:'—',instrument:a.instrument,outcome:a.outcome||'attended',attendanceId:a.id}));
 const rows=[...(data.recentBookings||[]),...orphaned].filter(b=>adminInstrumentMatches(b.instrument,adminUI.visitInstrument)&&(adminUI.visitState==='all'||(adminUI.visitState==='pending'?!b.outcome:!!b.outcome)));
 adminUI.visitPage=Math.min(adminUI.visitPage,Math.max(0,Math.ceil(rows.length/ADMIN_PAGE_SIZE)-1));
 for(const b of rows.slice(adminUI.visitPage*ADMIN_PAGE_SIZE,(adminUI.visitPage+1)*ADMIN_PAGE_SIZE)){
  const row=adminEl('div',undefined,'attendance-row'),details=adminEl('div');details.append(adminEl('strong',b.name),adminEl('div',`${dateLabel(b.date)} · ${b.time} · ${INSTR[b.instrument]||b.instrument}`));const buttons=adminEl('div',undefined,'person-actions');
  if(b.outcome){details.appendChild(adminEl('small',b.outcome==='missed'?'Пропустил занятие':'✓ Посетил занятие',b.outcome==='missed'?'admin-missed':'admin-attended'));const undo=adminButton('Отменить отметку',()=>{if(confirm('Отменить отметку? Занятие вернётся в список ожидающих обработки, серия будет пересчитана.'))adminPortalAction('undo_attendance',{id:b.attendanceId})});undo.disabled=busy;buttons.appendChild(undo)}
  else{
   const attended=adminButton('Посетил занятие',()=>adminPortalAction('attendance',{bookingId:b.id}));
   const missed=adminButton('Пропустил занятие',()=>{if(confirm(`${b.name} пропустил(а) занятие ${dateLabel(b.date)}? Пропуск не засчитывается в огонёк.`))adminPortalAction('missed',{bookingId:b.id})});attended.disabled=busy;missed.disabled=busy||!b.canMiss;if(!b.canMiss)missed.title='Доступно после окончания занятия';buttons.append(attended,missed);
  }
  row.append(details,buttons);root.appendChild(row);
 }
 if(!rows.length)root.appendChild(adminEl('p',adminUI.visitState==='pending'?'Все доступные занятия обработаны 💚':'Нет занятий по выбранным фильтрам.','sub'));
 adminPager(document.getElementById('attendancePager'),rows.length,adminUI.visitPage,page=>{adminUI.visitPage=page;renderAdminVisits(data)});
}
renderAttendance=function(data){renderAdminVisits(data)};
const adminOriginalRenderPortal=renderPortal;
renderPortal=function(data){adminUI.portal=data;adminUI.notificationsOffset=data.notificationsOffset||0;adminOriginalRenderPortal(data);renderAdminRequests();renderAdminWorkspace()};
async function adminPortalAction(action,payload={}){
 if(busy||!isAdmin)return;busy=true;renderAdminVisits(adminUI.portal);renderAdminBell();renderAdminRequests();
 try{await ensureSession();const session=authSession;const data=await request('/rest/v1/rpc/club_portal',{action,payload:{notificationsOffset:adminUI.notificationsOffset,...payload}},session.access_token);if(authSession===session)renderPortal(data)}catch(e){alert(e.message)}finally{busy=false;renderAdminVisits(adminUI.portal);renderAdminBell();renderAdminRequests();updateBookingState()}
}
function toggleAdminNotifications(){adminUI.noticesOpen=!adminUI.noticesOpen;renderAdminBell()}
function adminCreatedLabel(value){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'}).format(new Date(value))+' МСК'}
async function openAdminNotice(notice){
 const requestPanel=document.getElementById('adminRequestsPanel');if(requestPanel)requestPanel.open=true;
 await adminPortalAction('notification_read',{id:notice.id});
 if(!notice.bookingId||!adminAllBookings().some(b=>b.id===notice.bookingId)){alert('Заявка удалена или уже вне архива. Данные на момент записи сохранены в уведомлении.');return}
 adminUI.scope='all';adminUI.period='all';adminUI.instrument='all';adminUI.search='';adminUI.highlight=notice.bookingId;adminUI.noticesOpen=false;
 for(const [id,value]of [['requestScope','all'],['requestPeriod','all'],['requestInstrument','all'],['requestSearch','']])document.getElementById(id).value=value;
 adminUI.page=Math.floor(adminFilteredBookings().findIndex(b=>b.id===notice.bookingId)/ADMIN_PAGE_SIZE);setAdminSection('bookings');renderAdminRequests();document.querySelector(`[data-booking-id="${notice.bookingId}"]`)?.scrollIntoView?.({block:'center',behavior:'smooth'});
}
function renderAdminBell(){
 const data=adminUI.portal,unread=isAdmin?(data?.notificationsUnread||0):0,badge=document.getElementById('adminUnreadCount'),bell=document.getElementById('adminBell'),panel=document.getElementById('adminNotificationPanel');
 badge.hidden=!unread;badge.textContent=unread>99?'99+':String(unread);bell.setAttribute('aria-label','Уведомления, непрочитанных: '+unread);bell.setAttribute('aria-expanded',String(adminUI.noticesOpen&&isAdmin));panel.hidden=!adminUI.noticesOpen||!isAdmin;
 const root=document.getElementById('adminNotificationsContent');root.replaceChildren();if(!isAdmin||!adminUI.noticesOpen)return;
 const all=adminButton('Отметить все прочитанными',()=>adminPortalAction('notifications_read_all',{throughId:data?.notificationsThroughId||'0'}));all.disabled=busy||!unread;root.appendChild(all);
 const items=data?.notifications||[];
 for(const n of items){const box=adminEl('article',undefined,'admin-notice'+(n.read?'':' admin-unread'));box.append(adminEl('strong',n.name),adminEl('div',INSTR[n.instrument]||n.instrument),adminEl('small','Записался(ась): '+adminCreatedLabel(n.createdAt)));
  if(n.slotId)box.appendChild(adminEl('p',drumSlotLabel(n.slotId,n.monday)));
  else{box.appendChild(adminEl('p','Доступность на неделю с '+dateLabel(n.monday)));const details=adminEl('details');details.appendChild(adminEl('summary',`Подходящие слоты: ${(n.preferences||[]).length}`));const list=adminEl('ul');for(const id of n.preferences||[])list.appendChild(adminEl('li',drumSlotLabel(id,n.monday)));details.appendChild(list);box.appendChild(details)}
  const buttons=adminEl('div',undefined,'person-actions'),open=adminButton('Открыть заявку',()=>openAdminNotice(n));open.disabled=busy;buttons.appendChild(open);
  if(!n.read){const read=adminButton('Прочитано',()=>adminPortalAction('notification_read',{id:n.id}));read.disabled=busy;buttons.appendChild(read)}box.appendChild(buttons);root.appendChild(box);
 }
 if(!items.length)root.appendChild(adminEl('p','Пока нет новых записей. Здесь появятся заявки, отправленные после установки обновления.','sub'));
 const offset=data?.notificationsOffset||0,total=data?.notificationsTotal||0;if(total>20){const pager=adminEl('div',undefined,'admin-pager');const prev=adminButton('← Новее',()=>adminPortalAction('snapshot',{notificationsOffset:Math.max(0,offset-20)})),next=adminButton('Старее →',()=>adminPortalAction('snapshot',{notificationsOffset:offset+20}));prev.disabled=busy||offset===0;next.disabled=busy||offset+20>=total;pager.append(prev,adminEl('span',`${offset+1}–${Math.min(offset+20,total)} из ${total}`),next);root.appendChild(pager)}
 root.appendChild(adminEl('p','Уведомления за последние 90 дней. Список обновляется вместе с данными сайта.','sub'));
}

document.querySelector('.admin-tabs').addEventListener('keydown',event=>{const tabs=[...document.querySelectorAll('.admin-tabs [role="tab"]')],index=tabs.indexOf(event.target);if(index<0)return;let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();setAdminSection(['bookings','attendance','design'][next]);tabs[next].focus()});
