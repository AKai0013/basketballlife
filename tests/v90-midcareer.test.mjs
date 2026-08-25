import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"js/events/midcareer-rhythm.js"),"utf8");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");

function context(){
 const box={RNG:key=>{
  let value=0;for(const char of String(key))value=(value*33+char.charCodeAt(0))>>>0;
  return ()=>((value%997)+1)/998;
 }};
 box.globalThis=box;vm.createContext(box);vm.runInContext(source,box);return box;
}
function player(overrides={}){
 return {
  careerVersion:"9.0.0",seed:"MIDV9001",path:"NBA",careerSeason:8,year:2040,age:29,
  stats:{shoot:82,finish:80,handle:78,pass:81,defense:79,rebound:72,ath:80,iq:84},
  health:88,fatigue:24,bodyLoad:22,confidence:68,rep:35,durability:78,discipline:80,clutch:82,
  specialBonusPoints:0,seasonHistory:[],...overrides
 };
}
const history=values=>values.map((ovr,index)=>({year:2034+index,path:"NBA",ovr}));
const stageSeasons=[10,11,15,16,21,22,23];
const stageChapters=["peak","peak","turn","turn","legacy","legacy","legacy"];
function stagedCareer(box,offset,overrides={}){
 const ovr=offset<2?90:offset<4?86:80,role=offset<2?"core":offset<4?"starter":"sixth";
 const career=player({careerSeason:stageSeasons[offset],year:2040+stageSeasons[offset],age:27+stageSeasons[offset],peakOverall:90,roleState:{current:role,currentLabel:role},contract:{remaining:1,rolePromise:offset>=4?"主要輪替":"固定先發"},stats:Object.fromEntries(["shoot","finish","handle","pass","defense","rebound","ath","iq"].map(key=>[key,ovr])),...overrides});
 const state=box.ensureV90MidcareerState(career);state.startCareerSeason=10;state.startYear=2050;state.startOverall=90;state.startRole="core";state.startRoleLevel=5;state.triggerReason="OVR 90，成長進入平台";state.chapterReasons.peak=state.triggerReason;
 state.results=stageSeasons.slice(0,offset).map((careerSeason,index)=>({offset:index,careerSeason,year:2040+careerSeason,chapter:stageChapters[index],choice:`第 ${index+1} 幕`,story:"已完成",aligned:true}));
 return career;
}

test("mid-career chapter starts from season eight only after the OVR curve plateaus",()=>{
 const box=context();
 const insufficient=player({careerSeason:10,seasonHistory:history([88,89])});
 const rising=player({careerSeason:8,seasonHistory:history([70,74,78]),stats:{shoot:81,finish:81,handle:81,pass:81,defense:81,rebound:81,ath:81,iq:81}});
 const plateau=player({careerSeason:8,seasonHistory:history([78,79,80]),stats:{shoot:80,finish:80,handle:80,pass:80,defense:80,rebound:80,ath:80,iq:80}});
 assert.equal(box.v90MidcareerTriggerProfile(insufficient).eligible,false);
 assert.equal(box.v90MidcareerTriggerProfile(rising).eligible,false);
 assert.equal(box.v90MidcareerTriggerProfile(rising).stillRising,true);
 assert.equal(box.v90ShouldStartMidcareer(rising),false);
 assert.equal(box.v90MidcareerTriggerProfile(plateau).eligible,true);
 assert.equal(box.v90ShouldStartMidcareer(plateau),true);
 const justFlattened=player({careerSeason:10,seasonHistory:history([86,90,90]),stats:{shoot:90,finish:90,handle:90,pass:90,defense:90,rebound:90,ath:90,iq:90}});
 assert.equal(box.v90MidcareerTriggerProfile(justFlattened).eligible,true);
});

test("late bloomers can delay beyond season fourteen instead of hitting a fixed-age trigger",()=>{
 const box=context();
 const late=player({careerSeason:14,year:2046,age:35,seasonHistory:history([74,77,80]),stats:{shoot:82,finish:82,handle:82,pass:82,defense:82,rebound:82,ath:82,iq:82}});
 assert.equal(box.v90MidcareerTriggerProfile(late).eligible,false);
 late.careerSeason=15;late.year=2047;late.seasonHistory=history([80,82,83]);
 Object.keys(late.stats).forEach(key=>late.stats[key]=83);
 assert.equal(box.v90MidcareerTriggerProfile(late).eligible,true);
});

test("mature elite players and declining players enter the chapter from their actual curve",()=>{
 const box=context();
 const capped=player({careerSeason:9,seasonHistory:history([94,96,97])});
 Object.keys(capped.stats).forEach(key=>capped.stats[key]=98);
 assert.equal(box.v90MidcareerTriggerProfile(capped).eligible,true);
 const declining=player({careerSeason:11,seasonHistory:history([87,88,86])});
 Object.keys(declining.stats).forEach(key=>declining.stats[key]=85);
 assert.equal(box.v90MidcareerTriggerProfile(declining).eligible,true);
});

test("the three chapters wait for real career changes instead of playing for seven straight seasons",()=>{
 const box=context(),career=stagedCareer(box,2,{careerSeason:12,year:2052,stats:Object.fromEntries(["shoot","finish","handle","pass","defense","rebound","ath","iq"].map(key=>[key,90])),roleState:{current:"core",currentLabel:"先發核心"}});
 assert.equal(box.v90MidcareerDefinition(career),null,"an ordinary season remains between chapters");
 career.careerSeason=15;career.year=2055;Object.keys(career.stats).forEach(key=>career.stats[key]=86);career.roleState={current:"starter",currentLabel:"固定先發"};
 assert.equal(box.v90MidcareerDefinition(career).offset,2);
 const legacyWait=stagedCareer(box,4,{careerSeason:18,year:2058,stats:Object.fromEntries(["shoot","finish","handle","pass","defense","rebound","ath","iq"].map(key=>[key,86])),roleState:{current:"starter",currentLabel:"固定先發"},contract:{remaining:3,rolePromise:"固定先發"}});
 assert.equal(box.v90MidcareerDefinition(legacyWait),null,"legacy does not start while performance and role remain stable");
 legacyWait.careerSeason=21;legacyWait.year=2061;Object.keys(legacyWait.stats).forEach(key=>legacyWait.stats[key]=80);legacyWait.roleState={current:"sixth",currentLabel:"最佳第六人"};
 assert.equal(box.v90MidcareerDefinition(legacyWait).offset,4);
 for(let offset=0;offset<7;offset++)assert.equal(box.v90MidcareerDefinition(stagedCareer(box,offset)).choices.length,3);
 const legacy=player({careerVersion:"8.1.1"});
 assert.equal(box.ensureV90MidcareerState(legacy),null);
 assert.equal(legacy.midcareerArc,undefined);
 assert.equal(box.v90ShouldStartMidcareer(legacy),false);
});

test("a late physical freak is not pushed into the closing chapter by age alone",()=>{
 const box=context(),freak=stagedCareer(box,4,{careerSeason:24,year:2064,age:50,peakOverall:98,stats:Object.fromEntries(["shoot","finish","handle","pass","defense","rebound","ath","iq"].map(key=>[key,96])),roleState:{current:"core",currentLabel:"先發核心"},contract:{remaining:3,rolePromise:"先發核心"},health:96,bodyLoad:18});
 const profile=box.v90MidcareerLegacyProfile(freak,freak.midcareerArc);
 assert.equal(profile.eligible,false);
 assert.equal(box.v90MidcareerTransitionProfile(freak,freak.midcareerArc).eligible,false);
 assert.equal(box.v90MidcareerDefinition(freak),null);
 const veteran=stagedCareer(box,4,{careerSeason:24,year:2064,age:43,peakOverall:92,stats:Object.fromEntries(["shoot","finish","handle","pass","defense","rebound","ath","iq"].map(key=>[key,82])),roleState:{current:"worker",currentLabel:"主要輪替／防守工兵"},contract:{remaining:1,rolePromise:"主要輪替"},health:72,bodyLoad:70});
 assert.equal(box.v90MidcareerLegacyProfile(veteran,veteran.midcareerArc).eligible,true);
 assert.equal(box.v90MidcareerDefinition(veteran).offset,4);
});

test("extra-result odds remain bounded and use abilities, condition and objective alignment",()=>{
 const box=context(),career=player({careerSeason:9,year:2041});
 const state=box.ensureV90MidcareerState(career);state.startCareerSeason=9;state.startYear=2041;state.chapterObjectives.peak="peak_signature";
 const definition=box.v90MidcareerDefinition(career),choice=definition.choices[0];
 const normal=box.v90MidcareerChanceBreakdown(career,{...choice,chapter:definition.chapter});
 assert.ok(normal.chance>=22&&normal.chance<=92);
 assert.equal(normal.aligned,true);
 career.health=5;career.fatigue=100;career.bodyLoad=100;career.confidence=0;career.rep=-100;
 const strained=box.v90MidcareerChanceBreakdown(career,{...choice,chapter:definition.chapter});
 assert.ok(strained.chance>=22&&strained.chance<=92);
 assert.ok(strained.chance<normal.chance);
 assert.equal(strained.condition,0);
});

test("one seasonal choice applies guaranteed tradeoffs once and keeps all live values in bounds",()=>{
 const box=context(),career=player({careerSeason:10,year:2042});
 const state=box.ensureV90MidcareerState(career);state.startCareerSeason=10;state.startYear=2042;state.chapterObjectives.peak="peak_signature";
 const definition=box.v90MidcareerDefinition(career),choice=definition.choices[0],before={health:career.health,fatigue:career.fatigue,bodyLoad:career.bodyLoad,confidence:career.confidence,rep:career.rep};
 const result=box.v90ResolveMidcareerChoice(career,choice.id);
 assert.ok(result.chance>=22&&result.chance<=92);
 assert.ok(result.roll>=1&&result.roll<=100);
 assert.equal(career.confidence,before.confidence+choice.sure.confidence+(result.success?(choice.success.confidence||0):(choice.failure.confidence||0)));
 for(const key of ["health","fatigue","bodyLoad","confidence"])assert.ok(career[key]>=0&&career[key]<=100);
 assert.ok(career.rep>=-100&&career.rep<=200);
 const snapshot=JSON.stringify({health:career.health,fatigue:career.fatigue,bodyLoad:career.bodyLoad,confidence:career.confidence,rep:career.rep,specialBonusPoints:career.specialBonusPoints});
 assert.equal(box.v90ResolveMidcareerChoice(career,definition.choices[1].id).choiceId,result.choiceId);
 assert.equal(JSON.stringify({health:career.health,fatigue:career.fatigue,bodyLoad:career.bodyLoad,confidence:career.confidence,rep:career.rep,specialBonusPoints:career.specialBonusPoints}),snapshot);
});

test("all twenty-one decisions keep probability and live-score calculations inside safe bounds",()=>{
 const box=context(),objectiveByChapter={peak:"peak_title",turn:"turn_redefine",legacy:"legacy_long"};
 for(let offset=0;offset<7;offset++){
  const probe=stagedCareer(box,offset,{health:offset%2?34:96,fatigue:offset%2?88:4,bodyLoad:offset%2?91:6,confidence:offset%2?15:94,rep:offset%2?-70:130});
  const state=box.ensureV90MidcareerState(probe);
  const definition=box.v90MidcareerDefinition(probe);state.chapterObjectives[definition.chapter]=objectiveByChapter[definition.chapter];
  for(const choice of definition.choices){
   const career=structuredClone(probe);career.seed=`MID${offset}${choice.id}`.slice(0,8);
   const chance=box.v90MidcareerChanceBreakdown(career,{...choice,chapter:definition.chapter});
   assert.ok(Number.isInteger(chance.chance)&&chance.chance>=22&&chance.chance<=92,`${choice.id} chance ${chance.chance}`);
   const result=box.v90ResolveMidcareerChoice(career,choice.id);
   assert.ok(result&&Number.isInteger(result.roll)&&result.roll>=1&&result.roll<=100,choice.id);
   if(offset===6){assert.equal(career.midcareerArc.completed,true);assert.equal(box.v90MidcareerDefinition(career).offset,6);}
   for(const key of ["health","fatigue","bodyLoad","confidence"])assert.ok(Number.isFinite(career[key])&&career[key]>=0&&career[key]<=100,`${choice.id} ${key}`);
   assert.ok(Number.isFinite(career.rep)&&career.rep>=-100&&career.rep<=200,`${choice.id} rep`);
   assert.ok(Number.isFinite(career.specialBonusPoints)&&career.specialBonusPoints>=0&&career.specialBonusPoints<=1,`${choice.id} bonus`);
  }
 }
});

test("formal V9 flow rebuilds saved mid-career screens and sends the result to special events",()=>{
 const index=read("index.html"),events=read("js/ui/event-view.js"),storage=read("js/storage.js"),state=read("js/state.js"),career=read("js/ui/career-view.js"),css=read("css/v9-ui.css");
 assert.match(index,/js\/events\/midcareer-rhythm\.js/);
 assert.match(events,/maybeStartV90MidcareerRhythm\(\)/);
 assert.match(events,/p\.stage==="midcareer"/);
 assert.match(storage,/rebuildV90MidcareerScreenFromSave/);
 assert.match(state,/isV9Career&&typeof ensureV90MidcareerState/);
 assert.match(career,/ensureV90MidcareerState\(p\)/);
 assert.match(css,/data-v9-view="midcareer"/);
 assert.match(source,/recordV8Story\("turning"/);
 assert.doesNotMatch(source,/careerSeason\s*===\s*14|careerSeason\s*>?=\s*14/);
});
