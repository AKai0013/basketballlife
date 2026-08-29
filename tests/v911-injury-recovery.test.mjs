import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"js/career/injury-engine.js"),"utf8");

function context(random=.99){
 const p={seed:"MEDICAL01",year:2026,age:25,path:"HBL",durability:75,health:70,bodyLoad:35,injuryHistory:[],medicalHistory:[],oldInjuries:{},oldInjuryFloors:{},oldInjuryLastYear:{},postOpCareChosen:false};
 const c={p,console,Math,RNG:()=>()=>random,scheduledGamesForSeason:()=>18,leagueMarketRank:league=>({HBL:0,"SBL／半職業":1,"台灣職業":2,"NBA G League":5,"歐洲聯賽":6,NBA:7}[league]||0),logIt:()=>{},L:{},hasTitle:()=>false,isProPath:()=>false};
 vm.createContext(c);vm.runInContext(source,c);return c;
}

test("Achilles recovery uses months and crosses an HBL season",()=>{
 const c=context();
 c.p.injury={name:"阿基里斯腱斷裂",area:"阿基里斯腱",level:"重傷",episodeId:"achilles-1",startYear:2026,onsetFraction:.5,originalRecoveryMonths:13,remainingRecoveryMonths:13,recovery:"9～14個月"};
 const state=vm.runInContext("ensureInjuryRecoveryState()",c);
 assert.equal(state.remainingMonths,13);
 assert.equal(c.p.injury.remainingGames,18,"a 13-month injury must not display as only a few HBL games");
 const first=vm.runInContext("consumeInjuryRecoveryForSeason()",c);
 assert.equal(first,9);assert.equal(c.p.injury.remainingRecoveryMonths,7);
 c.p.year=2027;
 const second=vm.runInContext("consumeInjuryRecoveryForSeason()",c);
 assert.equal(second,11);assert.equal(c.p.injury.remainingRecoveryMonths,0);
});

test("failed medical clearance creates a player decision instead of forced retirement",()=>{
 const c=context(.01);
 c.p.path="NBA";c.p.age=27;c.p.injuryHistory=[{year:2026,name:"阿基里斯腱斷裂",level:"重傷"}];
 c.p.injury={name:"阿基里斯腱斷裂",area:"阿基里斯腱",level:"重傷",episodeId:"achilles-2",startYear:2025,onsetFraction:0,originalRecoveryMonths:12,remainingRecoveryMonths:0,recovery:"9～14個月",recur:true};
 const result=vm.runInContext("settleInjuryReturn()",c);
 assert.equal(result.outcome,"failed");
 assert.equal(c.p.injury,null);
 assert.equal(c.p.medicalClearancePending.outcome,"failed");
 assert.equal(c.p.retired,undefined,"medical failure must not silently retire the player");
 assert.equal(c.p.postInjuryStatus.minutesCap,18);
 assert.equal(c.p.medicalHistory.length,1);
 assert.equal(c.p.medicalHistory[0].returnOutcome,"failed");
});

test("legacy game-only injury saves migrate to recovery months",()=>{
 const c=context();
 c.p.injury={name:"ACL撕裂",area:"膝蓋",level:"重傷",originalMissedGames:18,remainingGames:9,recovery:"8～12個月"};
 const state=vm.runInContext("ensureInjuryRecoveryState()",c);
 assert.equal(state.originalMonths,10);
 assert.ok(state.remainingMonths>1&&state.remainingMonths<2,"legacy remaining games are converted from NBA-equivalent time");
 assert.match(c.p.injury.episodeId,/^inj-2026-/);
});

test("Achilles clearance calibration keeps full, limited and failed outcomes distinct",()=>{
 const counts={full:0,limited:0,failed:0};
 for(let i=0;i<100;i++){
  const c=context((i+.5)/100);c.p.path="NBA";
  c.p.injury={name:"阿基里斯腱斷裂",area:"阿基里斯腱",level:"重傷",episodeId:`achilles-${i}`,startYear:2025,originalRecoveryMonths:12,remainingRecoveryMonths:0,recovery:"9～14個月"};
  counts[vm.runInContext("settleInjuryReturn().outcome",c)]++;
 }
 assert.deepEqual(counts,{full:73,limited:14,failed:13});
});

test("aggravation updates one medical episode instead of creating a fake second injury",()=>{
 const eventSource=fs.readFileSync(path.join(root,"js/events/event-engine.js"),"utf8");
 const retirementSource=fs.readFileSync(path.join(root,"js/ui/retirement-view.js"),"utf8");
 assert.doesNotMatch(eventSource,/medicalHistory\.push\(\{year:p\.year,name:p\.injury\.name/);
 assert.match(eventSource,/updateMedicalEpisode\(p\.injury/);
 assert.match(eventSource,/failed\?"這不是自動退休[^\n]+:"你可以延長復健再接受評估/);
 assert.match(retirementSource,/majorMedical\.year} 年\$\{majorMedical\.name\|\|"重大傷病"}後續戰/);
});
