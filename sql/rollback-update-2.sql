begin;
CREATE OR REPLACE FUNCTION public.club_api(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_uid uuid:=auth.uid();v_admin boolean;v_mode text;v_message text;v_result jsonb;
 v_monday date;v_current date;v_first date;v_parity text;v_slot text;v_inst text;v_name text;v_user uuid;v_own boolean;
 v_old public.club_bookings%rowtype;v_start timestamp;v_end timestamp;v_old_start timestamp;
 v_now timestamp:=now() at time zone 'Europe/Moscow';v_kind text;v_cap integer;v_count integer;
begin
 if v_uid is null then raise exception 'Войдите на сайт';end if;
 select exists(select 1 from public.club_admins a where a.user_id=v_uid) into v_admin;
 -- Shared lock orders submissions against switching maintenance on.
 select s.maintenance_mode,s.maintenance_message into v_mode,v_message from public.club_settings s where s.id for share;
 if action='submit' and v_mode='full' and not v_admin then raise exception 'Идут технические работы. Запись временно закрыта';end if;
 if action in ('manual_create','manual_update') then
  if not v_admin then raise exception 'Доступ только для администратора';end if;
  v_monday:=(payload->>'monday')::date;
  v_current:=v_now::date-(extract(isodow from v_now)::integer-1);
  select s.first_monday into v_first from public.club_settings s where s.id;
  if v_monday is null or v_monday<v_first or v_monday not in (v_current,v_current+7,v_current+14) then raise exception 'Доступны текущая и две следующие учебные недели';end if;
  perform pg_advisory_xact_lock(78123,(v_monday-date '2000-01-01'));
  if action='manual_update' then
   select b.* into v_old from public.club_bookings b where b.id=(payload->>'id')::uuid and b.monday=v_monday for update;
   if v_old.id is null or v_old.manual_created_by is null then raise exception 'Ручная запись не найдена';end if;
   if payload->>'revision' is distinct from v_old.revision::text then raise exception 'Запись изменилась. Откройте её заново';end if;
   if exists(select 1 from public.club_attendance a where a.booking_id=v_old.id) then raise exception 'Посещение уже отмечено';end if;
   select (v_monday+s.day)+split_part(s.time,'–',1)::time into v_old_start from public.club_slots s
    where (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=v_old.slot_id;
   if v_old_start is null or v_old_start<=v_now then raise exception 'Нельзя менять начавшееся занятие';end if;
  end if;
  v_user:=nullif(payload->>'userId','')::uuid;v_name:=btrim(payload->>'name');v_inst:=payload->>'instrument';
  v_own:=coalesce((payload->>'own')::boolean,false);v_slot:=payload->>'slotId';
  if action='manual_update' and v_user is distinct from v_old.user_id then raise exception 'Нельзя менять аккаунт ученика у существующей записи';end if;
  if v_user is not null then
   if not exists(select 1 from auth.users u where u.id=v_user and (exists(select 1 from public.club_vk_identities i where i.user_id=u.id) or exists(select 1 from public.club_bookings b where b.user_id=u.id))) then raise exception 'Ученик не найден';end if;
   select left(i.display_name,60) into v_name from public.club_vk_identities i where i.user_id=v_user;
   if v_name is null then select b.name into v_name from public.club_bookings b where b.user_id=v_user order by b.created desc limit 1;end if;
  end if;
  if v_name is null or length(v_name) not between 1 and 60 or v_inst is null or v_inst not in ('acoustic','electric','bass','drums') then raise exception 'Проверьте имя и инструмент';end if;
  if v_inst='drums' then v_own:=false;end if;
  v_parity:=case when ((v_monday-v_first)/7+1)%2=0 then 'even' else 'odd' end;
  select s.kind,(v_monday+s.day)+split_part(s.time,'–',1)::time,(v_monday+s.day)+split_part(s.time,'–',2)::time
   into v_kind,v_start,v_end from public.club_slots s where s.parity=v_parity and (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=v_slot;
  if v_kind is distinct from (case when v_inst='drums' then 'drums' else 'guitar' end) or v_start is null or v_start<=v_now then raise exception 'Выберите подходящее будущее занятие';end if;
  if exists(select 1 from public.club_bookings b where b.id is distinct from v_old.id and b.monday=v_monday
   and ((v_user is not null and b.user_id=v_user) or (v_user is null and b.user_id is null and lower(btrim(b.name))=lower(v_name)))
   and (b.instrument=v_inst or (b.instrument<>'drums' and v_inst<>'drums'))) then raise exception 'У ученика уже есть заявка на этот инструмент на выбранную неделю';end if;
  if exists(select 1 from public.club_bookings b join public.club_slots s on (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=b.slot_id
   where b.id is distinct from v_old.id and b.monday=v_monday and b.status='assigned'
   and ((v_user is not null and b.user_id=v_user) or (v_user is null and b.user_id is null and lower(btrim(b.name))=lower(v_name)))
   and (v_monday+s.day)+split_part(s.time,'–',1)::time<v_end and (v_monday+s.day)+split_part(s.time,'–',2)::time>v_start) then raise exception 'У ученика уже есть занятие в это время';end if;
  if v_inst='drums' then
   if exists(select 1 from public.club_bookings b where b.id is distinct from v_old.id and b.monday=v_monday and b.instrument='drums' and b.slot_id=v_slot and b.status='assigned') then raise exception 'Барабанный слот занят';end if;
  elsif not v_own then
   v_cap:=case v_inst when 'acoustic' then 2 when 'electric' then 3 else 1 end+coalesce((select e.amount from public.club_extras e where e.monday=v_monday and e.slot_id=v_slot and e.instrument=v_inst),0);
   select count(*) into v_count from public.club_bookings b where b.id is distinct from v_old.id and b.monday=v_monday and b.slot_id=v_slot and b.instrument=v_inst and not b.own and b.status='assigned';
   if v_count>=v_cap then raise exception 'Места закончились. Выберите другой слот';end if;
  end if;
  if action='manual_create' then
   insert into public.club_bookings(user_id,name,instrument,own,monday,preferences,slot_id,status,manual_created_by,manual_locked)
    values(v_user,v_name,v_inst,v_own,v_monday,case when v_inst='drums' then array[v_slot] else '{}'::text[] end,v_slot,'assigned',v_uid,v_inst='drums');
  else
   update public.club_bookings b set name=v_name,instrument=v_inst,own=v_own,slot_id=v_slot,status='assigned',
    preferences=case when v_inst='drums' then array[v_slot] else '{}'::text[] end,manual_locked=v_inst='drums' where b.id=v_old.id;
  end if;
  v_result:=public.club_api_before_release_11('snapshot',jsonb_build_object('monday',v_monday));
 else
  v_result:=public.club_api_before_release_11(action,payload);
 end if;
 return v_result||jsonb_build_object('releaseVersion','1.1','maintenance',jsonb_build_object('mode',v_mode,'message',v_message));
end $function$

;
CREATE OR REPLACE FUNCTION public.club_portal(action text DEFAULT 'snapshot'::text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_admin boolean;v_result jsonb;v_mode text;v_message text;
begin
 if auth.uid() is null then raise exception 'Войдите на сайт';end if;
 select exists(select 1 from public.club_admins a where a.user_id=auth.uid()) into v_admin;
 if action in ('maintenance_save','manual_students') then
  if not v_admin then raise exception 'Доступ только для администратора';end if;
  if action='maintenance_save' then
   v_mode:=payload->>'mode';v_message:=btrim(coalesce(payload->>'message',''));
   if v_mode is null or v_mode not in ('off','banner','full') or length(v_message)>500 then raise exception 'Проверьте режим и сообщение (до 500 символов)';end if;
   update public.club_settings set maintenance_mode=v_mode,maintenance_message=v_message where id;
  else
   return jsonb_build_object('students',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'name',q.name) order by q.name,q.id) from (
    select u.id,coalesce(left(i.display_name,60),(select b.name from public.club_bookings b where b.user_id=u.id order by b.created desc limit 1)) name
     from auth.users u left join public.club_vk_identities i on i.user_id=u.id
     where i.user_id is not null or exists(select 1 from public.club_bookings b where b.user_id=u.id)
   ) q),'[]'::jsonb));
  end if;
  action:='snapshot';
 end if;
 v_result:=public.club_portal_before_release_11(action,payload)||jsonb_build_object('releaseVersion','1.1','maintenance',public.club_maintenance());
 if v_admin then
  v_result:=v_result||jsonb_build_object('manualBookings',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'userId',b.user_id,'revision',b.revision,'locked',b.manual_locked)) from public.club_bookings b where b.manual_created_by is not null and b.monday+6>=(now() at time zone 'Europe/Moscow')::date-90),'[]'::jsonb));
 end if;
 return v_result;
end $function$

;
commit;
