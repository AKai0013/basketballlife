-- BasketballLife V8.0 production migration
-- Run once in the Supabase SQL editor before publishing index.html.

create index if not exists career_records_ranking_era_idx
  on public.career_records ((career_data->>'ranking_era'))
  where is_public = true;

create index if not exists career_records_weekly_challenge_idx
  on public.career_records ((career_data->'weekly_challenge'->>'id'), career_rating desc)
  where is_public = true
    and career_data->'weekly_challenge'->>'active' = 'true';

with ranked as (
  select id,row_number() over (
    partition by user_id,(career_data->'weekly_challenge'->>'id')
    order by career_rating desc,created_at desc
  ) as rn
  from public.career_records
  where is_public=true and career_data->'weekly_challenge'->>'active'='true'
)
delete from public.career_records where id in (select id from ranked where rn>1);

create unique index if not exists career_records_weekly_user_best_uidx
  on public.career_records (user_id,(career_data->'weekly_challenge'->>'id'))
  where is_public=true and career_data->'weekly_challenge'->>'active'='true';

create table if not exists public.weekly_challenges (
  id text primary key,
  label text not null,
  seed text not null check (seed ~ '^[A-Z0-9]{8}$'),
  position text not null check (position in ('PG','SG','SF','PF','C')),
  height_cm integer not null,
  wingspan_cm integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);
alter table public.weekly_challenges enable row level security;
drop policy if exists "weekly challenges are public" on public.weekly_challenges;
create policy "weekly challenges are public" on public.weekly_challenges for select using (true);
grant select on public.weekly_challenges to anon, authenticated;

insert into public.weekly_challenges(id,label,seed,position,height_cm,wingspan_cm,starts_at,ends_at)
values ('2026W33','2026 第 33 週','A9UKWDGP','PF',205,220,'2026-08-10 00:00:00+00','2026-08-17 00:00:00+00')
on conflict (id) do update set label=excluded.label,seed=excluded.seed,position=excluded.position,
  height_cm=excluded.height_cm,wingspan_cm=excluded.wingspan_cm,starts_at=excluded.starts_at,ends_at=excluded.ends_at;

create or replace function public.publish_career_v8(p_record jsonb)
returns setof public.career_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.career_records;
  v_existing public.career_records;
  v_data jsonb := coalesce(p_record->'career_data', '{}'::jsonb);
  v_integrity jsonb := coalesce(p_record->'career_data'->'integrity', '{}'::jsonb);
  v_weekly boolean := coalesce((p_record->'career_data'->'weekly_challenge'->>'active')::boolean, false);
  v_week_id text := nullif(p_record->'career_data'->'weekly_challenge'->>'id', '');
  v_rating integer := greatest(0, coalesce((p_record->>'career_rating')::integer, 0));
  v_season_count integer;
  v_game_sum integer;
  v_challenge public.weekly_challenges;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if nullif(p_record->>'id','') is null then raise exception 'Missing career id'; end if;
  if p_record->>'user_id' <> v_uid::text then raise exception 'Invalid career owner'; end if;
  if p_record->>'is_public' <> 'true' then raise exception 'Career must be public'; end if;
  if v_data->>'ranking_era' <> 'v8' then raise exception 'V8 publisher only accepts V8 careers'; end if;
  if v_data->>'publisher_version' <> '8.0.0' then raise exception 'Unsupported publisher version'; end if;
  if v_integrity->>'schema' <> 'v8-core-1' or v_integrity->>'verdict' <> 'passed' then
    raise exception 'Invalid integrity envelope';
  end if;
  if coalesce((p_record->>'career_games')::integer,0) < 0
     or coalesce((p_record->>'retired_age')::integer,0) not between 16 and 60
     or coalesce((p_record->>'peak_overall')::integer,0) not between 0 and 99
     or (p_record->>'final_year')::integer - (p_record->>'retired_age')::integer <> 2010 then
    raise exception 'Career values outside allowed range';
  end if;
  select count(*),coalesce(sum((season->>'games')::integer),0) into v_season_count,v_game_sum
    from jsonb_array_elements(coalesce(p_record->'season_history','[]'::jsonb)) season;
  if v_season_count = 0 or v_game_sum <> (p_record->>'career_games')::integer
     or v_season_count <> coalesce((v_integrity->>'season_count')::integer,-1)
     or v_game_sum <> coalesce((v_integrity->>'career_games')::integer,-1) then
    raise exception 'Season history totals failed validation';
  end if;

  v_data := jsonb_set(v_data, '{integrity,server_verified}', '"passed"'::jsonb, true);

  -- Weekly challenge: one physical row per authenticated player and challenge.
  -- A lower replay never overwrites that player's existing best career.
  if v_weekly then
    if v_week_id is null then raise exception 'Missing weekly challenge id'; end if;
    select * into v_challenge from public.weekly_challenges where id=v_week_id;
    if not found then raise exception 'Unknown weekly challenge'; end if;
    if p_record->>'seed' <> v_challenge.seed
       or p_record->>'position' <> v_challenge.position
       or (v_data->>'height_cm')::integer <> v_challenge.height_cm
       or (v_data->>'wingspan_cm')::integer <> v_challenge.wingspan_cm then
      raise exception 'Weekly challenge settings do not match the official challenge';
    end if;
    select * into v_existing
      from public.career_records
      where user_id = v_uid
        and is_public = true
        and career_data->'weekly_challenge'->>'active' = 'true'
        and career_data->'weekly_challenge'->>'id' = v_week_id
      order by career_rating desc, created_at desc
      limit 1 for update;
    if found and coalesce(v_existing.career_rating,0) >= v_rating then
      return next v_existing;
      return;
    end if;
    if found then delete from public.career_records where id = v_existing.id; end if;
  end if;

  insert into public.career_records (
    id,user_id,nickname,player_name,position,seed,seed_tier,retired_age,final_year,
    peak_overall,career_rating,career_games,career_salary,championships,national_caps,
    hall_of_fame,jersey_retired,awards,titles,league_summary,season_history,career_data,is_public
  ) values (
    (p_record->>'id')::uuid,v_uid,left(p_record->>'nickname',30),left(p_record->>'player_name',30),
    left(p_record->>'position',4),left(p_record->>'seed',40),left(p_record->>'seed_tier',40),
    (p_record->>'retired_age')::integer,(p_record->>'final_year')::integer,
    (p_record->>'peak_overall')::integer,v_rating,(p_record->>'career_games')::integer,
    (p_record->>'career_salary')::bigint,(p_record->>'championships')::integer,
    (p_record->>'national_caps')::integer,coalesce(p_record->'hall_of_fame','[]'::jsonb),
    coalesce(p_record->'jersey_retired','[]'::jsonb),coalesce(p_record->'awards','[]'::jsonb),
    coalesce(p_record->'titles','[]'::jsonb),coalesce(p_record->'league_summary','{}'::jsonb),
    coalesce(p_record->'season_history','[]'::jsonb),v_data,true
  )
  on conflict (id) do update set
    nickname=excluded.nickname, player_name=excluded.player_name, position=excluded.position,
    seed=excluded.seed, seed_tier=excluded.seed_tier, retired_age=excluded.retired_age,
    final_year=excluded.final_year, peak_overall=excluded.peak_overall,
    career_rating=excluded.career_rating, career_games=excluded.career_games,
    career_salary=excluded.career_salary, championships=excluded.championships,
    national_caps=excluded.national_caps, hall_of_fame=excluded.hall_of_fame,
    jersey_retired=excluded.jersey_retired, awards=excluded.awards, titles=excluded.titles,
    league_summary=excluded.league_summary, season_history=excluded.season_history,
    career_data=excluded.career_data, is_public=true
  returning * into v_row;
  return next v_row;
end;
$$;

revoke all on function public.publish_career_v8(jsonb) from public;
grant execute on function public.publish_career_v8(jsonb) to authenticated;
revoke insert,update,delete on public.career_records from anon,authenticated;
grant select on public.career_records to anon,authenticated;
