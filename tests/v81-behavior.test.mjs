import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const runContract=(context)=>{vm.runInNewContext(read("js/career/ability-profile.js"),context);vm.runInNewContext(read("js/career/contract-engine.js"),context)};

test("a team that misses the regular-season cutoff cannot become playoff champion",()=>{
  const context={p:{path:"SBL／半職業"},window:{BL_LEAGUE_CFG:{},BL_STUDENT_SCHEDULES:{}}};
  vm.runInNewContext(read("js/career/career-engine.js"),context);
  context.isProPath=()=>true;
  context.isCollegePath=()=>false;
  const missed=[{name:"例行賽",finish:"未晉級季後賽"}];
  assert.equal(context.tournamentFinishWithQualification(99,"季後賽",missed),"未晉級");
  assert.equal(context.finishReward("未晉級",1),0);
  assert.equal(context.tournamentFinishWithQualification(99,"年度盃賽",missed),"冠軍");
});

test("a respected veteran can take one hometown last dance after age 50",()=>{
  const context={p:{
    path:"NBA",age:50,year:2058,lastDanceUsed:false,lastDanceActive:false,careerGames:320,
    careerMVP:0,careerFirstTeam:0,championships:0,nationalCaps:0,seasonHistory:[]
  }};
  vm.runInNewContext(read("js/career/retirement-engine.js"),context);
  context.isProfessionalPathValue=path=>["SBL／半職業","台灣職業","NBA"].includes(path);
  assert.equal(context.canOfferHomecomingLastDance(),true);
  context.p.lastDanceUsed=true;
  assert.equal(context.canOfferHomecomingLastDance(),false);

  context.p.lastDanceUsed=false;context.p.lastDanceActive=true;
  context.isProPath=()=>true;
  let retired=false;
  context.retireCareer=()=>{retired=true};
  assert.equal(context.maybeForceRetire(),true);
  assert.equal(context.p.age,51);
  assert.equal(context.p.year,2059);
  assert.equal(retired,true);
});

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
  runContract(context);
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
  const context={p:{age:24,careerSeason:2,seasonHistory:[{path:"台灣職業"}],seasonStats:{games:24,mins:12,pts:7,ast:2,reb:3}}};
  runContract(context);
  context.isProPath=()=>true;
  context.scheduledGamesForSeason=()=>36;
  context.overall=()=>46;
  context.scoutingScore=()=>46;

  assert.equal(context.leagueRosterOverallFloor("SBL／半職業"),45);
  assert.equal(context.youngMarketBridgeEligible(),true);
  assert.equal(context.collegeDraftContractYears("taiwan",1),2);
  assert.equal(context.collegeDraftContractYears("nba",1),2);
  assert.equal(context.collegeDraftContractYears("gleague",3),1);
  assert.equal(context.collegeDraftContractYears("sbl",3),1);

  context.p.path="台灣職業";
  context.LEAGUE_CFG={"台灣職業":{market:67}};
  context.collegeReturnMarketBonus=()=>0;
  context.overall=()=>52;
  assert.equal(context.canReceiveStandardContract("台灣職業",59,true),true);

  context.p.age=25;
  assert.equal(context.leagueRosterOverallFloor("SBL／半職業"),45);
  context.p.age=26;
  assert.equal(context.leagueRosterOverallFloor("SBL／半職業"),45);
  context.p.careerSeason=4;
  assert.equal(context.youngMarketBridgeEligible(),false);
  assert.equal(context.canReceiveStandardContract("台灣職業",59,true),false);
});

test("college entry is stricter while productive rookies keep a fair renewal runway",()=>{
  const context={p:{
    path:"台灣職業",age:28,year:2032,careerSeason:3,seasonHistory:[],
    seasonStats:{games:28,mins:14,pts:8,ast:3,reb:3,stl:.7,blk:.2}
  }};
  runContract(context);
  context.LEAGUE_CFG={"台灣職業":{market:67}};
  context.collegeReturnMarketBonus=()=>0;
  context.scheduledGamesForSeason=()=>36;
  context.overall=()=>50;
  assert.equal(context.canReceiveStandardContract("台灣職業",54,true),true);

  context.p.seasonStats={games:4,mins:3,pts:1,ast:.4,reb:.6};
  assert.equal(context.canReceiveStandardContract("台灣職業",54,true),false);

  const routes=Object.fromEntries(context.collegeDraftRoutes().map(route=>[route.id,route]));
  assert.deepEqual([routes.taiwan.minScore,routes.taiwan.minOvr],[48,46]);
  assert.deepEqual([routes.sbl.minScore,routes.sbl.minOvr],[40,40]);
});

test("an OVR 82 European standout enters the NBA pathway",()=>{
  const context={p:{
    path:"歐洲聯賽",age:27,contract:{continentalCup:"EuroLeague"},lastSeasonAwards:[],
    seasonStats:{games:30,mins:22,pts:15,ast:5,reb:4,stl:1,blk:.3}
  }};
  runContract(context);
  context.overall=()=>82;
  assert.equal(context.nbaPerformanceOfferKind(84),"two-way");
  context.overall=()=>84;
  assert.equal(context.nbaPerformanceOfferKind(86),"standard");
});

test("late-career European seasons do not reopen an NBA-Europe loop",()=>{
  const context={p:{
    path:"歐洲聯賽",age:42,seasonHistory:[{path:"NBA"}],contract:{continentalCup:"EuroLeague"},lastSeasonAwards:[],
    seasonStats:{games:30,mins:22,pts:15,ast:5,reb:4,stl:1,blk:.3}
  }};
  runContract(context);
  context.overall=()=>89;
  context.scoutingScore=()=>90;
  assert.equal(context.nbaPathwayOfferKind(90),"");
});

test("a regular season key battle carries team, rival, contract and injury context",()=>{
  const context={p:{
    year:2039,age:27,path:"NBA",team:"測試隊",seed:"KEYB0001",
    contract:{remaining:1,terminated:false},
    seasonHistory:[{tourneys:[{name:"季後賽",finish:"四強",reward:2}]}],
    careerCast:{rival:{name:"宿敵甲",respect:42}},
    teamWorld:{direction:"contend",directionLabel:"爭冠窗口"},
    injury:{name:"膝蓋扭傷",level:"中傷"},bodyLoad:64
  }};
  context.isProPath=()=>true;
  context.ensureV8CareerState=()=>{};
  context.ensureV8TeamWorld=()=>context.p.teamWorld;
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  const key=context.buildSeasonKeyBattle();
  assert.equal(key.kind,"seasonKeyBattle");
  assert.match(key.desc,/合約年/);
  assert.match(key.desc,/膝蓋扭傷/);
  assert.equal(key.keyBattle.opponent,"宿敵甲");
  assert.equal(key.keyBattle.contractYear,true);
});

test("key battle previews compare the same team and personal outcomes for every strategy",()=>{
  const context={p:{year:2039,age:27,path:"NBA",team:"測試隊",seed:"KEYB0002",confidence:62,clutch:74,rep:12,seasonEventSuccess:2,bodyLoad:20,teamWorld:{direction:"contend"}}};
  context.overall=()=>78;
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  const attack=context.seasonKeyBattlePreview("attack"),team=context.seasonKeyBattlePreview("team"),manage=context.seasonKeyBattlePreview("manage");
  for(const preview of [attack,team,manage]){
    assert.ok(preview.min<=preview.expected&&preview.expected<=preview.max);
    assert.ok(preview.teamWinChance>=0&&preview.teamWinChance<=100);
    assert.ok(preview.signatureChance>=0&&preview.signatureChance<=100);
    assert.ok(preview.contributionChance>=preview.signatureChance);
  }
  assert.ok(attack.expected>team.expected);
  assert.ok(manage.expected<team.expected);
  assert.ok(attack.max-attack.min>team.max-team.min);
  assert.ok(team.max-team.min>manage.max-manage.min);
  assert.ok(team.teamWinChance>attack.teamWinChance&&attack.teamWinChance>manage.teamWinChance);
  assert.ok(attack.signatureChance>=team.signatureChance&&team.signatureChance>=manage.signatureChance);
  for(const preview of [attack,team,manage]){
    const html=context.seasonKeyBattlePreviewHTML(preview);
    assert.match(html,/球隊勝率/);
    assert.match(html,/代表作/);
    assert.match(html,/關鍵貢獻以上/);
    assert.doesNotMatch(html,/預估表現值/);
  }
});

test("key battle objectives use league-relative performance without treating load control as failure",()=>{
  const context={p:{year:2026,age:16,path:"HBL",team:"測試高中",seed:"KEYB0003",confidence:50,clutch:50,rep:0,seasonEventSuccess:0,bodyLoad:0,teamWorld:{direction:"development"}}};
  context.overall=()=>42;
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  const highSchoolAttack=context.seasonKeyBattlePreview("attack"),highSchoolTeam=context.seasonKeyBattlePreview("team"),highSchoolManage=context.seasonKeyBattlePreview("manage");
  assert.ok(highSchoolAttack.contributionChance>0&&highSchoolAttack.contributionChance<100);
  assert.ok(highSchoolTeam.teamWinChance>highSchoolAttack.teamWinChance);
  assert.ok(highSchoolAttack.teamWinChance>highSchoolManage.teamWinChance);
  const managedObjective=context.seasonKeyBattleObjective("manage",40),missedSignature=context.seasonKeyBattleObjective("attack",73),madeSignature=context.seasonKeyBattleObjective("attack",74);
  assert.equal(managedObjective.label,"完成負荷控制");assert.equal(managedObjective.success,true);
  assert.equal(missedSignature.label,"未能打出代表作");assert.equal(missedSignature.success,false);
  assert.equal(madeSignature.label,"打出代表作");assert.equal(madeSignature.success,true);
  assert.equal(context.seasonKeyBattleObjective("team",80,false).label,"未能守住關鍵戰");
  assert.equal(context.seasonKeyBattleObjective("team",40,true).label,"守住關鍵戰");

  context.p.path="CBA";context.p.clutch=94;context.p.rep=100;context.p.teamWorld.direction="contend";context.overall=()=>81;
  const veteranAttack=context.seasonKeyBattlePreview("attack"),veteranTeam=context.seasonKeyBattlePreview("team");
  assert.ok(veteranAttack.signatureChance<100);
  assert.ok(veteranTeam.teamWinChance>veteranAttack.teamWinChance&&veteranTeam.teamWinChance<=90);
});

test("an average HBL player has a real but bounded signature-game chance when going all in",()=>{
  const context={p:{path:"HBL",pos:"PG",stats:{shoot:44,finish:44,handle:44,pass:44,defense:44,rebound:44,ath:44,iq:44},confidence:41,clutch:50,rep:-5,seasonEventSuccess:4,bodyLoad:20,teamWorld:{direction:"turmoil"}}};
  context.overall=()=>44;
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  const attack=context.seasonKeyBattlePreview("attack"),team=context.seasonKeyBattlePreview("team"),manage=context.seasonKeyBattlePreview("manage");
  assert.ok(attack.signatureChance>=15&&attack.signatureChance<=35);
  assert.ok(team.signatureChance>0&&team.signatureChance<attack.signatureChance);
  assert.ok(manage.signatureChance<=team.signatureChance);
  assert.ok(attack.contributionChance>attack.signatureChance);
});

test("load control resolves its health goal separately from court performance",()=>{
  let resultHTML="";
  const context={
    p:{year:2027,age:17,path:"HBL",team:"測試高中",seed:"KEYB0004",confidence:41,clutch:50,rep:-5,seasonEventSuccess:0,fatigue:20,bodyLoad:20,seasonInjuryExtra:4,teamWorld:{direction:"turmoil"},careerCast:{},pendingSeasonKeyBattle:{title:"排名戰",background:"season",opponent:"宿敵"}},
    overall:()=>44,RNG:()=>()=>.5,isProPath:()=>false,recordV8Story:()=>{},escapeFeedText:value=>String(value),finishSpecialEvent:html=>{resultHTML=html}
  };
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  context.finishSpecialEvent=html=>{resultHTML=html};
  context.resolveSeasonKeyBattle("manage");
  assert.equal(context.p.seasonKeyBattleResult.objective,"完成負荷控制");
  assert.equal(context.p.seasonKeyBattleResult.objectiveSuccess,true);
  assert.equal(context.p.seasonKeyBattleResult.performanceOutcome,context.p.seasonKeyBattleResult.outcome);
  assert.equal(context.p.fatigue,16);
  assert.equal(context.p.bodyLoad,12);
  assert.equal(context.p.seasonInjuryExtra,0);
  assert.match(resultHTML,/完成負荷控制/);
  assert.match(resultHTML,/場上表現/);
});

test("team-first strategy can win even when personal performance is below the contribution line",()=>{
  let resultHTML="";
  const context={
    p:{year:2027,age:17,path:"HBL",team:"測試高中",seed:"KEYB0005",pos:"PG",stats:{shoot:44,finish:44,handle:44,pass:44,defense:44,rebound:44,ath:44,iq:44},confidence:50,clutch:50,rep:0,seasonEventSuccess:0,fatigue:0,bodyLoad:0,seasonInjuryExtra:0,teamWorld:{direction:"development"},careerCast:{},pendingSeasonKeyBattle:{title:"排名戰",background:"season",opponent:"宿敵"}},
    overall:()=>44,RNG:()=>()=>0,isProPath:()=>false,recordV8Story:()=>{},escapeFeedText:value=>String(value),finishSpecialEvent:html=>{resultHTML=html}
  };
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  context.finishSpecialEvent=html=>{resultHTML=html};
  context.resolveSeasonKeyBattle("team");
  assert.ok(context.p.seasonKeyBattleResult.score<62);
  assert.equal(context.p.seasonKeyBattleResult.teamWon,true);
  assert.equal(context.p.seasonKeyBattleResult.objective,"守住關鍵戰");
  assert.equal(context.p.seasonKeyBattleResult.objectiveSuccess,true);
  assert.match(resultHTML,/守住關鍵戰/);
  assert.match(resultHTML,/球隊仍贏下關鍵戰，但你的場上表現是/);
  assert.doesNotMatch(resultHTML,/場上表現為.*球隊守住關鍵戰/);
});

test("event choices keep the same player-facing order for the same save state",()=>{
  const context={p:{seed:"ORDER0001",year:2034,eventIndex:2}};
  vm.runInNewContext(read("js/events/event-engine.js"),context);
  const options=[["高風險打法","提高上限","risk"],["穩健打法","維持平衡","normal"],["保守打法","降低風險","safe"]];
  const first=context.mapEventOptions(options).map(row=>row.slice(0,2));
  const second=context.mapEventOptions(options).map(row=>row.slice(0,2));
  assert.deepEqual(second,first);
});

test("a key battle market result changes scouting without affecting old saves",()=>{
  const context={p:{
    path:"NBA",age:27,stats:{shoot:60,finish:60,pass:60,handle:60,defense:60,rebound:60,ath:60,iq:60},
    caps:{shoot:60,finish:60,pass:60,handle:60,defense:60,rebound:60,ath:60,iq:60},growth:70,
    seasonStats:{pts:15,ast:4,reb:4,stl:1,blk:.2},lastSeasonAwards:[],injuryHistory:[],injury:null,
    rep:0,conductMarketPenalty:0,genius:false,seasonHistory:[]
  },overall:()=>65,isProPath:()=>true,leagueStrength:()=>1,LEAGUE_CFG:{NBA:{exposure:10}},seedMarketBonus:()=>0,confidencePerformanceMod:()=>0,hasTitle:()=>false};
  runContract(context);
  const base=context.scoutingScore();
  context.p.seasonHistory=[{keyBattle:{marketDelta:5}}];
  assert.equal(context.scoutingScore()-base,5);
});

test("late-career NBA return stays closed even after older NBA seasons leave the recent-history window",()=>{
  const context={p:{
    path:"歐洲聯賽",age:40,seasonHistory:[{year:2035,path:"NBA"},{year:2036,path:"歐洲聯賽"},{year:2037,path:"歐洲聯賽"},{year:2038,path:"歐洲聯賽"}],
    contract:{continentalCup:"EuroLeague"},lastSeasonAwards:[],seasonStats:{games:30,mins:24,pts:18,ast:6,reb:5,stl:1,blk:.4}
  }};
  runContract(context);
  context.overall=()=>90;
  context.scoutingScore=()=>92;
  assert.equal(context.nbaPathwayOfferKind(92),"");
});

test("an ordinary 47-year-old NBA rotation player cannot bypass veteran decline",()=>{
  const context={p:{
    path:"NBA",age:47,contract:{type:"標準合約"},careerMVP:0,careerFirstTeam:0,lastSeasonAwards:[],
    seasonStats:{games:50,mins:22,pts:12,ast:4,reb:4,stl:1,blk:.3}
  }};
  runContract(context);
  context.overall=()=>80;
  assert.equal(context.nbaPerformanceOfferKind(84),"");

  context.p.careerMVP=2;
  context.p.seasonStats={games:60,mins:28,pts:18,ast:6,reb:6,stl:1.4,blk:.5};
  context.overall=()=>90;
  assert.equal(context.nbaPerformanceOfferKind(92),"standard");
});

test("a productive 48-year-old gets a continuous lower-league market instead of an age cutoff",()=>{
  const context={p:{
    path:"NBA",age:48,year:2056,careerMVP:0,careerFirstTeam:0,lastSeasonAwards:[],
    stats:{ath:70},health:85,durability:70,bodyLoad:55,injury:null,injuryHistory:[],
    seasonStats:{games:30,scheduledGames:48,mins:18,pts:8,ast:2,reb:3,stl:.5,blk:.2}
  }};
  runContract(context);
  context.LEAGUE_CFG={
    "SBL／半職業":{market:54},"台灣職業":{market:67},"韓國職業":{market:74},
    "日本職業":{market:78},CBA:{market:79},"NBA G League":{market:80},
    "歐洲聯賽":{market:85},NBA:{market:90}
  };
  context.collegeReturnMarketBonus=()=>0;
  context.overall=()=>78;
  assert.equal(context.canReceiveStandardContract("SBL／半職業",90,false),true);
  assert.equal(context.canReceiveStandardContract("台灣職業",90,false),true);
  assert.equal(context.canReceiveStandardContract("韓國職業",90,false),true);
  assert.equal(context.canReceiveStandardContract("日本職業",90,false),true);
  assert.equal(context.canReceiveStandardContract("CBA",90,false),true);
  assert.equal(context.canReceiveStandardContract("歐洲聯賽",90,false),false);
  assert.equal(context.canReceiveStandardContract("NBA",90,false),false);
  assert.equal(context.gLeaguePathwayEligible(90),true);

  const candidates=[
    {league:"SBL／半職業",team:"SBL",salary:100},
    {league:"台灣職業",team:"T1",salary:500},
    {league:"韓國職業",team:"KBL",salary:1500},
    {league:"日本職業",team:"B.League",salary:1800}
  ];
  context.leagueMarketRank=league=>({"SBL／半職業":1,"台灣職業":2,"韓國職業":3,"日本職業":4}[league]||0);
  assert.equal(typeof context.ensureMinimumMarketOffers,"undefined");
  assert.doesNotMatch(read("js/career/contract-engine.js"),/ensureMinimumMarketOffers/);
});

test("European schedule integrity follows the stored domestic league and continental cup",()=>{
  const context={p:{path:"SBL／半職業"},window:{}};
  vm.runInNewContext(read("data/teams.js"),context);
  vm.runInNewContext(read("data/leagues.js"),context);
  vm.runInNewContext(read("js/career/career-engine.js"),context);
  assert.equal(context.seasonScheduleRangeForRecord({path:"歐洲聯賽",competition:"法國 LNB Élite",continentalCup:"EuroCup"}).join(","),"44,44");
  assert.equal(context.seasonScheduleRangeForRecord({path:"歐洲聯賽",competition:"西班牙 Liga ACB",continentalCup:"EuroLeague"}).join(","),"52,52");
  assert.ok(context.awardLeaguePrefixesForSeason({path:"歐洲聯賽",competition:"希臘 GBL",continentalCup:"EuroLeague"}).includes("希臘 GBL＋EuroLeague"));
  assert.ok(context.awardLeaguePrefixesForSeason({path:"歐洲聯賽",competition:"希臘 GBL",continentalCup:"EuroLeague"}).includes("歐洲聯賽"));
  assert.equal(context.awardDifficultyForSeasonRecord({path:"歐洲聯賽",competition:"西班牙 Liga ACB",continentalCup:"EuroCup"}),9);
  assert.equal(context.awardDifficultyForSeasonRecord({path:"歐洲聯賽",competition:"西班牙 Liga ACB",continentalCup:"EuroLeague"}),10);
  const borderline={games:44,scheduledGames:44,pts:30,ast:8,reb:6,stl:1,blk:.5,fg:50};
  assert.equal(context.professionalAwardEvaluation(borderline,{difficulty:9}).eligible["年度第一隊"],true);
  assert.equal(context.professionalAwardEvaluation(borderline,{difficulty:10}).eligible["年度第一隊"],false);
  const oldEuropeanSeason={...borderline,year:2041,path:"歐洲聯賽",competition:"西班牙 Liga ACB",continentalCup:"EuroCup",seasonAwards:["西班牙 Liga ACB＋EuroCup 年度第一隊"]};
  assert.deepEqual(Array.from(context.careerAwardIntegrityErrors({season_history:[oldEuropeanSeason],awards:[{year:2041,name:"西班牙 Liga ACB＋EuroCup 年度第一隊"}],career_data:{}})),[]);
  const impossible=context.careerAwardIntegrityErrors({season_history:[{...oldEuropeanSeason,awardAudit:{difficulty:9,schedule:44,defense:70,previousDPOY:0,dpoyRoll:.5,champion:false,league:"西班牙 Liga ACB＋EuroCup"}}],awards:[{year:2041,name:"西班牙 Liga ACB＋EuroCup 年度MVP"}],career_data:{}});
  assert.match(String(impossible[0]),/與該季表現不一致/);
  assert.match(read("js/leaderboard/leaderboard-api.js"),/seasonScheduleRangeForRecord\(season\)/);
  assert.match(read("js/leaderboard/leaderboard-api.js"),/storedTournamentMatch/);
  assert.match(read("js/career/career-engine.js"),/storedMatch&&!season\.awardAudit/);
});

test("a decorated senior national-team career reaches the national Hall of Fame ballot",()=>{
  const internationalHistory=Array.from({length:6},(_,index)=>({
    year:2037+index*2,level:"SENIOR",event:`成人國際賽 ${index+1}`,finish:index===0?"冠軍":"四強",
    games:index===0?8:7,mins:32,pts:28.8,reb:5.9,ast:4.7,stl:1.2,blk:.4,fg:52,three:41
  }));
  const context={
    p:{name:"測試球員",seed:"AAAAAAEN",year:2060,nationalCaps:6,careerNationalAwards:3,internationalHistory,seasonHistory:[],teamsPlayed:[]},
    calcCareerRating:()=>105000,careerLeagueProfiles:()=>({}),hasTitle:()=>false,pushNews:()=>{},overall:()=>90,
    RNG:()=>()=>.5,ri:()=>0,document:{addEventListener:()=>{}}
  };
  vm.runInNewContext(read("js/ui/retirement-view.js"),context);
  context.evaluateHallOfFame();
  const ballot=context.p.hallVotes.find(row=>row.league==="國家隊名人堂");
  assert.ok(ballot);
  assert.equal(ballot.nationalGames,43);
  assert.equal(ballot.inducted,true);
  assert.ok(context.p.hallOfFame.includes("國家隊名人堂"));
});

test("the full career poster separates GP and PTS and uses the full canvas width",()=>{
  const source=read("js/ui/retirement-view.js");
  assert.match(source,/const x1=590,x2=908,x3=1226,x4=W-1,yBottom=710/);
  assert.match(source,/const hx=\[618,740,784,821,851,878,904\]/);
  assert.match(source,/rule\(1254,52,x4-26,52\)/);
});

test("loading an existing retired save reapplies the current Hall of Fame rules",()=>{
  const source=read("js/storage.js");
  assert.match(source,/if\(p\.retired\|\|p\.stage==="retired"\)[\s\S]*?evaluateCareerLegacyTitles\(\);[\s\S]*?evaluateHallOfFame\(\);/);
});

test("V8.1.1 role evaluation recognizes non-traditional player identities",()=>{
  const context={p:{pos:"PG",stats:{rebound:92,ath:86,defense:82,handle:66,pass:64,iq:62,shoot:58,finish:60}}};
  runContract(context);
  assert.equal(context.playerRoleProfile().id,"rebounding_guard");

  context.p={pos:"C",stats:{pass:94,iq:90,handle:72,rebound:78,defense:60,ath:62,shoot:58,finish:66}};
  assert.equal(context.playerRoleProfile().id,"point_center");
});

test("V8.1.1 derived abilities create readable specialties without new saved skills",()=>{
  const shooter={pos:"SF",stats:{shoot:92,finish:66,handle:82,pass:64,defense:70,rebound:55,ath:78,iq:84},caps:{shoot:96,handle:90,iq:92}};
  const postBig={pos:"C",stats:{shoot:54,finish:91,handle:58,pass:68,defense:86,rebound:90,ath:82,iq:76},caps:{finish:96,rebound:94,defense:92}};
  const context={p:shooter};
  vm.runInNewContext(read("js/career/ability-profile.js"),context);
  const shooterProfile=context.v811AbilityProfile(shooter),bigProfile=context.v811AbilityProfile(postBig);
  assert.ok(shooterProfile.shooting.threePoint>=80);
  assert.ok(shooterProfile.traits.some(item=>item.id==="three_point_spacer"));
  assert.ok(bigProfile.finishing.post>=80);
  assert.ok(bigProfile.traits.some(item=>item.id==="post_finisher"));
  assert.equal(context.v811SeasonContext(postBig,bigProfile).situation,"對上小陣容時，低位、籃下與內線錯位能放大價值");
  assert.equal(Object.hasOwn(shooter,"derivedAbilities"),false);
  assert.ok(shooterProfile.growthDirection.label);
});

test("testing free agency preserves the known mother-team renewal anchor",()=>{
  const base={league:"NBA",team:"母隊",salary:3000,years:2,role:"先發球員",teamDirection:"contend",type:"先發合約"};
  const context={
    p:{age:30,path:"NBA",team:"母隊"}
  };
  runContract(context);
  context.finalizeContract=contract=>contract;
  context.leagueMarketRank=league=>({SBL:1,"台灣職業":2,NBA:7}[league]||0);

  for(const offers of [[],[{league:"台灣職業",salary:800}],[{league:"NBA",salary:3400}]]){
    const result=context.marketReturnTerms(base,offers,"NBA");
    assert.equal(JSON.stringify(result.offer),JSON.stringify(base));
    assert.notEqual(result.mode,"discount");
    assert.notEqual(result.mode,"cold");
  }
});

test("old saves without injury history can still open the contract market",()=>{
  const context={
    p:{path:"NBA",age:37,year:2047,seed:"12345678",seedTier:"S",stats:{shoot:81,finish:78,handle:76,pass:74,defense:80,rebound:70,ath:72,iq:79},caps:{shoot:86,finish:84,handle:82,pass:80,defense:85,rebound:78,ath:80,iq:84},seasonStats:{games:48,mins:24,pts:14,ast:4,reb:5,stl:1,blk:.5},lastSeasonAwards:[],seasonHistory:[],rep:0,growth:75,injury:null,genius:false},
    overall:()=>81,isProPath:()=>true,leagueStrength:()=>7,LEAGUE_CFG:{NBA:{market:90,exposure:10}},seedMarketBonus:()=>0,confidencePerformanceMod:()=>0,hasTitle:()=>false
  };
  runContract(context);
  assert.doesNotThrow(()=>context.scoutingScore());
});

test("contract cards keep role data separate from derived ability data",()=>{
  const context={
    p:{path:"NBA",age:37,year:2047,seed:"12345678",pos:"PG",stats:{shoot:81,finish:78,handle:76,pass:74,defense:80,rebound:70,ath:72,iq:79},caps:{shoot:86,finish:84,handle:82,pass:80,defense:85,rebound:78,ath:80,iq:84},injury:null,health:96,seasonHistory:[],roleState:{}},
    LEAGUE_CFG:{NBA:{label:"NBA",exposure:10,trait:"頂級職業聯盟"}},V8_TEAM_DIRECTIONS:[],
    moneyText:value=>String(value),contractCompetitionLabel:()=>"NBA",teamDirectionEffect:()=>"球隊評估中",leagueMarketRank:()=>7
  };
  runContract(context);
  const html=context.contractOfferHTML({league:"NBA",team:"測試隊",salary:3000,bonus:0,years:1,type:"標準合約",role:"輪替球員",teamDirection:"playoff",guaranteeRate:.66,guaranteeLabel:"66%保障",guaranteedTotal:1980,teamPatienceLabel:"逐季觀察"});
  assert.match(html,/成長方向：/);
  assert.match(html,/66%保障/);
  assert.match(html,/保障金額 1,980萬/);
  assert.match(html,/老將市場評估：逐季觀察/);
  assert.doesNotMatch(html,/undefined/);
});

test("veteran minutes respond to readiness instead of age alone",()=>{
  const context={
    p:{
      path:"NBA",age:41,stats:{ath:86},durability:92,health:96,bodyLoad:18,
      seasonStats:{games:48,scheduledGames:50,mins:26,pts:18,ast:6,reb:6,stl:1.2,blk:.5},
      roleState:{current:"core"},injury:null,rep:12
    },
    isProPath:()=>true,overall:()=>90,leagueTarget:()=>80
  };
  vm.runInNewContext(read("js/career/retirement-engine.js"),context);
  const ready=context.veteranMinutesProfile();
  assert.equal(ready.label,"正常主力輪替");

  context.p.stats.ath=55;context.p.durability=50;context.p.health=60;context.p.bodyLoad=82;
  context.p.seasonStats={games:12,scheduledGames:50,mins:12,pts:6,ast:1,reb:2,stl:.2,blk:0};
  context.p.roleState={current:"garbage"};context.p.injury={level:"大傷"};
  const burdened=context.veteranMinutesProfile();
  assert.equal(burdened.label,"身體狀態管理");
  assert.ok(ready.cap>burdened.cap);
  assert.ok(ready.penalty<burdened.penalty);
});

test("a healthy 50-year-old physical outlier is not age-capped",()=>{
  const context={
    p:{path:"NBA",age:50,stats:{ath:99},durability:99,health:100,bodyLoad:8,injury:null,rep:20,roleState:{current:"core"},seasonStats:{games:50,scheduledGames:50,mins:30,pts:24,ast:7,reb:8,stl:1.4,blk:.8}},
    isProPath:()=>true,overall:()=>96,leagueTarget:()=>80
  };
  vm.runInNewContext(read("js/career/retirement-engine.js"),context);
  const profile=context.veteranMinutesProfile();
  assert.equal(profile.cap,36);
  assert.equal(profile.penalty,0);
  assert.equal(profile.label,"正常主力輪替");
});
