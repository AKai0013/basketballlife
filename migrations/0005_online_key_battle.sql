-- Three-player ONLINE key battle prototype. Additive only; no career or leaderboard rows are changed.

CREATE TABLE IF NOT EXISTS online_key_battle_rooms (
  room_code TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','playing','finished')),
  current_turn INTEGER NOT NULL DEFAULT 0,
  max_turns INTEGER NOT NULL DEFAULT 4,
  turn_deadline INTEGER NOT NULL DEFAULT 0,
  team_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  trust INTEGER NOT NULL DEFAULT 50,
  last_result TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_user_id) REFERENCES profiles(user_id)
);

CREATE TABLE IF NOT EXISTS online_key_battle_players (
  room_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('guard','wing','big')),
  nickname TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(room_code,user_id),
  UNIQUE(room_code,role),
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code),
  FOREIGN KEY(user_id) REFERENCES profiles(user_id)
);

CREATE TABLE IF NOT EXISTS online_key_battle_actions (
  room_code TEXT NOT NULL,
  turn INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('guard','wing','big')),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  controlled_by TEXT NOT NULL DEFAULT 'human' CHECK(controlled_by IN ('human','ai')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(room_code,turn,role),
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code)
);

CREATE TABLE IF NOT EXISTS online_key_battle_turns (
  room_code TEXT NOT NULL,
  turn INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK(phase IN ('offense','defense')),
  result TEXT NOT NULL,
  actions TEXT NOT NULL,
  team_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  trust INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(room_code,turn),
  FOREIGN KEY(room_code) REFERENCES online_key_battle_rooms(room_code)
);

CREATE INDEX IF NOT EXISTS idx_online_key_battle_owner_status ON online_key_battle_rooms(owner_user_id,status);
CREATE INDEX IF NOT EXISTS idx_online_key_battle_actions_turn ON online_key_battle_actions(room_code,turn);
