const u2={own:null,viewer:null,students:[],pending:false,edit:null,draft:null,viewerSerial:0};
function u2El(tag,text,cls){return adminEl(tag,text,cls)}
function u2Button(text,fn,cls='small secondary'){const b=adminButton(text,fn,cls);b.disabled=u2.pending;return b}
function u2BookingMessage(text){const el=document.getElementById('u2BookingStatus');if(el)el.textContent=text}
function u2DrumsAllowed(){const next=portalData?.studentCard?.nextDrumMonday;return !next||selectedMonday()>=next}
function renderU2Selection(){const el=document.getElementById('u2Selection');if(!el)return;const inst=document.getElementById('instrument').value;el.textContent=!inst?'Выберите инструмент и время':!selected.length?'Выберите время ниже':inst==='drums'?'Подходящих вариантов: '+selected.length:drumSlotLabel(selected[0],selectedMonday())}
function renderU2WeekNav(){
 const current=currentBookingMonday(),chosen=selectedMonday(),offset=Math.round((Date.parse(chosen)-Date.parse(current))/(7*86400000));
 let nav=document.getElementById('u2WeekNav');if(!nav){const legacy=document.getElementById('studentWeek0')?.parentElement;if(!legacy)return;legacy.hidden=true;nav=u2El('div',undefined,'u2-week-nav');nav.id='u2WeekNav';nav.setAttribute('aria-label','Выбор недели');legacy.after(nav)}
 nav.replaceChildren();const previous=u2Button('←',()=>setWeek(offset-1)),next=u2Button('→',()=>setWeek(offset+1));previous.setAttribute('aria-label','Предыдущая неделя');next.setAttribute('aria-label','Следующая неделя');previous.disabled=offset<=0;next.disabled=offset>=2;
 const label=u2El('div');label.append(u2El('strong',dateLabel(chosen)+' — '+dateLabel(shiftBookingDate(chosen,6))),u2El('small',offset===0?'Текущая неделя · только просмотр':'Запись открыта'),u2El('small',weekParity(chosen)==='odd'?'Нечётная неделя':'Чётная неделя','sub'));nav.append(previous,label,next);
}
function instrumentIcon(inst){const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('viewBox','0 0 32 32');el.setAttribute('class','u2-instrument-icon');el.setAttribute('aria-hidden','true');
 const shapes={drums:'<path d="M7 5 26 27M25 5 6 27" stroke="#dba760" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="6" cy="4" rx="2" ry="3" fill="#f4d49d"/><ellipse cx="26" cy="4" rx="2" ry="3" fill="#f4d49d"/>',acoustic:'<path d="m18 15 9-11" stroke="#ddb37b" stroke-width="4"/><path d="M17 12C10 7 9 14 6 15-2 19 7 32 14 26c2-2 8-4 3-10Z" fill="#dba760"/><circle cx="12" cy="19" r="3" fill="#302619"/>',electric:'<path d="m17 16 10-12" stroke="#dbd0b8" stroke-width="3"/><path d="m16 10 1 8 7-1-7 11-12-4 1-10 6 6Z" fill="#ed654b"/><path d="m9 23 10-10" stroke="#fff" stroke-width="1"/>',bass:'<path d="m16 16 11-13" stroke="#c6baa2" stroke-width="3"/><path d="M14 12 14 20 21 16C24 27 10 32 5 24 1 17 6 12 10 17Z" fill="#65bea4"/><path d="m8 24 13-16m-12 17 13-16" stroke="#fff" stroke-width=".6"/>'};el.innerHTML=shapes[inst]||shapes.acoustic;return el}
function instrumentHeading(inst){const el=u2El('span',undefined,'u2-instrument');el.append(instrumentIcon(inst),document.createTextNode(INSTR[inst]||inst));return el}
function u2Section(title){const section=u2El('section',undefined,'panel u2-section');section.appendChild(u2El('h3',title));return section}
function u2DrawBookings(root,card){
 root.replaceChildren();if(!card?.bookings?.length){root.appendChild(u2El('p','Нет заявок на текущую и будущие недели.','sub'));return}
 for(const b of card.bookings){const box=u2El('article',undefined,'lesson-card');box.append(instrumentHeading(b.instrument),u2El('p','Неделя с '+dateLabel(b.monday)));
  if(b.instrument==='drums'){const details=u2El('details');details.appendChild(u2El('summary','Твоя доступность · '+(b.preferences||[]).length+' вариантов'));const list=u2El('ul');for(const id of b.preferences||[])list.appendChild(u2El('li',drumSlotLabel(id,b.monday)));details.appendChild(list);box.appendChild(details);box.appendChild(u2El('p',b.status==='assigned'&&b.slotId?'Назначенное занятие: '+drumSlotLabel(b.slotId,b.monday):b.status==='waitlist'?'Ожидает свободного места':'Ждёт распределения'))}
  else box.appendChild(u2El('p',drumSlotLabel(b.slotId,b.monday)));root.appendChild(box);
 }
}
function u2DrawHistory(root,card,viewer=false){
 root.replaceChildren();const rows=card?.history||[];if(!rows.length)root.appendChild(u2El('p','История занятий пока пуста.','sub'));
 for(const item of rows){const row=u2El('article',undefined,'u2-history-row');row.append(instrumentHeading(item.instrument),u2El('span',dateLabel(item.date)+(item.time?' · '+item.time:'')),u2El('strong',item.outcome==='attended'?'Посетил':item.outcome==='missed'?'Пропустил':'Нет отметки'));root.appendChild(row)}
 const offset=card?.historyOffset||0,total=card?.historyTotal||0;
 if(total>50){const pager=u2El('div',undefined,'admin-pager');const prev=u2Button('← Новее',()=>u2LoadCard(card.userId,Math.max(0,offset-50),viewer)),next=u2Button('Старее →',()=>u2LoadCard(card.userId,offset+50,viewer));prev.disabled=u2.pending||offset===0;next.disabled=u2.pending||offset+50>=total;pager.append(prev,u2El('span',`${offset+1}–${Math.min(offset+50,total)} из ${total}`),next);root.appendChild(pager)}
}
async function u2LoadCard(userId,offset=0,viewer=false){
 if(u2.pending||busy)return;const serial=++u2.viewerSerial;u2.pending=true;
 try{await ensureSession();const session=authSession;const data=await request('/rest/v1/rpc/club_portal',{action:'student_details',payload:{userId,historyOffset:offset}},session.access_token);if(session!==authSession||serial!==u2.viewerSerial)return;
  if(viewer){if(!isAdmin)return;u2.viewer=data.studentCard;u2RenderViewer()}else{portalData.studentCard=data.studentCard;u2.own=data.studentCard;u2RenderOwn()}
 }catch(e){alert('Не удалось загрузить кабинет: '+e.message)}finally{u2.pending=false;if(viewer&&isAdmin)u2RenderViewer();else if(!viewer&&portalData.profile)u2RenderOwn()}
}
async function u2TaskAction(action,payload){
 if(u2.pending||busy)return false;u2.pending=true;busy=true;++requestVersion;const status=document.getElementById('u2TaskStatus');if(status)status.textContent='Сохраняем…';document.querySelectorAll('#u2Tasks button').forEach(b=>b.disabled=true);
 try{await ensureSession();const session=authSession;const data=await request('/rest/v1/rpc/club_portal',{action,payload:{...payload,historyOffset:u2.own?.historyOffset||0}},session.access_token);if(session!==authSession)return false;portalData.studentCard=data.studentCard;u2.own=data.studentCard;u2.edit=null;u2.draft=null;u2.pending=false;u2RenderOwn();document.getElementById('u2TaskStatus').textContent='Изменения сохранены';return true}
 catch(e){if(status)status.textContent='Не удалось сохранить: '+e.message;return false}
 finally{u2.pending=false;busy=false;document.querySelectorAll('#u2Tasks button').forEach(b=>b.disabled=false);updateBookingState()}
}
function u2DrawTasks(root,card,editable){
 root.replaceChildren();root.appendChild(u2El('p',editable?'Здесь можно ставить себе задачи. Администратор клуба может их просматривать.':'Личные задачи ученика · только просмотр','sub'));
 if(editable){const form=u2El('form');form.innerHTML='<div class="field"><label for="u2TaskTitle">Задача</label><input id="u2TaskTitle" maxlength="200" required placeholder="Например, выучить перебор"></div><div class="field"><label for="u2TaskDue">Срок · необязательно</label><input id="u2TaskDue" type="date"></div><div class="u2-actions"><button type="submit">Сохранить задачу</button><button type="button" class="secondary" id="u2CancelTask" hidden>Отменить редактирование</button></div>';root.appendChild(form);
  if(u2.edit){form.querySelector('#u2TaskTitle').value=u2.edit.title;form.querySelector('#u2TaskDue').value=u2.edit.dueOn||'';form.querySelector('#u2CancelTask').hidden=false;form.querySelector('#u2CancelTask').onclick=()=>{u2.edit=null;u2.draft=null;u2DrawTasks(root,card,true)}}
  if(u2.draft&&u2.draft.id===(u2.edit?.id||null)){form.querySelector('#u2TaskTitle').value=u2.draft.title;form.querySelector('#u2TaskDue').value=u2.draft.dueOn;}
  form.oninput=()=>{u2.draft={id:u2.edit?.id||null,title:form.querySelector('#u2TaskTitle').value,dueOn:form.querySelector('#u2TaskDue').value}};
  form.onsubmit=e=>{e.preventDefault();u2TaskAction(u2.edit?'task_update':'task_create',{title:form.querySelector('#u2TaskTitle').value,dueOn:form.querySelector('#u2TaskDue').value,...(u2.edit?{id:u2.edit.id,revision:u2.edit.revision}:{})})};const status=u2El('p');status.id='u2TaskStatus';status.setAttribute('role','status');root.appendChild(status);
 }
 if(!card?.tasks?.length)root.appendChild(u2El('p','Задач пока нет.','sub'));
 for(const task of card?.tasks||[]){const row=u2El('article',undefined,'u2-task-row'+(task.completed?' u2-completed':''));row.append(u2El('strong',task.title),u2El('small',(task.completed?'Выполнено':'В работе')+(task.dueOn?' · до '+dateLabel(task.dueOn):'')));
  if(editable){const buttons=u2El('div',undefined,'u2-actions');buttons.append(u2Button(task.completed?'Вернуть в работу':'Выполнено',()=>u2TaskAction('task_update',{id:task.id,revision:task.revision,completed:!task.completed})),u2Button('Изменить',()=>{u2.edit=task;u2.draft={id:task.id,title:task.title,dueOn:task.dueOn||''};u2DrawTasks(root,card,true);document.getElementById('u2TaskTitle').focus()}),u2Button('Удалить',()=>{if(confirm('Удалить задачу «'+task.title+'»?'))u2TaskAction('task_delete',{id:task.id,revision:task.revision})},'small danger'));row.appendChild(buttons)}root.appendChild(row);
 }
}
function u2RenderOwn(){const card=u2.own;const own=document.getElementById('u2Own');if(!own)return;own.hidden=!portalData.profile;if(own.hidden)return;u2DrawBookings(document.getElementById('u2Availability'),card);u2DrawHistory(document.getElementById('u2History'),card);u2DrawTasks(document.getElementById('u2Tasks'),card,true);
 const note=document.getElementById('u2DrumRule');note.textContent=card?.nextDrumMonday?'Барабаны: после посещения пропускаем следующую неделю. Новая запись доступна на неделю с '+dateLabel(card.nextDrumMonday)+'. Уже поданные заявки сохраняются.':'Барабаны: после посещённого занятия следующую неделю пропускаем. Гитарные занятия доступны по прежним правилам.';
}
function u2RenderViewer(){const root=document.getElementById('u2StudentViewer');if(!root||!isAdmin)return;root.replaceChildren();const card=u2.viewer;if(!card)return;root.append(u2El('h3',card.profile?.name||'Кабинет ученика'),u2El('p','Просмотр администратором · изменения задач недоступны','sub'));
 const bookings=u2Section('Заявки и доступность'),history=u2Section('История занятий'),tasks=u2Section('Личные задачи');for(const section of [bookings,history,tasks]){const body=u2El('div');section.appendChild(body);root.appendChild(section)}
 u2DrawBookings(bookings.lastChild,card);u2DrawHistory(history.lastChild,card,true);u2DrawTasks(tasks.lastChild,card,false);
 const progress=streakInfo(card.visitDates||[]);root.prepend(u2El('p','Всего посещено: '+(card.attendedTotal||0)+' · дней с занятиями: '+progress.total+' · текущая серия: '+progress.count+' · лучшая серия: '+progress.best,'sub'));
}
function u2RenderDirectory(){const list=document.getElementById('u2StudentList'),search=document.getElementById('u2StudentSearch');if(!list||!isAdmin)return;list.replaceChildren();const matches=u2.students.filter(p=>p.name.toLocaleLowerCase('ru').includes(search.value.toLocaleLowerCase('ru')));for(const p of matches.slice(0,50))list.appendChild(u2Button(p.name+' · '+p.id.slice(0,8),()=>u2LoadCard(p.id,0,true)));if(matches.length>50)list.appendChild(u2El('p','Уточните имя: показаны первые 50 совпадений.','sub'));if(!matches.length)list.appendChild(u2El('p','Совпадений нет.','sub'))}
function renderUpdate2(data){
 let own=document.getElementById('u2Own');if(!own){own=u2El('div',undefined,'u2-cabinet-grid');own.id='u2Own';for(const [id,title]of [['u2Availability','Заявки и доступность'],['u2History','История занятий'],['u2Tasks','Мои задачи']]){const section=u2Section(title),body=u2El('div');body.id=id;section.appendChild(body);own.appendChild(section)}const note=u2El('p',undefined,'notice');note.id='u2DrumRule';own.prepend(note);document.getElementById('cabinetGrid').after(own)}
 u2.own=data.studentCard||null;u2RenderOwn();
 document.querySelectorAll('#upcomingLessons .lesson-card').forEach((row,index)=>{const b=data.upcoming[index];if(b)row.prepend(instrumentIcon(b.instrument))});
 let admin=document.getElementById('u2AdminStudents');if(!isAdmin){admin?.remove();u2.students=[];u2.viewer=null;u2.own=data.profile?u2.own:null;u2.edit=null;u2.draft=null;++u2.viewerSerial;own.hidden=!data.profile;if(!data.profile){for(const id of ['u2Availability','u2History','u2Tasks'])document.getElementById(id).replaceChildren()}return}
 if(!admin){admin=u2El('details',undefined,'panel u2-section u2-student-directory');admin.id='u2AdminStudents';admin.open=true;admin.appendChild(u2El('summary','Кабинеты учеников'));admin.innerHTML+='<p class="sub">Записи, история и личные задачи · просмотр без редактирования</p><button id="u2LoadStudents" type="button">Загрузить учеников</button><div class="field"><label for="u2StudentSearch">Поиск по имени</label><input id="u2StudentSearch" type="search" placeholder="Имя ученика"></div><div id="u2StudentList" class="u2-actions"></div><div id="u2StudentViewer"></div>';document.getElementById('adminStudentsTab').prepend(admin);
  document.getElementById('u2StudentSearch').oninput=u2RenderDirectory;
  document.getElementById('u2LoadStudents').onclick=async()=>{const button=document.getElementById('u2LoadStudents');button.disabled=true;try{await ensureSession();const session=authSession;const result=await request('/rest/v1/rpc/club_portal',{action:'manual_students',payload:{}},session.access_token);if(!isAdmin||session!==authSession)return;u2.students=result.students||[];u2RenderDirectory()}catch(e){alert('Не удалось загрузить учеников: '+e.message)}finally{button.disabled=false}};
 }
}
const MUSIC_FACTS=['В обычной гитаре шесть струн, а в стандартной бас-гитаре — четыре.','Метроном помогает держать ровный темп: его скорость указывают в ударах в минуту.','В октаве западной равномерно темперированной системы — 12 полутонов.','Открытые струны стандартно настроенной гитары: ми, ля, ре, соль, си, ми — от толстой к тонкой.','Ударные могут задавать ритм и одновременно создавать мелодию — например, ксилофон.','Пауза — часть музыки: у неё тоже есть определённая длительность.'];
let musicFactIndex=Math.floor(Math.random()*MUSIC_FACTS.length),musicFactTimer=null;
function stopMusicFacts(){if(musicFactTimer!==null){clearInterval(musicFactTimer);musicFactTimer=null}}
function startMusicFacts(){const loader=document.getElementById('siteLoader');if(!loader)return;const fact=u2El('p',MUSIC_FACTS[musicFactIndex],'u2-music-fact');fact.id='u2MusicFact';loader.querySelector('.loading-content').appendChild(fact);musicFactTimer=setInterval(()=>{if(loader.hidden){stopMusicFacts();return}musicFactIndex=(musicFactIndex+1)%MUSIC_FACTS.length;fact.textContent=MUSIC_FACTS[musicFactIndex]},8000)}
startMusicFacts();
