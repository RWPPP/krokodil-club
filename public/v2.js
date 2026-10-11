let portalData={profile:null,upcoming:[],visitDates:[],attendance:[],recentBookings:[],theme:{}};
const COLOR_FIELDS=[["background", "Фон страницы", "#0a0a0a"], ["panel", "Панели", "#141414"], ["panel2", "Карточки", "#1b1b1b"], ["text", "Основной текст", "#f6f1e6"], ["muted", "Второстепенный текст", "#9a9588"], ["line", "Границы", "#2c2c2c"], ["accent", "Основные кнопки", "#22c05b"], ["accentHover", "Основные кнопки при наведении", "#35d871"], ["buttonText", "Текст основных кнопок", "#0a0a0a"], ["danger", "Кнопки удаления", "#f4301e"], ["dangerHover", "Удаление при наведении", "#ff5240"], ["dangerText", "Текст удаления", "#ffffff"], ["secondaryText", "Текст дополнительных кнопок", "#f6f1e6"], ["secondaryHover", "Фон дополнительных кнопок при наведении", "#f6f1e6"], ["secondaryHoverText", "Их текст при наведении", "#0a0a0a"], ["navText", "Текст верхних кнопок", "#f6f1e6"], ["navActive", "Фон активной верхней кнопки", "#f6f1e6"], ["navActiveText", "Текст активной верхней кнопки", "#0a0a0a"], ["navHover", "Верхние кнопки при наведении", "#1b1b1b"], ["weekBar", "Фон переключателя недель", "#1b1b1b"], ["oddWeek", "Нечётная неделя — фон", "#ffd92e"], ["oddWeekText", "Нечётная неделя — текст", "#0a0a0a"], ["evenWeek", "Чётная неделя — фон", "#ffd92e"], ["evenWeekText", "Чётная неделя — текст", "#0a0a0a"], ["weekHover", "Недельные кнопки при наведении", "#2a2a2a"], ["heroBackground", "Главный блок — фон", "#000000"], ["heroText", "Главный блок — заголовок", "#f6f1e6"], ["heroSubtitle", "Главный блок — описание", "#cfc9bb"], ["heroEyebrow", "Подписи над заголовками", "#2ed3b0"], ["heroNote", "Главный блок — примечание", "#35d871"], ["inputBackground", "Поля — фон", "#0d0d0d"], ["inputText", "Поля — текст", "#f6f1e6"], ["inputPlaceholder", "Поля — подсказки", "#6b675d"], ["focus", "Цвет фокуса", "#22c05b"], ["hintBackground", "Подсказки — фон", "#0e1627"], ["hintText", "Подсказки — текст", "#c9d8ff"], ["hintBorder", "Подсказки — границы", "#2f6bff"], ["guitarColor", "Название гитарных занятий", "#35d871"], ["drumsColor", "Название барабанных занятий", "#ff7a66"], ["slotText", "Кнопки слотов — текст", "#f6f1e6"], ["slotBorder", "Кнопки слотов — границы", "#4a4a4a"], ["slotHover", "Кнопки слотов при наведении", "#262626"], ["slotSelected", "Выбранный слот — фон", "#22c05b"], ["slotSelectedText", "Выбранный слот — текст", "#0a0a0a"], ["tagBackground", "Метки — фон", "#262626"], ["tagText", "Метки — текст", "#f6f1e6"], ["noticeBackground", "Уведомления — фон", "#222016"], ["noticeText", "Уведомления — текст", "#f3e49a"], ["noticeBorder", "Уведомления — границы", "#ffd92e"], ["weekCounterBackground", "Счётчик недель — фон", "#1b1b1b"], ["weekCounterText", "Счётчик недель — текст", "#f6f1e6"], ["weekCounterAccent", "Счётчик недель — число", "#ffd92e"], ["footerText", "Подвал — текст", "#9a9588"], ["footerAccent", "Подвал — акцент", "#35d871"], ["tableHeader", "Таблица — заголовки", "#9a9588"], ["tableText", "Таблица — текст", "#f6f1e6"], ["statBookings", "Статистика записей", "#2f6bff"], ["statDrums", "Статистика барабанов", "#f4301e"], ["statWait", "Статистика ожидания", "#ffd92e"], ["blue", "Синий цвет иллюстраций", "#2f6bff"], ["teal", "Бирюзовый цвет иллюстраций", "#2ed3b0"], ["lav", "Сиреневый акцент", "#b3a8ff"], ["dayOdd0Accent", "Понедельник: акцент", "#2f6bff"], ["dayOdd0Background", "Понедельник: фон карточки", "#1b1b1b"], ["dayOdd0Text", "Понедельник: текст", "#f6f1e6"], ["dayOdd0Header", "Понедельник: фон заголовка", "#1b1b1b"], ["dayOdd1Accent", "Вторник: акцент", "#f4301e"], ["dayOdd1Background", "Вторник: фон карточки", "#1b1b1b"], ["dayOdd1Text", "Вторник: текст", "#f6f1e6"], ["dayOdd1Header", "Вторник: фон заголовка", "#1b1b1b"], ["dayOdd2Accent", "Среда: акцент", "#22c05b"], ["dayOdd2Background", "Среда: фон карточки", "#1b1b1b"], ["dayOdd2Text", "Среда: текст", "#f6f1e6"], ["dayOdd2Header", "Среда: фон заголовка", "#1b1b1b"], ["dayOdd3Accent", "Четверг: акцент", "#2ed3b0"], ["dayOdd3Background", "Четверг: фон карточки", "#1b1b1b"], ["dayOdd3Text", "Четверг: текст", "#f6f1e6"], ["dayOdd3Header", "Четверг: фон заголовка", "#1b1b1b"], ["dayOdd4Accent", "Пятница: акцент", "#b3a8ff"], ["dayOdd4Background", "Пятница: фон карточки", "#1b1b1b"], ["dayOdd4Text", "Пятница: текст", "#f6f1e6"], ["dayOdd4Header", "Пятница: фон заголовка", "#1b1b1b"], ["dayOdd5Accent", "Суббота: акцент", "#ffd92e"], ["dayOdd5Background", "Суббота: фон карточки", "#1b1b1b"], ["dayOdd5Text", "Суббота: текст", "#f6f1e6"], ["dayOdd5Header", "Суббота: фон заголовка", "#1b1b1b"], ["dayEven0Accent", "Понедельник: акцент", "#2f6bff"], ["dayEven0Background", "Понедельник: фон карточки", "#1b1b1b"], ["dayEven0Text", "Понедельник: текст", "#f6f1e6"], ["dayEven0Header", "Понедельник: фон заголовка", "#1b1b1b"], ["dayEven1Accent", "Вторник: акцент", "#f4301e"], ["dayEven1Background", "Вторник: фон карточки", "#1b1b1b"], ["dayEven1Text", "Вторник: текст", "#f6f1e6"], ["dayEven1Header", "Вторник: фон заголовка", "#1b1b1b"], ["dayEven2Accent", "Среда: акцент", "#22c05b"], ["dayEven2Background", "Среда: фон карточки", "#1b1b1b"], ["dayEven2Text", "Среда: текст", "#f6f1e6"], ["dayEven2Header", "Среда: фон заголовка", "#1b1b1b"], ["dayEven3Accent", "Четверг: акцент", "#2ed3b0"], ["dayEven3Background", "Четверг: фон карточки", "#1b1b1b"], ["dayEven3Text", "Четверг: текст", "#f6f1e6"], ["dayEven3Header", "Четверг: фон заголовка", "#1b1b1b"], ["dayEven4Accent", "Пятница: акцент", "#b3a8ff"], ["dayEven4Background", "Пятница: фон карточки", "#1b1b1b"], ["dayEven4Text", "Пятница: текст", "#f6f1e6"], ["dayEven4Header", "Пятница: фон заголовка", "#1b1b1b"], ["dayEven5Accent", "Суббота: акцент", "#ffd92e"], ["dayEven5Background", "Суббота: фон карточки", "#1b1b1b"], ["dayEven5Text", "Суббота: текст", "#f6f1e6"], ["dayEven5Header", "Суббота: фон заголовка", "#1b1b1b"]];
const IMAGE_FIELDS={"logo": "Логотип целиком: крокодил вместе с названием", "navStudent": "Кнопка «Запись на занятия»", "navCabinet": "Кнопка «Личный кабинет»", "navAdmin": "Кнопка «Администратор»", "hero": "Весь блок «Запишись на свою волну»", "mascotHappy": "Персонаж: радуется", "mascotWarning": "Персонаж: серия заканчивается", "mascotOff": "Персонаж: огонёк потух"};
const DEFAULT_THEME={...Object.fromEntries(COLOR_FIELDS.map(([key,label,value])=>[key,value])),font:"system",radius:22,...Object.fromEntries(Object.keys(IMAGE_FIELDS).map(key=>[key,""]))};
let savedTheme={...DEFAULT_THEME},activeTheme={...DEFAULT_THEME},themePreview=false;
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
 const t={...DEFAULT_THEME,...theme};activeTheme=t;const root=document.documentElement;
 for(const [key] of COLOR_FIELDS)root.style.setProperty('--theme-'+key,/^#[0-9a-f]{6}$/i.test(t[key])?t[key]:DEFAULT_THEME[key]);
 for(const [key,name] of Object.entries({background:'bg',panel:'panel',panel2:'panel2',text:'text',muted:'muted',line:'line',accent:'green',accentHover:'green2',danger:'red',blue:'blue',teal:'teal',lav:'lav',weekCounterAccent:'yellow'}))root.style.setProperty('--'+name,t[key]);
 const fonts={system:'Onest, Segoe UI, system-ui, sans-serif',serif:'Georgia, serif',rounded:'Trebuchet MS, Arial, sans-serif'};
 root.style.setProperty('--club-font',fonts[t.font]||fonts.system);root.style.setProperty('--club-radius',Math.min(40,Math.max(0,Number(t.radius)||0))+'px');
 const logo=document.getElementById('uploadedLogo');logo.hidden=!safeImage(t.logo);document.getElementById('defaultBrand').hidden=!logo.hidden;if(!logo.hidden)logo.src=t.logo;
 for(const [key,id] of Object.entries({navStudent:'studentTab',navCabinet:'cabinetTab',navAdmin:'adminTab'})){const button=document.getElementById(id),img=button.querySelector('img'),label=button.querySelector('span');img.hidden=!safeImage(t[key]);label.hidden=!img.hidden;button.classList.toggle('has-image',!img.hidden);if(!img.hidden)img.src=t[key]}
 const image=document.getElementById('heroImage'),hero=document.getElementById('mainHero');image.hidden=!safeImage(t.hero);hero.classList.toggle('custom-hero',!image.hidden);if(!image.hidden)image.src=t.hero;
 document.body.style.background=t.background;document.body.style.color=t.text;
 applyScheduleColors();renderStreak(t);
}
function applyScheduleColors(){
 const t=activeTheme,parity=typeof week!=='undefined'&&week==='even'?'Even':'Odd';
 document.querySelectorAll('#schedule .day').forEach((card,i)=>{const prefix='day'+parity+i;card.style.setProperty('--c',t[prefix+'Accent']);card.style.background=t[prefix+'Background'];card.style.color=t[prefix+'Text'];const head=card.querySelector('.dayhead');if(head)head.style.background=t[prefix+'Header']});
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
 renderAttendance(data);renderStreak(activeTheme);
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
function buildThemeEditor(){
 const colorGroup=(title,items)=>'<details><summary>'+title+'</summary><div class="theme-grid">'+items.map(([key,label])=>`<div class="field"><label for="theme-${key}">${label}</label><input id="theme-${key}" type="text" maxlength="7" pattern="#[0-9A-Fa-f]{6}" placeholder="#RRGGBB" spellcheck="false" onchange="previewTheme()" aria-describedby="hexHelp"></div>`).join('')+'</div></details>';
 const colors=document.getElementById('themeColors');colors.innerHTML=colorGroup('Основные цвета и элементы',COLOR_FIELDS.filter(([k])=>!k.startsWith('day')))+colorGroup('Дни нечётной недели',COLOR_FIELDS.filter(([k])=>k.startsWith('dayOdd')))+colorGroup('Дни чётной недели',COLOR_FIELDS.filter(([k])=>k.startsWith('dayEven')));
 document.getElementById('themeImages').innerHTML=Object.entries(IMAGE_FIELDS).map(([key,label])=>`<div class="field"><label for="image-${key}">${label}</label><input id="image-${key}" type="file" accept="image/png,image/jpeg,image/webp" onchange="uploadThemeImage(this,'${key}')"><button class="small secondary" onclick="clearThemeImage('${key}')">Стандартный вид</button></div>`).join('');
}
function fillThemeForm(t){buildThemeEditorOnce();for(const [key] of COLOR_FIELDS)document.getElementById('theme-'+key).value=t[key];for(const key of ['font','radius'])document.getElementById('theme-'+key).value=t[key];for(const key of Object.keys(IMAGE_FIELDS))document.getElementById('image-'+key).dataset.value=t[key]||''}
let themeEditorBuilt=false;
function buildThemeEditorOnce(){if(!themeEditorBuilt){buildThemeEditor();themeEditorBuilt=true}}
function readThemeForm(){const t={};for(const [key,label] of COLOR_FIELDS){const input=document.getElementById('theme-'+key),value=input.value.trim();if(!/^#[0-9a-f]{6}$/i.test(value)){input.focus();throw Error(label+': введи HEX-код, например #22C05B')}t[key]=value.toUpperCase()}t.font=document.getElementById('theme-font').value;t.radius=Number(document.getElementById('theme-radius').value);if(!Number.isFinite(t.radius)||t.radius<0||t.radius>40)throw Error('Скругление: число от 0 до 40');for(const key of Object.keys(IMAGE_FIELDS))t[key]=document.getElementById('image-'+key).dataset.value||'';if(new TextEncoder().encode(JSON.stringify(t)).length>1900000)throw Error('Суммарный размер оформления слишком большой. Уменьши размер одного из файлов.');return t}
function previewTheme(){try{const t=readThemeForm();themePreview=true;applyTheme(t);document.getElementById('themeStatus').textContent='Предпросмотр только у тебя. Нажми «Применить для всех», чтобы сохранить.'}catch(e){document.getElementById('themeStatus').textContent=e.message}}
function saveTheme(){try{portalAction('save_theme',{theme:readThemeForm()})}catch(e){alert(e.message)}}
function cancelThemePreview(){themePreview=false;fillThemeForm(savedTheme);applyTheme(savedTheme);document.getElementById('themeStatus').textContent='Предпросмотр отменён'}
function clearThemeImage(key){document.getElementById('image-'+key).value='';document.getElementById('image-'+key).dataset.value='';previewTheme()}
async function uploadThemeImage(input,key){
 const file=input.files?.[0];if(!file)return;
 const limit=key==='hero'?1000000:180000;
 try{
  if(!Object.hasOwn(IMAGE_FIELDS,key))throw Error('Неизвестная картинка');
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Выбери PNG, JPEG или WebP');
  if(Math.ceil(file.size/3)*4+50>limit)throw Error(key==='hero'?'Главная картинка слишком большая: нужен файл до 730 КБ. Качество автоматически не уменьшается.':'Картинка слишком большая: нужен файл до 130 КБ. Качество автоматически не уменьшается.');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Не удалось прочитать картинку'));reader.readAsDataURL(file)});
  if(typeof data!=='string'||data.length>limit||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data))throw Error('Не удалось загрузить изображение');
  const bitmap=await createImageBitmap(file);bitmap.close();
  // Original bytes: no canvas resizing or re-encoding.
  input.dataset.value=data;previewTheme();
 }catch(e){alert(e.message);input.value=''}
}

let initialLoading=true,loadingAttempt=0;
async function finishInitialLoad(){
 const attempt=++loadingAttempt;
 const images=['uploadedLogo','heroImage'].map(id=>document.getElementById(id)).concat([...document.querySelectorAll('.nav-image')]).filter(img=>!img.hidden&&img.src);
 let timer;
 try{await Promise.race([Promise.all(images.map(img=>typeof img.decode==='function'?img.decode():Promise.resolve())),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Изображения ещё загружаются')),15000)})]);
 if(attempt!==loadingAttempt)return;initialLoading=false;document.getElementById('siteLoader').hidden=true;document.body.classList.remove('site-loading');
 }finally{clearTimeout(timer)}
}
function showLoadingError(){document.getElementById('siteLoader').classList.add('loading-error');document.getElementById('loadingTitle').textContent='Волна немного задержалась 💚';document.getElementById('loadingSubtitle').textContent='Не удалось загрузить сайт. Проверь интернет и попробуй ещё раз.';document.getElementById('loadingRetry').hidden=false}
async function retryInitialLoad(){const button=document.getElementById('loadingRetry');button.hidden=true;document.getElementById('siteLoader').classList.remove('loading-error');document.getElementById('loadingTitle').textContent='Сейчас поймаем твою волну 💚';document.getElementById('loadingSubtitle').textContent='Загружаем музыкальный клуб';await refreshData()}
