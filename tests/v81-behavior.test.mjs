import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");

test("old injury burden fades after healthy seasons but major injuries keep a small floor",()=>{
  const context={p:{year:2034,seasonPlan:"care",healthySeasons:3,oldInjuries:{膝蓋:2,腳踝:.6},oldInjuryFloors:{膝蓋:.35,腳踝:0},oldInjuryLastYear:{膝蓋:2030,腳踝:2033}}};
  vm.runInNewContext(read("js/career/injury-engine.js"),context);
  const recovered=context.decayOldInjuries();
  assert.ok(context.p.oldInjuries.膝蓋<2);
  assert.ok(context.p.oldInjuries.膝蓋>=.35);
  assert.ok(recovered.includes("腳踝"));
  assert.equal("腳踝" in context.p.oldInjuries,false);
});

test("contract medical discount is recent, bounded, and zero for a healthy player",()=>{
  const context={
    p:{year:2035,path:"NCAA D1",team:"台北大學",health:100,injury:null,injuryHistory:[],oldInjuries:{},seasonHistory:[{year:2035,path:"NCAA D1",scheduledGames:30,games:28,mins:25,pts:8,reb:3,ast:2,stl:.5,blk:.2}]},
    scheduledGamesForSeason:()=>30,
    leagueMarketRank:league=>({"SBL／半職業":1,"台灣職業":2,"韓國職業":3,"日本職業":4,CBA:4,"NBA G League":5,"歐洲聯賽":6,NBA:7}[league]||0)
  };
  vm.runInNewContext(read("js/career/contract-engine.js"),context);
  assert.equal(context.contractInjuryDiscount(),0);
  assert.equal(context.collegeResumeProfile("NCAA D1").level,"starter");
  assert.equal(context.collegeReturnMarketBonus("台灣職業"),8);
  context.p.injuryHistory=[{year:2035,level:"重傷"},{year:2034,level:"大傷"},{year:2028,level:"重傷"}];
  context.p.oldInjuries={膝蓋:3};context.p.injury={level:"重傷"};context.p.health=55;
  const discounted=context.contractInjuryDiscount();
  assert.ok(discounted>0);
  assert.ok(discounted<=.22);
});

test("young professionals do not fall out of the market after one rookie season",()=>{
  const context={p:{age:24,careerSeason:2,seasonHistory:[{path:"台灣職業"}]}};
  vm.runInNewContext(read("js/career/contract-engine.js"),context);
  context.isProPath=()=>true;
  context.overall=()=>46;
  context.scoutingScore=()=>46;

  assert.equal(context.leagueRosterOverallFloor("SBL／半職業"),45);
  assert.equal(context.youngMarketBridgeEligible(),true);
  assert.equal(context.collegeDraftContractYears("taiwan",1),2);
  assert.equal(context.collegeDraftContractYears("nba",1),2);
  assert.equal(context.collegeDraftContractYears("gleague",3),1);
  assert.equal(context.collegeDraftContractYears("sbl",3),1);

  context.p.age=25;
  assert.equal(context.leagueRosterOverallFloor("SBL／半職業"),45);
  context.p.age=26;
  assert.equal(context.leagueRosterOverallFloor("SBL／半職業"),45);
  context.p.careerSeason=4;
  assert.equal(context.youngMarketBridgeEligible(),false);
});

test("an OVR 82 European standout enters the NBA pathway",()=>{
  const context={p:{
    path:"歐洲聯賽",age:27,contract:{continentalCup:"EuroLeague"},lastSeasonAwards:[],
    seasonStats:{games:30,mins:22,pts:15,ast:5,reb:4,stl:1,blk:.3}
  }};
  vm.runInNewContext(read("js/career/contract-engine.js"),context);
  context.overall=()=>82;
  assert.equal(context.nbaPerformanceOfferKind(84),"two-way");
  context.overall=()=>84;
  assert.equal(context.nbaPerformanceOfferKind(86),"standard");
});
