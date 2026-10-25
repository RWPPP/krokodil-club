function releaseOption(text,value){const option=document.createElement('option');option.textContent=text;option.value=value;return option}
let releaseMaintenance={mode:'off',message:''};
let maintenancePending=null;
function releaseMessage(state=releaseMaintenance){return state.message||(state.mode==='banner'?'На сайте ведутся технические работы. Некоторые функции могут быть временно недоступны.':'Настраиваем нашу музыкальную волну 💚 Скоро вернёмся')}
async function refreshMaintenance(){
 if(maintenancePending)return maintenancePending;
 maintenancePending=(async()=>{try{releaseMaintenance=await request('/rest/v1/rpc/club_maintenance',{},null);renderReleaseState();if(releaseMaintenance.mode==='full'&&initialLoading)await finishInitialLoad()}catch{}finally{maintenancePending=null}})();return maintenancePending;
}
function renderReleaseState(){
 let banner=document.getElementById('maintenanceBanner');
 if(!banner){banner=adminEl('div',undefined,'notice');banner.id='maintenanceBanner';banner.setAttribute('role','status');document.querySelector('.top').after(banner)}
 banner.hidden=releaseMaintenance.mode==='off';banner.textContent=releaseMessage()+(isAdmin&&releaseMaintenance.mode==='full'?' · Вам доступно управление сайтом.':'');
 let screen=document.getElementById('maintenanceScreen');
 if(!screen){screen=adminEl('section',undefined,'panel maintenance-screen');screen.id='maintenanceScreen';screen.append(adminEl('h2','Настраиваем нашу музыкальную волну 💚'),adminEl('p','', 'maintenance-message'),adminButton('Проверить снова',()=>refreshData()));document.getElementById('studentView').prepend(screen)}
 const full=releaseMaintenance.mode==='full'&&!isAdmin;document.body.classList.toggle('maintenance-full',full);screen.hidden=!full;screen.querySelector('p').textContent=releaseMessage();
 if(!isAdmin){document.getElementById('manualBookingDialog')?.remove();document.getElementById('releaseAdminPanel')?.remove();return}
 let panel=document.getElementById('releaseAdminPanel');
 if(!panel){panel=adminEl('section',undefined,'panel release-admin-panel');panel.id='releaseAdminPanel';
  panel.innerHTML='<div class="sectionhead"><h3>Управление сайтом · 1.1</h3><button id="manualBookingButton" type="button">Добавить запись</button></div><p id="releaseInstallNotice" class="notice" hidden>Для обновления 1.1 сначала установите SQL.</p><details><summary>Технические работы</summary><form id="maintenanceForm"><div class="field"><label for="maintenanceMode">Режим</label><select id="maintenanceMode"><option value="off">Выключен</option><option value="banner">Плашка · сайт работает</option><option value="full">Полный · запись закрыта</option></select></div><div class="field"><label for="maintenanceMessage">Сообщение посетителям</label><textarea id="maintenanceMessage" maxlength="500" rows="3" placeholder="Оставьте пустым для стандартного сообщения"></textarea></div><p class="sub">Администратор сохраняет доступ. При полном режиме новые заявки учеников блокируются в базе.</p><button id="maintenanceSave" type="submit">Сохранить режим</button><p id="maintenanceSaveStatus" role="status"></p></form></details>';
  document.getElementById('adminBookingsTab').prepend(panel);document.getElementById('manualBookingButton').onclick=()=>openManualBooking();
  panel.querySelector('details').addEventListener('toggle',()=>{if(panel.querySelector('details').open){document.getElementById('maintenanceMode').value=releaseMaintenance.mode;document.getElementById('maintenanceMessage').value=releaseMaintenance.message||''}});
  document.getElementById('maintenanceForm').onsubmit=async e=>{e.preventDefault();if(busy)return;const button=document.getElementById('maintenanceSave'),status=document.getElementById('maintenanceSaveStatus');button.disabled=true;busy=true;status.textContent='Сохраняем…';
   try{await ensureSession();const data=await request('/rest/v1/rpc/club_portal',{action:'maintenance_save',payload:{mode:document.getElementById('maintenanceMode').value,message:document.getElementById('maintenanceMessage').value}},authSession.access_token);renderPortal(data);await refreshMaintenance();status.textContent=releaseMaintenance.emergency?'Сохранено. В Render включён аварийный режим: для открытия сайта выключите MAINTENANCE_MODE.':'Режим сохранён.'}catch(err){status.textContent='Не удалось сохранить: '+err.message}finally{busy=false;button.disabled=false;updateBookingState()}
  };
 }
 const ready=portalData.releaseVersion==='1.1';document.getElementById('manualBookingButton').disabled=!ready;document.getElementById('maintenanceSave').disabled=!ready;document.getElementById('releaseInstallNotice').hidden=ready;
}
async function openManualBooking(booking=null,manual=null){
 if(!isAdmin||busy||portalData.releaseVersion!=='1.1')return;
 const monday=booking?.monday||selectedMonday();let students=[];
 try{await ensureSession();const data=await request('/rest/v1/rpc/club_portal',{action:'manual_students',payload:{}},authSession.access_token);if(!isAdmin)return;students=data.students||[]}catch(e){alert('Не удалось загрузить учеников: '+e.message);return}
 document.getElementById('manualBookingDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='manualBookingDialog';
 dialog.innerHTML='<div class="sectionhead"><h3></h3><button type="button" class="secondary" id="manualClose">Закрыть</button></div><p class="sub" id="manualWeek"></p><form id="manualForm"><div class="field"><label for="manualStudentSearch">Найти ученика</label><input id="manualStudentSearch" type="search" placeholder="Поиск по имени"></div><div class="field"><label for="manualStudent">Ученик</label><select id="manualStudent"></select></div><div class="field"><label for="manualName">Имя человека без аккаунта</label><input id="manualName" maxlength="60" required autocomplete="off"></div><div class="field"><label for="manualInstrument">Инструмент</label><select id="manualInstrument"><option value="acoustic">Акустическая гитара</option><option value="electric">Электрогитара</option><option value="bass">Бас-гитара</option><option value="drums">Барабаны</option></select></div><label class="checkline"><input id="manualOwn" type="checkbox">Свой инструмент</label><div class="field"><label for="manualSlot">Дата и время · Москва</label><select id="manualSlot" required></select></div><p class="sub">Для барабанов назначенное занятие закрепляется: общее перераспределение его не передвинет. Для человека без аккаунта запись видна администратору; привязка к аккаунту появится позже.</p><p id="manualStatus" role="status"></p><button id="manualSave" type="submit">Сохранить запись</button></form>';
 document.body.appendChild(dialog);dialog.querySelector('h3').textContent=booking?'Изменить ручную запись':'Добавить запись';dialog.querySelector('#manualWeek').textContent='Неделя с '+dateLabel(monday);dialog.querySelector('#manualClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
 const student=dialog.querySelector('#manualStudent'),name=dialog.querySelector('#manualName'),instrument=dialog.querySelector('#manualInstrument'),own=dialog.querySelector('#manualOwn'),slot=dialog.querySelector('#manualSlot'),search=dialog.querySelector('#manualStudentSearch');
 const selectedUser=manual?.userId||'';
 function fillStudents(){const keep=student.value||selectedUser;student.replaceChildren(releaseOption('Без аккаунта · ввести имя',''));for(const person of students.filter(p=>p.id===keep||p.name.toLocaleLowerCase('ru').includes(search.value.toLocaleLowerCase('ru')))){student.add(releaseOption(person.name+' · '+person.id.slice(0,8),person.id))}student.value=keep;syncStudent()}
 function syncStudent(){name.disabled=!!student.value;name.required=!student.value;if(student.value)name.value=students.find(p=>p.id===student.value)?.name||'';else if(!booking)name.value=''}
 search.oninput=fillStudents;student.onchange=syncStudent;
 name.value=booking?.name||'';fillStudents();if(booking){student.disabled=true;search.disabled=true;name.value=booking.name;instrument.value=booking.instrument;own.checked=!!booking.own}
 function fillSlots(){const chosen=slot.value||booking?.slotId,drums=instrument.value==='drums';own.disabled=drums;if(drums)own.checked=false;slot.replaceChildren(releaseOption('Выберите дату и время',''));
  for(const s of slotsFor(weekParity(monday)).filter(s=>s.type===(drums?'drums':'guitar'))){const info=drumSlotInfo(s.id,monday);if(info&&!info.past)slot.add(releaseOption(info.label,s.id))}if([...slot.options].some(o=>o.value===chosen))slot.value=chosen;
 }
 instrument.onchange=fillSlots;fillSlots();
 dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();if(busy||!isAdmin)return;const save=dialog.querySelector('#manualSave'),status=dialog.querySelector('#manualStatus');save.disabled=true;busy=true;status.textContent='Проверяем места и сохраняем…';
  try{await ensureSession();await request('/rest/v1/rpc/club_api',{action:booking?'manual_update':'manual_create',payload:{monday,userId:student.value||null,name:name.value.trim(),instrument:instrument.value,own:own.checked,slotId:slot.value,...(booking?{id:booking.id,revision:manual.revision}:{})}},authSession.access_token);dialog.close();await refreshData();alert('Запись сохранена')}catch(err){status.textContent='Не удалось сохранить: '+err.message}finally{busy=false;save.disabled=false;updateBookingState();renderReleaseState()}
 };dialog.showModal();
}


