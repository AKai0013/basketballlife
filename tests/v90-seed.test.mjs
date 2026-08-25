import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");

function talentContext(){
  const context={};vm.createContext(context);
  vm.runInContext(read("data/seed-config.js"),context);
  vm.runInContext(read("data/seed-talent-v9.js"),context);
  context.tier=key=>vm.runInContext(`SEED_TIER_DEFS.find(item=>item.key===${JSON.stringify(key)})`,context);
  return context;
}
const average=values=>values.reduce((sum,value)=>sum+value,0)/values.length;

test("V9 talent generation is deterministic and keeps the canonical eight-ability order",()=>{
  const context=talentContext(),tier=context.tier("S+");
  const first=context.v90GenerateTalent("V90TEST1","C",tier,{shoot:-1,defense:2,rebound:2});
  const second=context.v90GenerateTalent("V90TEST1","C",tier,{shoot:-1,defense:2,rebound:2});
  assert.deepEqual(first,second);
  assert.deepEqual(Object.keys(first.stats),["shoot","finish","handle","pass","defense","rebound","ath","iq"]);
  assert.deepEqual(Object.keys(first.caps),Object.keys(first.stats));
  assert.equal(first.profile.model,"v9-specialist-1");
});

test("all seven Seed tiers use distinct total budgets and specialty ceilings",()=>{
  const context=talentContext(),tiers=["C","B","A","S","S+","SS+","SSS+"];
  const summaries=[];
  for(const key of tiers){
    const tier=context.tier(key),rows=[];
    for(let index=0;index<600;index++)rows.push(context.v90GenerateTalent(`SIM${String(index).padStart(5,"0")}`,"SF",tier,{}));
    for(const row of rows){
      const startTotal=Object.values(row.stats).reduce((a,b)=>a+b,0),capTotal=Object.values(row.caps).reduce((a,b)=>a+b,0);
      assert.ok(startTotal>=tier.v9.startAverage[0]*8&&startTotal<=tier.v9.startAverage[1]*8);
      assert.ok(capTotal>=tier.v9.capTotal[0]&&capTotal<=tier.v9.capTotal[1]);
      assert.ok(row.profile.elite.length>=tier.v9.eliteSlots[0]&&row.profile.elite.length<=tier.v9.eliteSlots[1]);
      assert.ok(row.profile.elite.every(ability=>row.caps[ability]>=tier.v9.eliteFloor));
      assert.ok(Math.max(...Object.values(row.caps))-Math.min(...Object.values(row.caps))>=(key==="SSS+"?6:7));
    }
    summaries.push({
      start:average(rows.map(row=>average(Object.values(row.stats)))),
      cap:average(rows.map(row=>average(Object.values(row.caps))))
    });
  }
  for(let index=1;index<summaries.length;index++){
    assert.ok(summaries[index].start>summaries[index-1].start);
    assert.ok(summaries[index].cap>summaries[index-1].cap);
  }
});

test("V9 Seed Map v2 reassigns every legacy elite procedural code while legacy saves keep map 1",()=>{
  const context=talentContext(),oldElite="Q0000016";
  assert.equal(context.v90SeedTierProfile(oldElite,1).key,"SSS+");
  assert.equal(context.v90SeedTierProfile(oldElite,2).key,"B");
  assert.equal(context.v90SeedTierProfile(oldElite).key,"B");
  assert.equal(vm.runInContext("V90_SEED_TIER_MAP_VERSION",context),2);
  assert.equal(vm.runInContext("V90_LEGACY_SEED_TIER_MAP_VERSION",context),1);
  const priorElite=[];
  for(let index=0;index<10000&&priorElite.length<3;index++){
    const seed=("Q"+index.toString(36).toUpperCase().padStart(7,"0")).slice(0,8);
    if(["SSS+","SS+"].includes(context.v90SeedTierProfile(seed,1).key))priorElite.push(seed);
  }
  assert.equal(priorElite.length,3);
  assert.ok(priorElite.every(seed=>context.v90SeedTierProfile(seed,2).key==="B"));
});

test("position changes archetype likelihood without locking out modern hybrid roles",()=>{
  const context=talentContext(),tier=context.tier("A"),roles={PG:new Set(),C:new Set()};
  for(let index=0;index<1200;index++){
    const seed=`ROLE${String(index).padStart(4,"0")}`;
    roles.PG.add(context.v90GenerateTalent(seed,"PG",tier,{}).profile.archetype);
    roles.C.add(context.v90GenerateTalent(seed,"C",tier,{}).profile.archetype);
  }
  assert.ok(roles.PG.has("rebounding_guard"));
  assert.ok(roles.PG.has("point_center"));
  assert.ok(roles.C.has("point_center"));
  assert.ok(roles.C.has("stretch_big"));
  assert.ok(roles.C.has("two_way_wing"));
});

test("V9 growth discounts only core and support abilities while legacy careers keep their old curve",()=>{
  const context=talentContext();
  context.skillCostModifier=()=>0;context.chainSkillDiscount=()=>0;
  vm.runInContext(read("js/career/season-engine.js"),context);
  const tier=context.tier("SSS+"),talent=context.v90GenerateTalent("COSTTEST","PG",tier,{}),core=talent.profile.core[0];
  const foundation=Object.keys(talent.profile.affinity).find(key=>talent.profile.affinity[key]==="foundation");
  const stats=Object.fromEntries(Object.keys(talent.stats).map(key=>[key,82])),caps=Object.fromEntries(Object.keys(talent.stats).map(key=>[key,90]));
  context.p={age:24,seedTier:"SSS+",stats,caps,talentProfile:talent.profile,geniusCostDiscount:0};
  const coreCost=context.pointCost(core),foundationCost=context.pointCost(foundation);
  assert.ok(coreCost<foundationCost);
  context.p={age:24,seedTier:"SSS+",stats,caps,geniusCostDiscount:0};
  assert.equal(context.pointCost(core),context.pointCost(foundation));
});

test("V9 wiring preserves legacy save fields and separates the new leaderboard era",()=>{
  const career=read("js/ui/career-view.js"),state=read("js/state.js"),retirement=read("js/ui/retirement-view.js"),board=read("js/leaderboard/leaderboard-api.js"),api=read("functions/api/[[path]].js");
  assert.match(career,/legacyWeeklyChallenge\?V90_LEGACY_SEED_TIER_MAP_VERSION:V90_SEED_TIER_MAP_VERSION/);
  assert.match(career,/legacyWeeklyChallenge\?\{\}:\{talentVersion:1,talentProfile:talent\.profile,seedTierMapVersion\}/);
  assert.match(state,/player\.seedTierMapVersion=Number\(player\.seedTierMapVersion\)===V90_SEED_TIER_MAP_VERSION/);
  assert.doesNotMatch(state,/player\.stats\s*=\s*v90GenerateTalent/);
  assert.doesNotMatch(state,/player\.caps\s*=\s*v90GenerateTalent/);
  assert.match(retirement,/profile\?\.model!=="v9-specialist-1"/);
  assert.match(retirement,/核心適性/);
  assert.match(board,/startsWith\("9\."\)\?"v9"/);
  assert.match(board,/seed_tier_map_version/);
  assert.match(api,/ranking_era==="v81"/);
  assert.match(api,/ranking_era==="v9"/);
});

test("V9 player-facing training UI keeps secondary numbers folded and removes author notes",()=>{
  const index=read("index.html"),talent=read("data/seed-talent-v9.js"),ability=read("js/career/ability-profile.js"),career=read("js/ui/career-view.js"),events=read("js/ui/event-view.js"),growth=read("js/ui/growth-preview.js"),board=read("js/leaderboard/leaderboard-api.js");
  assert.match(career,/class="trainingAbilityDetails"/);
  assert.match(career,/\["training","季初特訓"\]/);
  assert.match(ability,/details class="derivedAbilityPanel"/);
  assert.match(talent,/球員天賦/);
  assert.match(board,/排行榜暫時無法連線，請稍後再試/);
  assert.match(events,/骰子已全部揭曉，請選擇第一顆骰子要訓練的能力/);
  assert.doesNotMatch(index,/本機預覽|登入 session/);
  assert.doesNotMatch(talent,/不再平均灌入/);
  assert.doesNotMatch(ability,/不另外消耗能力點|尚未形成明確專長/);
  assert.doesNotMatch(growth,/原本逐顆玩法仍保留/);
});

test("V9 approved UI uses the production game nodes and keeps the original save fields",()=>{
  const index=read("index.html"),career=read("js/ui/career-view.js"),events=read("js/events/event-engine.js"),season=read("js/career/season-engine.js"),storage=read("js/storage.js"),growth=read("js/ui/growth-preview.js"),board=read("js/leaderboard/leaderboard-api.js"),v9css=read("css/v9-ui.css");
  assert.match(index,/<section id="game" class="hidden">/);
  assert.match(index,/class="header"/);
  assert.doesNotMatch(index,/v9UnifiedShell|v9CareerShell|v9StageLabel|v9-shell\.css|v9-event-stage\.css/);
  assert.doesNotMatch(career,/v9UnifiedShell|v9StageKicker|v9StageLabel|flowSummary/);
  assert.doesNotMatch(events,/v9ChoiceIndex|v9ChoiceBody|v9ChoiceArrow|mountV9EventStage|markV9EventStageResolved/);
  assert.match(events,/v9KeyBattleChoices/);
  assert.match(events,/specialStage national keyBattle/);
  assert.match(growth,/\n  installQuickStartLayout\(\);/);
  assert.match(growth,/className = "blQuickStartPromise"/);
  assert.match(growth,/className = "blHomeQuickPanel v9PlayerEntry"/);
  assert.match(growth,/className = "v9GameNav"/);
  assert.match(index,/css\/v9-ui\.css/);
  assert.match(v9css,/v9-court-hero-v2\.png/);
  assert.doesNotMatch(v9css,/retirement-arena\.jpg/);
  assert.match(v9css,/v9-arena-tunnel-hero\.png/);
  assert.match(v9css,/choice:not\(\[data-v9-approach\]\):before\{content:counter\(v9-choice,decimal-leading-zero\)/);
  assert.match(v9css,/v9KeyBattleChoices>\.choice:before\{content:"0"/);
  assert.match(v9css,/v9KeyBattleChoices\{counter-reset:v9-battle;display:grid!important;grid-template-columns:1fr!important/);
  assert.match(v9css,/data-v9-view="points"/);
  assert.match(v9css,/data-v9-view="decision"/);
  assert.match(v9css,/data-v9-view="transition"/);
  assert.match(v9css,/body\.blCommunityMode \.v9HallHero/);
  assert.match(v9css,/body\.blCommunityMode \.v9HallPodium/);
  assert.match(v9css,/body\.blCommunityMode \.v9HallMine/);
  assert.match(board,/每一段生涯，<br>都有自己的位置/);
  assert.match(board,/era==="weekly"\s*\? `<div class="v9HallBrief"><span>本週 Seed 挑戰/);
  assert.match(board,/玩家殿堂規則/);
  assert.match(board,/每個項目・一位玩家一席/);
  assert.match(board,/我的完整全球名次/);
  assert.match(board,/第 4–50 名/);
  assert.match(season,/class="v9SeasonReport"/);
  assert.match(season,/class="v9HealthReport is-clear"/);
  assert.match(season,/class="v9HealthReport is-injured"/);
  assert.match(v9css,/\.v9SeasonMainGrid\{/);
  assert.match(v9css,/\.v9MedicalBoard\{/);
  assert.match(v9css,/trainingAbilityDetails \.trainingStats\{grid-template-columns:repeat\(2/);
  assert.match(v9css,/choice\.eventChoice>\.v9BattleOdds\.eventChancePreview\{border:0!important/);
  assert.match(v9css,/choice\.v9EventChoice>\.v9EventChance/);
  assert.match(events,/eventChancePreview v9EventChance/);
  assert.match(v9css,/data-v9-view="transition".*#currentPanel:after\{[^}]*inset:0;/s);
  assert.match(read("js/career/injury-engine.js"),/choice seasonPlanChoice risk/);
  assert.match(read("js/career/injury-engine.js"),/class="seasonPlanRisk"/);
  assert.match(v9css,/data-stage="plan".*choice\.seasonPlanChoice/s);
  assert.match(events,/v9BattleResolved/);
  assert.match(growth,/keyBattleResolved/);
  assert.match(growth,/function syncV9PointTracks\(/);
  assert.match(v9css,/choices:not\(:empty\):before\{[^}]*transform:none!important/);
  assert.match(storage,/special:special\.innerHTML,choices:choices\.innerHTML,flow:flow\.innerHTML/);
  assert.doesNotMatch(storage,/v9EventStage/);
});

test("normalizing a V8.1 save does not retrofit V9 stats, caps or talent fields",()=>{
  const context={
    window:{addEventListener(){},confirm(){return true}},document:{getElementById(){return null}},
    ensureV8CareerState(){},newAvatarSeed(){return "AVATAR"},normalizeV8Contract(){},
    NCAA_D2_TEAMS:["D2"],NCAA_D1_TEAMS:["D1"],hash(){return 0}
  };
  context.globalThis=context;vm.createContext(context);
  vm.runInContext(read("data/seed-config.js"),context);
  vm.runInContext(read("js/state.js"),context);
  const player={
    name:"舊檔",pos:"PG",seed:"K8M2X7QP",avatarSeed:"OLD",careerVersion:"8.1.1",
    stats:{shoot:40,finish:41,handle:42,pass:43,defense:44,rebound:45,ath:46,iq:47},
    caps:{shoot:70,finish:71,handle:72,pass:73,defense:74,rebound:75,ath:76,iq:77}
  };
  const before=JSON.stringify({stats:player.stats,caps:player.caps});
  context.normalizeCareerPlayer(player);
  assert.equal(JSON.stringify({stats:player.stats,caps:player.caps}),before);
  assert.equal(player.careerVersion,"8.1.1");
  assert.equal(player.talentProfile,undefined);
});

test("existing V9 map 1 saves retain their original tier and generated attributes",()=>{
  const context={
    window:{addEventListener(){},confirm(){return true}},document:{getElementById(){return null}},
    ensureV8CareerState(){},newAvatarSeed(){return "AVATAR"},normalizeV8Contract(){},
    NCAA_D2_TEAMS:["D2"],NCAA_D1_TEAMS:["D1"],hash(){return 0}
  };
  context.globalThis=context;vm.createContext(context);
  vm.runInContext(read("data/seed-config.js"),context);
  vm.runInContext(read("js/state.js"),context);
  const player={
    name:"既有 V9",pos:"PG",seed:"Q0000016",avatarSeed:"OLD",careerVersion:"9.0.0",seedTier:"SSS+",seedTierLabel:"既有等級",seedTierDesc:"既有說明",
    stats:{shoot:47,finish:46,handle:50,pass:49,defense:45,rebound:44,ath:47,iq:48},
    caps:{shoot:99,finish:97,handle:99,pass:98,defense:94,rebound:92,ath:96,iq:97}
  };
  const before=JSON.stringify({stats:player.stats,caps:player.caps,seedTier:player.seedTier,seedTierLabel:player.seedTierLabel,seedTierDesc:player.seedTierDesc});
  context.normalizeCareerPlayer(player);
  assert.equal(player.seedTierMapVersion,1);
  assert.equal(JSON.stringify({stats:player.stats,caps:player.caps,seedTier:player.seedTier,seedTierLabel:player.seedTierLabel,seedTierDesc:player.seedTierDesc}),before);
});

function retirementContext(player){
  const context={
    p:player,
    LEAGUE_CFG:{
      NBA:{label:"NBA"},"NBA G League":{label:"NBA G League"},"歐洲聯賽":{label:"歐洲聯賽"},
      CBA:{label:"CBA"},"日本職業":{label:"B.League"},"韓國職業":{label:"KBL"},"台灣職業":{label:"台灣職籃"},"SBL／半職業":{label:"SBL"}
    },
    document:{addEventListener(){}},
    escapeFeedText:value=>String(value??"")
  };
  vm.runInNewContext(read("js/ui/retirement-view.js"),context);
  return context;
}

test("retired legacy saves use the new retirement presentation without changing their version",()=>{
  const legacy={careerVersion:"8.1.1",stage:"retired",retired:true};
  const context=retirementContext(legacy);
  assert.equal(context.isV9RetirementExperience(),true);
  assert.equal(legacy.careerVersion,"8.1.1");
});

test("V9 retirement history position is factual for dynasty and ordinary careers",()=>{
  const dynastySeasons=Array.from({length:14},(_,index)=>({
    year:2040+index,age:22+index,team:"洛杉磯星辰",path:"NBA",games:76,mins:index<9?34:17,
    pts:index<9?25:10,reb:6,ast:index<9?7:4,stl:1.5,blk:.8,role:index<9?"core":"worker",
    abilityProfile:{defense:{perimeter:82,interior:75,help:84,rim:70}},seasonAwards:[]
  }));
  const dynasty={
    year:2054,seasonHistory:dynastySeasons,roleHistory:[],careerRating:52000,championships:3,
    championshipHistory:[2043,2046,2048].map(year=>({year,path:"NBA",team:"洛杉磯星辰"})),
    careerFinalsMVP:2,careerMVP:1,careerDPOY:0,careerFirstTeam:2,careerSecondTeam:1,
    hallOfFame:["NBA 名人堂"],jerseyRetired:["洛杉磯星辰"],medicalHistory:[{year:2049,name:"膝韌帶重傷",tier:"重傷",missedGames:34}],
    lastDanceUsed:false,homecomingTeam:"",homecomingRegion:""
  };
  const dynastyProfile=retirementContext(dynasty).retirementLegacyProfile();
  assert.match(dynastyProfile.title,/冠軍年代/);
  assert.match(dynastyProfile.summary,/洛杉磯星辰效力 14 季/);
  assert.match(dynastyProfile.summary,/膝韌帶重傷後/);
  assert.ok(dynastyProfile.evidence.some(item=>item.includes("3 座主要冠軍")));

  const leagues=["台灣職業","日本職業","韓國職業","CBA","歐洲聯賽","台灣職業"];
  const ordinarySeasons=Array.from({length:17},(_,index)=>({year:2030+index,age:21+index,team:`球隊${index%6+1}`,path:leagues[index%leagues.length],games:42,mins:16,pts:8,reb:4,ast:3,stl:.8,blk:.2}));
  const ordinary={year:2047,seasonHistory:ordinarySeasons,careerRating:12000,championships:3,championshipHistory:[2027,2028,2029].map(year=>({year,path:"HBL",team:"高中校隊"})),careerFinalsMVP:0,careerMVP:0,careerDPOY:0,careerFirstTeam:0,careerSecondTeam:0,hallOfFame:[],jerseyRetired:[],medicalHistory:[]};
  const ordinaryProfile=retirementContext(ordinary).retirementLegacyProfile();
  assert.equal(ordinaryProfile.title,"在不同球隊找到位置的職業旅人");
  assert.doesNotMatch(`${ordinaryProfile.title}${ordinaryProfile.summary}`,/傳奇|王朝|歷史級/);
  assert.ok(ordinaryProfile.evidence.every(item=>!item.includes("冠軍")));
  assert.equal(ordinaryProfile.professionalSeasons,17);
});

test("V9 retirement role timeline and role storage stay compatible with old saves",()=>{
  const oldPlayer={
    year:2033,seasonHistory:[
      {year:2030,age:23,team:"甲隊",path:"台灣職業",mins:31,pts:23,reb:5,ast:4},
      {year:2031,age:24,team:"甲隊",path:"台灣職業",mins:26,pts:15,reb:5,ast:6.5},
      {year:2032,age:25,team:"乙隊",path:"日本職業",mins:15,pts:8,reb:4,ast:3}
    ]
  };
  const stages=retirementContext(oldPlayer).retirementRoleTimeline();
  assert.deepEqual(Array.from(stages,x=>x.identity),["得分核心","先發組織者","主要輪替"]);

  const memory={p:null,window:{},document:{getElementById(){return null}}};
  vm.runInNewContext(read("js/events/event-memory.js"),memory);
  const current={year:2035,team:"測試隊",path:"NBA",roleHistory:[]};
  memory.recordV8RoleHistory(current,{id:"starter",label:"固定先發"},"賽季輪替評估");
  memory.recordV8RoleHistory(current,{id:"core",label:"先發核心"},"球季實際角色",32);
  assert.equal(current.roleHistory.length,1);
  assert.equal(current.roleHistory[0].role,"core");
  assert.equal(current.roleHistory[0].mins,32);
  assert.match(read("js/state.js"),/"roleHistory"/);
  assert.match(read("js/career/season-engine.js"),/roleLabel:isProPath\(\)\?p\.roleState\.currentLabel/);
});

test("V9 formal retirement page adds factual sections without replacing the two original image actions",()=>{
  const retirement=read("js/ui/retirement-view.js");
  const career=read("js/ui/career-view.js"),styles=read("css/home.css");
  assert.match(retirement,/function retirementLegacyProfile\(/);
  assert.match(retirement,/function v9RetirementPageHTML\(/);
  assert.match(retirement,/data-retire-tab="overview"|\["overview","生涯總覽"\]/);
  assert.match(retirement,/data-retire-panel="records"/);
  assert.match(retirement,/這段生涯留下了什麼/);
  assert.match(retirement,/場上角色如何改變/);
  assert.match(retirement,/影響生涯的選擇與轉折/);
  assert.match(retirement,/同時代的人/);
  assert.match(retirement,/onclick="generateRetirementPageImage\(\)"/);
  assert.match(retirement,/onclick="generateCareerImage\(\)"/);
  assert.match(retirement,/txt\("BL POWER"/);
  assert.match(career,/const v9RetiredStage=retiredStage/);
  assert.match(retirement,/function isV9RetirementExperience\(\)\{return !!\(p\?\.retired\|\|p\?\.stage==="retired"\)\}/);
  assert.match(styles,/body\.v9RetirementMode \.retireHero/);
  assert.match(styles,/body\.v9RetirementMode \.brandRow,body\.v9RetirementMode \.liveTicker/);
  assert.match(styles,/body\.v9RetirementMode \.v9GameNav\{display:none!important\}/);
});
