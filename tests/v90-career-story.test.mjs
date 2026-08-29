import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const hash=value=>[...String(value)].reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,2166136261);
const RNG=seed=>{let state=hash(seed)||1;return()=>((state=(state*1664525+1013904223)>>>0)/4294967296)};
function storyContext(player){
 const context={
  p:player,hash,RNG,console,
  ensureV8CareerState:()=>player,
  recordV8Story:(type,text,importance,meta)=>{player.recordedStory={type,text,importance,meta}},
  finishSpecialEvent:(html,log)=>{player.finished={html,log}},
  CAREER_STORY_TEST_RESULT:null
 };
 vm.createContext(context);
 vm.runInContext(read("data/career-story-events.js"),context);
 vm.runInContext(read("js/career/progression-engine.js"),context);
 vm.runInContext(read("js/events/career-story-engine.js"),context);
 return context;
}
function player(overrides={}){
 return {
  seed:"STORY001",year:2026,age:16,path:"HBL",careerSeason:0,team:"測試高中",retired:false,
  stats:{shoot:45,finish:45,handle:45,pass:45,defense:45,rebound:45,ath:45,iq:45},
  confidence:50,rep:0,fatigue:10,bodyLoad:10,health:100,discipline:50,clutch:50,familyHarmony:60,
  relationshipHistory:[],careerCast:{
   friend:{name:"朋友甲",trait:"從小一起練球",trust:58},rival:{name:"宿敵甲",trait:"長期對手",respect:42},
   coach:{name:"教練甲",trait:"重視紀律",trust:55},teammate:{name:"隊友甲",trait:"輪替競爭",trust:50},agent:{name:"經紀人甲",trait:"重視長線",trust:58}
  },...overrides
 };
}

test("career-story catalog contains 112 unique events, at least eight four-node lines and 336 choices",()=>{
 const context=storyContext(player());
 const report=vm.runInContext(`({
  total:CAREER_STORY_EVENTS.length,
  ids:new Set(CAREER_STORY_EVENTS.map(event=>event.id)).size,
  lines:new Set(CAREER_STORY_LINES.map(event=>event.line)).size,
  linked:CAREER_STORY_LINES.length,
  standalone:CAREER_STORY_STANDALONES.length,
  choices:CAREER_STORY_EVENTS.reduce((sum,event)=>sum+event.choices.length,0),
  fourNodeLines:new Set(CAREER_STORY_LINES.filter(event=>event.node===4).map(event=>event.line)).size,
  badChoices:CAREER_STORY_EVENTS.filter(event=>event.choices.length!==3).map(event=>event.id)
 })`,context);
 assert.deepEqual(JSON.parse(JSON.stringify(report)),{total:112,ids:112,lines:12,linked:44,standalone:68,choices:336,fourNodeLines:8,badChoices:[]});
});

test("new major scenes are stage-gated and end with a concrete memory",()=>{
 const context=storyContext(player());
 const ids=["hbl_empty_family_seat","hbl_last_uniform_wash","college_roommate_transfer","college_scholarship_table","pro_first_full_dnp","pro_returning_teammate_locker","late_unused_towel","late_bus_nameplate"];
 const report=vm.runInContext(`(${JSON.stringify(ids)}).map(id=>{const event=careerStoryEventById(id);return {id:event.id,stages:event.stages,choices:event.choices.map(choice=>({result:choice.result,memory:choice.memory}))}})`,context);
 assert.equal(report.length,ids.length);
 for(const event of report){
  assert.equal(event.stages.length,1,event.id);
  assert.equal(event.choices.length,3,event.id);
  for(const choice of event.choices){
   assert.ok(choice.result.length>=17,event.id);
   assert.ok(choice.memory.length>=17,event.id);
  }
 }
});

test("each new career deterministically unlocks two character lines plus one team, life and late line",()=>{
 const career=player(),context=storyContext(career);
 vm.runInContext("ensureCareerStoryState(p)",context);
 assert.equal(career.careerStoryLineSelection.character.length,2);
 assert.equal(career.careerStoryLineSelection.team.length,0);
 assert.equal(career.careerStoryLineSelection.life.length,0);
 assert.equal(career.careerStoryLineSelection.late.length,0);
 career.path="NCAA D1";career.age=19;career.careerSeason=3;
 vm.runInContext("ensureCareerStoryState(p)",context);
 assert.equal(career.careerStoryLineSelection.team.length,1);
 assert.equal(career.careerStoryLineSelection.life.length,1);
 career.path="台灣職業";career.age=36;career.careerSeason=15;career.firstFullProAge=20;career.peakOverall=85;
 career.health=74;career.bodyLoad=68;career.contract={remaining:1};career.roleState={current:"benchLeader",promised:"starter"};
 career.stats=Object.fromEntries(Object.keys(career.stats).map(key=>[key,64]));
 vm.runInContext("ensureCareerStoryState(p)",context);
 const active=Object.values(career.careerStoryLineSelection).filter(Array.isArray).flat();
 assert.equal(career.careerStoryLineSelection.late.length,1);
 assert.equal(active.length,5);
});

test("same Seed and route keep the same line set while different Seeds and routes vary the set",()=>{
 const selected=(seed,path)=>{
  const career=player({seed}),context=storyContext(career);
  vm.runInContext("ensureCareerStoryState(p)",context);
  career.path=path;career.age=20;career.careerSeason=4;
  vm.runInContext("ensureCareerStoryState(p)",context);
  return JSON.stringify(career.careerStoryLineSelection);
 };
 assert.equal(selected("LOCK001","NCAA D1"),selected("LOCK001","NCAA D1"));
 const seeds=Array.from({length:12},(_,index)=>selected(`LOCK${String(index+1).padStart(3,"0")}`,"NCAA D1"));
 assert.ok(new Set(seeds).size>=5,"different Seeds should unlock several mainline combinations");
 const routePairs=Array.from({length:12},(_,index)=>{
  const seed=`ROUTE${String(index+1).padStart(3,"0")}`;
  return [selected(seed,"NCAA D1"),selected(seed,"UBA 強權")];
 });
 assert.ok(routePairs.some(([left,right])=>left!==right),"college route should influence the later line draw");
});

test("the seasonal pool keeps standalone events but excludes locked long lines",()=>{
 const career=player({year:2033,age:23,path:"台灣職業",careerSeason:7,contract:{remaining:1},seasonStats:{games:32,scheduledGames:40,mins:28,pts:18},rep:12,teamWorld:{direction:"rebuild"},roleState:{current:"starter"}});
 const context=storyContext(career),report=vm.runInContext(`(()=>{
  const pool=careerStoryUnusedPool(p),active=new Set(ensureCareerStoryLineSelection(p));
  return {hasStandalone:pool.some(event=>!event.line),locked:pool.filter(event=>event.line&&!active.has(event.line)).map(event=>event.id)};
 })()`,context);
 assert.equal(report.hasStandalone,true);
 assert.deepEqual(Array.from(report.locked),[]);
});

test("old saves keep every long line that already started before the lock was introduced",()=>{
 const career=player({careerStoryHistory:[
  {eventId:"school_rival_1",line:"school_rivalry",node:1},
  {eventId:"friend_thread_1",line:"friendship",node:1},
  {eventId:"teammate_scandal_1",line:"teammate_scandal",node:1}
 ]});
 const context=storyContext(career);
 vm.runInContext("ensureCareerStoryState(p)",context);
 assert.deepEqual(new Set(career.careerStoryLineSelection.character),new Set(["school_rivalry","friendship","teammate_scandal"]));
});

test("career-story choice copy never leaks unresolved actor placeholders",()=>{
 const context=storyContext(player());
 const bad=vm.runInContext(`CAREER_STORY_EVENTS.flatMap(event=>event.choices.filter(choice=>/\{[^}]+\}/.test(choice.label+choice.detail+choice.result+choice.memory)).map(choice=>event.id+":"+choice.id))`,context);
 assert.deepEqual(Array.from(bad),[]);
});

test("student pools exclude professional agent, marriage, free-market and retirement events",()=>{
 const context=storyContext(player());
 const report=vm.runInContext(`(()=>{
  const hbl=CAREER_STORY_EVENTS.filter(event=>event.stages.includes("hbl"));
  const college=CAREER_STORY_EVENTS.filter(event=>event.stages.includes("college"));
  return {
   hblCount:hbl.length,
   hblForbidden:hbl.filter(event=>event.actor==="agent"||/婚姻|自由市場|退休|續約/.test(event.title+event.desc)).map(event=>event.id),
   collegeForbidden:college.filter(event=>/婚姻|退休/.test(event.title+event.desc)).map(event=>event.id)
  };
 })()`,context);
 assert.ok(report.hblCount>=8);
 assert.deepEqual(Array.from(report.hblForbidden),[]);
 assert.deepEqual(Array.from(report.collegeForbidden),[]);
});

test("all 112 events expose a clear actor role and institutional events never borrow unrelated people",()=>{
 const context=storyContext(player({year:2036,age:26,path:"台灣職業",careerSeason:10}));
 const report=vm.runInContext(`(()=>{
  const missing=CAREER_STORY_EVENTS.filter(event=>!careerStoryActorPresentation(event,p)?.name).map(event=>event.id);
  const actors=Object.fromEntries(CAREER_STORY_EVENTS.map(event=>[event.id,event.actor]));
  return {missing,actors};
 })()`,context);
 assert.deepEqual(Array.from(report.missing),[]);
 const expected={
  college_home_call:"family",college_roommate:"roommate",college_draft_feedback:"scout",
  hbl_exam_week:"schoolOffice",hbl_social_clip:"media",hbl_injury_notice:"medicalTeam",
  national_miss_1:"nationalStaff",national_miss_2:"nationalStaff",national_miss_3:"nationalStaff",
  rebuild_core_1:"frontOffice",rebuild_core_2:"frontOffice",rebuild_core_3:"frontOffice",
  pro_union_vote:"playersUnion",late_family_calendar:"family",late_fan_chant:"fans",late_youth_camp:"almaMater"
 };
 for(const [id,actor] of Object.entries(expected))assert.equal(report.actors[id],actor,`${id} should identify ${actor}`);
});

test("expanded stories wait for the career facts stated in their copy",()=>{
 const cases=[
  ["hbl_bench_role",player({seasonStats:{games:8,mins:26}}),false],
  ["hbl_bench_role",player({seasonStats:{games:8,mins:10}}),true],
  ["hbl_graduation_plan",player({grade:2}),false],
  ["hbl_graduation_plan",player({grade:3}),true],
  ["college_final_year_plan",player({path:"NCAA D1",age:21,careerSeason:5,grade:3}),false],
  ["college_final_year_plan",player({path:"NCAA D1",age:22,careerSeason:6,grade:4}),true],
  ["pro_community_day",player({path:"台灣職業",age:25,careerSeason:8,rep:2}),false],
  ["pro_community_day",player({path:"台灣職業",age:25,careerSeason:8,rep:8}),true],
  ["pro_overseas_family_visit",player({path:"台灣職業",age:25,careerSeason:8}),false],
  ["pro_overseas_family_visit",player({path:"韓國職業",age:25,careerSeason:8}),true],
  ["pro_national_return",player({path:"台灣職業",age:25,careerSeason:8,nationalCaps:0}),false],
  ["pro_national_return",player({path:"台灣職業",age:25,careerSeason:8,nationalCaps:2}),true],
  ["late_record_chase",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,careerGames:180,awards:[],peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader",promised:"starter"}}),false],
  ["late_record_chase",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,careerGames:420,awards:["年度第一隊"],peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader",promised:"starter"}}),true],
  ["late_family_road",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader",promised:"starter"}}),false],
  ["late_family_road",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader",promised:"starter"},partnerName:"伴侶"}),true],
  ["late_rotation_review",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,seasonStats:{games:30,mins:14},peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader"},contract:{remaining:2}}),false],
  ["late_rotation_review",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,seasonStats:{games:30,mins:14},peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader"},contract:{remaining:1}}),true],
  ["late_option_window",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader"},contract:{remaining:1,option:{type:"none",status:"pending"}}}),false],
  ["late_option_window",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader"},contract:{remaining:1,option:{type:"player",status:"pending"}}}),true],
  ["late_rival_reunion",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,peakOverall:88,health:76,bodyLoad:66,roleState:{current:"starter"}}),false],
  ["late_rival_reunion",player({path:"台灣職業",age:36,careerSeason:15,firstFullProAge:20,peakOverall:88,health:76,bodyLoad:66,roleState:{current:"benchLeader"}}),true]
 ];
 for(const [id,snapshot,expected] of cases){
  const context=storyContext(snapshot);
  assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById(${JSON.stringify(id)}),p)`,context),expected,id);
 }
 const healthy=storyContext(player({path:"台灣職業",age:26,careerSeason:8,health:98,bodyLoad:18,injuryHistory:[]}));
 const recovering=storyContext(player({path:"台灣職業",age:26,careerSeason:8,health:84,bodyLoad:54,injuryHistory:[{name:"腳踝扭傷"}]}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_recovery_lab"),p)`,healthy),false);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_recovery_lab"),p)`,recovering),true);
});

test("family, school, national-team and front-office cards do not display a random friend or club coach",()=>{
 const context=storyContext(player({year:2036,age:26,path:"台灣職業",careerSeason:10}));
 const report=vm.runInContext(`(()=>{
  const ids=["college_home_call","hbl_exam_week","national_miss_1","rebuild_core_1"];
  return ids.map(id=>{const event=careerStoryEventById(id),actor=careerStoryActorPresentation(event,p);return {id,name:actor.name,role:actor.role,isPerson:actor.isPerson}});
 })()`,context);
 assert.deepEqual(JSON.parse(JSON.stringify(report)),[
  {id:"college_home_call",name:"家人",role:"和你一起承擔生活選擇的人",isPerson:false},
  {id:"hbl_exam_week",name:"導師與校隊窗口",role:"協調課業、請假與比賽行程",isPerson:false},
  {id:"national_miss_1",name:"國家隊教練團",role:"獨立於目前球隊的選訓單位",isPerson:false},
  {id:"rebuild_core_1",name:"球團管理層",role:"負責陣容方向、角色與合約決策",isPerson:false}
 ]);
});

test("trade arrival requires an actual prior trade",()=>{
 const untouched=storyContext(player({year:2033,age:23,path:"台灣職業",careerSeason:7,tradeCount:0}));
 const traded=storyContext(player({year:2033,age:23,path:"台灣職業",careerSeason:7,tradeCount:1}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_trade_arrival"),p)`,untouched),false);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_trade_arrival"),p)`,traded),true);
});

test("draft, rookie, overseas-language, rebuild and market events require their real career context",()=>{
 const collegeEarly=storyContext(player({year:2028,age:18,path:"NCAA D1",careerSeason:2,grade:2}));
 const collegeReady=storyContext(player({year:2029,age:19,path:"NCAA D1",careerSeason:3,grade:3}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("college_draft_feedback"),p)`,collegeEarly),false);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("college_draft_feedback"),p)`,collegeReady),true);
 const domestic=storyContext(player({year:2033,age:23,path:"台灣職業",careerSeason:5,firstFullProAge:20,contract:{remaining:2},teamWorld:{direction:"playoff"}}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_rookie_vet"),p)`,domestic),false);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_language_room"),p)`,domestic),false);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("rebuild_core_1"),p)`,domestic),false);
 const overseas=storyContext(player({year:2033,age:23,path:"日本職業",careerSeason:2,firstFullProAge:22,rep:9,contract:{remaining:2},teamWorld:{direction:"rebuild"},roleState:{current:"starter",promised:"starter"}}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_rookie_vet"),p)`,overseas),true);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_language_room"),p)`,overseas),true);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("rebuild_core_1"),p)`,overseas),true);
 const noContract=storyContext(player({year:2033,age:23,path:"台灣職業",careerSeason:5,contract:null}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("market_choice_1"),p)`,noContract),false);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("market_choice_1"),p)`,domestic),true);
});

test("national observation cannot contradict an existing call-up and is suppressed during a formal national event",()=>{
 const veteran=storyContext(player({year:2036,age:26,path:"台灣職業",careerSeason:10,nationalCaps:1,internationalHistory:[{year:2035,level:"SENIOR"}]}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("national_miss_1"),p)`,veteran),false);
 const blocked=storyContext(player({year:2036,age:26,path:"台灣職業",careerSeason:10,careerStoryPending:[{id:"national",eventId:"national_miss_2",line:"national_miss",dueYear:2036,status:"pending",sourceChoice:"要求列出評估條件"}]}));
 const special=vm.runInContext(`buildCareerStorySpecial(p,{blockedThemes:["national"]})`,blocked);
 assert.notEqual(special?.storyEventId,"national_miss_2");
 assert.match(read("js/events/event-engine.js"),/blockedThemes:nt\?\["national"\]:\[\]/);
});

test("the same Seed and stage pick the same event while three career stages receive valid pools",()=>{
 const snapshots=[
  player(),
  player({year:2030,age:20,path:"NCAA D1",team:"測試大學",careerSeason:4}),
  player({year:2036,age:26,path:"台灣職業",team:"測試職業隊",careerSeason:7})
 ];
 for(const snapshot of snapshots){
  const first=storyContext(structuredClone(snapshot));
  const second=storyContext(structuredClone(snapshot));
  const a=vm.runInContext("buildCareerStorySpecial(p)",first);
  const b=vm.runInContext("buildCareerStorySpecial(p)",second);
  assert.equal(a.storyEventId,b.storyEventId);
  const valid=vm.runInContext(`careerStoryEventEligible(careerStoryEventById(${JSON.stringify(a.storyEventId)}),p)`,first);
  assert.equal(valid,true);
 }
});

test("a choice schedules an actual next-season event and records consequences without promising its title or year",()=>{
 const career=player();
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("school_rival_1","challenge")`,context);
 assert.equal(career.careerStoryHistory.length,1);
 assert.equal(career.careerStoryPending.length,1);
 assert.equal(career.careerStoryPending[0].eventId,"school_rival_2");
 assert.equal(career.careerStoryPending[0].sourceTitle,"第一球，他就點名要守你");
 assert.equal(career.careerStoryPending[0].sourceTeam,"測試高中");
 assert.equal(career.careerStoryPending[0].lineActors.rival.name,"宿敵甲");
 assert.match(career.finished.html,/留下的記憶/);
 assert.match(career.finished.html,/這次選擇與當下後果已保留/);
 assert.doesNotMatch(career.finished.html,/最後一波，他站到了你面前|2027 年起/);
 career.year=2027;career.age=17;
 const follow=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(follow.kind,"careerStory");
 assert.equal(follow.storyEventId,"school_rival_2");
 assert.match(follow.title,/最後一波，他站到了你面前/);
});

test("story outcomes never reveal an unguaranteed next chapter",()=>{
 const career=player(),context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("school_rival_1","team")`,context);
 assert.match(career.finished.html,/已寫入生涯/);
 assert.doesNotMatch(career.finished.html,/最後一波，他站到了你面前|2027 年起|預定年份/);
});

test("a completed third node schedules its authored fourth node and the fourth node closes the line",()=>{
 const career=player({year:2035,age:27,path:"台灣職業",careerSeason:9,contract:{remaining:1}});
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("market_choice_3","correct")`,context);
 assert.equal(career.careerStoryPending.at(-1).eventId,"market_choice_4");
 career.year=career.careerStoryPending.at(-1).dueYear;
 vm.runInContext(`resolveCareerStoryEvent("market_choice_4","jointReview")`,context);
 assert.equal(career.careerStoryHistory.at(-1).eventId,"market_choice_4");
 assert.equal(career.careerStoryPending.filter(item=>item.status==="pending"&&item.line==="market_choice").length,0);
});

test("a callback keeps the original named person and shows the actual previous event and choice",()=>{
 const career=player();
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("friend_thread_1","makeTime")`,context);
 career.careerCast.friend={name:"後來才認識的人",trait:"不該取代原人物",trust:50};
 career.year=2027;career.age=17;
 const pending=career.careerStoryPending[0];
 const actor=vm.runInContext(`careerStoryActorPresentation(careerStoryEventById("friend_thread_2"),p,p.careerStoryPending[0])`,context);
 assert.equal(actor.name,"朋友甲");
 assert.equal(pending.sourceTitle,"鐵門快關了，他還抱著那顆舊球");
 assert.equal(pending.sourceChoice,"留下來投完五十顆");
 assert.match(vm.runInContext(`careerStoryText(careerStoryEventById("friend_thread_2").desc,p,p.careerStoryPending[0])`,context),/朋友甲/);
});

test("team or staff changes silently close an old callback instead of showing a filler event",()=>{
 const career=player({year:2033,age:23,path:"台灣職業",careerSeason:7,team:"原球隊"});
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("coach_role_1","ask")`,context);
 career.year=2034;career.age=24;career.team="新球隊";career.careerCast.coach={name:"新教練",trait:"新環境",trust:50};
 const special=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(career.careerStoryPending[0].status,"closed");
 assert.notEqual(special?.kind,"careerStoryClosure");
 assert.equal(career.careerStoryHistory.some(row=>Number(row.node)===0||String(row.eventId).endsWith(":closed")),false);
});

test("a callback without a recorded source choice closes silently instead of inventing a return",()=>{
 const career=player({year:2028,age:18,careerStoryPending:[{id:"orphan",eventId:"school_rival_2",line:"school_rivalry",dueYear:2028,status:"pending",sourceEventId:"school_rival_1"}]});
 const context=storyContext(career),special=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(career.careerStoryPending[0].status,"closed");
 assert.notEqual(special?.storyEventId,"school_rival_2");
});

test("older pending records without actor snapshots use a neutral role instead of the current random name",()=>{
 const career=player({year:2034,age:24,path:"台灣職業",careerSeason:8,careerStoryPending:[{id:"legacy",eventId:"coach_role_2",line:"coach_role",dueYear:2034,status:"pending",sourceEventId:"coach_role_1",sourceChoice:"提出可驗證的升級條件"}]});
 const context=storyContext(career);
 const actor=vm.runInContext(`careerStoryActorPresentation(careerStoryEventById("coach_role_2"),p,p.careerStoryPending[0])`,context);
 assert.equal(actor.name,"當時與你談角色的教練");
 assert.equal(actor.isPerson,false);
 assert.equal(career.careerStoryPending[0].sourceTitle,"戰術板上，你的名字只剩半格");
 assert.doesNotMatch(vm.runInContext(`careerStoryText(careerStoryEventById("coach_role_2").desc,p,p.careerStoryPending[0])`,context),/教練甲/);
});

test("long-story callbacks can return one to three seasons later",()=>{
 const career=player({year:2033,age:23,path:"台灣職業",careerSeason:7});
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("family_city_1","delay")`,context);
 assert.equal(career.careerStoryPending[0].dueYear,2036);
 assert.equal(career.careerStoryPending[0].earliestYear,2036);
 assert.equal(career.careerStoryPending[0].latestYear,2038);
});

test("market callbacks wait for a real contract window and expire without inventing an offer",()=>{
 const career=player({year:2033,age:23,path:"台灣職業",careerSeason:7,contract:{remaining:3},team:"原球隊"});
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("market_choice_1","test")`,context);
 career.year=2034;career.age=24;career.contract.remaining=2;
 assert.notEqual(vm.runInContext("buildCareerStorySpecial(p)",context)?.storyEventId,"market_choice_2");
 career.year=2037;career.age=27;career.contract.remaining=2;
 const expired=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(career.careerStoryPending[0].status,"closed");
 assert.notEqual(expired?.kind,"careerStoryClosure");
});

test("a real national-team call-up resolves the observation line instead of inventing another camp",()=>{
 const career=player({year:2033,age:23,path:"台灣職業",careerSeason:7,nationalCaps:0,internationalHistory:[]});
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("national_miss_1","askReport")`,context);
 career.year=2034;career.age=24;career.nationalCaps=1;career.internationalHistory=[{year:2034,level:"SENIOR"}];
 const result=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(career.careerStoryPending[0].status,"closed");
 assert.notEqual(result?.kind,"careerStoryClosure");
});

test("national observation requires an actual current-year near miss plus credible age, OVR, league role and availability",()=>{
 const weak=storyContext(player({year:2051,age:41,path:"韓國職業",careerSeason:20,stats:{shoot:65,finish:65,handle:65,pass:65,defense:65,rebound:65,ath:65,iq:65},seasonStats:{scheduledGames:54,games:40,mins:22}}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("national_miss_1"),p)`,weak),false);
 const noMiss=storyContext(player({year:2033,age:27,path:"韓國職業",careerSeason:8,stats:{shoot:76,finish:76,handle:76,pass:76,defense:76,rebound:76,ath:76,iq:76},seasonStats:{scheduledGames:54,games:45,mins:24}}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("national_miss_1"),p)`,noMiss),false);
 const ready=storyContext(player({year:2033,age:27,path:"韓國職業",careerSeason:8,nationalObservationCandidate:{year:2033,score:76,threshold:78},stats:{shoot:76,finish:76,handle:76,pass:76,defense:76,rebound:76,ath:76,iq:76},seasonStats:{scheduledGames:54,games:45,mins:24}}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("national_miss_1"),p)`,ready),true);
});

test("status-heavy stories require the career facts their text claims",()=>{
 const ordinary=storyContext(player({year:2040,age:30,path:"台灣職業",careerSeason:14,rep:1,peakOverall:70,careerGames:120,seasonStats:{scheduledGames:40,games:28,mins:9,pts:6},contract:{remaining:3},health:96,bodyLoad:20,fatigue:12}));
 for(const id of ["pro_sponsor_day","late_role_offer","late_body_warning","late_fan_chant","late_youth_camp","late_contract_physical"]){
  assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById(${JSON.stringify(id)}),p)`,ordinary),false,`${id} should not invent status or a contract/body window`);
 }
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("late_family_calendar"),p)`,ordinary),false);
 const unsigned=storyContext(player({year:2040,age:34,path:"台灣職業",careerSeason:14,rep:24,peakOverall:86,careerGames:520,contract:null,seasonStats:{scheduledGames:40,games:32,mins:24,pts:19}}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("late_contract_physical"),p)`,unsigned),false);
 const visiblePro=storyContext(player({year:2034,age:24,path:"台灣職業",careerSeason:7,rep:12,seasonStats:{scheduledGames:40,games:35,mins:29,pts:20},lastSeasonAwards:["年度第一隊"]}));
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("pro_sponsor_day"),p)`,visiblePro),true);
 const established=storyContext(player({year:2040,age:34,path:"台灣職業",careerSeason:14,rep:24,peakOverall:86,careerGames:520,married:true,partnerName:"伴侶",seasonStats:{scheduledGames:40,games:32,mins:24,pts:19},contract:{remaining:1},health:82,bodyLoad:58,fatigue:54,lastSeasonAwards:["年度第一隊"]}));
 for(const id of ["late_role_offer","late_body_warning","late_family_calendar","late_fan_chant","late_youth_camp","late_contract_physical"]){
  assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById(${JSON.stringify(id)}),p)`,established),true,`${id} should appear when its real context exists`);
 }
});

test("market, rebuild and media stories wait for a real window or visible role",()=>{
 const early=storyContext(player({year:2033,age:23,path:"台灣職業",careerSeason:6,rep:1,contract:{remaining:4},teamWorld:{direction:"rebuild"},seasonStats:{games:20,mins:9,pts:5},roleState:{current:"garbage",promised:"garbage"}}));
 for(const id of ["market_choice_1","rebuild_core_1","media_identity_1"]){
  assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById(${JSON.stringify(id)}),p)`,early),false,id);
 }
 early.p.contract.remaining=2;early.p.rep=9;early.p.seasonStats={games:32,mins:24,pts:14};early.p.roleState.current="starter";
 for(const id of ["market_choice_1","rebuild_core_1","media_identity_1"]){
  assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById(${JSON.stringify(id)}),p)`,early),true,id);
 }
 assert.doesNotMatch(read("data/career-story-events.js"),/季後賽傷勢|季後賽前的止痛選擇/);
});

test("a young short-career decline does not unlock veteran farewell stories",()=>{
 const career=player({year:2031,age:21,path:"台灣職業",careerSeason:4,firstFullProAge:19,peakOverall:82,stats:{shoot:70,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70},health:70,bodyLoad:72,contract:{remaining:1},roleState:{current:"benchLeader",promised:"starter"}});
 const context=storyContext(career);
 assert.equal(vm.runInContext("careerStoryStage(p)",context),"pro");
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("final_chapter_1"),p)`,context),false);
});

test("the first real closing chapter is not delayed behind random veteran filler",()=>{
 const career=player({year:2042,age:36,path:"台灣職業",careerSeason:14,peakOverall:88,stats:{shoot:78,finish:78,handle:78,pass:78,defense:78,rebound:78,ath:78,iq:78},health:76,bodyLoad:66,contract:{remaining:1},roleState:{current:"benchLeader",promised:"starter"},careerStoryLineSelection:{version:1,character:["school_rivalry","friendship"],team:["coach_role"],life:["playoff_injury"],late:["final_chapter"]}});
 const context=storyContext(career),special=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(vm.runInContext("careerStoryStage(p)",context),"veteran");
 assert.equal(special.storyEventId,"final_chapter_1");
});

test("family relocation story requires an actual meaningful move and is prioritized",()=>{
 const career=player({year:2033,age:27,path:"台灣職業",team:"桃園職籃",careerSeason:8,married:true,partnerName:"伴侶",careerStoryLineSelection:{version:1,character:["school_rivalry","friendship"],team:["coach_role"],life:["family_city"],late:[]}});
 const context=storyContext(career);
 assert.equal(vm.runInContext(`careerStoryEventEligible(careerStoryEventById("family_city_1"),p)`,context),false);
 vm.runInContext(`recordCareerRelocation(p,"台灣職業","桃園職籃","韓國職業","首爾籃球隊")`,context);
 const special=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(special.storyEventId,"family_city_1");
 assert.match(special.title,/桃園職籃/);assert.match(special.title,/首爾籃球隊/);
});

test("a later overseas move gets a new relocation story even after a domestic move used the first one",()=>{
 const career=player({year:2033,age:27,path:"台灣職業",team:"台南職籃",careerSeason:8,married:true,partnerName:"伴侶"});
 const context=storyContext(career);
 vm.runInContext(`recordCareerRelocation(p,"台灣職業","台南職籃","台灣職業","桃園職籃")`,context);
 career.team="桃園職籃";
 vm.runInContext(`resolveCareerStoryEvent("family_city_1","stay")`,context);
 assert.equal(career.careerStorySeen.includes("family_city_1"),true);
 career.year=2035;career.age=29;career.path="韓國職業";career.team="首爾籃球隊";
 vm.runInContext(`recordCareerRelocation(p,"台灣職業","桃園職籃","韓國職業","首爾籃球隊")`,context);
 const special=vm.runInContext("buildCareerStorySpecial(p)",context);
 assert.equal(special.storyEventId,"family_city_1");
 assert.match(special.title,/桃園職籃/);assert.match(special.title,/首爾籃球隊/);
});

test("callback facts do not repeat the previous-choice sentence already shown in the context card",()=>{
 const career=player();const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("friend_thread_1","makeTime")`,context);
 career.year=2027;career.age=17;
 const facts=vm.runInContext(`careerStoryFollowUpFacts(p.careerStoryPending[0],p)`,context);
 assert.doesNotMatch(facts,/你當時選擇/);
 assert.match(read("js/events/event-engine.js"),/舊友再聯絡/);
});

test("player-entered relationship names are escaped in career-story HTML",()=>{
 const career=player({careerCast:{
  friend:{name:'<img src=x onerror="bad()">',trait:"自訂朋友",trust:58},rival:{name:"宿敵甲",trait:"長期對手",respect:42},
  coach:{name:"教練甲",trait:"重視紀律",trust:55},teammate:{name:"隊友甲",trait:"輪替競爭",trust:50},agent:{name:"經紀人甲",trait:"重視長線",trust:58}
 }});
 const context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("friend_thread_1","makeTime")`,context);
 assert.doesNotMatch(career.finished.html,/<img/);
 assert.match(career.finished.html,/&lt;img/);
});

test("callbacks do not trigger after retirement and old saves receive additive defaults",()=>{
 const old=player({careerStoryHistory:undefined,careerStoryPending:undefined,careerStorySeen:undefined,careerStoryThemeYears:undefined,careerIntroductions:undefined});
 const context=storyContext(old);
 vm.runInContext("ensureCareerStoryState(p)",context);
 assert.equal(old.careerStoryHistory.length,0);
 old.careerStoryPending.push({id:"pending",eventId:"school_rival_2",dueYear:2026,status:"pending"});
 old.retired=true;
 assert.equal(vm.runInContext("buildCareerStorySpecial(p)",context),null);
 assert.equal(old.careerStoryPending[0].status,"pending");
 assert.doesNotMatch(read("js/ui/retirement-view.js"),/careerStoryPending|buildCareerStorySpecial|resolveCareerStoryEvent/);
 assert.match(read("js/state.js"),/openingCareerStoryYear:0/);
 assert.match(read("js/state.js"),/typeof player\.specialReturnStage!=="string"/);
});

test("home setup persists optional friend and rival names and the record drawer exposes people and consequences",()=>{
 const home=read("js/ui/growth-preview.js"),career=read("js/ui/career-view.js");
 assert.match(home,/id="careerFriendNameInput"/);
 assert.match(home,/id="careerRivalNameInput"/);
 assert.match(home,/這段生涯裡的人/);
 assert.match(home,/選擇留下的後果/);
 assert.match(home,/你當時選擇/);
 assert.match(home,/當時球隊/);
 assert.match(career,/careerCast:\{friend:\{name:friendName/);
 assert.match(career,/rival:\{name:rivalName/);
 assert.match(home,/遇見以前不提前顯示姓名/);
 assert.doesNotMatch(home,/製作故事卡/);
});

test("the opening story introduces a named long-term relationship before ordinary events",()=>{
 const career=player(),context=storyContext(career);
 const opening=vm.runInContext("buildCareerStorySpecial(p,{openingOnly:true})",context);
 assert.ok(["school_rival_1","friend_thread_1"].includes(opening.storyEventId));
 assert.ok(["friend","rival"].includes(vm.runInContext(`careerStoryEventById(${JSON.stringify(opening.storyEventId)}).actor`,context)));
});

test("unintroduced cast names stay hidden and a played story reveals only its actor",()=>{
 const career=player(),context=storyContext(career);
 assert.equal(vm.runInContext("careerStoryPeople(p).length",context),0);
 vm.runInContext(`resolveCareerStoryEvent("friend_thread_1","makeTime")`,context);
 const people=vm.runInContext("careerStoryPeople(p)",context);
 assert.deepEqual(Array.from(people,item=>item.key),["friend"]);
});

test("early relationship callbacks finish within the first five seasons",()=>{
 const career=player(),context=storyContext(career);
 vm.runInContext(`resolveCareerStoryEvent("friend_thread_1","ignore")`,context);
 assert.equal(career.careerStoryPending[0].dueYear,2027);
 career.year=2027;career.age=17;career.careerSeason=1;
 vm.runInContext(`resolveCareerStoryEvent("friend_thread_2","saveLater")`,context);
 assert.equal(career.careerStoryPending.find(item=>item.eventId==="friend_thread_3").dueYear,2028);
});

test("three deterministic careers run from HBL through veteran seasons without duplicate story nodes",()=>{
 const strategies=[0,1,2];
 for(const [careerIndex,choiceIndex] of strategies.entries()){
  const career=player({seed:`STORY00${careerIndex+2}`});
  const context=storyContext(career),played=[];
  for(let offset=0;offset<22;offset++){
   career.year=2026+offset;career.age=16+offset;career.careerSeason=offset;
   career.path=offset<3?"HBL":offset<7?"NCAA D1":offset<18?"台灣職業":"NBA";
   career.team=offset<3?"測試高中":offset<7?"測試大學":offset<18?"測試職業隊":"測試 NBA 隊";
   career.grade=offset<3?offset+1:offset<7?offset-2:0;
   career.seasonStats={games:10+offset,scheduledGames:30,mins:[12,18,24,29][offset%4],pts:8+offset*.6,ast:3,reb:4};
   career.rep=offset*2;career.careerGames=offset*28;career.contract=offset>=7?{remaining:offset%3+1}:null;
   career.roleState={current:offset>=18?"benchLeader":"starter",promised:"starter"};
   career.partnerName=offset>=10?"伴侶":"";career.nationalCaps=offset>=12?1:0;
   career.peakOverall=85;career.stats=Object.fromEntries(Object.keys(career.stats).map(key=>[key,offset>=18?64:offset>=15?72:78]));
   career.health=offset>=18?74:offset%6===0?84:92;career.bodyLoad=offset>=18?68:career.path==="HBL"?18:career.path==="NCAA D1"?30:48;
   career.injuryHistory=offset%6===0?[{name:"腳踝扭傷",year:career.year}]:[];
   const special=vm.runInContext("buildCareerStorySpecial(p)",context);
   if(!special)continue;
   if(special.kind==="careerStoryClosure"){
    vm.runInContext(`resolveCareerStoryClosure(${JSON.stringify(special.storyPendingId)})`,context);
    played.push(`closure:${special.storyPendingId}`);
    continue;
   }
   const choice=vm.runInContext(`careerStoryEventById(${JSON.stringify(special.storyEventId)}).choices[${choiceIndex}]`,context);
   vm.runInContext(`resolveCareerStoryEvent(${JSON.stringify(special.storyEventId)},${JSON.stringify(choice.id)})`,context);
   played.push(special.storyEventId);
  }
  assert.ok(played.length>=18,`career ${careerIndex+1} should receive a meaningful story in most seasons`);
  assert.equal(new Set(played).size,played.length,`career ${careerIndex+1} should not repeat a story node`);
  assert.ok(career.careerStoryHistory.some(item=>item.node===2),`career ${careerIndex+1} should receive a cross-season follow-up`);
  assert.ok(career.careerStoryHistory.some(item=>item.node===3),`career ${careerIndex+1} should finish at least one long line`);
 }
});

test("twelve full careers receive meaningfully different story selections",()=>{
 const signatures=[],union=new Set();
 for(let careerIndex=0;careerIndex<12;careerIndex++){
  const career=player({seed:`REPLAY${String(careerIndex+1).padStart(3,"0")}`});
  const context=storyContext(career),played=[];
  for(let offset=0;offset<22;offset++){
   career.year=2026+offset;career.age=16+offset;career.careerSeason=offset;
   career.path=offset<3?"HBL":offset<7?(careerIndex%2?"UBA 強權":"NCAA D1"):offset<18?(careerIndex%3===0?"韓國職業":"台灣職業"):"NBA";
   career.team=`生涯${careerIndex+1}球隊${offset<3?"高":offset<7?"大":"職"}`;
   career.grade=offset<3?offset+1:offset<7?offset-2:0;
   career.seasonStats={games:12+offset,scheduledGames:32,mins:[11,17,23,29][(offset+careerIndex)%4],pts:7+offset*.7,ast:3.5,reb:4.5};
   career.rep=offset*2+careerIndex%4;career.careerGames=offset*30;career.contract=offset>=7?{remaining:(offset+careerIndex)%3+1}:null;
   career.roleState={current:offset>=18?"benchLeader":offset%4===0?"core":"starter",promised:"starter"};
   career.partnerName=offset>=9&&careerIndex%2===0?"伴侶":"";career.nationalCaps=offset>=11&&careerIndex%3===0?1:0;
   career.peakOverall=86;career.stats=Object.fromEntries(Object.keys(career.stats).map(key=>[key,offset>=18?63:offset>=15?71:77]));
   career.health=offset>=18?73:offset%5===0?85:93;career.bodyLoad=offset>=18?69:offset<7?28:50;
   career.injuryHistory=offset%5===0?[{name:"膝部不適",year:career.year}]:[];
   const special=vm.runInContext("buildCareerStorySpecial(p)",context);
   if(!special?.storyEventId)continue;
   const choice=vm.runInContext(`careerStoryEventById(${JSON.stringify(special.storyEventId)}).choices[${careerIndex%3}]`,context);
   vm.runInContext(`resolveCareerStoryEvent(${JSON.stringify(special.storyEventId)},${JSON.stringify(choice.id)})`,context);
   played.push(special.storyEventId);union.add(special.storyEventId);
  }
  assert.ok(played.length>=18,`career ${careerIndex+1} should keep receiving valid stories`);
  assert.equal(new Set(played).size,played.length,`career ${careerIndex+1} should not repeat an event`);
  signatures.push(played.join("|"));
 }
 assert.ok(union.size>=50,`expected broad catalog use, received ${union.size} unique events`);
 assert.ok(new Set(signatures).size>=10,"different Seeds should not collapse into the same story order");
});

test("cross-season copy does not assume one earlier choice happened",()=>{
 const source=read("data/career-story-events.js");
 assert.doesNotMatch(source,/你手機裡仍留著當初那張戰術板照片/);
 assert.doesNotMatch(source,/拿出上一季的腕帶/);
 assert.doesNotMatch(source,/當年的紅色腕帶/);
 assert.doesNotMatch(source,/收回借出的恢復頁/);
 assert.doesNotMatch(source,/都回到同一座球場投完五十顆/);
 assert.match(source,/無論家人已經搬來、仍在兩地往返，或暫時保留舊住處/);
 assert.match(source,/無論你曾分享整本筆記、只給一頁，或要他自己記錄/);
});
