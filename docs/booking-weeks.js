// Выбор по календарной дате: чётность определяет шаблон, а не саму неделю.
let viewedWeekMonday=null;
function shiftBookingDate(date,days){const value=new Date(date+'T00:00:00Z');value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10)}
function currentBookingMonday(now=new Date()){
 const date=moscowDate(now),value=new Date(date+'T00:00:00Z'),day=value.getUTCDay();
 return shiftBookingDate(date,-((day+6)%7));
}
function weekParity(monday){const index=Math.round((Date.parse(monday+'T00:00:00Z')-Date.parse(FIRST_STUDY_MONDAY+'T00:00:00Z'))/(7*86400000))+1;return index%2===0?'even':'odd'}
function isBookingWeekOpen(){const current=currentBookingMonday(),selected=selectedMonday();return selected===shiftBookingDate(current,7)||selected===shiftBookingDate(current,14)}
function refreshWeekControls(){
 const current=currentBookingMonday(),selected=selectedMonday();
 for(let offset=0;offset<3;offset++){
  const monday=shiftBookingDate(current,offset*7),parity=weekParity(monday),label=['Текущая · просмотр','Следующая','Через две недели'][offset];
  for(const prefix of ['studentWeek','adminWeek']){
   const button=document.getElementById(prefix+offset);if(!button)continue;
   button.textContent=(prefix==='adminWeek'&&offset===0?'Текущая':label)+' · с '+dateLabel(monday)+' · '+(parity==='odd'?'нечётная':'чётная');
   button.classList.toggle('active',selected===monday);button.setAttribute('aria-pressed',String(selected===monday));button.dataset.parity=parity;
  }
 }
 const adminLabel=document.getElementById('adminWeekLabel');if(adminLabel)adminLabel.textContent='С '+dateLabel(selected)+' · '+(weekParity(selected)==='odd'?'нечётная':'чётная');
}
function updateBookingState(){
 const open=isBookingWeekOpen(),button=document.getElementById('submitBtn'),notice=document.getElementById('bookingWindowNotice');
 button.disabled=!open||!onlineReady||busy;
 button.textContent=open?(document.getElementById('instrument').value==='drums'?'Отправить доступность':'Подтвердить запись'):'Текущая неделя — только просмотр';
 document.getElementById('scheduleTitle').textContent=open?(document.getElementById('instrument').value==='drums'?'Когда ты можешь прийти?':'Выбирай время'):'Расписание текущей недели';
 if(!open)document.getElementById('scheduleNote').textContent='Неделя уже началась. Запись закрыта, расписание доступно для просмотра.';
 else document.getElementById('scheduleNote').textContent=document.getElementById('instrument').value==='drums'?'Отметь все подходящие будущие слоты, даже занятые: при распределении возможны перестановки. Это предпочтения, не подтверждённая запись.':'Выбери один слот на неделю.';
 if(notice)notice.textContent=open?'Запись на неделю с '+dateLabel(selectedMonday())+'. Также доступна запись на неделю после неё.':'Запись на текущую неделю закрыта. Расписание и ваши записи доступны для просмотра. Для записи выберите одну из двух следующих недель.';
}
