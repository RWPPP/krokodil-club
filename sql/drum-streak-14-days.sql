begin;
CREATE OR REPLACE FUNCTION public.club_student_card(p_user uuid, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_admin boolean;v_profile jsonb;v_history jsonb;v_total integer;v_today date:=(now() at time zone 'Europe/Moscow')::date;
begin
 if auth.uid() is null or p_user is null then raise exception 'Войдите на сайт';end if;
 select exists(select 1 from public.club_admins a where a.user_id=auth.uid()) into v_admin;
 if p_user<>auth.uid() and not v_admin then raise exception 'Нет доступа к чужому кабинету';end if;
 if p_offset is null or p_offset<0 or p_offset>100000 then raise exception 'Неверная страница';end if;
 select jsonb_build_object('name',i.display_name,'avatar',i.avatar) into v_profile from public.club_vk_identities i where i.user_id=p_user;
 if v_profile is null then select jsonb_build_object('name',b.name,'avatar','') into v_profile from public.club_bookings b where b.user_id=p_user order by b.created desc limit 1;end if;
 with lessons as (
  select b.id::text id,b.monday+s.day date,s.time,b.instrument,a.outcome from public.club_bookings b
  join public.club_slots s on (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=b.slot_id
  left join public.club_attendance a on a.booking_id=b.id where b.user_id=p_user and b.status='assigned'
  and (b.monday+s.day)+split_part(s.time,'–',1)::time<=now() at time zone 'Europe/Moscow'
  union all select a.id::text,a.attended_on,null,a.instrument,a.outcome from public.club_attendance a where a.user_id=p_user and a.booking_id is null
 ), page as (select * from lessons order by date desc,time desc nulls last,id limit 50 offset p_offset)
 select (select count(*) from lessons),coalesce((select jsonb_agg(to_jsonb(page) order by date desc,time desc nulls last,id) from page),'[]') into v_total,v_history;
 return jsonb_build_object('visitWindows',coalesce((select jsonb_agg(jsonb_build_object('date',x.d,'days',x.grace_days) order by x.d) from (select a.attended_on d,max(case when a.instrument='drums' then 14 else 7 end) grace_days from public.club_attendance a where a.user_id=p_user and a.outcome='attended' group by a.attended_on) x),'[]'::jsonb),'userId',p_user,'profile',v_profile,'nextDrumMonday',public.club_next_drum_week(p_user),
  'visitDates',coalesce((select jsonb_agg(x.d order by x.d) from (select distinct a.attended_on d from public.club_attendance a where a.user_id=p_user and a.outcome='attended') x),'[]'),
  'attendedTotal',(select count(*) from public.club_attendance a where a.user_id=p_user and a.outcome='attended'),
  'history',v_history,'historyTotal',v_total,'historyOffset',p_offset,
  'tasks',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'dueOn',t.due_on,'completed',t.completed,'revision',t.revision) order by t.completed,t.due_on nulls last,t.created_at desc,t.id) from public.club_student_tasks t where t.user_id=p_user),'[]'),
  'bookings',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'instrument',b.instrument,'monday',b.monday,'slotId',b.slot_id,'status',b.status,'preferences',b.preferences) order by b.monday,b.created,b.id) from public.club_bookings b where b.user_id=p_user and b.monday+6>=v_today),'[]'));
end $function$

;
CREATE OR REPLACE FUNCTION public.club_portal(action text DEFAULT 'snapshot'::text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid();v_user uuid;v_name text;v_result jsonb;v_task public.club_student_tasks%rowtype;v_title text;v_due date;v_completed boolean;
begin
 if v_uid is null then raise exception 'Войдите на сайт';end if;
 if action='student_details' then
  v_user:=coalesce(nullif(payload->>'userId','')::uuid,v_uid);
  if v_user<>v_uid and not exists(select 1 from public.club_vk_identities i where i.user_id=v_user) and not exists(select 1 from public.club_bookings b where b.user_id=v_user) then raise exception 'Ученик не найден';end if;
  return jsonb_build_object('studentCard',public.club_student_card(v_user,coalesce((payload->>'historyOffset')::integer,0)));
 end if;
 if action in ('task_create','task_update','task_delete') then
  if not exists(select 1 from public.club_vk_identities i where i.user_id=v_uid) then raise exception 'Для личных задач войдите через ВК';end if;
  perform pg_advisory_xact_lock(78203,hashtext(v_uid::text));
  if action<>'task_create' then
   select t.* into v_task from public.club_student_tasks t where t.id=(payload->>'id')::uuid and t.user_id=v_uid for update;
   if v_task.id is null then raise exception 'Задача не найдена';end if;
   if payload->>'revision' is distinct from v_task.revision::text then raise exception 'Задача изменилась. Обновите кабинет';end if;
  end if;
  if action='task_delete' then delete from public.club_student_tasks t where t.id=v_task.id and t.user_id=v_uid;
  else
   v_title:=btrim(coalesce(payload->>'title',v_task.title));
   if v_title is null or length(v_title) not between 1 and 200 then raise exception 'Введите задачу от 1 до 200 символов';end if;
   v_due:=case when payload ? 'dueOn' then nullif(payload->>'dueOn','')::date else v_task.due_on end;
   v_completed:=coalesce((payload->>'completed')::boolean,v_task.completed,false);
   if action='task_create' then
    if (select count(*) from public.club_student_tasks t where t.user_id=v_uid)>=500 then raise exception 'Сохранено 500 задач. Удалите ненужные перед добавлением новой';end if;
    insert into public.club_student_tasks(user_id,title,due_on,completed) values(v_uid,v_title,v_due,v_completed);
   else update public.club_student_tasks t set title=v_title,due_on=v_due,completed=v_completed,revision=gen_random_uuid(),updated_at=now() where t.id=v_task.id and t.user_id=v_uid;
   end if;
  end if;
  return jsonb_build_object('studentCard',public.club_student_card(v_uid,coalesce((payload->>'historyOffset')::integer,0)),'taskSaved',true);
 end if;
 if action in ('attendance','missed') then
  select b.user_id,b.name into v_user,v_name from public.club_bookings b where b.id=(payload->>'bookingId')::uuid;
 elsif action='undo_attendance' then
  select a.user_id,a.student_name into v_user,v_name from public.club_attendance a where a.id=(payload->>'id')::uuid;
 end if;
 if action in ('attendance','missed','undo_attendance') then
  perform pg_advisory_xact_lock(78202,hashtext(coalesce(v_user::text,lower(btrim(v_name)),'')));
 end if;
 v_result:=public.club_portal_before_update2(action,payload);
 if action='manual_students' then return v_result;end if;
 return v_result||jsonb_build_object('visitWindows',coalesce((select jsonb_agg(jsonb_build_object('date',x.d,'days',x.grace_days) order by x.d) from (select a.attended_on d,max(case when a.instrument='drums' then 14 else 7 end) grace_days from public.club_attendance a where a.user_id=v_uid and a.outcome='attended' group by a.attended_on) x),'[]'::jsonb),'updateVersion',2,'studentCard',public.club_student_card(v_uid,coalesce((payload->>'historyOffset')::integer,0)));
end $function$

;
revoke all on function public.club_student_card(uuid,integer) from public,anon,authenticated;
revoke all on function public.club_portal(text,jsonb) from public,anon,authenticated;
grant execute on function public.club_portal(text,jsonb) to authenticated;
commit;
