Object.assign(OFF_COURT_EVENT_DEFS,{
 mentorCall:{title:"以前的教練傳來一段沒有剪完的影片",desc:"帶你入門的教練傳來一段學生比賽影片。他沒有要你替誰背書，只問你願不願意把當年別人教過你的判讀，完整說給一名年輕球員聽。",kicker:"🎞️ 來處與傳承",actions:[["mentorReview","排出一小時逐球說明","少掉一段休息，換成一份真正能被使用的回覆。"],["mentorVoice","錄下三段重點語音","保留賽程與恢復，也不讓求助只得到一句加油。"],["mentorDelay","等休賽季再處理","守住眼前安排，但需要幫助的人不一定等得到。"]]},
 familyVisit:{title:"家人把看診時間藏在賽程背面",desc:"家人原本只說是例行檢查，你卻在行程表背面看見需要陪同的時間。它撞上球隊恢復日，不是生死抉擇，卻也不是一句有空再說。",kicker:"🏠 家庭與缺席",actions:[["familyAttend","向球隊請半天假陪同","親自到場並補做恢復，必須承擔額外行程。"],["familyArrange","安排可信任的人陪同並全程聯絡","不虛構自己在場，仍把照顧責任安排清楚。"],["familyIgnore","只傳訊息詢問結果","保住球隊行程，也讓家人看見你的優先順序。"]]},
 overseasHome:{title:"租約到期，但球季還沒有答案",desc:"你在海外效力的住處即將到期，球團下一季去留卻尚未確定。續租、短租或先寄回物品，都會把合約不確定性變成真實生活成本。",kicker:"🧳 旅外與去留",actions:[["homeRenew","續租並承擔提前解約風險","保住熟悉生活，押注自己仍會留在這座城市。"],["homeShort","改住短租到市場明朗","成本較高，卻替下一份合約保留移動空間。"],["homePack","先寄回大部分物品","降低後續搬遷壓力，也讓這座城市提早像在告別。"]]}
});
const OFF_COURT_AUTHORED_ACTIONS={
 mentorReview:[{fatigue:3,rep:3},"你和教練把影片停了二十多次。通話結束前，年輕球員在最後一個回合先說出了自己的判讀。"],mentorVoice:[{rep:1,discipline:1},"三段語音都能直接帶進訓練。幾天後，教練只回傳一張寫滿筆記的戰術板。"],mentorDelay:[{confidence:-1},"訊息被標成稍後處理；球季繼續往前，那段影片仍停在沒有剪完的位置。"],
 familyAttend:[{fatigue:3,familyHarmony:5},"你坐在診間外補看球隊影片。檢查結束後，家人第一次沒有用『沒事』替你省略過程。"],familyArrange:[{familyHarmony:3,discipline:1},"陪同、交通與回報時間都被排好。你沒有假裝人在現場，也沒有把責任留成一句再看看。"],familyIgnore:[{familyHarmony:-5,confidence:-1},"結果傳來時你正在恢復室。家人回了一句收到，卻沒有再提為什麼一開始不告訴你。"],
 homeRenew:[{confidence:2,financialLosses:30},"你把下一季仍留在這裡的可能簽進租約。鑰匙沒有更換，市場壓力卻第一次有了地址。"],homeShort:[{discipline:2,financialLosses:15},"行李沒有完全拆開，但下一份報價到來時，你不必先處理一整間房子的承諾。"],homePack:[{confidence:-2,bodyLoad:-2},"箱子寄走後，住處牆面空了一半。你仍替目前球隊比賽，只是不再假裝去留已經確定。"]
};
