import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");

function draftContext(){
  const random=()=>.12;
  const context={
    p:{
      careerVersion:"9.0.0",seed:"V9DRAFT1",seedTier:"SS+",year:2032,age:21,grade:3,path:"NCAA D1",team:"測試大學",pos:"PG",
      stats:{shoot:78,finish:74,handle:84,pass:86,defense:75,rebound:58,ath:76,iq:88},
      caps:{shoot:92,finish:89,handle:97,pass:98,defense:90,rebound:80,ath:91,iq:97},
      talentProfile:{model:"v9-specialist-1",label:"控場指揮官",core:["handle","pass","iq"],support:["shoot"],affinity:{handle:"core",pass:"core",iq:"core",shoot:"support",finish:"foundation",defense:"foundation",rebound:"foundation",ath:"support"}},
      seasonStats:{pts:18,ast:7,reb:4,stl:1.4,blk:.2},lastSeasonAwards:[]
    },
    window:{BL_LEAGUE_CFG:{},BL_STUDENT_SCHEDULES:{}},RNG:()=>random,ri:(r,min,max)=>min+Math.floor(r()*(max-min+1)),
    overall:()=>78,scoutingScore:()=>88,leagueMarketRank:league=>league==="NBA"?7:2
  };
  vm.createContext(context);
  vm.runInContext(read("js/career/ability-profile.js"),context);
  vm.runInContext(read("js/career/contract-engine.js"),context);
  return context;
}

test("V9 draft scouting combines Seed, role, caps and traits without changing legacy careers",()=>{
  const context=draftContext(),assessment={score:88,ov:78,impact:25,grade:3,profile:{level:"star",label:"主力",mins:31}};
  const profile=context.v9DraftProfile(assessment),nba=context.collegeDraftRoutes().find(route=>route.id==="nba");
  assert.equal(profile.roleLabel,"組織核心");
  assert.ok(profile.draftLift>0);
  assert.equal(context.v9DraftProjection(nba,assessment,profile),"首輪前段觀察");
  const route=context.collegeDraftRouteAssessment(nba,assessment);
  assert.equal(route.v9Profile.projection,"首輪前段觀察");

  context.p.careerVersion="8.1.1";
  assert.equal(context.v9DraftEntryDetails(nba,assessment,true),null);
  assert.equal(context.collegeDraftRouteAssessment(nba,assessment).v9Profile,null);
});

test("V9 NBA entry records round, pick, team need, fit and contract consequences",()=>{
  const context=draftContext(),assessment={score:88,ov:78,impact:25,grade:3,profile:{level:"star",label:"主力",mins:31}},nba=context.collegeDraftRoutes().find(route=>route.id==="nba");
  const entry=context.v9DraftEntryDetails(nba,assessment,true);
  assert.equal(entry.entryType,"首輪新秀合約");
  assert.equal(entry.round,"首輪");
  assert.ok(entry.pick>=1&&entry.pick<=15);
  assert.equal(entry.fit,"高度適配");
  assert.match(entry.teamNeed,/組織/);

  context.makeContract=()=>({league:"NBA",team:"測試隊",salary:1000,bonus:100,years:2,remaining:2});
  context.finalizeContract=contract=>contract;
  const contract=context.makeCollegeDraftContract(nba,assessment,70,entry);
  assert.equal(contract.years,3);
  assert.equal(contract.remaining,3);
  assert.equal(contract.salary,1180);
  assert.equal(contract.draftEntryType,"首輪新秀合約");
  assert.equal(contract.draftPick,entry.pick);
  assert.equal(contract.rolePromise,"新秀主要輪替");
  assert.equal(contract.draftGuarantee,"前兩年保障｜末年球隊選項");
  assert.equal(contract.draftGuaranteedTotal,contract.salary*2+contract.bonus);
});

test("V9 entry types preserve first, second, two-way and training-camp contract paths",()=>{
  const context=draftContext(),nba=context.collegeDraftRoutes().find(route=>route.id==="nba");
  const makeAssessment=score=>({score,ov:72,impact:17,grade:3,profile:{level:"starter",label:"先發",mins:27}});
  const first=context.v9DraftEntryDetails(nba,makeAssessment(88),true);
  const second=context.v9DraftEntryDetails(nba,makeAssessment(66),true);
  const camp=context.v9DraftEntryDetails(nba,makeAssessment(50),true);
  assert.equal(first.entryType,"首輪新秀合約");
  assert.equal(second.entryType,"次輪新秀合約");
  assert.ok(["雙向合約","落選後訓練營"].includes(camp.entryType));
  assert.notEqual(first.guarantee,second.guarantee);
});

test("V9 CBA and G League routes produce visible draft rounds instead of generic newcomer entries",()=>{
  const context=draftContext(),assessment={score:68,ov:68,impact:18,grade:4,profile:{level:"starter",label:"穩定先發",mins:29}};
  const cba=context.collegeDraftRoutes().find(route=>route.id==="cba"),gleague=context.collegeDraftRoutes().find(route=>route.id==="gleague");
  const cbaEntry=context.v9DraftEntryDetails(cba,assessment,true),gleagueEntry=context.v9DraftEntryDetails(gleague,assessment,true);
  assert.ok(["首輪","次輪"].includes(cbaEntry.round));
  assert.ok(cbaEntry.pick>=1&&cbaEntry.pick<=40);
  assert.match(cbaEntry.entryType,/新秀合約/);
  assert.ok(["首輪","次輪"].includes(gleagueEntry.round));
  assert.ok(gleagueEntry.pick>=1&&gleagueEntry.pick<=60);
  assert.match(gleagueEntry.entryType,/G League/);
});

test("V9 draft UI exposes scouting, projection, need, fit and contract guarantee",()=>{
  const source=read("js/career/contract-engine.js"),storage=read("js/storage.js"),css=read("css/v9-ui.css");
  assert.match(source,/選秀前球探報告/);
  assert.match(source,/v9DraftRouteReport/);
  assert.match(source,/正式選秀結果/);
  assert.match(source,/保障金額/);
  assert.match(storage,/rebuildV9CollegeDraftResultFromSave\(save\.screen\)/);
  assert.match(css,/\.v9DraftOutcomeGrid/);
  assert.match(css,/\.v9DraftContractFacts/);
});

test("resuming an existing V9 draft result enriches presentation without rerolling its outcome",()=>{
  const context=draftContext(),history={
    year:2032,grade:3,path:"NCAA D1",team:"測試大學",
    results:[{id:"cba",label:"CBA 新秀／試訓市場",league:"CBA",method:"選秀／球團試訓",chance:68,roll:42,success:true,draft:{entryType:"新人名單合約"}}]
  };
  context.p.stage="decision";
  context.p.collegeDraftHistory=[history];
  context.scoutingScore=()=>88;
  context.overall=()=>78;
  context.collegeResumeProfile=()=>({level:"star",label:"主力",mins:31});
  let rendered=null;
  context.renderCollegeDraftResult=(assessment,results,options)=>{rendered={assessment,results,options}};
  const rebuilt=context.rebuildV9CollegeDraftResultFromSave({chapter:"2032 · 21歲 · 大3新人市場結果"});
  assert.equal(rebuilt,true);
  assert.equal(rendered.results[0].chance,68);
  assert.equal(rendered.results[0].roll,42);
  assert.equal(rendered.results[0].success,true);
  assert.ok(["首輪","次輪"].includes(rendered.results[0].draft.round));
  assert.equal(rendered.options.recordStory,false);
});
