import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
function context(player){
  const sandbox={p:player};vm.createContext(sandbox);vm.runInContext(read("js/career/highlight-engine.js"),sandbox);return sandbox;
}

test("career mode is additive and old saves default to complete",()=>{
  const state=read("js/state.js"),career=read("js/ui/career-view.js"),html=read("index.html");
  assert.match(state,/chosenCareerMode="complete"/);
  assert.match(state,/!\["complete","highlight"\]\.includes\(player\.careerMode\)/);
  assert.match(career,/careerMode:weeklySetupMatches\?"complete":chosenCareerMode/);
  assert.match(html,/data-career-mode="highlight"/);
  assert.match(html,/約 20～30 分鐘/);
  assert.match(state,/"highlightChapterHistory"/);
});

test("highlight schedule auto-runs low-impact seasons in the high-school-to-entry slice",()=>{
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'complete',path:'HBL',grade:2}).action",context({})),"manual");
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'highlight',path:'HBL',grade:2}).action",context({})),"autoPrelude");
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'highlight',path:'HBL',grade:3}).action",context({})),"autoPrelude");
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'highlight',path:'UBA',grade:1}).action",context({})),"autoPrelude");
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'highlight',path:'UBA',grade:4}).action",context({})),"manual");
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'highlight',path:'SBL／半職業'}).action",context({})),"autoPrelude");
  assert.equal(vm.runInContext("highlightScheduleFor({careerMode:'highlight',path:'NBA',grade:1}).action",context({})),"autoPrelude");
});

test("highlight pacing auto-resolves routine specials and preserves major ones",()=>{
  const sandbox=context({careerMode:"highlight"});
  assert.equal(vm.runInContext("highlightMajorSpecialKind('seasonKeyBattle')",sandbox),true);
  assert.equal(vm.runInContext("highlightMajorSpecialKind('surgeryChoice')",sandbox),true);
  assert.equal(vm.runInContext("highlightMajorSpecialKind('romanceFirst')",sandbox),false);
  assert.equal(vm.runInContext("highlightPrepareSpecialQueue([{kind:'romanceFirst'},{kind:'seasonKeyBattle'}]).length",sandbox),2);
  assert.match(read("js/career/highlight-engine.js"),/highlightAutoResolveRoutineSpecials/);
});

test("highlight routine special option effects are applied before the major stop",()=>{
  const sandbox=context({careerMode:"highlight",seed:"HIGHLIGHT-OPTIONS",year:2030,path:"NBA",specialIndex:0,specialQueue:[{kind:"romanceFirst",title:"例行事件"},{kind:"seasonKeyBattle",title:"關鍵戰"}],stats:{shoot:50},specialBonusPoints:0,highlightHistory:[]});
  sandbox.RNG=()=>()=>0;
  sandbox.choices={querySelectorAll:()=>[{click:()=>{sandbox.p.stats.shoot+=2;sandbox.p.specialBonusPoints+=1;sandbox.p.specialIndex++;}}]};
  sandbox.showSpecialEvent=()=>{};
  assert.equal(vm.runInContext("highlightAutoResolveRoutineSpecials()",sandbox),true);
  assert.equal(sandbox.p.stats.shoot,52);
  assert.equal(sandbox.p.specialBonusPoints,1);
  assert.equal(sandbox.p.specialIndex,1);
  assert.equal(sandbox.p.highlightHistory[0].kind,"autoSpecial");
});

test("highlight scheduling is deterministic and does not reclassify legacy careers",()=>{
  const source=read("js/career/highlight-engine.js");
  assert.match(source,/HIGHLIGHT_SCHEDULE_V1/);
  assert.equal(vm.runInContext("isHighlightCareer({careerMode:undefined})",context({})),false);
  assert.equal(vm.runInContext("isHighlightCareer({careerMode:'highlight'})",context({})),true);
  const complete=context({careerMode:"complete"});
  const untouched=vm.runInContext(`(()=>{const queue=[{kind:'careerStory'},{kind:'seasonKeyBattle'}];return highlightPrepareSpecialQueue(queue)===queue})()`,complete);
  assert.equal(untouched,true);
  const legacyHighlight={careerMode:"highlight"},legacyContext=context(legacyHighlight);
  assert.equal(vm.runInContext("ensureHighlightChapterState(p).length",legacyContext),0);
  assert.deepEqual(Array.from(legacyHighlight.highlightChapterHistory),[]);
});

test("standard highlight routes reserve ten to twelve playable chapters",()=>{
  const simulate=includeCollege=>{
    const player={careerMode:"highlight",seed:"CHAPTERS",year:2026,age:16,path:"HBL",grade:1,careerSeason:0,highlightChapterHistory:[]};
    const sandbox=context(player),queue=`[{kind:'careerStory',title:'人物事件'},{kind:'seasonKeyBattle',title:'關鍵戰'}]`;
    for(const grade of [1,2,3]){player.path="HBL";player.grade=grade;player.year=2025+grade;vm.runInContext(`highlightPrepareSpecialQueue(${queue})`,sandbox)}
    if(includeCollege)for(const grade of [1,2,3,4]){player.path="UBA";player.grade=grade;player.year=2028+grade;vm.runInContext(`highlightPrepareSpecialQueue(${queue})`,sandbox)}
    for(const season of [1,2,3,4,5,6,7,8,9]){player.path="台灣職業";player.careerSeason=season;player.year=2032+season;vm.runInContext(`highlightPrepareSpecialQueue(${queue})`,sandbox)}
    for(const season of [10,11,12,13,14,15,16,17,18]){player.path="台灣職業";player.careerSeason=season;player.year=2032+season;vm.runInContext(`highlightPrepareSpecialQueue(${queue})`,sandbox)}
    return player.highlightChapterHistory;
  };
  const full=simulate(true),direct=simulate(false);
  assert.equal(full.length,12);
  assert.equal(direct.length,10);
  assert.deepEqual(full.reduce((counts,row)=>(counts[row.stage]=(counts[row.stage]||0)+1,counts),{}),{hbl:2,college:2,pro:5,veteran:3});
  assert.deepEqual(full.map(row=>row.number),Array.from({length:12},(_,index)=>index+1));
});

test("forced turns replace a later routine chapter instead of expanding the stage budget",()=>{
  const player={careerMode:"highlight",seed:"FORCED",year:2033,age:23,path:"台灣職業",careerSeason:1,highlightChapterHistory:[]};
  const sandbox=context(player),routine=`[{kind:'careerStory'},{kind:'seasonKeyBattle'}]`;
  for(let season=1;season<=9;season++){
    player.careerSeason=season;player.year=2032+season;
    const queue=season===2?`[{kind:'tradeChoice'},{kind:'careerStory'},{kind:'seasonKeyBattle'}]`:routine;
    vm.runInContext(`highlightPrepareSpecialQueue(${queue})`,sandbox);
  }
  assert.equal(player.highlightChapterHistory.length,5);
  assert.equal(player.highlightChapterHistory.some(row=>row.reason==="forced"&&row.kinds.includes("tradeChoice")),true);
  assert.equal(player.highlightChapterHistory.some(row=>row.year===2041),false);
});

test("routine seasons keep formula effects automated but defer unplayed career stories",()=>{
  const player={careerMode:"highlight",seed:"ROUTINE",year:2030,age:20,path:"UBA",grade:1,careerSeason:0,highlightChapterHistory:[]};
  const sandbox=context(player);
  const queue=vm.runInContext(`highlightPrepareSpecialQueue([{kind:'careerStory'},{kind:'seasonKeyBattle'},{kind:'romanceFirst'}])`,sandbox);
  assert.deepEqual(Array.from(queue,event=>event.kind),["seasonKeyBattle","romanceFirst"]);
  assert.equal(queue.every(event=>event.highlightRoutine===true),true);
  assert.equal(player.highlightChapterHistory.length,0);
});

test("a newly generated major injury or championship interrupts automatic season completion",()=>{
  const injured={careerMode:"highlight",year:2040,age:30,path:"NBA",careerSeason:8,highlightChapterHistory:[],championships:0};
  const injuryContext=context(injured);injuryContext.chapter={textContent:""};injuryContext.showHealth=()=>{injured.injury={name:"阿基里斯腱撕裂",level:"重傷",startYear:2040}};injuryContext.showResults=()=>{throw new Error("major injury should stop before results")};
  assert.equal(vm.runInContext("highlightAutoFinishSeason()",injuryContext),true);
  assert.match(injuryContext.chapter.textContent,/重大傷病/);
  const champion={careerMode:"highlight",year:2042,age:32,path:"NBA",careerSeason:10,highlightChapterHistory:[],championships:1,injury:null};
  const titleContext=context(champion);titleContext.chapter={textContent:""};titleContext.showHealth=()=>{};titleContext.showResults=()=>{champion.championships++};
  assert.equal(vm.runInContext("highlightAutoFinishSeason()",titleContext),true);
  assert.match(titleContext.chapter.textContent,/冠軍球季/);
});

test("the three mid-career arcs remain playable highlight chapters without counting every node twice",()=>{
  const player={careerMode:"highlight",year:2040,age:30,path:"NBA",careerSeason:8,highlightChapterHistory:[]},sandbox=context(player);
  const peakA=vm.runInContext("highlightRegisterMidcareerChapter(p,{chapter:'peak',label:'巔峰延續',offset:0})",sandbox);
  player.year++;player.careerSeason++;
  const peakB=vm.runInContext("highlightRegisterMidcareerChapter(p,{chapter:'peak',label:'巔峰延續',offset:1})",sandbox);
  assert.equal(peakA.number,peakB.number);
  assert.equal(player.highlightChapterHistory.length,1);
  assert.deepEqual(Array.from(player.highlightChapterHistory[0].kinds),["midcareer:peak:0","midcareer:peak:1"]);
  player.year+=2;player.careerSeason+=2;
  vm.runInContext("highlightRegisterMidcareerChapter(p,{chapter:'turn',label:'角色轉折',offset:2})",sandbox);
  player.year+=3;player.careerSeason+=3;
  vm.runInContext("highlightRegisterMidcareerChapter(p,{chapter:'legacy',label:'生涯收束',offset:4})",sandbox);
  assert.deepEqual(Array.from(player.highlightChapterHistory,row=>row.label),["巔峰延續","角色轉折","生涯收束"]);
  assert.deepEqual(Array.from(player.highlightChapterHistory,row=>row.number),[1,2,3]);
});

test("highlight prelude stops for the real mid-career storyline before ordinary special events",()=>{
  const player={careerMode:"highlight",seed:"MIDCAREER",year:2040,age:30,path:"NBA",careerSeason:8,stats:{},dice:[],used:[],eventIndex:0,seasonEventCount:0,highlightHistory:[]},sandbox=context(player);
  sandbox.showTraining=()=>{player.dice=[];player.used=[]};sandbox.renderDice=()=>{};sandbox.choices={querySelectorAll:()=>[]};
  sandbox.maybeStartV90MidcareerRhythm=()=>{sandbox.midcareerStarted=true;player.stage="midcareer";return true};
  assert.equal(vm.runInContext("runHighlightSeasonPrelude()",sandbox),true);
  assert.equal(sandbox.midcareerStarted,true);
  assert.equal(player.stage,"midcareer");
  assert.equal(player.highlightHistory[0].kind,"autoPrelude");
  assert.match(read("js/events/midcareer-rhythm.js"),/精華生涯 · 第 \$\{highlightRow\.number\} 章/);
});

test("highlight season points use manual-growth room and buy the cheapest OVR gains first",()=>{
  const stats={handle:70,pass:49,iq:49,shoot:49,finish:49,defense:49,ath:49,rebound:49};
  const player={careerMode:"highlight",pos:"PG",stats,bonusPoints:4,bankedPoints:0},sandbox=context(player);
  sandbox.isV9Progression=()=>true;sandbox.canUseManualGrowth=()=>true;sandbox.availableTrainingGrowth=()=>0;sandbox.availableManualGrowth=()=>4;
  sandbox.showPointDistribution=()=>{};sandbox.pointCost=key=>player.stats[key]<50?1:4;
  sandbox.buyPoint=key=>{const cost=sandbox.pointCost(key);player.stats[key]++;player.bonusPoints-=cost};
  vm.runInContext("highlightAutoPointAllocation()",sandbox);
  assert.equal(player.bonusPoints,0);
  assert.equal(Object.values(player.stats).reduce((sum,value)=>sum+value,0),70+50+50+50+50+49+49+49);
  assert.equal(player.stats.handle,70);
  assert.deepEqual([player.stats.pass,player.stats.iq,player.stats.shoot,player.stats.finish],[50,50,50,50]);
});

test("highlight ordinary events prefer expected growth but protect a heavily strained player",()=>{
  const sandbox=context({careerMode:"highlight",health:100,fatigue:10,bodyLoad:10});
  const button=(effect,strategy,chance)=>({dataset:{highlightEffect:effect,highlightStrategy:strategy,highlightChance:String(chance)}});
  sandbox.growth=button("shoot","balance",66);sandbox.safe=button("safe","safe",90);sandbox.risk=button("ath","risk",54);
  assert.equal(vm.runInContext("highlightChooseEventButton([growth,safe,risk],.5,p)",sandbox),sandbox.growth);
  sandbox.p.health=45;sandbox.p.fatigue=88;sandbox.p.bodyLoad=82;
  assert.equal(vm.runInContext("highlightChooseEventButton([growth,safe,risk],.5,p)",sandbox),sandbox.safe);
  const eventSource=read("js/events/event-engine.js");
  assert.match(eventSource,/data-highlight-effect=/);
  assert.match(eventSource,/data-highlight-strategy=/);
  assert.match(eventSource,/data-highlight-chance=/);
});
