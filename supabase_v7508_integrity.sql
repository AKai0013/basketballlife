-- BasketballLife V7.50.8
-- Run once in the Supabase SQL Editor BEFORE deploying index.html.
-- 1. Deletes the confirmed invalid public career.
-- 2. Moves V7.50.8 publishing behind an authenticated RPC.
-- 3. Recalculates deterministic schedules / training sixes on the server.
-- 4. Stamps only validated rows as server_verified.

begin;

delete from public.career_records
where id = 'e9040a1c-5dc3-49f6-944c-8172cb8a518d'::uuid;

create or replace function public.bl_v7508_hash(p_text text)
returns bigint
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_hash bigint := 2166136261;
  v_index integer;
begin
  for v_index in 1..char_length(p_text) loop
    v_hash := ((v_hash # ascii(substr(p_text, v_index, 1)))::numeric * 16777619::numeric % 4294967296::numeric)::bigint;
  end loop;
  return v_hash;
end;
$$;

create or replace function public.bl_v7508_imul(p_left bigint, p_right bigint)
returns bigint
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select mod(p_left::numeric * p_right::numeric, 4294967296::numeric)::bigint
$$;

-- Returns the same unsigned 32-bit output as the Nth call to the game's
-- Mulberry32 RNG. All arithmetic is explicitly reduced to 32 bits.
create or replace function public.bl_v7508_rng_u32(p_seed text, p_call integer)
returns bigint
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_a bigint := public.bl_v7508_hash(p_seed);
  v_t bigint := 0;
  v_index integer;
begin
  if p_call < 1 then
    raise exception 'RNG call index must be positive';
  end if;
  for v_index in 1..p_call loop
    v_a := (v_a + 1831565813) & 4294967295;
    v_t := public.bl_v7508_imul((v_a # (v_a >> 15)) & 4294967295, (1 | v_a) & 4294967295);
    v_t := ((v_t + public.bl_v7508_imul((v_t # (v_t >> 7)) & 4294967295, (61 | v_t) & 4294967295)) & 4294967295) # v_t;
    v_t := (v_t # (v_t >> 14)) & 4294967295;
  end loop;
  return v_t;
end;
$$;

create or replace function public.bl_v7508_rand_int(p_seed text, p_call integer, p_min integer, p_max integer)
returns integer
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select floor(public.bl_v7508_rng_u32(p_seed, p_call)::numeric / 4294967296::numeric * (p_max - p_min + 1))::integer + p_min
$$;

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
    ('NCAA D2',26,30),('NCAA D1',29,31),('SBL／半職業',20,24),
    ('台灣職業',36,36),('韓國職業',54,54),('日本職業',60,60),
    ('CBA',42,46),('NBA G League',50,50),('NBA',82,82)
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

create or replace function public.bl_v7508_deterministic_sixes(p_seed text, p_seasons jsonb)
returns integer
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_season jsonb;
  v_training_seed text;
  v_count integer;
  v_index integer;
  v_total integer := 0;
begin
  for v_season in select value from jsonb_array_elements(p_seasons) loop
    if (v_season->>'age')::integer < 22 then
      v_training_seed := p_seed || 'training-' || (v_season->>'year') || '-' || (v_season->>'path');
      v_count := public.bl_v7508_rand_int(v_training_seed, 1, 4, 6);
      for v_index in 1..v_count loop
        if public.bl_v7508_rand_int(v_training_seed, v_index + 1, 1, 6) = 6 then
          v_total := v_total + 1;
        end if;
      end loop;
    end if;
  end loop;
  return v_total;
end;
$$;

create or replace function public.bl_v7508_seed_start_range(p_seed text)
returns integer[]
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_fixed text[] := array[
    'K8M2X7QP','7RNP4A2Z','V9T4L2QK','M3X8P6RA','Q7N2K9WV','A4Z8M2TR','P6Q3X9LK','R8V2N5MA','T4K7Q1ZX','W9M3P8LR',
    'B5Q7K2NP','C8R4M9TX','D2V7P6LA','F9K3Q8MW','G4N6X2RP','H7M9T3KA','J2Q8V5LN','L6P4R9XK','N3T7M2QA','P8W5K4ZR','R2L9Q6MX','T7A3N8KP',
    'V4M2X9RQ','X8Q5L3NP','Z2R7K6MV','B9T4P2XA','C3M8Q7LK','D7P2V9RN','F4X6K3MT','G8Q2L7PA','H3N9R5KV','J6M4T8QX','L2P7A9RN','N8V3K5MQ',
    'P4Q9X2LT','R7M5A8KN','T2K6P9QV','V9L3R4MX','X5N8Q2KA','Z7P4M6RT','B2V9L5QK','C7M3X8PA','D4Q6R2VN','F8K5T9LM','G2P7N4RX','H9V3M6QA',
    'J5L8Q2KP','L7R4X9MN','N2K8P5VT','P9M6Q3LA'
  ];
  v_index integer := array_position(v_fixed, upper(p_seed));
  v_bucket integer;
begin
  if v_index is not null then
    if v_index <= 3 then return array[4,7]; end if;
    if v_index <= 10 then return array[2,5]; end if;
    if v_index <= 22 then return array[0,3]; end if;
    if v_index <= 40 then return array[-1,2]; end if;
    return array[-4,-1];
  end if;
  v_bucket := (public.bl_v7508_hash(upper(p_seed)) % 10000)::integer;
  if v_bucket < 600 then return array[4,7]; end if;
  if v_bucket < 2000 then return array[2,5]; end if;
  if v_bucket < 4400 then return array[0,3]; end if;
  if v_bucket < 8000 then return array[-1,2]; end if;
  return array[-4,-1];
end;
$$;

-- Deliberately generous upper bound for the age-16 HBL scoring line. It uses
-- the real Seed, position, body settings, first training dice and event count,
-- then assumes every available point was spent on scoring plus 30 free levels.
create or replace function public.bl_v7508_first_scoring_ceiling(
  p_seed text, p_position text, p_career_data jsonb, p_first_season jsonb
)
returns numeric
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_start integer[] := public.bl_v7508_seed_start_range(p_seed);
  v_rng_seed text := upper(p_seed) || p_position;
  v_shoot numeric;
  v_finish numeric;
  v_ath numeric;
  v_height integer;
  v_wingspan integer;
  v_default_height integer;
  v_default_reach integer;
  v_h integer := 0;
  v_w integer := 0;
  v_event_count integer;
  v_training_seed text := upper(p_seed) || 'training-2026-HBL';
  v_dice_count integer;
  v_training_points integer := 0;
  v_index integer;
  v_max_skill numeric;
  v_pts_bias numeric;
  v_minutes numeric;
  v_scoring36 numeric;
begin
  v_shoot := public.bl_v7508_rand_int(v_rng_seed,1,31,45) + public.bl_v7508_rand_int(v_rng_seed,2,v_start[1],v_start[2]);
  v_finish := public.bl_v7508_rand_int(v_rng_seed,3,31,45) + public.bl_v7508_rand_int(v_rng_seed,4,v_start[1],v_start[2]);
  v_ath := public.bl_v7508_rand_int(v_rng_seed,13,33,48) + public.bl_v7508_rand_int(v_rng_seed,14,v_start[1],v_start[2]);

  if p_position = 'SG' then v_shoot := v_shoot + 7; v_finish := v_finish + 4; end if;
  if p_position = 'SF' then v_finish := v_finish + 5; end if;

  if (p_career_data->>'height_cm') ~ '^\d+$' and (p_career_data->>'wingspan_cm') ~ '^\d+$' then
    v_height := (p_career_data->>'height_cm')::integer;
    v_wingspan := (p_career_data->>'wingspan_cm')::integer;
    select x.default_height, x.default_reach into v_default_height, v_default_reach
    from (values ('PG',188,10),('SG',195,11),('SF',201,13),('PF',205,15),('C',211,18)) x(pos,default_height,default_reach)
    where x.pos = p_position;
    v_h := greatest(-2, least(2, floor((v_height - v_default_height)::numeric / 5 + 0.5)::integer));
    v_w := greatest(-2, least(2, floor(((v_wingspan - v_height) - v_default_reach)::numeric / 5 + 0.5)::integer));
    v_shoot := v_shoot - v_w;
    v_finish := v_finish + v_h;
    v_ath := v_ath - v_h;
  end if;

  v_shoot := greatest(22,least(58,v_shoot));
  v_finish := greatest(22,least(58,v_finish));
  v_ath := greatest(22,least(58,v_ath));
  v_event_count := public.bl_v7508_rand_int(v_rng_seed,29,2,4);
  v_dice_count := public.bl_v7508_rand_int(v_training_seed,1,4,6);
  for v_index in 1..v_dice_count loop
    v_training_points := v_training_points + public.bl_v7508_rand_int(v_training_seed,v_index+1,1,6);
  end loop;

  v_max_skill := v_shoot*.43 + v_finish*.42 + v_ath*.15 + (v_training_points + v_event_count*6 + 30)*.43;
  v_pts_bias := case p_position when 'PG' then .85 when 'SG' then 1.20 when 'SF' then 1.05 when 'PF' then .90 else .82 end;
  v_minutes := greatest(0,least(32,(p_first_season->>'mins')::numeric));
  v_scoring36 := 8 + (v_max_skill - 40)*.43 + 3;
  return round(greatest(3,v_scoring36) * (v_minutes/36) * v_pts_bias,1);
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
    if v_scheduled <> public.bl_v7508_schedule_expected(v_seed,v_year,v_path) then raise exception 'Deterministic schedule mismatch'; end if;
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
  v_integrity := jsonb_set(v_integrity,'{server_ruleset}','"v7508-db-1"'::jsonb,true);
  return jsonb_set(v_cd,'{integrity}',v_integrity,true);
exception
  when invalid_text_representation or numeric_value_out_of_range or null_value_not_allowed then
    raise exception 'Malformed career record';
end;
$$;

create or replace function public.bl_v7508_career_insert_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  new.career_data := public.bl_v7508_validate_career(to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists bl_v7508_career_insert_guard on public.career_records;
create trigger bl_v7508_career_insert_guard
before insert on public.career_records
for each row execute function public.bl_v7508_career_insert_guard();

create or replace function public.publish_career_v7508(p_record jsonb)
returns table(id uuid, career_data jsonb)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(p_record->>'user_id','') <> v_user_id::text then raise exception 'Career owner mismatch'; end if;
  if p_record->'career_data'->>'publisher_version' <> '7.50.8' then raise exception 'V7.50.8 publisher required'; end if;

  return query
  insert into public.career_records as inserted(
    id,user_id,nickname,player_name,position,seed,seed_tier,retired_age,final_year,
    peak_overall,career_rating,career_games,career_salary,championships,national_caps,
    hall_of_fame,jersey_retired,awards,titles,league_summary,season_history,career_data,is_public
  ) values (
    (p_record->>'id')::uuid,v_user_id,left(p_record->>'nickname',30),left(p_record->>'player_name',30),
    p_record->>'position',upper(p_record->>'seed'),left(coalesce(p_record->>'seed_tier',''),30),
    (p_record->>'retired_age')::integer,(p_record->>'final_year')::integer,
    (p_record->>'peak_overall')::integer,(p_record->>'career_rating')::bigint,
    (p_record->>'career_games')::integer,(p_record->>'career_salary')::bigint,
    (p_record->>'championships')::integer,(p_record->>'national_caps')::integer,
    coalesce(p_record->'hall_of_fame','[]'::jsonb),coalesce(p_record->'jersey_retired','[]'::jsonb),
    coalesce(p_record->'awards','[]'::jsonb),coalesce(p_record->'titles','[]'::jsonb),
    coalesce(p_record->'league_summary','{}'::jsonb),p_record->'season_history',p_record->'career_data',true
  )
  returning inserted.id,inserted.career_data;
end;
$$;

-- The browser can no longer bypass the validator with a direct INSERT/UPDATE.
revoke insert, update on public.career_records from anon, authenticated;
revoke all on function public.bl_v7508_validate_career(jsonb) from public, anon, authenticated;
revoke all on function public.bl_v7508_career_insert_guard() from public, anon, authenticated;
revoke all on function public.publish_career_v7508(jsonb) from public, anon;
grant execute on function public.publish_career_v7508(jsonb) to authenticated;

commit;

-- Expected result after the transaction: 0.
select count(*) as blocked_record_remaining
from public.career_records
where id = 'e9040a1c-5dc3-49f6-944c-8172cb8a518d'::uuid;
