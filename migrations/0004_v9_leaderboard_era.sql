-- BasketballLife V9.0 leaderboard era.
-- Existing V8.1, V8.0 and V7.50 records remain untouched as read-only archives.

INSERT OR IGNORE INTO leaderboard_stats(board_key,players,careers,top_power,top_peak,updated_at)
VALUES('v9',0,0,0,0,CURRENT_TIMESTAMP);
