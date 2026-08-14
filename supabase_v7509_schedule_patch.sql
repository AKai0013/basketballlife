-- BasketballLife V7.50.10 schedule compatibility migration
-- Safe scope: no row deletion, no trigger replacement, no publishing-policy changes.
-- Re-run this file in Supabase SQL Editor after the original V7.50.8 integrity migration.
-- It keeps modern careers strict while allowing only historically legal CBA/SBL
-- schedules for careers whose creation version was V7.50.5 through V7.50.8.

begin;

create or replace function public.bl_v7508_schedule_expected(p_seed text, p_year integer, p_path text)
returns integer
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_min integer;
  v_max integer;
begin
  select x.lo, x.hi into v_min, v_max
  from (values
    ('HBL',18,24),('UBA',20,26),('UBA 強權',22,28),('日本大學',24,30),
    ('NCAA D2',26,30),('NCAA D1',29,31),('SBL／半職業',30,30),
    ('台灣職業',36,36),('韓國職業',54,54),('日本職業',60,60),
    ('CBA',42,42),('NBA G League',50,50),('NBA',82,82)
  ) as x(path,lo,hi)
  where x.path = p_path;

  if v_min is null then
    v_min := 24;
    v_max := 30;
  end if;
  if v_min = v_max then return v_min; end if;
  return public.bl_v7508_rand_int(p_seed || '-schedule-' || p_year || '-' || p_path, 1, v_min, v_max);
end;
$$;

-- Compatibility calculator for careers that began before the V7.50.9
-- real-schedule correction. It is only accepted for CBA and SBL rows.
create or replace function public.bl_v7508_legacy_schedule_expected(p_seed text, p_year integer, p_path text)
returns integer
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_min integer;
  v_max integer;
begin
  select x.lo, x.hi into v_min, v_max
  from (values ('SBL／半職業',20,24),('CBA',42,46)) as x(path,lo,hi)
  where x.path = p_path;
  if v_min is null then return -1; end if;
  return public.bl_v7508_rand_int(p_seed || '-schedule-' || p_year || '-' || p_path, 1, v_min, v_max);
end;
$$;

create or replace function public.bl_v7508_validate_career(p_record jsonb)
returns jsonb
language plpgsql
volatile
strict
security definer
set search_path = pg_catalog
as $$
declare
  v_id uuid := (p_record->>'id')::uuid;
  v_seed text := upper(p_record->>'seed');
  v_position text := p_record->>'position';
  v_retired_age integer := (p_record->>'retired_age')::integer;
  v_final_year integer := (p_record->>'final_year')::integer;
  v_peak integer := (p_record->>'peak_overall')::integer;
  v_career_games integer := (p_record->>'career_games')::integer;
  v_cd jsonb := p_record->'career_data';
  v_game_version text := coalesce(p_record->'career_data'->>'game_version','legacy');
  v_integrity jsonb;
  v_seasons jsonb := p_record->'season_history';
  v_season jsonb;
  v_first jsonb := null;
  v_field text;
  v_value numeric;
  v_games integer;
  v_scheduled integer;
  v_missed integer;
  v_year integer;
  v_age integer;
  v_path text;
  v_expected_schedule integer;
  v_allow_historical_schedule boolean := false;
  v_historical_schedule_accepted boolean := false;
  v_historical_schedule_seasons integer := 0;
  v_games_total integer := 0;
  v_sixes integer;
  v_has_genius boolean := false;
  v_seen_years jsonb := '{}'::jsonb;
  v_ceiling numeric;
  v_award jsonb;
  v_award_season jsonb;
  v_award_year integer;
  v_award_name text;
  v_award_type text;
  v_award_label text;
  v_award_diff numeric;
  v_star_score numeric;
  v_award_ok boolean;
  v_award_seen jsonb := '{}'::jsonb;
  v_championship jsonb;
  v_championship_season jsonb;
  v_championship_year integer;
  v_expected_tournament text;
  v_championship_seen jsonb := '{}'::jsonb;
  v_verified_at text := to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if v_id = 'e9040a1c-5dc3-49f6-944c-8172cb8a518d'::uuid then raise exception 'Career record is blocked'; end if;
  if jsonb_typeof(p_record) <> 'object'
     or jsonb_typeof(p_record->'retired_age') <> 'number'
     or jsonb_typeof(p_record->'final_year') <> 'number'
     or jsonb_typeof(p_record->'peak_overall') <> 'number'
     or jsonb_typeof(p_record->'career_games') <> 'number'
  then raise exception 'Missing numeric career fields'; end if;
  if v_seed is null or v_seed !~ '^[A-Z0-9]{8}$' then raise exception 'Invalid career Seed'; end if;
  if v_position is null or v_position not in ('PG','SG','SF','PF','C') then raise exception 'Invalid position'; end if;
  if v_peak is null or v_peak not between 0 and 99 then raise exception 'Invalid peak OVR'; end if;
  if v_retired_age is null or v_final_year is null or v_retired_age not between 16 and 60 or v_final_year - v_retired_age <> 2010 then raise exception 'Invalid retirement year'; end if;
  if jsonb_typeof(v_seasons) <> 'array' or jsonb_array_length(v_seasons) not between 1 and 45 then raise exception 'Invalid season history'; end if;
  if jsonb_typeof(coalesce(p_record->'titles','[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_record->'awards','[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(v_cd->'championship_history','[]'::jsonb)) <> 'array'
  then raise exception 'Invalid title, award or championship list'; end if;
  if jsonb_array_length(coalesce(p_record->'awards','[]'::jsonb)) > jsonb_array_length(v_seasons) * 8 then raise exception 'Too many career awards'; end if;
  if jsonb_array_length(coalesce(v_cd->'championship_history','[]'::jsonb)) <> (p_record->>'championships')::integer then raise exception 'Championship total mismatch'; end if;
  if jsonb_typeof(v_cd) <> 'object' or v_cd->>'publisher_version' <> '7.50.8' then raise exception 'V7.50.8 publisher required'; end if;
  if jsonb_typeof(v_cd->'game_version') is distinct from 'string' then raise exception 'Missing career creation version'; end if;
  v_allow_historical_schedule := v_game_version ~ '^7[.]50[.](5|6|7|8)$';
  if v_cd->>'ranking_era' <> 'v750' or v_cd->>'upload_id' <> v_id::text then raise exception 'Invalid publication identity'; end if;
  v_integrity := v_cd->'integrity';
  if jsonb_typeof(v_integrity) <> 'object'
     or v_integrity->>'schema' <> 'v7508-core-1'
     or v_integrity->>'verdict' <> 'passed'
     or coalesce(v_integrity->>'checksum','') !~ '^[0-9a-f]{8}$'
     or jsonb_typeof(v_integrity->'deterministic_sixes') <> 'number'
     or jsonb_typeof(v_integrity->'season_count') <> 'number'
     or jsonb_typeof(v_integrity->'career_games') <> 'number'
  then raise exception 'Invalid client integrity envelope'; end if;

  for v_season in select value from jsonb_array_elements(v_seasons) loop
    if jsonb_typeof(v_season) <> 'object'
       or not (v_season ?& array['year','age','games','scheduledGames','missedGames','path','mins','pts','reb','ast','stl','blk','fg','three'])
       or exists(
         select 1 from unnest(array['year','age','games','scheduledGames','missedGames','mins','pts','reb','ast','stl','blk','fg','three']) as required(field)
         where jsonb_typeof(v_season->required.field) <> 'number'
       )
    then raise exception 'Missing or malformed season fields'; end if;
    v_year := (v_season->>'year')::integer;
    v_age := (v_season->>'age')::integer;
    v_games := (v_season->>'games')::integer;
    v_scheduled := (v_season->>'scheduledGames')::integer;
    v_missed := coalesce((v_season->>'missedGames')::integer,0);
    v_path := v_season->>'path';
    if v_year - v_age <> 2010 then raise exception 'Season year and age mismatch'; end if;
    if v_seen_years ? v_year::text then raise exception 'Duplicate season year'; end if;
    v_seen_years := v_seen_years || jsonb_build_object(v_year::text,true);
    if v_games < 0 or v_games > 82 or v_scheduled < 0 or v_scheduled > 82 or v_missed < 0 or v_games + v_missed <> v_scheduled then
      raise exception 'Invalid season games';
    end if;
    -- V7.50.9 fixed CBA at 42 and SBL at 30. Careers created in V7.50.5–V7.50.8
    -- really used the ranges below, and saves could span several later updates.
    -- Accept the historical range only when the recorded creation version predates
    -- the correction. The narrow range is stamped for audit; all newer careers stay exact.
    v_expected_schedule := public.bl_v7508_schedule_expected(v_seed,v_year,v_path);
    if v_scheduled <> v_expected_schedule then
      if v_allow_historical_schedule
         and ((v_path = 'CBA' and v_scheduled between 42 and 46)
           or (v_path = 'SBL／半職業' and v_scheduled between 20 and 24))
      then
        v_historical_schedule_accepted := true;
        v_historical_schedule_seasons := v_historical_schedule_seasons + 1;
      else
        raise exception 'Deterministic schedule mismatch: year %, league %, got %, expected % (career version %)',
          v_year, v_path, v_scheduled, v_expected_schedule, v_game_version;
      end if;
    end if;
    foreach v_field in array array['mins','pts','reb','ast','stl','blk','fg','three'] loop
      v_value := (v_season->>v_field)::numeric;
      if (v_field = 'mins' and v_value not between 0 and 36)
         or (v_field = 'pts' and v_value not between 0 and 60)
         or (v_field in ('reb','ast') and v_value not between 0 and 25)
         or (v_field in ('stl','blk') and v_value not between 0 and 8)
         or (v_field in ('fg','three') and v_value not between 0 and 100)
      then raise exception 'Season statistic out of range: %',v_field; end if;
    end loop;
    if v_year = 2026 and v_age = 16 and v_path = 'HBL' then v_first := v_season; end if;
    v_games_total := v_games_total + v_games;
  end loop;

  if v_games_total <> v_career_games then raise exception 'Career games do not match season total'; end if;
  if (v_integrity->>'season_count')::integer <> jsonb_array_length(v_seasons)
     or (v_integrity->>'career_games')::integer <> v_games_total
  then raise exception 'Integrity totals do not match'; end if;

  v_sixes := public.bl_v7508_deterministic_sixes(v_seed,v_seasons);
  if (v_integrity->>'deterministic_sixes')::integer <> v_sixes then raise exception 'Deterministic training dice mismatch'; end if;
  select exists(
    select 1 from jsonb_array_elements(coalesce(p_record->'titles','[]'::jsonb)) as title(value)
    where case when jsonb_typeof(title.value) = 'string' then trim(both '"' from title.value::text) else title.value->>'name' end = '天才'
  ) into v_has_genius;
  if v_has_genius <> (v_sixes >= 5) then raise exception 'Genius title does not match deterministic dice'; end if;

  for v_award in select value from jsonb_array_elements(coalesce(p_record->'awards','[]'::jsonb)) loop
    if jsonb_typeof(v_award) <> 'object'
       or jsonb_typeof(v_award->'year') <> 'number'
       or jsonb_typeof(v_award->'name') <> 'string'
    then raise exception 'Malformed award record'; end if;
    v_award_year := (v_award->>'year')::integer;
    v_award_name := v_award->>'name';
    select value into v_award_season from jsonb_array_elements(v_seasons) where (value->>'year')::integer = v_award_year limit 1;
    if v_award_season is null then raise exception 'Award does not match a season'; end if;
    select x.label, x.diff into v_award_label, v_award_diff
    from (values
      ('SBL／半職業','SBL',0),('台灣職業','台灣職籃',1),('韓國職業','韓國職籃',4),('日本職業','日本職籃',6),
      ('CBA','CBA',7),('NBA G League','NBA G League',7),('NBA','NBA',13)
    ) x(path,label,diff)
    where x.path = v_award_season->>'path';
    if v_award_label is null or left(v_award_name,char_length(v_award_label)+1) <> v_award_label || ' ' then raise exception 'Award league mismatch'; end if;
    if v_award_seen ? (v_award_year || '|' || v_award_name) then raise exception 'Duplicate award'; end if;
    v_award_seen := v_award_seen || jsonb_build_object(v_award_year || '|' || v_award_name,true);
    v_award_type := substr(v_award_name,char_length(v_award_label)+2);
    v_star_score := (v_award_season->>'pts')::numeric*1.25 + (v_award_season->>'ast')::numeric*1.05
      + (v_award_season->>'reb')::numeric*.62 + (v_award_season->>'stl')::numeric*1.8
      + (v_award_season->>'blk')::numeric*1.6 + ((v_award_season->>'fg')::numeric-43)*.18;
    v_award_ok := case v_award_type
      when '年度MVP' then v_star_score >= 52+v_award_diff
      when '年度第一隊' then v_star_score >= 44+v_award_diff
      when '年度第二隊' then v_star_score >= 37+v_award_diff and v_star_score < 44+v_award_diff
      when '最佳防守球員' then (v_award_season->>'stl')::numeric+(v_award_season->>'blk')::numeric >= 3
      when '得分王' then (v_award_season->>'pts')::numeric >= 23+v_award_diff*.30
      when '助攻王' then (v_award_season->>'ast')::numeric >= 7.8+v_award_diff*.10
      when '籃板王' then (v_award_season->>'reb')::numeric >= 10+v_award_diff*.08
      when '明星賽' then v_star_score >= 36+v_award_diff
      when '總冠軍賽MVP' then v_star_score >= 43+v_award_diff and exists(
        select 1 from jsonb_array_elements(coalesce(v_cd->'championship_history','[]'::jsonb)) c(value)
        where (c.value->>'year')::integer=v_award_year
          and c.value->>'path'=v_award_season->>'path'
          and c.value->>'tournament' like '%季後賽%'
      )
      else false
    end;
    if not coalesce(v_award_ok,false) then raise exception 'Award does not match season performance'; end if;
  end loop;

  for v_championship in select value from jsonb_array_elements(coalesce(v_cd->'championship_history','[]'::jsonb)) loop
    if jsonb_typeof(v_championship) <> 'object'
       or jsonb_typeof(v_championship->'year') <> 'number'
       or jsonb_typeof(v_championship->'path') <> 'string'
       or jsonb_typeof(v_championship->'team') <> 'string'
       or jsonb_typeof(v_championship->'tournament') <> 'string'
    then raise exception 'Malformed championship record'; end if;
    v_championship_year := (v_championship->>'year')::integer;
    if v_championship_seen ? v_championship_year::text then raise exception 'Duplicate championship season'; end if;
    v_championship_seen := v_championship_seen || jsonb_build_object(v_championship_year::text,true);
    select value into v_championship_season from jsonb_array_elements(v_seasons) where (value->>'year')::integer=v_championship_year limit 1;
    if v_championship_season is null
       or v_championship->>'path' <> v_championship_season->>'path'
       or v_championship->>'team' <> coalesce(v_championship_season->>'team','')
    then raise exception 'Championship does not match season'; end if;
    v_expected_tournament := case v_championship_season->>'path'
      when 'HBL' then 'HBL高中籃球聯賽'
      when 'UBA' then 'UBA公開一級'
      when 'UBA 強權' then 'UBA公開一級'
      when '日本大學' then '全日本大學錦標賽'
      when 'NCAA D1' then 'NCAA D1 全國錦標賽'
      when 'NCAA D2' then 'NCAA D2 全國錦標賽'
      else '季後賽'
    end;
    if v_championship->>'tournament' <> v_expected_tournament then raise exception 'Invalid championship tournament'; end if;
  end loop;

  if v_first is null then raise exception 'Missing age-16 HBL season'; end if;
  v_ceiling := public.bl_v7508_first_scoring_ceiling(v_seed,v_position,v_cd,v_first);
  if (v_first->>'pts')::numeric > v_ceiling + .2 then raise exception 'Age-16 scoring exceeds legal growth ceiling'; end if;

  v_integrity := jsonb_set(v_integrity,'{server_verified}','"passed"'::jsonb,true);
  v_integrity := jsonb_set(v_integrity,'{server_verified_at}',to_jsonb(v_verified_at),true);
  v_integrity := jsonb_set(v_integrity,'{server_ruleset}','"v7508-db-2"'::jsonb,true);
  v_integrity := jsonb_set(v_integrity,'{legacy_schedule_accepted}',to_jsonb(v_historical_schedule_accepted),true);
  v_integrity := jsonb_set(v_integrity,'{legacy_schedule_seasons}',to_jsonb(v_historical_schedule_seasons),true);
  return jsonb_set(v_cd,'{integrity}',v_integrity,true);
exception
  when invalid_text_representation or numeric_value_out_of_range or null_value_not_allowed then
    raise exception 'Malformed career record';
end;
$$;

revoke all on function public.bl_v7508_legacy_schedule_expected(text,integer,text) from public, anon, authenticated;

commit;

select
  public.bl_v7508_schedule_expected('S00463LO',2033,'CBA') as cba_games,
  public.bl_v7508_schedule_expected('S00463LO',2033,'SBL／半職業') as sbl_games;
