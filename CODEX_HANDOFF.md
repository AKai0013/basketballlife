# BasketballLife V8.1 修正交接

- 階段：maintenance／隔離修正分支 `codex/v81-review-fixes`
- 目標：修正 V8.1 Review 發現的市場報價、事件節奏、NBA／歐洲迴圈與玩家姓名顯示風險；不修改 `main`。存檔復原提案已取消，維持原有存檔行為。
- 已完成：正式市場報價不再由候選補足；特殊事件最多三件並新增最後一舞取向；40 歲以上已有 NBA 履歷者不再由歐洲回 NBA；動態姓名 HTML escape；一般賽季固定有一場本季關鍵戰，國家隊徵召時由國家隊關鍵戰優先接管。
- 關鍵戰內容：依上季賽事、球隊方向、宿敵、合約年與傷病生成背景；提供搶代表作、以球隊勝負為優先、控制負荷三種打法；結果寫入 `seasonHistory.keyBattle`，影響代表戰／失利故事、宿敵尊重、疲勞與身體負荷，以及職業球探市場評估。最後一舞仍保留作為真正生涯關卡。
- 重要檔案：`js/career/contract-engine.js`、`js/career/season-engine.js`、`js/events/event-engine.js`、`js/ui/career-view.js`、`js/ui/event-view.js`、`js/ui/growth-preview.js`、`js/ui/retirement-view.js`、`tests/v81-behavior.test.mjs`、`tests/v81-integrity.test.mjs`
- 驗證：存檔恢復修改已撤回；44/44 tests；變更 JS `node --check`；`git diff --check` 通過。既有 HTTP 瀏覽器矩陣已走過 390px、430px、1440px 的首頁→開始生涯→季初訓練，主要行動按鈕可見且可點，遊戲內容沒有可見左右溢出。另以固定 Seed 走過 390px 的真實傷病分支，確認健康頁會顯示傷勢、部位、嚴重度、缺席場數、恢復時間與舊傷紀錄，季末結算後可正常進入下一季。以正常長生涯推進至 2039 年、29 歲、韓國職業，實際觸發成人代表隊邀請；接受後進入「國家隊關鍵戰」，選擇團隊打法後完成冠軍、國際賽數據、疲勞與傷病結果。
- 跨裝置修正：`index.html` 的本機 CSS、JS、資料與 manifest 資產統一改用 `8.1.0-sync1`，避免桌機與手機因舊 query cache 載入不同版本；手機事件選項強制保留成功率標籤，能力點數值與說明也強制可見。
- PR #34 狀態：`nationalTeamOpportunity()` 先判定徵召，只有成功進入國家隊特殊事件後，玩家選擇接受徵召才會進入 `showNationalKeyBattle()`；不是每季固定出現的事件。現有測試只驗證函式與文案存在，未覆蓋實際「徵召 → 關鍵戰」流程，因此玩家可能長時間看不到它。
- 目前風險：國家隊徵召仍是條件式出現，不是每年保證出現；本機 HTTP 預覽的 Online API 404 為預期警告，本機頁面本身回應 200。瀏覽器 QA 產生的測試生涯只存在本機測試存檔，未上傳。
- 下一步：等待使用者確認是否上傳；若要再補 QA，優先用正常長生涯觸發國家隊徵召並確認國家隊關鍵戰接管一般關鍵戰，不加入存檔自動修復。
