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

test("expanded ordinary pools contain 60 distinct authored events",()=>{
  const ordinary=Array.from(context.__BL_TEST_DATA.events);
  const professional=Array.from(context.__BL_TEST_DATA.PRO_GENERAL_EVENTS);
  assert.equal(ordinary.length,32);
  assert.equal(professional.length,28);
  const titles=[...ordinary,...professional].map(event=>event.t);
  assert.equal(new Set(titles).size,60);
});

test("all ordinary choices use supported outcomes and contain no unresolved placeholders",()=>{
  const supported=new Set(["ath","check","clutch","compete","defense","finish","handle","injrisk","iq","minuteslimit","normal","pass","playhurt","rebound","risk","safe","shoot","show","sitout","social","study","talk","team","three"]);
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
  base.contract.remaining=1;base.fatigue=52;
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
