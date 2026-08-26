/* Shared V9 progression rules. V8.1 careers intentionally keep their original curve. */
(function(global){
"use strict";

const BL_SKILLS=["shoot","finish","handle","pass","defense","rebound","ath","iq"];
const BL_TECHNICAL=new Set(["shoot","pass","iq"]);
const BL_HYBRID=new Set(["handle","defense"]);
const BL_PHYSICAL=new Set(["ath","finish","rebound"]);
const BL_ROLE_LEVEL={garbage:0,benchLeader:1,worker:2,sixth:3,starter:4,core:5};

function isV9Progression(player){return String(player?.careerVersion||"").startsWith("9.")}
function number(value,fallback=0){const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback}
function progressionOverall(player){
 const values=BL_SKILLS.map(key=>number(player?.stats?.[key],NaN)).filter(Number.isFinite);
 return values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0;
}
function careerStatCap(player,key){
 const stored=number(player?.caps?.[key],99);
 return Math.max(20,Math.min(99,stored));
}
function careerStatBreakthroughRoom(player,key){
 if(!isV9Progression(player))return Math.max(0,99-careerStatCap(player,key));
 const affinity=typeof global.v90TalentAffinity==="function"?global.v90TalentAffinity(player,key):"foundation";
 const tierRoom={C:2,B:3,A:4,S:5,"S+":6,"SS+":7,"SSS+":8}[String(player?.seedTier||"")]??3;
 if(affinity==="core")return tierRoom;
 if(affinity==="support")return Math.max(2,Math.ceil(tierRoom*.55));
 return Math.min(2,tierRoom);
}
function careerStatLimit(player,key){
 const cap=careerStatCap(player,key);
 if(!isV9Progression(player))return 99;
 return Math.min(99,cap+careerStatBreakthroughRoom(player,key));
}
function progressionAgeBand(player){
 const age=number(player?.age,16);
 if(age<=28)return "prime";
 if(age<=31)return "transition";
 if(age<=34)return "technical";
 if(age<=37)return "veteran";
 return "maintenance";
}
function progressionSkillGroup(key){
 if(BL_TECHNICAL.has(key))return "technical";
 if(BL_HYBRID.has(key))return "hybrid";
 if(BL_PHYSICAL.has(key))return "physical";
 return "technical";
}
function permanentGrowthAllowance(player,key){
 if(!isV9Progression(player))return Infinity;
 const group=progressionSkillGroup(key),band=progressionAgeBand(player);
 if(band==="prime")return 4;
 if(band==="transition")return group==="physical"?1:2;
 if(band==="technical")return group==="physical"?0:group==="hybrid"?1:2;
 if(band==="veteran")return group==="technical"?1:0;
 return 0;
}
function usedPermanentGrowth(player,key){return Math.max(0,number(player?.seasonPermanentGrowth?.[key],0))}
function availablePermanentGrowth(player,key){
 if(!isV9Progression(player))return Infinity;
 const used=player?.permanentGrowthSeasonKey===currentSeasonKey(player)?usedPermanentGrowth(player,key):0;
 return Math.max(0,permanentGrowthAllowance(player,key)-used);
}
function ensurePermanentGrowthState(player){
 if(!player||typeof player!=="object")return {};
 if(!player.seasonPermanentGrowth||typeof player.seasonPermanentGrowth!=="object"||Array.isArray(player.seasonPermanentGrowth))player.seasonPermanentGrowth={};
 return player.seasonPermanentGrowth;
}
function currentSeasonKey(player){return `${number(player?.year,0)}:${number(player?.careerSeason,0)}`}
function resetPermanentGrowthSeason(player){
 if(!isV9Progression(player))return;
 const key=currentSeasonKey(player);
 if(player.permanentGrowthSeasonKey===key)return;
 player.permanentGrowthSeasonKey=key;
 player.seasonPermanentGrowth={};
}
function applyCareerStatChange(player,key,delta,options={}){
 const requested=Math.trunc(number(delta,0));
 const current=number(player?.stats?.[key],0);
 if(!player?.stats||!BL_SKILLS.includes(key)||!requested)return {requested,applied:0,converted:0,cap:careerStatCap(player,key),reason:"invalid"};
 if(requested<0){
  const next=Math.max(20,current+requested),applied=next-current;
  player.stats[key]=next;
  return {requested,applied,converted:0,cap:careerStatCap(player,key),reason:"loss"};
 }
 if(!isV9Progression(player)){
  const next=Math.min(99,current+requested),applied=next-current;
  player.stats[key]=next;
  return {requested,applied,converted:0,cap:99,reason:"legacy"};
 }
 const cap=careerStatCap(player,key),source=String(options.source||"event");
 const recovery=source==="rehab";
 const limit=recovery?cap:careerStatLimit(player,key);
 resetPermanentGrowthSeason(player);
 const space=Math.max(0,limit-current);
 const allowance=recovery?requested:availablePermanentGrowth(player,key);
 const applied=Math.max(0,Math.min(requested,space,allowance));
 if(applied){
  player.stats[key]=current+applied;
  if(!recovery){
   const spent=ensurePermanentGrowthState(player);
   spent[key]=usedPermanentGrowth(player,key)+applied;
  }
 }
 let converted=0;
 if(options.seasonalFallback&&applied<requested){
  converted=Math.max(1,Math.min(2,Math.ceil((requested-applied)/2)));
  player.planStatMod=Math.max(-8,Math.min(8,number(player.planStatMod,0)+converted));
 }
 const reason=space<=0?"limit":allowance<=0?"age":applied<requested?"limited":current>=cap?"breakthrough":"applied";
 return {requested,applied,converted,cap,limit,reason};
}
function raiseCareerStatCap(player,key,amount,options={}){
 const requested=Math.max(0,Math.trunc(number(amount,0)));
 if(!player?.caps||!BL_SKILLS.includes(key)||!requested)return {requested,applied:0,reason:"invalid"};
 if(!isV9Progression(player)){
  const before=careerStatCap(player,key),next=Math.min(99,before+requested);player.caps[key]=next;
  return {requested,applied:next-before,reason:"legacy"};
 }
 const band=progressionAgeBand(player),group=progressionSkillGroup(key);
 let limit=0;
 if(band==="prime")limit=requested;
 else if(band==="transition")limit=group==="physical"?Math.min(1,requested):Math.min(2,requested);
 else if(band==="technical")limit=group==="technical"?Math.min(1,requested):0;
 if(!limit)return {requested,applied:0,reason:"age"};
 const before=careerStatCap(player,key),next=Math.min(99,before+limit);player.caps[key]=next;
 return {requested,applied:next-before,reason:next-before<requested?"limited":"applied"};
}
function progressionSeasonGrowthMultiplier(player){
 if(!isV9Progression(player))return 1;
 return ({prime:1,transition:.78,technical:.55,veteran:.32,maintenance:.12})[progressionAgeBand(player)]||1;
}
function careerLifecycleProfile(player){
 const current=progressionOverall(player),peak=Math.max(current,number(player?.peakOverall,current));
 const gap=Math.max(0,peak-current),health=number(player?.health,100),bodyLoad=number(player?.bodyLoad,0);
 const role=BL_ROLE_LEVEL[String(player?.roleState?.current||"")]??-1;
 const promised=BL_ROLE_LEVEL[String(player?.roleState?.promised||"")]??role;
 const contractYears=number(player?.contract?.remaining,0);
 const strained=health<78||bodyLoad>=65||!!player?.injury;
 const closing=gap>=7||(gap>=5&&role<=3)||(role>=0&&role<=1&&contractYears<=1)||(strained&&gap>=4&&contractYears<=1);
 const turning=!closing&&(gap>=3||role<promised||strained);
 const chapter=closing?"legacy":turning?"turn":"peak";
 const reason=closing?`OVR ${peak} 的高點已落差 ${gap}，目前角色與健康需要重新評估`:turning?`目前 OVR ${current}、健康 ${Math.round(health)}、身體負荷 ${Math.round(bodyLoad)}，使用方式正在改變`:`目前 OVR ${current}，角色與身體狀態仍支持延續巔峰`;
 return {chapter,current,peak,gap,health,bodyLoad,role,promised,contractYears,strained,reason};
}

Object.assign(global,{BL_PROGRESS_SKILLS:BL_SKILLS,isV9Progression,careerStatCap,careerStatBreakthroughRoom,careerStatLimit,progressionAgeBand,progressionSkillGroup,permanentGrowthAllowance,availablePermanentGrowth,resetPermanentGrowthSeason,applyCareerStatChange,raiseCareerStatCap,progressionSeasonGrowthMultiplier,careerLifecycleProfile});
})(globalThis);
