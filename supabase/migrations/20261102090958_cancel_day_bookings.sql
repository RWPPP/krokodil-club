create function public.club_day_cancel_plan(p_date date)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb; current_monday date;
begin
 if auth.uid() is null or not exists(select 1 from public.club_admins a where a.user_id=auth.uid()) then raise exception 'Доступ только для администратора';end if;
 current_monday:=(now() at time zone 'Europe/Moscow')::date-(extract(isodow from now() at time zone 'Europe/Moscow')::integer-1);
 if p_date is null or p_date<(now() at time zone 'Europe/Moscow')::date or p_date>current_monday+20 then raise exception 'Выберите день текущей или двух следующих недель';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'revision',b.revision) order by b.id),'[]') into rows
 from public.club_bookings b join public.club_slots s on (s.parity||'-'||s.day||'-'||regexp_replace(s.time,'[^0-9]','','g'))=b.slot_id
 where b.status='assigned' and b.monday+s.day=p_date
 and (b.monday+s.day)+split_part(s.time,'–',1)::time>now() at time zone 'Europe/Moscow'
 and not exists(select 1 from public.club_attendance a where a.booking_id=b.id);
 return jsonb_build_object('date',p_date,'count',jsonb_array_length(rows),'rows',rows,'token',md5(p_date::text||rows::text));
end $$;
revoke all on function public.club_day_cancel_plan(date) from public,anon,authenticated;

alter function public.club_api(text,jsonb) rename to club_api_before_day_cancel;
create function public.club_api(action text,payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare plan jsonb; item jsonb; actor uuid; day date; monday date;
begin
 if action not in ('preview_cancel_day','cancel_day') then return public.club_api_before_day_cancel(action,payload);end if;
 day:=(payload->>'date')::date;
 plan:=public.club_day_cancel_plan(day);
 if action='preview_cancel_day' then return jsonb_build_object('cancelDayPlan',plan-'rows');end if;
 -- Follow single-booking lock order: students first, then the week.
 for actor in select distinct b.user_id from public.club_bookings b
  where b.id in (select (x->>'id')::uuid from jsonb_array_elements(plan->'rows') x) and b.user_id is not null order by b.user_id
 loop perform pg_advisory_xact_lock(78202,hashtext(actor::text));end loop;
 monday:=day-(extract(isodow from day)::integer-1);
 perform pg_advisory_xact_lock(78123,monday-date '2000-01-01');
 plan:=public.club_day_cancel_plan(day);
 if payload->>'planToken' is distinct from plan->>'token' then raise exception 'Записи на этот день изменились. Повторите предпросмотр';end if;
 if (plan->>'count')::integer=0 then raise exception 'На этот день нет будущих назначенных занятий';end if;
 for item in select value from jsonb_array_elements(plan->'rows') loop
  perform public.club_api_before_day_cancel('cancel',jsonb_build_object('id',item->>'id','revision',item->>'revision','preserveStreak',true,'monday',monday));
 end loop;
 return public.club_api_before_day_cancel('snapshot',jsonb_build_object('monday',coalesce(nullif(payload->>'monday','')::date,monday)))
  ||jsonb_build_object('cancelledCount',(plan->>'count')::integer,'cancelledDate',day);
end $$;
revoke all on function public.club_api_before_day_cancel(text,jsonb) from public,anon,authenticated;
revoke all on function public.club_api(text,jsonb) from public,anon;
grant execute on function public.club_api(text,jsonb) to authenticated;
