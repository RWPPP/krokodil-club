create table public.club_booking_cancellations (
 booking_id uuid primary key,
 user_id uuid references auth.users(id) on delete cascade,
 cancelled_by uuid not null references auth.users(id),
 cancelled_at timestamptz not null default now(),
 lesson_date date,
 grace_days integer not null check(grace_days in (7,14)),
 preserve_streak boolean not null,
 booking jsonb not null
);
alter table public.club_booking_cancellations enable row level security;
revoke all on public.club_booking_cancellations from public,anon,authenticated;
create index club_cancellations_user on public.club_booking_cancellations(user_id,lesson_date);

alter function public.club_api(text,jsonb) rename to club_api_before_cancellation;
alter function public.club_student_card(uuid,integer) rename to club_student_card_before_cancellation;

create function public.club_student_card(p_user uuid,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; bookings jsonb;
begin
 -- The existing card enforces owner/admin access before any extra data is read.
 result:=public.club_student_card_before_cancellation(p_user,p_offset);
 select coalesce(jsonb_agg(x.value||jsonb_build_object('revision',b.revision,'canCancel',
  not exists(select 1 from public.club_attendance a where a.booking_id=b.id) and
  case when b.slot_id is null then b.monday+6>=(now() at time zone 'Europe/Moscow')::date
  else exists(select 1 from public.club_slots s where (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=b.slot_id
   and (b.monday+s.day)+split_part(s.time,'–',1)::time>now() at time zone 'Europe/Moscow') end) order by x.ordinality),'[]') into bookings
 from jsonb_array_elements(result->'bookings') with ordinality x(value,ordinality)
 join public.club_bookings b on b.id=(x.value->>'id')::uuid;
 return result||jsonb_build_object('bookings',bookings,'protectedCancellations',coalesce((
  select jsonb_agg(jsonb_build_object('date',c.lesson_date,'days',c.grace_days) order by c.lesson_date,c.booking_id)
  from public.club_booking_cancellations c where c.user_id=p_user and c.preserve_streak),'[]'));
end $$;

create function public.club_api(action text,payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); admin boolean; row public.club_bookings%rowtype;
 lesson timestamp; preserve boolean; requested_monday date; target_user uuid;
begin
 if uid is null then raise exception 'Войдите на сайт';end if;
 if action not in ('cancel','delete') then return public.club_api_before_cancellation(action,payload);end if;
 select exists(select 1 from public.club_admins a where a.user_id=uid) into admin;
 select b.user_id,b.monday into target_user,requested_monday from public.club_bookings b where b.id=(payload->>'id')::uuid;
 if requested_monday is null then raise exception 'Запись уже отменена или не найдена';end if;
 if target_user is not null then perform pg_advisory_xact_lock(78202,hashtext(target_user::text));end if;
 perform pg_advisory_xact_lock(78123,requested_monday-date '2000-01-01');
 select b.* into row from public.club_bookings b where b.id=(payload->>'id')::uuid for update;
 if row.id is null then raise exception 'Запись уже отменена или не найдена';end if;
 if not admin and (row.user_id is distinct from uid or not exists(select 1 from public.club_vk_identities i where i.user_id=uid)) then raise exception 'Нельзя отменять чужую запись';end if;
 if action='cancel' and payload->>'revision' is distinct from row.revision::text then raise exception 'Запись изменилась. Обновите страницу';end if;
 preserve:=coalesce((payload->>'preserveStreak')::boolean,false);
 if preserve and not admin then raise exception 'Сохранить срок огонька может только администратор';end if;
 if exists(select 1 from public.club_attendance a where a.booking_id=row.id) then raise exception 'Посещение уже отмечено. Отмена записи недоступна';end if;
 if row.slot_id is not null then
  select (row.monday+s.day)+split_part(s.time,'–',1)::time into lesson from public.club_slots s
   where (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=row.slot_id;
  if lesson is null or lesson<=now() at time zone 'Europe/Moscow' then raise exception 'Нельзя отменить начавшееся или прошедшее занятие';end if;
 elsif row.monday+6<(now() at time zone 'Europe/Moscow')::date then raise exception 'Нельзя отменить прошедшую заявку';
 end if;
 insert into public.club_booking_cancellations(booking_id,user_id,cancelled_by,lesson_date,grace_days,preserve_streak,booking)
 values(row.id,row.user_id,uid,lesson::date,case when row.instrument='drums' then 14 else 7 end,preserve and lesson is not null,to_jsonb(row));
 delete from public.club_bookings b where b.id=row.id;
 -- Keep the selected week in the UI; cancellation may come from another week in the cabinet.
 return public.club_api_before_cancellation('snapshot',jsonb_build_object('monday',coalesce(nullif(payload->>'monday','')::date,row.monday)))||jsonb_build_object('bookingCancelled',true);
end $$;
revoke all on function public.club_student_card(uuid,integer) from public,anon,authenticated;
revoke all on function public.club_student_card_before_cancellation(uuid,integer) from public,anon,authenticated;
revoke all on function public.club_api_before_cancellation(text,jsonb) from public,anon,authenticated;
revoke all on function public.club_api(text,jsonb) from public,anon;
grant execute on function public.club_api(text,jsonb) to authenticated;

alter function public.club_portal(text,jsonb) rename to club_portal_before_cancellation;
create function public.club_portal(action text default 'snapshot',payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; bookings jsonb;
begin
 result:=public.club_portal_before_cancellation(action,payload);
 if result->>'admin'='true' and jsonb_typeof(result->'adminBookings')='array' then
  select coalesce(jsonb_agg(x.value||jsonb_build_object('revision',b.revision) order by x.ordinality),'[]') into bookings
  from jsonb_array_elements(result->'adminBookings') with ordinality x(value,ordinality)
  join public.club_bookings b on b.id=(x.value->>'id')::uuid;
  result:=result||jsonb_build_object('adminBookings',bookings);
 end if;
 return result;
end $$;
revoke all on function public.club_portal_before_cancellation(text,jsonb) from public,anon,authenticated;
revoke all on function public.club_portal(text,jsonb) from public,anon;
grant execute on function public.club_portal(text,jsonb) to authenticated;
