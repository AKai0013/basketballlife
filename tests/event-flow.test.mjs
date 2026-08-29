import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({});
const eventSource = fs.readFileSync(path.join(root, "data/events.js"), "utf8");
const injurySource = fs.readFileSync(path.join(root, "data/injuries.js"), "utf8");
const eventEngineSource = fs.readFileSync(path.join(root, "js/events/event-engine.js"), "utf8");
vm.runInContext(`${eventSource}\n${injurySource}\nglobalThis.__BL_TEST_DATA={events,PRO_GENERAL_EVENTS,INJURY_PRESSURE_EVENTS,OFF_COURT_EVENT_DEFS};`, context);

function eventLogic(player) {
  const logic = vm.createContext({p:player,console});
  vm.runInContext(eventSource, logic);
  vm.runInContext(injurySource, logic);
  vm.runInContext(`
    function isProPath(){return ["SBL／半職業","台灣職業","日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA"].includes(p.path)}
    function isCollegePath(){return ["UBA","UBA 強權","NCAA D1","NCAA D2","日本大學"].includes(p.path)}
    function overall(){const values=Object.values(p.stats||{});return values.length?Math.round(values.reduce((sum,value)=>sum+Number(value||0),0)/values.length):0}
  `, logic);
  vm.runInContext(eventEngineSource, logic);
  return logic;
}

test("ordinary and professional events keep three choices", () => {
  const rows = [...context.__BL_TEST_DATA.events, ...context.__BL_TEST_DATA.PRO_GENERAL_EVENTS, ...context.__BL_TEST_DATA.INJURY_PRESSURE_EVENTS];
  assert.ok(rows.length >= 30);
  for (const event of rows) {
    assert.equal(event.opts?.length, 3, event.t);
    assert.equal(new Set(event.opts.map((option) => option[0])).size, 3, event.t);
  }
});

test("expanded ordinary pools contain 103 distinct events",()=>{
  const ordinary=Array.from(context.__BL_TEST_DATA.events);
  const professional=Array.from(context.__BL_TEST_DATA.PRO_GENERAL_EVENTS);
  assert.equal(ordinary.length,46);
  assert.equal(professional.length,57);
  const titles=[...ordinary,...professional].map(event=>event.t);
  assert.equal(new Set(titles).size,103);
});

test("new scene events provide a specific result for every choice and outcome tier",()=>{
  const titles=new Set([
    "暫停只剩最後一次","隊長要求交換防守任務","邊線球只剩零點八秒","隊友把你的加練影片傳進群組",
    "導師把缺席單送到球館","期中考週撞上跨校客場",
    "菜鳥記錯最後一波戰術","客場球迷把飯店房號貼上網","記錄台多算了你一次犯規","對手公開說出你的第一選擇",
    "白天排班臨時延長","主場臨時換到陌生場館","翻譯漏掉最後一句防守口令","跨省客場的裝備箱沒有抵達",
    "NBA 母隊臨時要看一場試用","國內聯賽與跨國賽只隔兩天","全國轉播把開賽時間提前",
    "戰術角色調整","投籃低潮","影片會議","關鍵第四節","主場噓聲","隊友進入合約年",
    "對手開始放空你的外線","換防後對手連續點名你","賽前發言輪到你","年輕隊友帶著影片來敲門","最後一個輪替名額"
  ]);
  const rows=[...context.__BL_TEST_DATA.events,...context.__BL_TEST_DATA.PRO_GENERAL_EVENTS].filter(event=>titles.has(event.t));
  assert.equal(rows.length,titles.size);
  for(const event of rows){
    for(const option of event.opts){
      assert.deepEqual(Object.keys(option[3]||{}).sort(),["disaster","fail","great","success"],`${event.t}: ${option[0]}`);
      for(const result of Object.values(option[3]))assert.ok(result.length>=24,`${event.t}: ${option[0]}`);
    }
  }
});

test("new emotional ordinary scenes keep concrete copy and four authored outcomes",()=>{
  const titles=new Set([
    "輸球後，校車只剩最後一排","家人坐在客隊看台","隊友的鞋底在熱身時裂開","助教刪掉你唯一一段精華",
    "器材室最後一件球衣","畢業合照和彩排撞上決勝練習","班導把賽程貼在作業旁","學長把護膝留在你的椅上",
    "隊友被交易後留下半杯咖啡","連續未登錄後，名牌被移到最外側","季後賽輪替縮成八人","主場開始喊替補的名字",
    "交易截止日前的未接來電","體能教練的最後一個工作日","客場房門下的手寫信","練習隊球員拿到正式合約",
    "賽後只剩那次失誤被反覆播放","主場地板換掉了舊隊徽","最後一波不再畫給你","教練忘了約好的角色會議",
    "賽前，隊友請你把最後一球交給他"
  ]);
  const rows=[...context.__BL_TEST_DATA.events,...context.__BL_TEST_DATA.PRO_GENERAL_EVENTS].filter(event=>titles.has(event.t));
  assert.equal(rows.length,titles.size);
  for(const event of rows){
    assert.ok(event.d.length>=40,event.t);
    for(const option of event.opts){
      assert.ok(option[1].length>=17,`${event.t}: ${option[0]}`);
      assert.deepEqual(Object.keys(option[3]||{}).sort(),["disaster","fail","great","success"],`${event.t}: ${option[0]}`);
      assert.doesNotMatch(Object.values(option[3]).join(" "),/事情往最好的方向|選擇帶來正面結果|沒有帶來預期效果|朝最差方向發展/,event.t);
    }
  }
});

test("third-batch professional rewrites contain a concrete setup and meaningful choices",()=>{
  const titles=new Set(["戰術角色調整","投籃低潮","影片會議","關鍵第四節","主場噓聲","隊友進入合約年"]);
  const rows=Array.from(context.__BL_TEST_DATA.PRO_GENERAL_EVENTS).filter(event=>titles.has(event.t));
  assert.equal(rows.length,titles.size);
  for(const event of rows){
    assert.ok(event.d.length>=55,event.t);
    for(const option of event.opts)assert.ok(option[1].length>=24,`${event.t}: ${option[0]}`);
  }
});

test("rewritten legacy drills describe a real decision instead of stat labels",()=>{
  const titles=new Set(["控球加練","防守腳步課","籃板卡位","中距離武器","罰球線壓力","擋拆傳球窗口","左手終結","弱側協防","單打腳步調整","防守任務升級","籃板責任增加","持球壓力"]);
  const rows=[...context.__BL_TEST_DATA.events,...context.__BL_TEST_DATA.PRO_GENERAL_EVENTS].filter(event=>titles.has(event.t));
  assert.equal(rows.length,titles.size);
  for(const event of rows){
    assert.ok(event.d.length>=45,event.t);
    for(const option of event.opts)assert.ok(option[1].length>=20,`${event.t}: ${option[0]}`);
  }
});

test("ordinary event resolver prefers authored result text and keeps legacy fallback",()=>{
  assert.match(eventEngineSource,/const authoredOutcome=ordinaryEventOutcome\(activeOrdinaryEvent,label,tier\)/);
  const logic=eventLogic({year:2032,path:"HBL",stats:{shoot:60,finish:60,handle:60,pass:60,defense:60,rebound:60,ath:60,iq:60}});
  const result=vm.runInContext(`ordinaryEventOutcome(events.find(event=>event.t==="邊線球只剩零點八秒"),"改成外彈接球直接出手","great")`,logic);
  assert.match(result,/紅燈剛亮/);
  assert.equal(vm.runInContext(`ordinaryEventOutcome(events[0],events[0].opts[0][0],"great")`,logic),"");
});

test("context-gated events stay out of illogical leagues and career states",()=>{
  const player={path:"台灣職業",rep:2,stats:{shoot:72,finish:72,handle:72,pass:72,defense:72,rebound:72,ath:72,iq:72}};
  const logic=eventLogic(player);
  assert.equal(vm.runInContext(`normalEventPool().some(event=>event.t==="記錄台多算了你一次犯規")`,logic),true);
  assert.equal(vm.runInContext(`normalEventPool().some(event=>event.t==="客場球迷把飯店房號貼上網")`,logic),false);
  assert.equal(vm.runInContext(`normalEventPool().some(event=>event.t==="對手公開說出你的第一選擇")`,logic),false);
  player.path="日本職業";
  assert.equal(vm.runInContext(`normalEventPool().some(event=>event.t==="客場球迷把飯店房號貼上網")`,logic),true);
  player.rep=8;
  assert.equal(vm.runInContext(`normalEventPool().some(event=>event.t==="對手公開說出你的第一選擇")`,logic),true);
  for(const path of ["CBA","NBA G League","NBA"]){
    player.path=path;
    assert.equal(vm.runInContext(`normalEventPool().some(event=>event.t==="記錄台多算了你一次犯規")`,logic),false,path);
  }
});

test("new professional scenes require the weakness or career context named in their setup",()=>{
  const player={path:"台灣職業",age:23,careerSeason:3,rep:2,seasonHistory:[],stats:{shoot:74,finish:72,handle:72,pass:72,defense:74,rebound:72,ath:72,iq:72}};
  const logic=eventLogic(player);
  const has=title=>vm.runInContext(`normalEventPool().some(event=>event.t===${JSON.stringify(title)})`,logic);
  assert.equal(has("對手開始放空你的外線"),false);
  assert.equal(has("換防後對手連續點名你"),false);
  assert.equal(has("賽前發言輪到你"),false);
  assert.equal(has("年輕隊友帶著影片來敲門"),false);
  assert.equal(has("最後一個輪替名額"),false);
  delete player.stats.shoot;
  assert.equal(has("對手開始放空你的外線"),false);
  player.stats.shoot=64;player.stats.defense=66;
  assert.equal(has("對手開始放空你的外線"),true);
  assert.equal(has("換防後對手連續點名你"),true);
  player.age=29;player.careerSeason=9;player.rep=12;
  assert.equal(has("賽前發言輪到你"),true);
  assert.equal(has("年輕隊友帶著影片來敲門"),true);
  player.seasonHistory=[{path:"UBA",mins:12}];
  assert.equal(has("最後一個輪替名額"),false);
  player.seasonHistory=[{path:"台灣職業"}];
  assert.equal(has("最後一個輪替名額"),false);
  player.seasonHistory=[{path:"台灣職業",mins:17.5}];
  assert.equal(has("最後一個輪替名額"),true);
  player.seasonHistory=[{path:"台灣職業",mins:18.5}];
  assert.equal(has("最後一個輪替名額"),false);
});

test("stage-specific additions only enter their intended career paths",()=>{
  const rows=[...context.__BL_TEST_DATA.events,...context.__BL_TEST_DATA.PRO_GENERAL_EVENTS];
  const expected={
    "導師把缺席單送到球館":["HBL"],
    "期中考週撞上跨校客場":["UBA","UBA 強權","NCAA D1","NCAA D2","日本大學"],
    "白天排班臨時延長":["SBL／半職業"],
    "主場臨時換到陌生場館":["台灣職業"],
    "翻譯漏掉最後一句防守口令":["日本職業","韓國職業"],
    "跨省客場的裝備箱沒有抵達":["CBA"],
    "NBA 母隊臨時要看一場試用":["NBA G League"],
    "國內聯賽與跨國賽只隔兩天":["歐洲聯賽"],
    "全國轉播把開賽時間提前":["NBA"]
  };
  for(const [title,paths] of Object.entries(expected)){
    const event=rows.find(row=>row.t===title);
    assert.deepEqual(Array.from(event.paths),paths,title);
  }
});

test("travel and postseason copy does not appear without its real context",()=>{
  const domestic={path:"台灣職業",rep:10,fatigue:60,bodyLoad:60,stats:{shoot:70,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70}};
  const logic=eventLogic(domestic);
  const domesticTitles=vm.runInContext("normalEventPool().map(event=>event.t)",logic);
  assert.equal(domesticTitles.includes("客場交通延誤"),false);
  assert.equal(domesticTitles.includes("客場連戰疲勞"),false);
  assert.equal(domesticTitles.includes("季後賽第一戰"),false);
  assert.equal(domesticTitles.includes("焦點戰開局尺度更重"),true);
  domestic.path="NBA";
  const nbaTitles=vm.runInContext("normalEventPool().map(event=>event.t)",logic);
  assert.equal(nbaTitles.includes("客場交通延誤"),true);
  assert.equal(nbaTitles.includes("客場連戰疲勞"),true);
});

test("all ordinary choices use supported outcomes and contain no unresolved placeholders",()=>{
  const supported=new Set(["ath","check","clutch","compete","defense","discipline","finish","handle","injrisk","iq","minuteslimit","normal","pass","playhurt","rebound","risk","safe","shoot","show","sitout","social","study","talk","team","three"]);
  const rows=[...context.__BL_TEST_DATA.events,...context.__BL_TEST_DATA.PRO_GENERAL_EVENTS,...context.__BL_TEST_DATA.INJURY_PRESSURE_EVENTS];
  for(const event of rows){
    assert.doesNotMatch(`${event.t} ${event.d}`,/\{[a-z]+\}/i,event.t);
    for(const option of event.opts){
      assert.equal(supported.has(option[2]),true,`${event.t}: ${option[2]}`);
      assert.doesNotMatch(option.join(" "),/\{[a-z]+\}/i,event.t);
    }
  }
});

test("ordinary-event memory prevents repeats within the same season while unused events remain",()=>{
  const logic=eventLogic({year:2032,path:"HBL",eventMemory:{},recentEvents:[],stats:{shoot:60,finish:60,handle:60,pass:60,defense:60,rebound:60,ath:60,iq:60}});
  const picked=vm.runInContext(`(()=>{const memory={},recent=[],titles=[];for(let i=0;i<12;i++){const event=memoryWeightedPick(events,()=>.47,memory,recent);titles.push(event.t);rememberEvent(memory,event.t);recent.push(event.t)}return titles})()`,logic);
  assert.equal(new Set(Array.from(picked)).size,12);
});

test("off-court events keep three distinct actions", () => {
  for (const [id, event] of Object.entries(context.__BL_TEST_DATA.OFF_COURT_EVENT_DEFS)) {
    assert.equal(event.actions?.length, 3, id);
    assert.equal(new Set(event.actions.map((action) => action[0])).size, 3, id);
  }
});

test("ordinary events do not invent a contract year, exhaustion or scouting attention",()=>{
  const base={path:"台灣職業",contract:{remaining:3},fatigue:10,bodyLoad:12,confidence:60,rep:2,grade:1,stats:{shoot:72,finish:72,handle:72,pass:72,defense:72,rebound:72,ath:72,iq:72}};
  const logic=eventLogic(base);
  const names=vm.runInContext("normalEventPool().map(event=>event.t)",logic);
  assert.equal(names.includes("經紀人要求刷數據"),false);
  assert.equal(names.includes("客場連戰疲勞"),false);
  assert.equal(names.includes("主場噓聲"),false);
  base.contract.remaining=1;base.fatigue=52;base.path="NBA";
  const relevant=vm.runInContext("normalEventPool().map(event=>event.t)",logic);
  assert.equal(relevant.includes("經紀人要求刷數據"),true);
  assert.equal(relevant.includes("客場連戰疲勞"),true);
});

test("unknown low-income players do not receive celebrity and finance off-court stories",()=>{
  const player={path:"台灣職業",age:24,rep:1,careerSalary:40};
  const logic=eventLogic(player);
  for(const kind of ["agentFinance","friendLoan","charityCommitment","rumorPhoto","podcastSlip","partyLeak","fanPhoneConflict"]){
    assert.equal(vm.runInContext(`offCourtEventEligible(${JSON.stringify(kind)})`,logic),false,kind);
  }
  player.rep=20;player.careerSalary=800;
  for(const kind of ["agentFinance","friendLoan","charityCommitment","rumorPhoto","podcastSlip","partyLeak","fanPhoneConflict"]){
    assert.equal(vm.runInContext(`offCourtEventEligible(${JSON.stringify(kind)})`,logic),true,kind);
  }
  player.path="NBA";
  assert.equal(vm.runInContext(`offCourtEventEligible("importWalkout")`,logic),false);
});

test("a first romance meeting identifies itself as a first appearance",()=>{
  assert.match(eventEngineSource,/這是她第一次正式進入你的生涯/);
  assert.doesNotMatch(eventEngineSource,/和 \$\{candidate\.name\} 再次聊了起來/);
});

test("national observation candidates are rejected before story selection when ability, league or role is not credible",()=>{
  const player={year:2041,age:30,path:"韓國職業",health:92,fatigue:20,nationalTeamBanUntil:0,nationalObservationCandidate:{year:2041},stats:{shoot:65,finish:65,handle:65,pass:65,defense:65,rebound:65,ath:65,iq:65},seasonStats:{scheduledGames:54,games:40,mins:22}};
  const logic=eventLogic(player);
  logic.officialSeniorCompetition=()=>({id:"fiba",event:"亞洲盃",selectionNote:"正式選訓"});
  logic.jonesCupCompetition=()=>({id:"jones",event:"瓊斯盃",selectionNote:"邀請賽"});
  logic.passesNationalSelection=(_level,competition)=>competition.id==="fiba"?{ok:false,score:76,threshold:78}:{ok:false,score:60,threshold:72};
  assert.equal(vm.runInContext("nationalTeamOpportunity()",logic),null);
  assert.equal(player.nationalObservationCandidate,null);
  player.stats={shoot:76,finish:76,handle:76,pass:76,defense:76,rebound:76,ath:76,iq:76};
  assert.equal(vm.runInContext("nationalTeamOpportunity()",logic),null);
  assert.equal(player.nationalObservationCandidate?.year,2041);
  assert.equal(player.nationalObservationCandidate?.overall,76);
  player.path="SBL／半職業";
  assert.equal(vm.runInContext("nationalTeamOpportunity()",logic),null);
  assert.equal(player.nationalObservationCandidate,null);
});
