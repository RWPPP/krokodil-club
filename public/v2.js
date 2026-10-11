let portalData={profile:null,upcoming:[],visitDates:[],attendance:[],recentBookings:[],theme:{}};
const DEFAULT_THEME={background:'#0a0a0a',panel:'#141414',text:'#f6f1e6',accent:'#22c05b',danger:'#f4301e',font:'system',radius:22,logo:'',banner:'',mascotHappy:'',mascotWarning:'',mascotOff:''};
let savedTheme={...DEFAULT_THEME},themePreview=false;
function moscowDate(now=new Date()){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const f=t=>p.find(x=>x.type===t).value;return `${f('year')}-${f('month')}-${f('day')}`}
function dayIndex(date){return Math.floor(Date.parse(date+'T00:00:00Z')/86400000)}
function dateLabel(date){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'))}
function daysWord(n){const a=n%10,b=n%100;return a===1&&b!==11?'день':a>=2&&a<=4&&(b<12||b>14)?'дня':'дней'}
function streakInfo(dates,today=moscowDate()){
 const days=[...new Set(dates.filter(d=>d<=today))].sort();let count=0,best=0,last=null;
 for(const d of days){count=last===null||dayIndex(d)-dayIndex(last)>7?1:count+1;best=Math.max(best,count);last=d}
 const age=last===null?null:dayIndex(today)-dayIndex(last),active=last!==null&&age<=7;
 return {count:active?count:0,best,total:days.length,active,remaining:active?7-age:null,last,due:last?new Date((dayIndex(last)+7)*86400000).toISOString().slice(0,10):null};
}
function safeImage(value){return typeof value==='string'&&(value.startsWith('data:image/png;base64,')||value.startsWith('data:image/jpeg;base64,')||value.startsWith('data:image/webp;base64,')||value.startsWith('/assets/'))}
function applyTheme(theme){
 const t={...DEFAULT_THEME,...theme},root=document.documentElement;
 for(const [key,variable] of Object.entries({background:'--bg',panel:'--panel',text:'--text',accent:'--yellow',danger:'--red'})){if(/^#[\da-f]{6}$/i.test(t[key]))root.style.setProperty(variable,t[key])}
 if(/^#[\da-f]{6}$/i.test(t.accent)){root.style.setProperty('--green',t.accent);root.style.setProperty('--green2',t.accent)}
 const fonts={system:'Onest, Segoe UI, system-ui, sans-serif',serif:'Georgia, serif',rounded:'Trebuchet MS, Arial, sans-serif'};
 root.style.setProperty('--club-font',fonts[t.font]||fonts.system);root.style.setProperty('--club-radius',Math.min(40,Math.max(0,Number(t.radius)||0))+'px');
 const logo=document.getElementById('uploadedLogo');logo.hidden=!safeImage(t.logo);document.querySelector('.brand .logo').classList.toggle('hidden',!logo.hidden);if(!logo.hidden)logo.src=t.logo;
 const banner=document.getElementById('clubBanner');banner.hidden=!safeImage(t.banner);if(!banner.hidden)banner.src=t.banner;
 document.body.style.background=t.background;document.body.style.color=t.text;
 renderStreak(t);
}
function renderStreak(theme=savedTheme){
 const info=streakInfo(portalData.visitDates),state=!info.active?'Off':info.remaining<=2?'Warning':'Happy';
 const img=document.getElementById('streakMascot'),custom=theme['mascot'+state];img.src=safeImage(custom)?custom:'/assets/cheburashka-'+state.toLowerCase()+'.svg';
 document.getElementById('streakBox').classList.toggle('streak-off',!info.active);
 document.getElementById('streakCount').textContent=info.active?'🔥 '+info.count+' '+daysWord(info.count)+' занятий в серии':'Огонёк ждёт тебя';
 document.getElementById('streakMessage').textContent=info.active?'Посети занятие до '+dateLabel(info.due)+' включительно, чтобы сохранить серию.':'Посети занятие — после отметки администратора огонёк загорится.';
 document.getElementById('streakBest').textContent='Всего дней занятий: '+info.total+' · Лучшая серия: '+info.best;
}
function renderPortal(data){
 portalData=data;savedTheme={...DEFAULT_THEME,...data.theme};if(!themePreview)applyTheme(savedTheme);
 const profile=data.profile,photo=document.getElementById('profileAvatar'),name=document.getElementById('profileName');
 name.textContent=profile?.name||'Личный кабинет';photo.hidden=!(profile?.avatar&&/^https:\/\//.test(profile.avatar));if(!photo.hidden)photo.src=profile.avatar;
 document.getElementById('profileHint').textContent=profile?'Твои занятия и музыкальный прогресс':'Войди через ВК, чтобы видеть свои занятия на любом устройстве.';
 document.getElementById('vkLoginBtn').classList.toggle('hidden',!!profile);document.getElementById('studentLogout').classList.toggle('hidden',!profile);
 document.getElementById('cabinetGrid').classList.toggle('hidden',!profile);
 document.getElementById('themeEditor').classList.toggle('hidden',!data.admin);document.getElementById('attendanceEditor').classList.toggle('hidden',!data.admin);
 const input=document.getElementById('name');input.readOnly=!!profile;if(profile)input.value=profile.name.slice(0,60);
 document.getElementById('bookingLoginHint').classList.toggle('hidden',!!profile||data.admin);
 const future=document.getElementById('upcomingLessons');future.innerHTML='';
 if(!data.upcoming.length)future.innerHTML='<p class="sub">Будущих записей пока нет. Выбери занятие во вкладке «Запись».</p>';
 for(const b of data.upcoming){
  const card=document.createElement('div');card.className='lesson-card';
  const confirmed=b.status==='assigned'&&b.slotId,delta=dayIndex(b.date)-dayIndex(moscowDate());
  const when=confirmed?(delta===0?'Сегодня':delta===1?'Завтра':'Через '+delta+' '+daysWord(delta)):b.status==='waitlist'?'В списке ожидания':'Ждёт распределения';
  card.innerHTML=`<strong>${esc(INSTR[b.instrument]||b.instrument)}</strong><div>${confirmed?esc(dateLabel(b.date))+' · '+esc(b.time):'Неделя с '+esc(dateLabel(b.monday))+' · '+(b.preferences||[]).length+' подходящих слотов'}</div><div class="countdown">${esc(when)}</div>`;future.appendChild(card);
 }
 renderAttendance(data);renderStreak(themePreview?readThemeForm():savedTheme);
 if(!themePreview)fillThemeForm(savedTheme);
}
function renderAttendance(data){
 const list=document.getElementById('attendanceBookings');list.innerHTML='';
 if(!data.recentBookings.length)list.innerHTML='<p class="sub">Пока нет состоявшихся занятий за последние 90 дней.</p>';
 for(const b of data.recentBookings){const row=document.createElement('div');row.className='attendance-row';row.innerHTML=`<div><strong>${esc(b.name)}</strong><div>${esc(dateLabel(b.date))} · ${esc(b.time)} · ${esc(INSTR[b.instrument])}</div></div>`;const button=document.createElement('button');button.className='small secondary';button.disabled=!!b.attended;button.textContent=b.attended?'✓ Посещение отмечено':'Посетил занятие';button.onclick=()=>portalAction('attendance',{bookingId:b.id});row.appendChild(button);list.appendChild(row)}
 const history=document.getElementById('attendanceHistory');history.innerHTML='';
 for(const a of data.attendance){const row=document.createElement('div');row.className='attendance-row';row.innerHTML=`<div>${esc(a.name)} · ${esc(dateLabel(a.date))} · ${esc(INSTR[a.instrument]||a.instrument)}</div>`;const button=document.createElement('button');button.className='small danger';button.textContent='Отменить отметку';button.onclick=()=>{if(confirm('Отменить посещение? Серия будет пересчитана.'))portalAction('undo_attendance',{id:a.id})};row.appendChild(button);history.appendChild(row)}
}
async function loadPortal(){const session=authSession;const data=await request('/rest/v1/rpc/club_portal',{action:'snapshot',payload:{}},session.access_token);if(session===authSession)renderPortal(data)}
async function portalAction(action,payload){
 if(busy)return;busy=true;try{await ensureSession();const data=await request('/rest/v1/rpc/club_portal',{action,payload},authSession.access_token);if(action==='save_theme'||action==='restore_theme')themePreview=false;renderPortal(data);if(action.includes('theme'))document.getElementById('themeStatus').textContent='Оформление сохранено для всех посетителей'}catch(e){alert(e.message)}finally{busy=false}
}
async function startVKLogin(){
 const btn=document.getElementById('vkLoginBtn');btn.disabled=true;
 try{await ensureSession();const r=await fetch('/vk/start',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+authSession.access_token},body:'{}'});const data=await r.json();if(!r.ok)throw Error(data.message||'Вход не настроен');const target=new URL(data.url);if(target.protocol!=='https:'||target.hostname!=='id.vk.com')throw Error('Неверный адрес входа');location.assign(target.href)}catch(e){alert(e.message);btn.disabled=false}
}
function showCabinet(){showView('cabinet')}
function fillThemeForm(t){for(const key of ['background','panel','text','accent','danger','font','radius'])document.getElementById('theme-'+key).value=t[key];for(const key of ['logo','banner','mascotHappy','mascotWarning','mascotOff'])document.getElementById('image-'+key).dataset.value=t[key]||''}
function readThemeForm(){const t={};for(const key of ['background','panel','text','accent','danger','font'])t[key]=document.getElementById('theme-'+key).value;t.radius=Number(document.getElementById('theme-radius').value);for(const key of ['logo','banner','mascotHappy','mascotWarning','mascotOff'])t[key]=document.getElementById('image-'+key).dataset.value||'';return t}
function previewTheme(){themePreview=true;applyTheme(readThemeForm());document.getElementById('themeStatus').textContent='Предпросмотр только в твоём браузере. Нажми «Применить для всех», чтобы сохранить.'}
function cancelThemePreview(){themePreview=false;fillThemeForm(savedTheme);applyTheme(savedTheme);document.getElementById('themeStatus').textContent='Предпросмотр отменён'}
function clearThemeImage(key){document.getElementById('image-'+key).value='';document.getElementById('image-'+key).dataset.value='';previewTheme()}
async function uploadThemeImage(input,key){
 const file=input.files?.[0];if(!file)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000){alert('Выбери PNG, JPEG или WebP размером до 10 МБ');input.value='';return}
 try{const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');const scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let data=canvas.toDataURL('image/webp',.8);if(data.length>180000)data=canvas.toDataURL('image/webp',.45);if(data.length>180000)throw Error('Картинка слишком сложная. Выбери изображение меньшего размера');input.dataset.value=data;previewTheme()}catch(e){alert(e.message);input.value=''}
}
