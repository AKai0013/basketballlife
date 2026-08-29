import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const line = value => clean(value) || "（原資料未提供）";

function evaluateClassic(file, names) {
  const context = {};
  vm.createContext(context);
  const expose = names.map(name => `globalThis.${name} = typeof ${name} === "undefined" ? undefined : ${name};`).join("\n");
  vm.runInContext(`${read(file)}\n${expose}`, context, { filename: file });
  return Object.fromEntries(names.map(name => [name, context[name]]));
}

function evaluateClassicFiles(files, names) {
  const context = {};
  vm.createContext(context);
  const expose = names.map(name => `globalThis.${name} = typeof ${name} === "undefined" ? undefined : ${name};`).join("\n");
  vm.runInContext(`${files.map(read).join("\n")}\n${expose}`, context, { filename: files.join(" + ") });
  return Object.fromEntries(names.map(name => [name, context[name]]));
}

function evaluateModuleData(file, names) {
  const context = {};
  vm.createContext(context);
  const source = read(file)
    .replace(/\bexport\s+(?=(?:const|let|var|function|class)\b)/g, "")
    .replace(/\bexport\s*\{[^}]*\};?/g, "");
  const expose = names.map(name => `globalThis.${name} = typeof ${name} === "undefined" ? undefined : ${name};`).join("\n");
  vm.runInContext(`${source}\n${expose}`, context, { filename: file });
  return Object.fromEntries(names.map(name => [name, context[name]]));
}

const ordinaryData = evaluateClassicFiles(["data/events.js", "data/off-court-events-v911.js", "data/ordinary-event-outcomes-v911.js"], ["events", "PRO_GENERAL_EVENTS", "OFF_COURT_EVENT_DEFS"]);
const storyData = evaluateClassicFiles(["data/career-story-events.js", "data/career-story-copy-v911.js"], ["CAREER_STORY_EVENTS"]);
const sharedSeasonData = evaluateModuleData("functions/api/shared-season-events.js", ["SHARED_SEASON_EVENTS"]);
const sharedStoryData = evaluateModuleData("functions/api/shared-career-stories.js", ["STORY_NODES"]);

const ordinary = [...(ordinaryData.events || []), ...(ordinaryData.PRO_GENERAL_EVENTS || [])];
const offCourt = ordinaryData.OFF_COURT_EVENT_DEFS || {};
const stories = storyData.CAREER_STORY_EVENTS || [];
const sharedSeason = sharedSeasonData.SHARED_SEASON_EVENTS || {};
const sharedStories = sharedStoryData.STORY_NODES || {};

const out = [];
const h = (level, text) => out.push(`${"#".repeat(level)} ${text}`, "");
const p = text => out.push(line(text), "");
const bullet = text => out.push(`- ${line(text)}`);

const requirementLabels = {
  hasNationalCaps: "至少一場正式成人代表隊紀錄",
  nationalEligible: "當季符合培訓或代表隊資格",
  medicalConcern: "存在尚未結束的傷勢、復健或重大傷病紀錄",
  hasPartner: "存檔中已有伴侶關係",
  contractOptionPending: "合約選項尚待決定",
  madePlayoffs: "本季已取得季後賽資格",
  minChampionships: "至少一座正式職業冠軍",
  minCareerSeason: "達到指定生涯年資",
  minCareerGames: "達到指定生涯出賽",
  minRecognition: "已有指定層級的聯盟評價",
  minRep: "已有指定球隊或市場評價",
  minGames: "本季達到指定出賽",
  maxMins: "本季平均時間低於指定門檻",
  contractMinRemaining: "合約剩餘年至少符合門檻",
  contractMaxRemaining: "合約剩餘年不超過門檻"
};

function requirementsText(event) {
  const req = event.requirements || {};
  const rows = Object.entries(req).map(([key, value]) => `${requirementLabels[key] || key}：${Array.isArray(value) ? value.join("／") : value === true ? "是" : value}`);
  return rows.length ? rows.join("；") : "依階段、主線抽取與前置節點判定；沒有符合條件就不出現。";
}

function factBindings(event) {
  const text = `${event.id || ""} ${event.line || ""} ${event.theme || ""}`.toLowerCase();
  const facts = [];
  if (/national/.test(text)) facts.push("正式代表隊年份、賽事結果、當時球隊與既有國家隊選擇；沒有正式紀錄時整段鎖定");
  if (/injury|medical|rehab/.test(text)) facts.push("實際傷勢名稱、部位、缺席場數、處理選擇與復出後角色");
  if (/champ|playoff|final/.test(text)) facts.push("實際季後賽輪次、冠軍／失利結果、當季球隊與關鍵戰紀錄");
  if (/rival/.test(text)) facts.push("同一名宿敵、第一次交手、上次選擇與目前互相尊重值");
  if (/friend/.test(text)) facts.push("同一名朋友、已完成或失約的約定，以及最近一次回訪結果");
  if (/coach|role|rotation/.test(text)) facts.push("同一名教練、當時球隊、曾談過的角色與前次信任結果");
  if (/teammate|partner|succession/.test(text)) facts.push("同一名隊友、共同球隊、爭位／合作紀錄與目前角色");
  if (/contract|market|trade|reunion|homecoming/.test(text)) facts.push("實際合約年、報價、交易前後球隊、離隊原因與重逢條件");
  if (/family/.test(text)) facts.push("已存在的家庭關係、效力城市、搬遷或缺席紀錄；沒有關係時不虛構");
  if (/legacy|veteran|late|retire/.test(text)) facts.push("真實年齡、出賽、最後球隊、角色下降／維持與已發生的生涯轉折");
  if (!facts.length) facts.push("當季真實球隊、聯盟、角色、上一個相關選擇與已產生結果");
  return facts;
}

function narrativeScale(event) {
  const text = `${event.id || ""} ${event.line || ""} ${event.theme || ""}`.toLowerCase();
  return /national|champ|playoff_injury|injury|reunion|legacy|retire|market_choice|family_city|school_rival|friend_thread|coach_role|succession/.test(text)
    ? "重大章節：可使用完整場景、比賽段落與收束動作"
    : "一般章節：維持短而具體，不擴寫成固定長篇";
}

const retirementCopy = [
  {
    id: "retire-ceremony",
    title: "主場正式引退",
    when: "retirementExitClass=ceremony，且最後一支球隊確實安排告別；引用 lastTeam、lastSeason、careerGames 與實際重要成就。",
    opening: "最後一場主場賽前，{lastTeam} 把你的置物櫃留到最後才收。球衣、護具和本季的比賽計畫仍在原位，只有門上多了一張由隊友簽滿的紙：『今天不用替下一場留力。』",
    body: "終場前 {lastMinutes} 分鐘，教練依照你本季真正的角色把你換上場。這段比賽不保證絕殺；如果你近年已轉為防守、組織或替補領袖，最後一段就用那項工作完成。計時器歸零後，{returningPerson} 帶著曾在 {callbackYear} 年留下的 {memoryObject} 走到場邊。",
    ending: "你把球鞋放進置物櫃，卻沒有把門關上。最年輕的隊友還要進來拿走明天的訓練表。"
  },
  {
    id: "retire-voluntary",
    title: "自己決定停下來",
    when: "玩家主動退休且仍有出賽能力；不得寫成無合約或被迫離隊。",
    opening: "球隊的下一季計畫已經送到你手上，裡面仍有名字、分鐘與工作。你看完後沒有簽回去，而是請球團把教練、經紀人和一路陪你最久的人留到會議最後。",
    body: "你逐一說明這不是因為某一場失敗，也不是等待市場替你下結論。畫面會引用最後一季的真實角色、健康與家庭狀態；如果曾承諾『再打一季』，此處回收那個承諾。",
    ending: "離開球館前，你把下一季行事曆折好放進口袋——上面第一次沒有任何一場比賽非到不可。"
  },
  {
    id: "retire-no-offer",
    title: "市場沒有再開門",
    when: "正式自由市場與母隊都沒有合約，且退休原因確實為無報價；引用最後報價、測試與經紀人紀錄。",
    opening: "自由市場截止日過後，經紀人的手機安靜了整個下午。桌上不是空白：有你完成的測試、拒絕過的條件、願意接受的角色，以及最後仍沒有送來的正式合約。",
    body: "你和經紀人重新看過最後一次市場決定。若曾拒絕不合適角色，文本承認那是你的選擇；若所有球隊都沒有報價，文本不把它美化成主動告別。最後一支球隊、最後一場正式比賽與最後一次進入輪替都必須寫對。",
    ending: "經紀人把手機反扣在桌上。這一次，你們都沒有再說『再等一天』。"
  },
  {
    id: "retire-injury",
    title: "傷勢替賽程畫下界線",
    when: "retirementReason 與重大傷病直接相關，且 injuryHistory 有可引用的傷勢；不得只因年齡套用。",
    opening: "醫療室的燈板再次亮起，顯示的是 {injuryYear} 年留下的 {injuryName}，以及這一季始終沒有回到安全範圍的負荷曲線。這不是第一次有人勸你休息，卻是第一次沒有人能再替你寫出復出日期。",
    body: "文本回收當時選擇：帶傷出賽、限時上場、手術、保守治療或改造打法。最後一戰服務『身體與身分分開』的主題，不用一顆英雄球假裝傷勢消失。曾協助復健的固定人物在場，態度依前次信任改變。",
    ending: "你把那條戴過最久的護具留在治療床上；走出門時，第一次不必問明天能不能訓練。"
  },
  {
    id: "retire-champion",
    title: "帶著冠軍離開",
    when: "championships>0，並引用真實冠軍年份、球隊、季後賽角色；沒有冠軍不得出現獎盃回憶。",
    opening: "球團把 {championshipYear} 年的冠軍合照放進引退會場。你先找到的不是自己，而是站在身旁的 {championshipPerson}——那年最後一輪，你們曾因 {championshipChoice} 把責任分開。",
    body: "若最後一季不是冠軍年，文本明確區分『曾經奪冠』與『以冠軍退休』。比賽段落回收當年主題：犧牲球權、傷後復出、替補接棒或關鍵防守，而不是固定寫成最後一投。",
    ending: "你沒有再碰一次獎盃，只把合照扶正。它屬於那一整隊人，不是替今天準備的道具。"
  },
  {
    id: "retire-national",
    title: "國家隊記憶回到最後一頁",
    when: "hasNationalCaps=true，並引用正式出賽年份、賽事與結果；只有培訓或觀察名單不得使用。",
    opening: "引退會場後排坐著幾名曾和你穿過同一件代表隊球衣的人。大螢幕沒有剪成英雄集錦，只停在 {nationalYear} 年 {nationalEvent} 的賽後名單：你的名字、真實結果，以及那次你選擇 {nationalChoice} 後留下的紀錄。",
    body: "若國家隊生涯有失利，必須保留失利；若有冠軍或獎牌，才顯示相應畫面。回訪人物沿用當年教練或隊友，並依合作、競爭或疏遠結果說不同的話。",
    ending: "你把代表隊外套摺好交回管理員。名字留在名單上，衣服則要給下一個被叫到的人。"
  },
  {
    id: "retire-homecoming",
    title: "母隊最後一舞",
    when: "確實接受 homecoming lastDance，且 home.team 是真實效力過的球隊。",
    opening: "球隊巴士再次停在 {homeTeam} 熟悉的入口。你離開這裡時是 {departureRole}，回來時合約只保證限時輪替與老將責任；兩件事都沒有被包裝成同一個你。",
    body: "最後一季引用離隊原因、旅外經歷與回歸後實際角色。若當年與教練或隊友不歡而散，先處理那段關係，不能直接寫成全場歡迎。最後一戰由目前能力完成，不恢復巔峰數值。",
    ending: "你最後一次把門禁卡放到櫃檯。管理員看了一眼，沒有收進回收盒，而是夾進那本寫滿歷年球員名字的簿子。"
  },
  {
    id: "retire-quiet",
    title: "沒有儀式的最後一場",
    when: "普通告別或低評價生涯；不得硬套傳奇、全場掌聲、球衣退休或名人堂。",
    opening: "最後一場比賽結束時，場館照常播放散場音樂。你和隊友完成握手、伸展與賽後會議，直到工作人員開始收椅子，才有人想起這是你的最後一次球員報到。",
    body: "文本引用真實出賽數與最後角色，不用掌聲大小衡量生涯。若有固定朋友、教練或隊友主線，只讓實際維持關係的人出現；若沒有，保留安靜，不臨時創造知己。",
    ending: "你關掉置物櫃上方的小燈。走廊沒有變得特別，但你知道自己不會再從這扇門穿著球衣回來。"
  },
  {
    id: "retire-shared-world",
    title: "共享世界共同終章",
    when: "只在 2～3 人共享世界；引用每名真人的真實退休年份、交手、合作與仍未完成的玩家。",
    opening: "{retiringPlayer} 完成本季後離開球員名單。同一條時間線上的 {activePlayers} 仍有下一季，因此這不是整個世界的結局，只是一個位置先空了下來。",
    body: "提早退休者依過去共同事件留下不同訊息：宿敵可保留未完成對決、同隊搭檔可交回角色、受傷支援者可回收承諾。仍在玩的玩家要做一次回應，該選擇進入之後共同事件；所有人退休後才生成整體終章。",
    ending: "共享世界沒有停在同一年結束；先離開的人把名字留在時間線上，讓後來完成的人知道最後一頁少不了誰。"
  }
];

h(1, "BasketballLife V9.1.1 全量敘事文案審稿本");
p("這份文件是依照真實條件、既有生涯事實、人物連續性、分歧後果與多年回訪完成的全量改寫審稿稿。已達標的具體文案保留，空泛段落改寫，並替每個生涯節點列出正式整合時必須讀取的事實。它不是新增的遊戲頁面，也不會在你審稿前改變事件數值、存檔、完整／精華生涯或多人流程。");
h(2, "統一文案標準");
bullet("必須符合真實生涯條件；沒有正式國家隊資歷，就不能出現國家隊回憶或國手式收尾。");
bullet("必須引用玩家真正發生過的球隊、傷病、冠軍、選擇或失敗；找不到事實就改用中性版本或不出現。");
bullet("人物必須有前後關係；教練、宿敵、朋友、隊友與家人沿用 careerCast 與事件記憶，不臨時換陌生人。");
bullet("選擇必須改變場景、人物態度、共同關係或後續事件，不以數值提示取代敘事結果。");
bullet("比賽過程必須服務事件主題；傷病章節處理身體與角色，冠軍章節處理分工與代價，不固定套用關鍵球。");
bullet("重大章節結尾必須留下能被記住的一句話或一個動作，並寫入可供多年後回訪的記憶。");
bullet("長篇只用於國家隊、冠軍、大傷、重逢、退休與生涯轉折；一般事件仍短而具體。");
bullet("學習參考文本的場景、因果與情緒，不複製原句，也不採用固定線性結局；關鍵位置保留玩家選擇與分歧回訪。");
out.push("");
h(2, "內容總表");
bullet(`一般籃球事件：${ordinary.length} 則，${ordinary.reduce((sum, event) => sum + (event.opts?.length || 0), 0)} 個選項。`);
bullet(`場外重大事件：${Object.keys(offCourt).length} 則，${Object.values(offCourt).reduce((sum, event) => sum + (event.actions?.length || 0), 0)} 個選項。`);
bullet(`單人生涯劇情：${stories.length} 個節點，${stories.reduce((sum, event) => sum + (event.choices?.length || 0), 0)} 個選項。`);
bullet(`多人季中交會：${Object.keys(sharedSeason).length} 則。`);
bullet(`多人跨季主線：${Object.keys(sharedStories).length} 條，${Object.values(sharedStories).reduce((sum, nodes) => sum + nodes.length, 0)} 個節點。`);
out.push("");

h(2, "A. 一般籃球事件");
ordinary.forEach((event, index) => {
  h(3, `A${String(index + 1).padStart(2, "0")}｜${line(event.t)}`);
  p(`場景：${line(event.d)}`);
  (event.opts || []).forEach((choice, choiceIndex) => {
    const outcomes = choice[3] && typeof choice[3] === "object" ? choice[3] : null;
    out.push(`**選項 ${choiceIndex + 1}｜${line(choice[0])}**`, "");
    p(`取捨：${line(choice[1])}`);
    if (outcomes) {
      p(`大成功：${line(outcomes.great)}`);
      p(`成功：${line(outcomes.success)}`);
      p(`失敗：${line(outcomes.fail)}`);
      p(`重大失敗：${line(outcomes.disaster)}`);
    }
  });
});

h(2, "B. 場外重大事件");
Object.entries(offCourt).forEach(([id, event], index) => {
  h(3, `B${String(index + 1).padStart(2, "0")}｜${line(event.title)}`);
  bullet(`ID：${id}`);
  bullet(`分類：${line(event.kicker)}`);
  out.push("");
  p(`場景：${line(event.desc)}`);
  (event.actions || []).forEach((choice, choiceIndex) => {
    out.push(`**選項 ${choiceIndex + 1}｜${line(choice[1])}**`, "");
    p(`取捨：${line(choice[2])}`);
  });
});

h(2, "C. 單人生涯劇情");
stories.forEach((event, index) => {
  h(3, `C${String(index + 1).padStart(3, "0")}｜${line(event.title)}`);
  bullet(`ID：${line(event.id)}`);
  bullet(`階段：${(event.stages || []).join("／") || "未限制"}`);
  bullet(`主線：${line(event.line || "獨立事件")}；節點：${line(event.node || "單次")}`);
  bullet(`出場人物：${line(event.actor)}`);
  bullet(`篇幅：${narrativeScale(event)}`);
  bullet(`必要條件：${requirementsText(event)}`);
  factBindings(event).forEach(fact => bullet(`必須引用：${fact}`));
  out.push("");
  p(`場景：${line(event.desc)}`);
  (event.choices || []).forEach((choice, choiceIndex) => {
    out.push(`**選項 ${choiceIndex + 1}｜${line(choice.label)}**`, "");
    p(`取捨：${line(choice.detail)}`);
    p(`立即結果：${line(choice.result)}`);
    p(`生涯記憶：${line(choice.memory)}`);
  });
});

h(2, "F. 退休頁面改寫稿");
p("退休頁先判定實際退役原因與生涯資料，再選擇一個主版本；國家隊、冠軍、傷病、母隊與共享世界只能作為已成立的加寫段落，不能彼此亂疊。下列變數均由存檔事實填入，沒有資料就不顯示該句。");
retirementCopy.forEach((item, index) => {
  h(3, `F${String(index + 1).padStart(2, "0")}｜${item.title}`);
  bullet(`版本 ID：${item.id}`);
  bullet(`出現條件：${item.when}`);
  out.push("");
  p(`開場：${item.opening}`);
  p(`中段：${item.body}`);
  p(`收束：${item.ending}`);
});

h(3, "F10｜退休頁固定介面文案");
out.push("| 位置 | 改寫文案 |", "| --- | --- |");
out.push("| 頁首標題 | 這段球員生涯，走到了最後一頁。 |");
out.push("| 頁首副標 | 從第一次正式登錄，到最後一次離開球員通道；以下只記錄真正發生過的球隊、選擇、勝負與留下的人。 |");
out.push("| 故事分頁 | 生涯故事 |");
out.push("| 紀錄分頁 | 逐季紀錄 |");
out.push("| 人物分頁 | 同行的人 |");
out.push("| 遺憾區塊 | 沒有完成的事 |");
out.push("| 遺憾說明 | 只列出已發生且未被後續事件修補的失利、失約、未奪冠、關係中斷或傷病結果。沒有遺憾紀錄時，不替玩家虛構。 |");
out.push("| 傳承區塊 | 後來的人記住了什麼 |");
out.push("| 分享區塊 | 分享這段真正走過的生涯 |");
out.push("| 重新開始 | 用另一個 Seed，走一條不同的路 |");
out.push("");

h(3, "F11｜退休人物回訪規則與文案");
bullet("宿敵：只有同一名宿敵至少出現兩次才回訪。和解時遞回舊球；競爭未完時只留下一句『下一次換我先到球場。』；關係破裂時不強行出席。");
bullet("教練：只引用真正提拔、降角色、衝突或再次合作的教練。信任高時交回當年的戰術筆；信任低但已和解時只在通道握手；仍決裂時不出現。");
bullet("隊友：以共同球隊和已完成事件為準。曾代扛傷病、合作奪冠或爭位者使用不同段落，不用泛稱『昔日隊友』。");
bullet("朋友／家人：只有關係仍存在才到場；曾失約且未修補時，退休頁保留空缺或一則未回覆訊息，不自動大團圓。");
out.push("");

h(3, "F12｜退休頁事實優先順序");
out.push("1. 退役原因：主動、無合約、傷病、最後一舞或共享世界提早退休。", "2. 最後一季：真實球隊、聯盟、角色、出賽、健康與最後一場結果。", "3. 重大生涯事實：冠軍、正式國家隊、重大傷病、母隊回歸。", "4. 人物回訪：只使用已建立且關係狀態允許的人。", "5. 未解後果：遺憾、失約、衝突或尚未完成的共享世界。", "6. 最後才選擇標題、長度與收束動作。", "");

h(2, "D. 多人季中交會事件");
Object.entries(sharedSeason).forEach(([id, event], index) => {
  h(3, `D${String(index + 1).padStart(2, "0")}｜${line(event.title)}`);
  bullet(`ID：${id}`);
  bullet(`性質：${line(event.kind)}`);
  out.push("");
  p(`共同場景：${line(event.detail)}`);
  const roles = event.roles || event.roleOptions || event.options || {};
  const entries = Array.isArray(roles) ? [["所有玩家", roles]] : Object.entries(roles);
  entries.forEach(([role, choices]) => {
    h(4, `身分／位置：${role}`);
    (choices || []).forEach((choice, choiceIndex) => {
      out.push(`**選項 ${choiceIndex + 1}｜${line(choice.label)}**`, "");
      p(`取捨：${line(choice.detail)}`);
    });
  });
});

h(2, "E. 多人跨季共同主線");
Object.entries(sharedStories).forEach(([lineId, nodes], lineIndex) => {
  h(3, `E${String(lineIndex + 1).padStart(2, "0")}｜${lineId}`);
  nodes.forEach((event, nodeIndex) => {
    h(4, `第 ${nodeIndex + 1} 節｜${line(event.title)}`);
    p(`共同場景：${line(event.detail)}`);
    (event.options || []).forEach((choice, choiceIndex) => {
      out.push(`**選項 ${choiceIndex + 1}｜${line(choice.label)}**`, "");
      p(`取捨：${line(choice.detail)}`);
    });
  });
});

// The retirement draft is authored beside the career-story rules above, then
// moved behind the multiplayer catalogs so the review document keeps A-F order.
const retirementStart = out.indexOf("## F. 退休頁面改寫稿");
const multiplayerStart = out.indexOf("## D. 多人季中交會事件");
if (retirementStart >= 0 && multiplayerStart > retirementStart) {
  const retirementBlock = out.splice(retirementStart, multiplayerStart - retirementStart);
  out.push(...retirementBlock);
}

h(2, "審稿檢核");
bullet("閱讀時請優先標記：場景不像真實籃球環境、選項沒有實質差異、結果沒有承接選擇、人物或聯盟條件不可能成立、以及太短而看不懂代價的段落。");
bullet("正式整合時只替換文案欄位；不因改文案順便修改能力成長、合約、傷病、Seed、排行榜或多人同步規則。");

const destination = path.join(root, "docs", "narrative-copy-review-v911.md");
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `${out.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ destination, ordinary: ordinary.length, offCourt: Object.keys(offCourt).length, stories: stories.length, sharedSeason: Object.keys(sharedSeason).length, sharedLines: Object.keys(sharedStories).length, sharedNodes: Object.values(sharedStories).reduce((sum, nodes) => sum + nodes.length, 0) }, null, 2));
