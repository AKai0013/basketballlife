import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const leagueRank=league=>({"SBL／半職業":1,"台灣職業":2,"韓國職業":3,"日本職業":4,CBA:4,"NBA G League":5,"歐洲聯賽":6,NBA:7}[league]||0);
const leagueConfig={
  "SBL／半職業":{market:54},"台灣職業":{market:67},"韓國職業":{market:74},
  "日本職業":{market:78},CBA:{market:79},"NBA G League":{market:80},
  "歐洲聯賽":{market:85},NBA:{market:90}
};

function average(stats){return Math.round(Object.values(stats).reduce((sum,value)=>sum+value,0)/8)}
function careerContext(player,{ironman=false}={}){
  const context={
    p:player,
    L:{shoot:"投射",finish:"終結",handle:"控球",pass:"傳球",defense:"防守",rebound:"籃板",ath:"體能",iq:"球商"},
    LEAGUE_CFG:leagueConfig,
    overall:()=>average(context.p.stats),
    scheduledGamesForSeason:league=>({"SBL／半職業":30,"台灣職業":36,"韓國職業":54,"日本職業":60,CBA:46,"NBA G League":50,"歐洲聯賽":44,NBA:82}[league]||36),
    leagueMarketRank:leagueRank,
    hasTitle:title=>ironman&&title==="ironman",
    logIt:()=>{}
  };
  vm.runInNewContext(read("js/career/ability-profile.js"),context);
  vm.runInNewContext(read("js/career/contract-engine.js"),context);
  vm.runInNewContext(read("js/career/retirement-engine.js"),context);
  context.collegeReturnMarketBonus=()=>0;
  return context;
}

test("age 50 is not a standard-contract or NBA-performance cutoff",()=>{
  const stats={shoot:96,finish:96,handle:96,pass:96,defense:96,rebound:96,ath:99,iq:96};
  const context=careerContext({
    path:"NBA",age:50,year:2065,seed:"VETERAN1",stats,caps:{...stats},health:100,durability:99,bodyLoad:8,
    injury:null,injuryHistory:[],seasonStats:{games:70,scheduledGames:82,mins:31,pts:24,ast:7,reb:8,stl:1.5,blk:1},
    lastSeasonAwards:[],careerMVP:0,careerFirstTeam:0,careerAllStar:0,roleState:{current:"core"},rep:20
  });
  assert.equal(context.canReceiveStandardContract("NBA",96,true),true);
  assert.equal(context.nbaPerformanceOfferKind(96),"standard");
  const age50=context.veteranContinuationProfile("NBA",true);
  context.p.age=55;
  const age55=context.veteranContinuationProfile("NBA",true);
  assert.equal(age55.score,age50.score);
  assert.equal(age55.eligible,true);

  context.p.stats={shoot:82,finish:62,handle:72,pass:74,defense:64,rebound:60,ath:42,iq:78};
  context.p.health=58;context.p.durability=48;context.p.bodyLoad=82;
  context.p.seasonStats={games:18,scheduledGames:82,mins:11,pts:5,ast:2,reb:2,stl:.3,blk:.1};
  assert.equal(context.canReceiveStandardContract("NBA",96,true),false);
});

test("age changes veteran contract risk, not the player's continuation score",()=>{
  const stats={shoot:88,finish:86,handle:84,pass:88,defense:87,rebound:82,ath:86,iq:91};
  const context=careerContext({
    path:"NBA",age:35,year:2050,seed:"VETERAN2",stats,caps:{...stats},health:96,durability:91,bodyLoad:22,
    injury:null,injuryHistory:[],seasonStats:{games:68,scheduledGames:82,mins:27,pts:19,ast:6,reb:6,stl:1.2,blk:.6},
    lastSeasonAwards:[],careerMVP:0,careerFirstTeam:0,careerAllStar:0,roleState:{current:"starter"},rep:12
  });
  const readiness35=context.veteranContinuationProfile("NBA",true),risk35=context.veteranContractRiskProfile("NBA",true);
  context.p.age=50;
  const readiness50=context.veteranContinuationProfile("NBA",true),risk50=context.veteranContractRiskProfile("NBA",true);
  assert.equal(readiness50.score,readiness35.score);
  assert.equal(readiness50.eligible,readiness35.eligible);
  assert.ok(risk50.salaryFactor<risk35.salaryFactor);
  assert.ok(risk50.guaranteeRate<risk35.guaranteeRate);
  assert.ok(risk50.teamPatience<risk35.teamPatience);
});

test("ordinary and physical-outlier veterans receive different 49-to-55 markets",()=>{
  const leagues=["SBL／半職業","台灣職業","韓國職業","日本職業","CBA","NBA G League","歐洲聯賽","NBA"];
  const ordinaryStats={shoot:78,finish:72,handle:70,pass:72,defense:74,rebound:70,ath:68,iq:80};
  const freakStats={shoot:99,finish:99,handle:99,pass:99,defense:99,rebound:99,ath:99,iq:99};
  const ordinary=careerContext({
    path:"台灣職業",age:49,year:2060,seed:"VETERAN3",stats:ordinaryStats,caps:{...ordinaryStats},health:85,durability:72,bodyLoad:55,
    injury:null,injuryHistory:[],seasonPlan:"balance",seasonStats:{games:28,scheduledGames:36,mins:20,pts:10,ast:3,reb:4,stl:.7,blk:.3},
    lastSeasonAwards:[],careerMVP:0,careerFirstTeam:0,careerAllStar:0,roleState:{current:"worker"},rep:4
  });
  const freak=careerContext({
    path:"NBA",age:49,year:2060,seed:"VETERAN4",stats:freakStats,caps:{...freakStats},health:100,durability:99,bodyLoad:12,
    injury:null,injuryHistory:[],seasonPlan:"care",seasonStats:{games:76,scheduledGames:82,mins:31,pts:25,ast:8,reb:8,stl:1.5,blk:1},
    lastSeasonAwards:[],careerMVP:1,careerFirstTeam:2,careerAllStar:5,roleState:{current:"core"},rep:18
  },{ironman:true});

  const simulate=(context,kind)=>{
    const rows=[];
    for(let age=49;age<=55;age++){
      context.p.age=age;context.p.year=2060+(age-49);
      if(kind==="ordinary"){
        context.p.health=Math.max(55,85-(age-49)*5);context.p.durability=Math.max(50,72-(age-49)*3);context.p.bodyLoad=Math.min(82,55+(age-49)*5);
        context.p.seasonStats={games:Math.max(12,28-(age-49)*3),scheduledGames:36,mins:Math.max(10,20-(age-49)*1.5),pts:Math.max(4,10-(age-49)),ast:2,reb:3,stl:.4,blk:.2};
      }
      context.applyAging();
      const market=leagues.filter(league=>context.canReceiveStandardContract(league,90,false));
      rows.push({age,ovr:context.overall(),market});
    }
    return rows;
  };
  const ordinaryRows=simulate(ordinary,"ordinary"),freakRows=simulate(freak,"freak");
  assert.ok(ordinaryRows[0].market.length>ordinaryRows.at(-1).market.length);
  assert.equal(ordinaryRows.at(-1).market.length,0);
  assert.ok(freakRows.at(-1).ovr>ordinaryRows.at(-1).ovr);
  assert.ok(freakRows.at(-1).market.includes("台灣職業"));
  assert.ok(freakRows.at(-1).market.length>0);
});

test("last dance is available only as a post-market career choice without an upper age cap",()=>{
  const context={p:{
    path:"NBA",age:55,year:2070,lastDanceUsed:false,lastDanceActive:false,careerGames:600,
    careerMVP:0,careerFirstTeam:0,championships:0,nationalCaps:0,seasonHistory:[]
  }};
  vm.runInNewContext(read("js/career/retirement-engine.js"),context);
  context.isProfessionalPathValue=path=>["SBL／半職業","台灣職業","NBA"].includes(path);
  assert.equal(context.canOfferHomecomingLastDance(),true);
  context.p.lastDanceActive=true;context.isProPath=()=>true;
  let reason="";context.retireCareer=value=>{reason=value};
  assert.equal(context.maybeForceRetire(),true);
  assert.equal(context.p.age,56);
  assert.match(reason,/最後一舞/);
  assert.doesNotMatch(read("js/career/contract-engine.js"),/50歲後不再有球隊提供|expired_by_age/);
  assert.doesNotMatch(read("js/career/retirement-engine.js"),/p\.age<=50|50歲告別特例/);
});
