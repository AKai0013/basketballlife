# BasketballLife Cloudflare Pages Functions／D1 設定

BasketballLife 的同網域 `/api/*` 由 Cloudflare Pages Functions 提供，並透過 `DB` binding 存取 D1。`wrangler.toml` 是 Preview 與 Production binding 的版本控制來源；Cloudflare Dashboard 設定必須與它一致。

## 一、安全界線

- Production D1 不得當測試資料庫。多人驗收、測試生涯與 migration 演練只能使用本機或隔離 Preview D1。
- Production 的 migration、schema 或資料寫入必須先取得使用者明確授權。
- migration 執行前先確認目標環境、資料庫名稱與待套用清單；不要只因 binding 名稱相同就假設指向同一個 D1。
- `0002_leaderboard_read_optimization.sql` 含 `ALTER TABLE ... ADD COLUMN`，不得手動重複執行。Wrangler migration 會以 `d1_migrations` 記錄已套用檔案。
- 對已有 schema、但過去以 Dashboard 手動執行 SQL 的資料庫，不得盲目執行全部 migration；先比對現有資料表、欄位與 `d1_migrations` 記錄。

## 二、目前環境

| 環境 | Wrangler env | D1 資料庫 | Binding |
| --- | --- | --- | --- |
| 隔離 Preview | `preview` | `basketballlife-preview` | `DB` |
| 正式 Production | `production` | `DB` | `DB` |

Cloudflare Pages 專案的 Production 與 Preview 都要有 `DB` binding，但應指向不同資料庫。修改 binding 後需要新的 Pages deployment 才會生效。

`MIGRATION_SECRET` 是管理者匯入舊公開生涯時使用的加密環境變數：

- 長度至少 32 字元。
- 只設定在 Cloudflare，不寫入程式碼、`wrangler.toml`、文件、Log 或玩家瀏覽器。
- Preview 與 Production 使用不同的密鑰。

## 三、Migration 順序

| 檔案 | 目的 |
| --- | --- |
| `0001_basketballlife_d1.sql` | 玩家身分、公開生涯、基礎排行榜與 BL LIVE |
| `0002_leaderboard_read_optimization.sql` | 排行榜數值欄位、統計表、舊資料回填與索引 |
| `0003_v81_leaderboard_era.sql` | V8.1 排行榜分代 |
| `0004_v9_leaderboard_era.sql` | V9／V9.1／V9.1.1 玩家殿堂分代 |
| `0005_online_key_battle.sql` | 多人房間、玩家、共同行動與回合 |
| `0008_online_shared_world.sql` | 共享世界、個人生涯、選擇與跨季歷史 |

編號缺口不代表漏檔；目前只有上表六個正式 migration。新建空白 D1 時必須全部依檔名順序套用。

## 四、本機與 Preview migration

先確認 Wrangler 可用：

```powershell
npx wrangler --version
```

本機 D1 不會連到遠端 Preview，可用來先演練全部 migration：

```powershell
npx wrangler d1 migrations list DB --local --env preview
npx wrangler d1 migrations apply DB --local --env preview
```

隔離 Preview D1 只套用尚未套用的 migration：

```powershell
npx wrangler d1 migrations list DB --remote --env preview
npx wrangler d1 migrations apply DB --remote --env preview
```

套用後用 Preview `/api/health` 檢查 Pages Functions 與 binding，再檢查關鍵 schema。`/api/health` 回應 200 不等於所有 migration 都完整：

```powershell
npx wrangler d1 execute DB --remote --env preview --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('leaderboard_stats','online_key_battle_rooms','online_shared_worlds') ORDER BY name"
```

預期同時出現三個資料表名稱。

## 五、Production migration

只在使用者明確授權、已確認目標與備份，並先於 Preview 驗證後執行：

```powershell
npx wrangler d1 migrations list DB --remote --env production
npx wrangler d1 migrations apply DB --remote --env production
```

套用後要核對：

- `/api/health` 回應 `200` 與 `{"ok":true,"backend":"cloudflare-d1"}`。
- `leaderboard_stats`、`online_key_battle_rooms`、`online_shared_worlds` 存在。
- 既有 V7.50、V8、V8.1、V9／V9.1／V9.1.1 排行榜仍可讀取。
- 沒有為驗收寫入測試生涯或多人房間。

## 六、D1 資料原則

- 單人生涯的逐步流程保留在瀏覽器存檔；不寫入每一步 funnel 事件。
- D1 會儲存玩家暱稱、公開退休生涯、排行榜摘要、必要的 BL LIVE 內容。
- 多人共享世界會寫入房間、玩家生涯摘要、共同選擇、共同結果與跨季歷史。
- 共同選擇與結果必須保持重試冪等；不得因重連重複加成、重複推進年份或重複計入多人排行。
- 不刪除舊 Supabase 或正式 D1 資料，除非使用者明確授權且已有可還原備份。

## 七、匯入舊公開生涯

匯入前先備份、核對 JSON 筆數，並確認目標網址。先以 Preview 驗證；沒有明確授權不得匯入 Production。

PowerShell：

```powershell
$env:BL_MIGRATION_SECRET = '<Preview 密鑰>'
node tools/import_supabase_export_to_d1.mjs career_records.json https://<preview-host>
Remove-Item Env:BL_MIGRATION_SECRET
```

Bash：

```bash
BL_MIGRATION_SECRET='<Preview 密鑰>' node tools/import_supabase_export_to_d1.mjs career_records.json https://<preview-host>
```

工具每批最多傳送 25 筆，保留原公開生涯 ID，因此既有分享網址可維持相容。匯入後核對筆數、隨機抽查內容與公開分享路徑，在確認前不刪除來源資料。

## 八、正式上線檢查

1. 確認部署的 commit 與授權的 commit 一致。
2. 確認 Pages Functions 的 Production `DB` binding 指向正確 D1。
3. 確認 `/api/health` 回應 200。
4. 只讀核對排行榜與公開生涯；不建立測試記錄。
5. 如有多人變更，必須先在 Preview 完成 `docs/multiplayer-acceptance-matrix-v911.md` 的相關項目。
