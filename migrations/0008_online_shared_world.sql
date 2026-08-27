-- Two-or-three-player shared-world careers. Each player owns an independent career.
-- Additive only: no single-player career, leaderboard, or prior ONLINE rows are rewritten.

CREATE TABLE IF NOT EXISTS online_shared_worlds (
  room_code TEXT PRIMARY KEY,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  timeline_year INTEGER NOT NULL DEFAULT 2026,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'personal' CHECK(phase IN ('personal','intersection','offseason','resolving')),
  world_seed TEXT NOT NULL,
  last_world_result TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code)
);

CREATE TABLE IF NOT EXISTS online_shared_player_careers (
  room_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK(position IN ('guard','wing','big')),
  origin_route TEXT NOT NULL CHECK(origin_route = 'hbl'),
  league TEXT NOT NULL,
  team_name TEXT NOT NULL,
  age INTEGER NOT NULL DEFAULT 16,
  overall INTEGER NOT NULL DEFAULT 55,
  health INTEGER NOT NULL DEFAULT 90,
  reputation INTEGER NOT NULL DEFAULT 25,
  draft_stock INTEGER NOT NULL DEFAULT 15,
  contract_years INTEGER NOT NULL DEFAULT 0,
  career_flags TEXT NOT NULL DEFAULT '{}',
  last_result TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(room_code,user_id),
  UNIQUE(room_code,position),
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code),
  FOREIGN KEY(user_id) REFERENCES profiles(user_id)
);

CREATE TABLE IF NOT EXISTS online_shared_choices (
  room_code TEXT NOT NULL,
  cycle_number INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  choice TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(room_code,cycle_number,chapter_number,user_id),
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code)
);

CREATE TABLE IF NOT EXISTS online_shared_history (
  room_code TEXT NOT NULL,
  cycle_number INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  choice TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(room_code,cycle_number,chapter_number,user_id),
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code)
);

CREATE INDEX IF NOT EXISTS idx_online_shared_choices_checkpoint ON online_shared_choices(room_code,cycle_number,chapter_number);
CREATE INDEX IF NOT EXISTS idx_online_shared_history_player ON online_shared_history(room_code,user_id,cycle_number,chapter_number);
