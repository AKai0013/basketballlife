# BasketballLife 停運與清理

停運時間：2026-10-11 12:00:00 Asia/Taipei（UTC 2026-10-11 04:00:00）。

使用者於 2026-10-02 明確要求首頁顯示運營至 10/11、當日停止運營並刪除所有遊戲相關內容；後續指定中午 12:00。此時間前不得刪除或停止服務。

## 已實作的停運控制

- 首頁在第一個畫面顯示停運日期、時間、資料清理與排行榜／公開生涯將無法查閱的說明。
- `functions/service-closure.js` 由 Cloudflare 的伺服器時間判斷截止點。
- 根 middleware 與 `_routes.json` 在截止點攔截所有首頁、資產及 API 請求並回傳 `410`／`no-store`；API 不再進入 D1 handler。
- 截止點前保留原有功能。此控制不會刪除資料；部署後即使本機未開機也能阻止新請求。
- 已下載到其他玩家裝置的離線遊戲、圖片、備份或瀏覽器存檔無法透過服務端全面抹除。停運指的是停止提供網站、資產及線上服務。

## 清理排程

- Codex thread heartbeat：`basketballlife-10-11`。
- 每日台灣時間 12:00 喚醒，prompt 強制 2026-10-11 12:00 前禁止刪除且保持安靜；到期後執行清理，未完成項目可在後續喚醒重試。
- 本機必須開機且 Codex 能執行。錯過到期時刻時不能保證刪除準時完成；伺服器截止控制仍生效。
- 每個項目核對並驗證後才標記完成；全部完成後停用排程。

## 精確清理目標

2026-10-02 已以 Cloudflare API／Wrangler、GitHub API 及 Git worktree 實際核對：

| 資源 | 精確目標 | 清理與驗證 |
| --- | --- | --- |
| Cloudflare account | `32c558d9e459c92acd6efae3910f6daa` | 僅作核對，帳號與共用憑證保留 |
| Cloudflare Pages | `basketballlife`，domain `basketballlife.pages.dev`，production branch `main` | 刪除專案及其部署；核對專案不存在與網站無法再提供遊戲 |
| Production D1 | `0d62b257-4c8a-493e-9128-e858541b89fb`，實際名稱 `basketballlife-online`，Pages production `DB` binding | 刪除專用資料庫；所有玩家、排行榜、公開生涯與共享世界資料均在範圍內；核對 ID 不再存在 |
| Preview D1 | `2010e6bd-5478-4050-9eea-f8aeb254f678`，`basketballlife-preview`，Pages preview `DB` binding | 刪除專用資料庫；核對 ID 不再存在 |
| GitHub repository | `AKai0013/basketballlife` | 刪除 repository 及其遊戲內容；須具備刪除權限，再核對 repository 不存在 |

Cloudflare 另有 `basketball-spirit-beta`，2026-10-02 核對其沒有共用上述 D1 binding，必須保留。

本機已核對三個 worktree 的 remote 均為 `https://github.com/AKai0013/basketballlife.git`：

1. `C:\Users\wl001\Documents\Codex\2026-08-17\basketballlife-v8-0-repo-akai0013-basketballlife-2\work\basketballlife-retirement-share`
2. `C:\Users\wl001\Documents\Codex\2026-08-17\new-chat-2\production-sync-tree`
3. `D:\Codex-BasketballLife\basketballlife-v8-0-repo-akai0013-basketballlife-2\work\basketballlife`

共同 Git directory 在第 3 個目標內。先記錄清理結果並停止遊戲相關本機服務，完成雲端清理後再清理本機，第 3 個目標最後處理。刪除前重新解析絕對路徑、核對 remote／目錄內容，僅對精確目標使用 `Remove-Item -LiteralPath`，不得刪除上述工作樹的上層資料夾。未追蹤的遊戲原型與遊戲專用備份在目標内也納入清理，不應建立未要求的永久備份。

## 權限與尚未核對範圍

- Cloudflare OAuth 已可正常查詢 Pages／D1，具備 `pages:write` 與 `d1:write`；到期仍须重新核對是否有效。
- GitHub CLI 目前 scopes 為 `gist, read:org, repo, workflow`，缺少 `delete_repo`。不可宣稱已具備永久刪除 repository 的能力；到期先確認是否已授予，否則回報權限障礙，不可把清空分支冒稱 repository 已刪除。
- 其他本機遊戲副本／備份需先盤點並核對專用性，不能依模糊名稱或全文命中批次刪除。
- 尚未列明的 Threads／Instagram／其他社群宣傳貼文、附件或其他 repository，需先列出精確網址／ID，再確認範圍；不得刪除共用帳號或其他遊戲內容。
- 共用 Cloudflare／GitHub 帳號、Codex 安裝／系統／記憶與 BasketballSpirit 均保留。
- 原創 repository 2026-10-02 未見 GitHub forks；使用者以外的人已下載或轉載的副本仍不在可控制範圍。

## 驗證

- 截止前 1ms 正常；截止時首頁／資產／API GET／POST／DELETE／HEAD 均為 `410`，HEAD 無 body，API 不執行後續 handler。
- 完整 Node 測試：251/251。
- 隔離 Chrome：1440／430／390px 公告於第一畫面完整顯示，無水平溢位與頁面錯誤；位置選擇正常，重載公告保留；模擬停運頁無開局控制。
- 發布狀態與永久刪除結果以當次 GitHub／Cloudflare／本機驗證為準。2026-10-02 尚未刪除任何遊戲專案或玩家資料。
