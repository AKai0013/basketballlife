/* BasketballLife V9 talent generation — deterministic from Seed and position. */
const V90_TALENT_MODEL="v9-specialist-1";
const V90_ABILITY_KEYS=["shoot","finish","handle","pass","defense","rebound","ath","iq"];

function v90TalentHash(value){
 let h=2166136261;
 const text=String(value||"");
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
function v90TalentRng(value){
 let a=v90TalentHash(value);
 return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}
function v90TalentInt(r,min,max){return Math.floor(r()*(max-min+1))+min}
function v90TalentClamp(value,min,max){return Math.max(min,Math.min(max,Math.round(Number(value)||0)))}
function v90TalentShuffle(r,items){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){const j=v90TalentInt(r,0,i),hold=out[i];out[i]=out[j];out[j]=hold}
 return out;
}
function v90PickArchetype(r,pos){
 const weights=V90_POSITION_ARCHETYPE_WEIGHTS[pos]||V90_POSITION_ARCHETYPE_WEIGHTS.PG;
 const entries=Object.entries(weights),total=entries.reduce((sum,[,weight])=>sum+weight,0);
 let roll=r()*total;
 for(const [id,weight] of entries){roll-=weight;if(roll<0)return {id,...V90_TALENT_ARCHETYPES[id]}}
 const id=entries[0][0];return {id,...V90_TALENT_ARCHETYPES[id]};
}
function v90Rebalance(values,target,{minimum=0,maximum=99,floors={}}={}){
 const out={...values},keys=Object.keys(out);
 let total=keys.reduce((sum,key)=>sum+out[key],0),guard=0;
 while(total!==target&&guard<5000){
   guard++;
   const direction=total<target?1:-1;
   const candidates=keys.filter(key=>direction>0?out[key]<maximum:out[key]>Math.max(minimum,Number(floors[key])||minimum));
   if(!candidates.length)break;
   const key=candidates[(guard-1)%candidates.length];out[key]+=direction;total+=direction;
 }
 return out;
}
function v90GenerateTalent(seed,pos,tier,bodyMods={}){
 const cfg=tier?.v9||SEED_TIER_DEFS.find(item=>item.key==="B").v9;
 const r=v90TalentRng(`BL-V9-TALENT:${String(seed||"").toUpperCase()}:${pos}`),archetype=v90PickArchetype(r,pos);
 const core=[...archetype.core],support=archetype.support.filter(key=>!core.includes(key));
 const affinity=Object.fromEntries(V90_ABILITY_KEYS.map(key=>[key,core.includes(key)?"core":support.includes(key)?"support":"foundation"]));

 const startAverage=v90TalentInt(r,cfg.startAverage[0],cfg.startAverage[1]),startTarget=startAverage*V90_ABILITY_KEYS.length;
 const startRaw={};
 for(const key of V90_ABILITY_KEYS){
   const lift=affinity[key]==="core"?5:affinity[key]==="support"?2:-2;
   startRaw[key]=v90TalentClamp(startAverage+lift+v90TalentInt(r,-3,3)+(Number(bodyMods[key])||0),25,58);
 }
 const startOrder=v90TalentShuffle(r,[...core,...support,...V90_ABILITY_KEYS.filter(key=>affinity[key]==="foundation")]);
 const orderedStart=Object.fromEntries(startOrder.map(key=>[key,startRaw[key]]));
 const balancedStats=v90Rebalance(orderedStart,startTarget,{minimum:25,maximum:58});
 const stats=Object.fromEntries(V90_ABILITY_KEYS.map(key=>[key,balancedStats[key]]));

 const capTarget=v90TalentInt(r,cfg.capTotal[0],cfg.capTotal[1]),capAverage=capTarget/V90_ABILITY_KEYS.length;
 const floors={},capsRaw={};
 for(const key of V90_ABILITY_KEYS){
   const floor=affinity[key]==="core"?cfg.coreFloor:affinity[key]==="support"?cfg.supportFloor:cfg.foundationFloor;
   floors[key]=Math.max(floor,stats[key]+10);
   const lift=affinity[key]==="core"?9:affinity[key]==="support"?3:-6;
   capsRaw[key]=v90TalentClamp(capAverage+lift+v90TalentInt(r,-3,3)+(Number(bodyMods[key])||0),floors[key],99);
 }
 const eliteCount=v90TalentInt(r,cfg.eliteSlots[0],cfg.eliteSlots[1]);
 const elitePool=v90TalentShuffle(r,[...core,...support]);
 const elite=elitePool.slice(0,eliteCount);
 elite.forEach(key=>{floors[key]=Math.max(floors[key],cfg.eliteFloor);capsRaw[key]=Math.max(capsRaw[key],floors[key])});
 const capOrder=[...V90_ABILITY_KEYS.filter(key=>affinity[key]==="foundation"),...support,...core];
 const orderedCaps=Object.fromEntries(capOrder.map(key=>[key,capsRaw[key]]));
 const balancedCaps=v90Rebalance(orderedCaps,capTarget,{minimum:0,maximum:99,floors});
 const caps=Object.fromEntries(V90_ABILITY_KEYS.map(key=>[key,balancedCaps[key]]));

 return {
   stats,caps,growth:v90TalentInt(r,cfg.growth[0],cfg.growth[1]),
   profile:{model:V90_TALENT_MODEL,archetype:archetype.id,label:archetype.label,core,support,elite,affinity,startBudget:Object.values(stats).reduce((a,b)=>a+b,0),capBudget:Object.values(caps).reduce((a,b)=>a+b,0)}
 };
}
function v90TalentAffinity(player,key){
 if(player?.talentProfile?.model!==V90_TALENT_MODEL)return "legacy";
 const saved=player.talentProfile.affinity?.[key];
 if(["core","support","foundation"].includes(saved))return saved;
 return player.talentProfile.core?.includes(key)?"core":player.talentProfile.support?.includes(key)?"support":"foundation";
}
const V90_TALENT_DESCRIPTIONS={
 lead_guard:"用控場與傳球掌握節奏，讓隊友在最舒服的位置完成進攻。",
 scoring_guard:"用持球與投射創造得分空間，在關鍵回合接管比賽。",
 rebounding_guard:"從外圍衝進禁區收下籃板，再用速度直接推動反擊。",
 two_way_wing:"能守住主要得分點，也能用投射與運動能力回應對手。",
 wing_creator:"用持球突破防線，也能在協防到來前找到下一個空檔。",
 point_forward:"以鋒線身材組織進攻，在不同對位中找到最好的選擇。",
 slashing_forward:"用第一步與對抗攻擊籃框，在轉換進攻中放大破壞力。",
 stretch_big:"把長人帶離禁區，用投射與球商替隊友拉開球場。",
 point_center:"站在中鋒位置閱讀全場，從高低位串起球隊進攻。",
 rim_anchor:"守住籃框並控制籃板，讓隊友敢在外圍施加壓力。",
 post_hub:"在低位吸引防守，以終結與傳球破解包夾。",
 connector:"補上每一個攻守缺口，讓球隊的戰術運轉得更完整。"
};
function v90TalentPanelHTML(player){
 const profile=player?.talentProfile;if(profile?.model!==V90_TALENT_MODEL)return "";
 const labels=keys=>(keys||[]).map(key=>L[key]||key);
 const core=labels(profile.core),support=labels(profile.support);
 return `<div class="v90TalentPanel" aria-label="球員天賦"><span class="v90TalentWatermark" aria-hidden="true">V9</span><div class="v90TalentHeading"><small>PLAYER TALENT</small><b>${profile.label||"多功能球員"}</b><p>${V90_TALENT_DESCRIPTIONS[profile.archetype]||"用最適合自己的能力，建立獨一無二的球風。"}</p></div><div class="v90TalentBadges">${core.map(label=>`<span class="core">${label}</span>`).join("")}${support.map(label=>`<span>${label}</span>`).join("")}</div><div class="v90TalentLines"><span><small>核心適性</small>${core.join("、")}</span><span><small>延伸適性</small>${support.join("、")}</span></div></div>`;
}
