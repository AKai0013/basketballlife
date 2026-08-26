import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
function context(){
 const box={globalThis:null};box.globalThis=box;vm.createContext(box);
 vm.runInContext(read("js/career/progression-engine.js"),box);
 return box;
}
function player(overrides={}){
 return {
  careerVersion:"9.0.0",year:2040,careerSeason:12,age:30,health:88,bodyLoad:22,durability:78,peakOverall:80,
  stats:{shoot:70,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70},
  caps:{shoot:74,finish:74,handle:74,pass:74,defense:74,rebound:74,ath:74,iq:74},
  roleState:{current:"starter",promised:"starter"},seasonPermanentGrowth:{},...overrides
 };
}

test("V9 Seed caps remain natural ceilings but growth years allow bounded breakthroughs",()=>{
 const box=context(),v9=player({stats:{shoot:74,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70}});
 const capped=box.applyCareerStatChange(v9,"shoot",1,{source:"event",seasonalFallback:true});
 assert.equal(capped.applied,1);assert.equal(capped.reason,"breakthrough");assert.equal(v9.stats.shoot,75);
 assert.ok(box.careerStatLimit(v9,"shoot")>box.careerStatCap(v9,"shoot"));
 const old=player({careerVersion:"8.1.1",stats:{shoot:74,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70}});
 assert.equal(box.applyCareerStatChange(old,"shoot",1,{source:"event"}).applied,1);
 assert.equal(old.stats.shoot,75);
});

test("bounded breakthroughs still stop at the Seed and affinity-derived training limit",()=>{
 const box=context(),career=player({seedTier:"B",stats:{shoot:76,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70}});
 assert.equal(box.careerStatCap(career,"shoot"),74);
 assert.equal(box.careerStatLimit(career,"shoot"),76);
 assert.equal(box.applyCareerStatChange(career,"shoot",1,{source:"point"}).applied,0);
});

test("30s development becomes technical and 38+ cannot add permanent ability",()=>{
 const box=context(),veteran=player({age:35});
 assert.equal(box.applyCareerStatChange(veteran,"ath",1,{source:"point"}).applied,0);
 assert.equal(box.applyCareerStatChange(veteran,"shoot",1,{source:"point"}).applied,1);
 assert.equal(box.applyCareerStatChange(veteran,"shoot",1,{source:"point"}).applied,0);
 const late=player({age:38});
 assert.equal(box.applyCareerStatChange(late,"pass",1,{source:"point"}).applied,0);
});

test("a new season does not inherit the previous season's per-skill growth lock",()=>{
 const box=context(),career=player({
  age:28,year:2040,careerSeason:12,permanentGrowthSeasonKey:"2040:12",seasonPermanentGrowth:{finish:4,handle:4,defense:4}
 });
 assert.equal(box.availablePermanentGrowth(career,"finish"),0);
 career.year=2041;career.careerSeason=13;
 assert.equal(box.availablePermanentGrowth(career,"finish"),4);
 box.resetPermanentGrowthSeason(career);
 assert.equal(career.permanentGrowthSeasonKey,"2041:13");
 assert.deepEqual({...career.seasonPermanentGrowth},{});
});

test("38+ season points are converted into recovery instead of becoming unusable leftovers",()=>{
 const box=context();
 box.p=player({age:41,bonusPoints:9,bankedPoints:3,fatigue:18,bodyLoad:26,health:82});
 vm.runInContext(read("js/career/season-engine.js"),box);
 const result=box.convertV9MaintenancePoints();
 assert.deepEqual({...result},{spent:9,fatigue:4,bodyLoad:4,health:2});
 assert.equal(box.p.bonusPoints,0);
 assert.equal(box.p.bankedPoints,0);
 assert.equal(box.p.fatigue,14);
 assert.equal(box.p.bodyLoad,22);
 assert.equal(box.p.health,84);
});

test("unused preseason training converts into visible recovery instead of disappearing",()=>{
 const box=context(),career=player({age:36,fatigue:18,bodyLoad:24,health:91,dice:[6,4,3],used:[true,false,false],trainingUndo:[{k:"shoot"}]});
 box.p=career;box.render=()=>{};box.renderDice=()=>{};box.scheduleCareerAutosave=()=>{};
 box.assign={innerHTML:""};box.diceMsg={textContent:""};box.next={textContent:"",classList:{remove:()=>{},add:()=>{}}};
 vm.runInContext(read("js/ui/event-view.js"),box);
 box.renderDice=()=>{};
 const before={...career.stats};
 vm.runInContext("convertRemainingTrainingToRecovery()",box);
 assert.deepEqual(career.used,[true,true,true]);
 assert.equal(career.fatigue,16);assert.equal(career.bodyLoad,21);assert.equal(career.health,93);
 assert.equal(career.preseasonRecoveryRisk,.056);
 assert.deepEqual(career.stats,before);
 assert.match(career.trainingRecoverySummary,/剩餘 7 點課表已轉為恢復/);
});

test("rehab can restore ability only to the actual cap, without bypassing it",()=>{
 const box=context(),career=player({age:40,stats:{shoot:70,finish:70,handle:70,pass:70,defense:70,rebound:70,ath:70,iq:70},caps:{shoot:74,finish:74,handle:74,pass:74,defense:74,rebound:74,ath:71,iq:74}});
 assert.equal(box.applyCareerStatChange(career,"ath",2,{source:"rehab"}).applied,1);
 assert.equal(career.stats.ath,71);
});

test("career chapters follow ability, role and condition rather than age alone",()=>{
 const box=context();
 const healthy=player({age:50,peakOverall:88,stats:{shoot:88,finish:88,handle:88,pass:88,defense:88,rebound:88,ath:88,iq:88},roleState:{current:"core",promised:"core"},health:96,bodyLoad:18,contract:{remaining:2}});
 assert.equal(box.careerLifecycleProfile(healthy).chapter,"peak");
 const declining=player({age:36,peakOverall:88,stats:{shoot:80,finish:80,handle:80,pass:80,defense:80,rebound:80,ath:80,iq:80},roleState:{current:"benchLeader",promised:"starter"},health:72,bodyLoad:70,contract:{remaining:1}});
 assert.equal(box.careerLifecycleProfile(declining).chapter,"legacy");
});

test("all permanent stat entry points are routed through the shared V9 progression gate",()=>{
 const eventSource=read("js/events/event-engine.js"),storySource=read("js/events/career-story-engine.js"),injurySource=read("js/career/injury-engine.js"),chainSource=read("js/events/event-memory.js"),trainingSource=read("js/ui/event-view.js");
 assert.match(eventSource,/applyCareerStatChange\(p,key,delta/);
 assert.match(storySource,/applyCareerStatChange\(player,key,delta/);
 assert.match(injurySource,/applyCareerStatChange\(p,k,-n/);
 assert.match(chainSource,/raiseCareerStatCap\(p,key,amount/);
 assert.match(trainingSource,/applyCareerStatChange\(p,k,1,\{source:"training"\}\)/);
});
