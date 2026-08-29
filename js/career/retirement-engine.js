function romanceCandidateForCareer(){
 const former=new Set((p.formerPartners||[]).map(x=>x.name));
 const options=ROMANCE_PROFILE_POOL.flatMap(profile=>profile.names.map(name=>({...profile,name,names:undefined}))).filter(x=>!former.has(x.name));
 const pool=options.length?options:ROMANCE_PROFILE_POOL.flatMap(profile=>profile.names.map(name=>({...profile,name,names:undefined})));
 const r=RNG(`${p.seed}-romance-${p.year}-${p.romanceAttempts||0}-${(p.formerPartners||[]).length}`);
 return {...pool[Math.floor(r()*pool.length)]};
}
function ensureRomanceCandidate(){
 if(!p.romanceCandidate?.name)p.romanceCandidate=romanceCandidateForCareer();
 return p.romanceCandidate;
}
function activateRomanceCandidate(){
 const candidate=ensureRomanceCandidate();p.partnerProfile={...candidate};p.partnerName=candidate.name;p.romanceCandidate={};
 return candidate;
}
function applyPartnerProfileBonus(){
 const profile=p.partnerProfile||{};let text="";
 if(profile.type==="media"){p.rep+=2;p.confidence=Math.min(100,p.confidence+1);text="球隊評價 +2｜信心 +1"}
 else if(profile.type==="creative"){p.confidence=Math.min(100,p.confidence+3);text="信心 +3"}
 else if(profile.type==="performance"){p.confidence=Math.min(100,p.confidence+2);p.rep+=1;text="信心 +2｜球隊評價 +1"}
 else if(profile.type==="global"){p.confidence=Math.min(100,p.confidence+3);p.rep+=1;text="旅外適應：信心 +3｜球隊評價 +1"}
 else if(profile.type==="wellness"){p.health=Math.min(100,p.health+4);p.durability=Math.min(99,p.durability+1);text="健康 +4｜耐久 +1"}
 else if(profile.type==="strategy"){const outcome=typeof applyCareerStatChange==="function"?applyCareerStatChange(p,"iq",1,{source:"event",seasonalFallback:true}):null;p.confidence=Math.min(100,p.confidence+2);text=`${outcome?.applied?`球商 +${outcome.applied}`:outcome?.converted?`本季數據機會 +${outcome.converted}`:"能力維持"}｜信心 +2`}
 else if(profile.type==="business"){p.rep+=2;p.discipline=Math.min(100,p.discipline+1);text="球隊評價 +2｜紀律 +1"}
 else {p.familyHarmony=Math.min(100,p.familyHarmony+6);p.discipline=Math.min(100,p.discipline+1);text="家庭關係 +6｜紀律 +1"}
 return text;
}
function archiveCurrentPartner(reason="關係結束"){
 if(p.partnerName){
   p.formerPartners=p.formerPartners||[];
   p.formerPartners.push({name:p.partnerName,role:p.partnerProfile?.role||"伴侶",years:p.relationshipYears||0,year:p.year,reason});
 }
 p.partnerName="";p.partnerProfile={};p.romanceCandidate={};p.relationshipYears=0;p.married=false;p.divorced=true;p.romanceStage=0;p.romanceAttempts=(p.romanceAttempts||0)+1;p.romanceNextYear=p.year+1;
}
function familyRelationshipSummary(){
 const current=p.married?`現任伴侶：${p.partnerName}${p.partnerProfile?.role?`（${p.partnerProfile.role}）`:""}`:p.partnerName?`交往對象：${p.partnerName}${p.partnerProfile?.role?`（${p.partnerProfile.role}）`:""}`:"目前單身";
 const former=(p.formerPartners||[]).length?`｜前段婚姻／關係：${p.formerPartners.map(x=>`${x.name}（${x.reason}）`).join("、")}`:"";
 return `${current}${former}｜子女 ${p.children||0} 人｜家庭關係 ${p.familyHarmony}`;
}
function applySpecialEffect(etype,tier){
 let extra="",r=RNG(p.seed+"special-"+p.year+"-"+p.eventIndex+"-"+etype);
 const ok=tier==="great"||tier==="success";
 if(etype==="tradeDemand"&&ok){
   p.rep-=5;
   if(r()<.65){
     const pool=leagueTeamPool(p.path);
     let candidates=pool.filter(x=>x!==p.team),old=completeTrade(candidates[ri(r,0,candidates.length-1)]);
     extra=`<div class="majorEvent"><b>🔁 交易完成</b><br>${old} 將你交易至 <b class="gold">${p.team}</b>。</div>`;pushNews(`🔁 ${p.name} 從 ${old} 被交易至 ${p.team}`);
   }
 }
 if(etype==="surgery"&&ok){p.surgeries++;p.missedSeasons++;p.fatigue=0;if(p.injury){ensureInjuryRecoveryState();setInjuryRecoveryFloor((p.injury.originalSeasonShare||0)*.70)}extra=`<div class="dangerEvent"><b>🏥 手術完成</b><br>本季剩餘時間幾乎確定報銷，但長期復原率提高。</div>`;}
 if(etype==="rehab"&&ok){p.fatigue=Math.max(0,p.fatigue-15);adjustInjuryRecoveryGames(-5);}
 if(etype==="relationship"&&ok){if(!p.partnerName)activateRomanceCandidate();p.relationshipYears=Math.max(1,p.relationshipYears);extra=`<div class="majorEvent"><b>❤️ 關係確立</b><br>你與 ${p.partnerName}（${p.partnerProfile?.role||"場外認識的朋友"}）開始正式交往。</div>`;}
 if(etype==="proposal"&&ok){p.married=true;extra=`<div class="majorEvent"><b>💍 結婚</b><br>${p.partnerName} 答應了你的求婚。</div>`;pushNews(`💍 ${p.name} 宣布結婚`);}
 if(etype==="child"&&ok){p.children++;p.confidence=Math.min(100,p.confidence+5);extra=`<div class="majorEvent"><b>👶 新生兒</b><br>家中迎來第 ${p.children} 個孩子。信心 +5。</div>`;}
 if(etype==="endorsement"&&ok){let income=tier==="great"?220:120;p.endorsementIncome+=income;p.careerSalary+=income;extra=`<div class="majorEvent"><b>💰 代言簽約</b><br>額外收入 ${income} 萬。</div>`;}
 return extra;
}
function updateCareerTotals(stats){
 p.careerGames+=stats.games||0;
 p.careerPtsTotal+=(stats.pts||0)*(stats.games||0);
 p.careerRebTotal+=(stats.reb||0)*(stats.games||0);
 p.careerAstTotal+=(stats.ast||0)*(stats.games||0);p.careerBlocksTotal+=(stats.blk||0)*(stats.games||0);
 const currentOverall=overall();
 if(currentOverall>(p.peakOverall||0)){p.peakOverall=currentOverall;p.peakAge=p.age;}
 if(p.contract){
   p.careerBasketballSalary+=(p.contract.salary||0);
   p.careerSalary+=(p.contract.salary||0);
 }
}
function legacyApplyAging(){
 if(p.age<29)return "";
 let losses,stage,name;
 if(p.age<=30){stage=1;name="巔峰尾聲";losses={ath:1,finish:1};}
 else if(p.age<=32){stage=2;name="第一波衰退";losses={ath:1,finish:1,defense:1};}
 else if(p.age<=34){stage=3;name="歲月累積";losses={ath:2,finish:1,defense:1,handle:1};}
 else if(p.age<=36){stage=4;name="老將調整";losses={ath:2,finish:2,defense:1,handle:1,rebound:1,shoot:1};}
 else if(p.age<=38){stage=5;name="老將模式";losses={ath:3,finish:2,defense:2,handle:1,rebound:2,shoot:1,pass:1};}
 else if(p.age<=40){stage=6;name="暮年輪替";losses={ath:3,finish:3,defense:2,handle:2,rebound:2,shoot:1,pass:1};}
 else if(p.age<=44){stage=7;name="延長生涯";losses={ath:4,finish:3,defense:3,handle:2,rebound:2,shoot:2,pass:1,iq:1};}
 else if(p.age<=49){stage=8;name="生涯極限";losses={ath:5,finish:4,defense:3,handle:3,rebound:3,shoot:2,pass:2,iq:1};}
 else{stage=9;name="晚年急速收束";losses={ath:7,finish:6,defense:5,handle:4,rebound:5,shoot:3,pass:2,iq:2};}
 const changes=[];
 for(const [k,n] of Object.entries(losses)){let mod=n;if(hasTitle("ironman")&&k==="ath")mod=Math.max(0,mod-1);if(p.seasonPlan==="care"&&["ath","finish"].includes(k))mod=Math.max(0,mod-1);if(p.injuryHistory.length>=4&&["ath","finish","defense"].includes(k))mod+=1;if((p.bodyLoad||0)>=75&&["ath","finish","defense","rebound"].includes(k))mod+=1;if(mod){p.stats[k]=Math.max(20,p.stats[k]-mod);changes.push(`${L[k]} -${mod}`);}}
 const healthBase=p.age>=50?2:p.age>=45?1:0,healthLoss=p.seasonPlan==="care"?Math.max(0,healthBase-1):healthBase;
 if(healthLoss){p.health=Math.max(30,(Number(p.health)||100)-healthLoss);changes.push(`健康 -${healthLoss}`);}
 p.ageDeclineStage=Math.max(p.ageDeclineStage||0,stage);
 return changes.length?`<div class="notice fail"><b>⏳ ${name}</b><br>${changes.join("｜")}<br><span class="mut">年齡、舊傷與本季身體負荷共同造成。</span></div>`:"";
}
function v9AgingBase(){
 if(p.age<=31)return {stage:1,name:"巔峰調整",losses:{ath:1}};
 if(p.age<=34)return {stage:2,name:"技術維持期",losses:{ath:1,finish:1}};
 if(p.age<=37)return {stage:3,name:"老將轉型期",losses:{ath:2,finish:1,defense:1,rebound:1}};
 if(p.age<=40)return {stage:4,name:"老將負荷期",losses:{ath:3,finish:2,defense:1,handle:1,rebound:1}};
 if(p.age<=44)return {stage:5,name:"延長生涯",losses:{ath:3,finish:2,defense:2,handle:1,rebound:2,shoot:1,pass:1}};
 if(p.age<=49)return {stage:6,name:"生涯極限",losses:{ath:5,finish:3,defense:2,handle:2,rebound:3,shoot:1,pass:1}};
 return {stage:7,name:"晚年急速收束",losses:{ath:7,finish:5,defense:4,handle:3,rebound:4,shoot:2,pass:2}};
}
function v9OldInjuryPenalty(key){
 const lower=["膝蓋","腳踝","阿基里斯腱","腿後肌","股四頭","足部","腹股溝"],upper=["肩膀","手指"];
 let burden=0;
 Object.entries(p.oldInjuries||{}).forEach(([area,value])=>{
  const level=Math.min(2,Number(value)||0);
  if(lower.includes(area)&&["ath","finish","defense","rebound","handle"].includes(key))burden+=level*.18;
  if(upper.includes(area)&&["shoot","pass","handle","finish"].includes(key))burden+=level*.14;
  if(area==="下背"&&["ath","finish","defense","rebound"].includes(key))burden+=level*.16;
 });
 return burden;
}
function v9AgingLoss(key,base){
 let multiplier=1;
 const durability=Number(p.durability||70),health=Number(p.health||100),load=Number(p.bodyLoad||0);
 if(durability>=86)multiplier-=.20;else if(durability<=58)multiplier+=.18;
 if(health>=90)multiplier-=.10;else if(health<72)multiplier+=.18;
 if(p.seasonPlan==="care")multiplier-=.16;
 if(hasTitle("ironman")&&key==="ath")multiplier-=.14;
 if(load>=75&&["ath","finish","defense","rebound"].includes(key))multiplier+=.24;
 else if(load>=55&&["ath","finish","defense","rebound"].includes(key))multiplier+=.10;
 multiplier+=v9OldInjuryPenalty(key);
 multiplier=Math.max(.25,Math.min(1.85,multiplier));
 const scaled=base*multiplier,whole=Math.floor(scaled),fraction=scaled-whole;
 const roll=RNG(`${p.seed}-v9-aging-${p.year}-${p.age}-${key}`)();
 return whole+(roll<fraction?1:0);
}
function applyAging(){
 if(p.age<29)return "";
 if(typeof isV9Progression!=="function"||!isV9Progression(p))return legacyApplyAging();
 const profile=v9AgingBase(),changes=[];
 for(const [key,base] of Object.entries(profile.losses)){
  const loss=v9AgingLoss(key,base);
  if(!loss)continue;
  const outcome=typeof applyCareerStatChange==="function"?applyCareerStatChange(p,key,-loss,{source:"aging"}):null;
  const applied=Math.abs(outcome?.applied??loss);
  if(applied)changes.push(`${L[key]} -${applied}`);
 }
 const healthBase=p.age>=50?2:p.age>=45?1:0;
 const healthLoss=p.seasonPlan==="care"?Math.max(0,healthBase-1):healthBase;
 if(healthLoss){p.health=Math.max(30,(Number(p.health)||100)-healthLoss);changes.push(`健康 -${healthLoss}`);}
 p.ageDeclineStage=Math.max(p.ageDeclineStage||0,profile.stage);
 if(changes.length){logIt(`⏳ ${profile.name}：${changes.join("、")}`);return `<div class="notice fail"><b>⏳ ${profile.name}</b><br>${changes.join("｜")}<br><span class="mut">體能、健康、身體負荷與實際舊傷共同決定今年的變化；球商不會因年齡自動下降。</span></div>`;}
 return "";
}
function veteranMinutesProfile(ov=overall()){
 if(!isProPath())return {penalty:0,cap:36,label:"一般輪替"};
 const stats=p.stats||{},season=p.seasonStats||{};
 const ath=Number(stats.ath)||50,durability=Number(p.durability)||60,health=Number(p.health)||100,bodyLoad=Number(p.bodyLoad)||0;
 const games=Number(season.games)||0,scheduled=Number(season.scheduledGames)||0,availability=scheduled?games/scheduled:games>=35?1:games>=24?.82:games>=12?.60:0;
 const recentImpact=(Number(season.pts)||0)+(Number(season.ast)||0)*.7+(Number(season.reb)||0)*.35+(Number(season.stl)||0)*1.4+(Number(season.blk)||0)*1.2;
 let readiness=0;
 if(ath>=80)readiness+=2;else if(ath>=70)readiness+=1;
 if(durability>=85)readiness+=2;else if(durability>=72)readiness+=1;
 if(health>=90)readiness+=1;else if(health<70)readiness-=2;
 if(bodyLoad>=75)readiness-=2;else if(bodyLoad<=30)readiness+=1;
 if(availability>=.8&&Number(season.mins)>=22)readiness+=1;
 if(recentImpact>=15)readiness+=1;
 if(["core","starter"].includes(p.roleState?.current))readiness+=1;
 if(p.injury)readiness-=p.injury.level==="重傷"?3:p.injury.level==="大傷"?2:1;
 readiness=Math.max(-3,Math.min(7,readiness));
 // 年齡不再直接壓低上場時間；限制只來自當下的身體狀態、出勤、傷病與角色。
 let penalty=Math.max(0,Math.max(0,bodyLoad-45)*.045-Math.max(0,readiness)*.35);
 let cap=36;
 cap+=readiness;
 if(ov>=leagueTarget()+8&&(p.rep||0)>=10)cap+=2;
 if(p.injury)cap-=p.injury.level==="重傷"?5:p.injury.level==="大傷"?3:2;
 if(p.postInjuryStatus?.yearsRemaining>0){cap=Math.min(cap,Number(p.postInjuryStatus.minutesCap)||26);penalty+=Number(p.postInjuryStatus.performancePenalty||0)*.35;}
 if(bodyLoad>=75)cap-=2;
 if(p.lastDanceActive)cap=Math.min(cap,22);
 if(p.retirementDefianceUsed&&!p.lastDanceActive)cap=Math.min(cap,20);
 const needsLoadManagement=readiness<=1||bodyLoad>=65||availability<.75||health<80||!!p.injury||!!p.postInjuryStatus||["benchLeader","garbage"].includes(p.roleState?.current);
 const label=needsLoadManagement?"身體狀態管理":readiness>=5&&["core","starter"].includes(p.roleState?.current)?"正常主力輪替":"依對位輪替";
  return {penalty,cap:Math.max(12,Math.min(36,cap)),label};
}
function retirementPressure(){
 if(p.age<34)return 0;
 if(typeof isV9Progression==="function"&&isV9Progression(p)){
   const profile=typeof careerLifecycleProfile==="function"?careerLifecycleProfile(p):null;
   const leagueFloor=leagueTarget(),current=overall(),peak=Math.max(current,Number(p.peakOverall||current));
   const season=p.seasonStats||{},scheduled=Math.max(1,Number(season.scheduledGames)||36),availability=Math.min(1,Number(season.games||0)/scheduled);
   let pressure=0;
   pressure+=Math.max(0,leagueFloor-current)*2.1;
   pressure+=Math.max(0,peak-current-3)*2.2;
   pressure+=Math.max(0,(p.bodyLoad||0)-55)*.34;
   if((p.health||100)<75)pressure+=(75-(p.health||100))*.55;
   if(Number(season.games||0)>0&&availability<.50)pressure+=(.50-availability)*20;
   if((p.majorInjuryCount||0)>=2)pressure+=6;
   if(profile?.chapter==="legacy")pressure+=5;
   if(p.age>=37)pressure+=4;if(p.age>=45)pressure+=7;if(p.age>=50)pressure+=10;
   if((p.contract?.remaining||0)>1)pressure-=16;
   if(profile?.chapter==="peak"&&current>=leagueFloor+5&&(p.health||100)>=84&&(p.bodyLoad||0)<=55)pressure-=12;
   if((p.careerMVP||0)+(p.careerFirstTeam||0)>=3)pressure-=4;
   if(hasTitle("ironman"))pressure-=6;
   return Math.max(0,Math.min(95,Math.round(pressure)));
 }
 let pressure=28;
 pressure+=Math.max(0,leagueTarget()-overall())*2.2;
 pressure+=Math.max(0,(p.bodyLoad||0)-35)*.28;
 if(p.injuryHistory.length>=3)pressure+=6;
 if((p.majorInjuryCount||0)>=2)pressure+=7;
 if((p.contract?.remaining||0)>1)pressure-=14;
 if((p.careerMVP||0)+(p.careerFirstTeam||0)>=3)pressure-=6;
 if(hasTitle("ironman"))pressure-=8;
 return Math.max(0,Math.min(95,pressure));
}
function retirementDefianceChance(){
 if(p.retirementDefianceUsed)return 0;
 if(overall()<contractRosterOverallFloor("SBL／半職業")-2)return 0;
 const relative=overall()-leagueTarget(),risk=typeof veteranContractRiskProfile==="function"?veteranContractRiskProfile("SBL／半職業",false):null;
 let chance=20+relative*2.4+Math.max(-8,Math.min(14,(p.rep||0)*.35))+(risk?risk.teamPatience*.22:12);
 chance+=(p.careerMVP||0)*3+(p.careerFirstTeam||0)*1.2+(p.careerAllStar||0)*.35;
 chance-=(p.majorInjuryCount||0)*3+Math.max(0,(p.bodyLoad||0)-45)*.18;
 return Math.max(8,Math.min(72,Math.round(chance)));
}
function retirementMediaPressureChance(){
 if(p.retirementPressureUsed)return 0;
 const origin=p.marketOriginTeam||p.team;
 const seasons=(p.seasonHistory||[]).filter(x=>x.team===origin&&isProfessionalPathValue(x.path)).length;
 const risk=typeof veteranContractRiskProfile==="function"?veteranContractRiskProfile(p.marketOriginLeague||p.path,true):null;
 let chance=10+Math.min(16,seasons*2)+Math.max(-6,Math.min(12,(p.rep||0)*.28))+(risk?risk.teamPatience*.16:8);
 chance+=(p.careerMVP||0)*2+(p.careerFirstTeam||0)*.8+(p.championships||0)*1.2;
 chance-=(p.majorInjuryCount||0)*2;
 return Math.max(10,Math.min(48,Math.round(chance)));
}
function homecomingRegion(place=p.birthplace){
 return Object.values(TAIWAN_HOMECOMING_REGIONS).find(x=>x.places.includes(place))||TAIWAN_HOMECOMING_REGIONS.north;
}
function retirementHomecomingPreview(){
 const league=overall()>=63?"台灣職業":"SBL／半職業";
 const pool=leagueTeamPool(league);
 const region=homecomingRegion(),regional=(league==="台灣職業"?region.pro:region.semi).filter(x=>pool.includes(x));
 const careerTeams=[...new Set((p.seasonHistory||[]).filter(x=>x.path===league&&pool.includes(x.team)).map(x=>x.team))];
 const r=RNG(`${p.seed}-homecoming-${p.birthplace}-${p.year}-${p.age}-${careerTeams.join("|")}`);
 const preferred=regional.length?regional:pool;
 let team=preferred[ri(r,0,preferred.length-1)];
 if(careerTeams.length&&r()<.32)team=careerTeams[ri(r,0,careerTeams.length-1)];
 if(team===p.team&&preferred.length>1&&r()<.55)team=preferred[(preferred.indexOf(team)+1+ri(r,0,preferred.length-2))%preferred.length];
 return {league,team,region:region.label,reason:`依 ${p.birthplace||region.label} 出身地與台灣職涯連結媒合`};
}
function retirementHomecomingContract(){
 const home=retirementHomecomingPreview();
 let c=makeContract(home.league,Math.max(55,scoutingScore()),"last-dance-"+p.year,home.team,true);
 c.years=c.remaining=1;c.type="告別巡迴合約";c.role="老將領袖／限時輪替";c.bonus=0;
 c.salary=Math.max(20,Math.round(leagueSalaryBase(home.league,p.year)*.72));
 return finalizeContract(c);
}
function hasFarewellResume(){
 const honors=(p.careerMVP||0)+(p.careerFirstTeam||0)+(p.championships||0)+(p.nationalCaps||0);
 const proSeasons=(p.seasonHistory||[]).filter(row=>isProfessionalPathValue(row.path)).length;
 return honors>=3||proSeasons>=8||(p.careerGames||0)>=300;
}
function canOfferHomecomingLastDance(){
 return !p.lastDanceUsed&&p.age>=31&&hasFarewellResume();
}
function startVeteranExtension(contract,kind,resultHTML=""){
 const oldTeam=p.team,oldLeague=p.path,agingHTML=p.pendingAgingHTML||"";
 p.pendingAgingHTML="";p.retirementCrisisReason="";
 p.contract=contract;p.path=contract.league;p.team=contract.team;ensureTeamHistory();
 if(typeof recordCareerRelocation==="function")recordCareerRelocation(p,oldLeague,oldTeam,contract.league,contract.team);
 p.lastDanceActive=kind==="lastDance";
 // 正式職業合約到期時，finishSeason 已經把日曆推進到下一季；
 // 年輕 SBL 發展市場則以 pendingSeasonAdvance 延後推進。兩條路都只
 // 能消耗一次年度，否則最後一舞會憑空跳過一年並多老一歲。
 consumePendingSeasonAdvance();
 p.eventIndex=0;
 p.seasonEventCount=ri(RNG(p.seed+"events-"+p.year),2,4);p.seasonPlan=null;p.planRiskMod=0;p.planGrowthMod=0;p.planStatMod=0;p.seasonInjuryRiskTarget=0;p.seasonInjurySurvival=1;p.seasonInjuryChecksDone=0;p.seasonInjuryExtra=0;p.seasonMedicalEventShown=false;p.seasonNaturalInjuryChecked=false;
 showCareerChapter(oldTeam===p.team?"renewal":"newTeam");
 if(agingHTML||resultHTML)special.insertAdjacentHTML("beforeend",agingHTML+resultHTML);
}
function showRetirementCrisis(reason){
 p.stage="decision";p.retirementCrisisReason=reason;p.retirementCrisisCount=(p.retirementCrisisCount||0)+1;
 resetMain();render();flow.innerHTML="";
 const chance=retirementDefianceChance(),pressureChance=retirementMediaPressureChance(),home=retirementHomecomingPreview(),pressure=retirementPressure();
 const marketState=pressure>=75?"幾近關閉":pressure>=55?"非常冷清":pressure>=35?"選擇有限":"仍有機會";
 const healthState=(p.bodyLoad||0)>=70?"高負荷":(p.bodyLoad||0)>=45?"需要管理":"可維持出賽";
 chapter.textContent=`${p.year} · ${p.age}歲 · 生涯續命抉擇`;
 title.textContent="市場已經沒有標準合約";
 text.innerHTML=`經紀團隊走訪母隊、自由市場與公開測試後，帶回最後的消息：<b>${reason}</b>。標準合約的大門已經關上，現在由你決定如何走完球員生涯的最後一段路。`;
 const lastDanceButton=canOfferHomecomingLastDance()?`<button class="choice" onclick="resolveRetirementCrisis('lastDance')"><b>🏠 接受家鄉告別合約</b><small>${home.team} 願以限時輪替與老將領袖角色，提供一季純告別性質的合約。${home.reason}。</small><span class="retirementOdds">家鄉返鄉｜打完正式引退</span></button>`:"";
 const defyButton=!p.retirementDefianceUsed&&chance>0?`<button class="choice" onclick="resolveRetirementCrisis('defy')"><b>🔥 自費參加封閉測試</b><small>再向職業球團證明一次身體與即戰力；成功只能取得一年老將證明約，失敗則正式離開市場。</small><span class="retirementOdds">取得證明約機率 ${chance}%</span></button>`:"";
 const pressureButton=!p.retirementPressureUsed&&pressureChance>0&&(p.marketOriginTeam||p.team)?`<button class="choice" onclick="resolveRetirementCrisis('pressure')"><b>📣 公開施壓母隊</b><small>要求 ${p.marketOriginTeam||p.team} 再給一年；可能換到低角色合約，也會破壞球團與更衣室關係。</small><span class="retirementOdds">母隊讓步機率 ${pressureChance}%｜必定留下負面稱號</span></button>`:"";
 special.innerHTML=`<div class="retirementCrisis"><h3>合約市場最終報告</h3><p>${reason}。</p><div class="retirementCrisisMeta"><span>年齡 ${p.age}</span><span>總評 ${overall()}</span><span>健康狀態 ${healthState}</span><span>市場狀態 ${marketState}</span></div></div>
 <div class="retirementChoiceGrid">
   <button class="choice" onclick="resolveRetirementCrisis('retire')"><b>🏁 正式宣布引退</b><small>結束現役生涯，進入完整退休結算。</small></button>
   ${lastDanceButton}${defyButton}${pressureButton}
 </div>`;
 choices.innerHTML="";
}
function resolveRetirementCrisis(action){
 const reason=p.retirementCrisisReason||"市場與身體狀況讓職業生涯難以延續";
 if(action==="retire"){retireCareer(`${reason}；你選擇接受退場`);return}
 if(action==="lastDance"){
   if(p.lastDanceUsed)return;
   p.lastDanceUsed=true;
   const c=retirementHomecomingContract();
   p.homecomingTeam=c.team;p.homecomingRegion=homecomingRegion().label;
   logIt(`🏠 最後一舞：與 ${c.team} 簽下1年告別巡迴合約`);
   pushNews(`🏠 ${p.name} 宣布回到台灣，與 ${c.team} 展開生涯最後一舞`,{type:"career",importance:4,league:c.league});
   startVeteranExtension(c,"lastDance",`<div class="notice awake"><b>🏠 家鄉最後一舞</b><br>你接受限時輪替與降薪，這一季結束後將正式退休。</div>`);
   return;
 }
 if(action==="defy"){
   if(p.retirementDefianceUsed)return;
   const chance=retirementDefianceChance(),r=RNG(p.seed+"retirement-defiance-"+p.year+"-"+(p.retirementCrisisCount||0));
   p.retirementDefianceUsed=true;p.rep=Math.max(-20,(p.rep||0)-1);
   if(r()*100<chance){
     const proofLeague=overall()>=58?"台灣職業":"SBL／半職業";
     let c=makeContract(proofLeague,Math.max(50,scoutingScore()-8),"veteran-proof-"+p.year,null,true);
     c.years=c.remaining=1;c.type="老將證明約";c.role="板凳老將／需證明更衣室價值";c.bonus=0;c.salary=Math.max(20,Math.round(c.salary*.55));c=finalizeContract(c);
     p.retirementDefianceSucceeded=true;
     logIt(`🔥 封閉測試成功：${c.team} 提供1年老將證明約`);
     startVeteranExtension(c,"defy",`<div class="notice awake"><b>🔥 封閉測試成功</b><br>你拿到1年證明約，球隊信任 -1，角色降為板凳老將。下一季仍必須重新接受市場評估。</div>`);
   }else{
     logIt("🔥 強迫續留失敗：球隊與其他市場同時關門");
     retireCareer(`${reason}；你選擇自費證明自己，但封閉測試後仍沒有球隊願意提供合約`);
   }
   return;
 }
 if(action==="pressure"){
   if(p.retirementPressureUsed)return;
   const chance=retirementMediaPressureChance(),origin=p.marketOriginTeam||p.team,league=p.marketOriginLeague||p.path,r=RNG(`${p.seed}-retirement-pressure-${p.year}-${origin}`);
   p.retirementPressureUsed=true;p.rep=Math.max(-40,(p.rep||0)-8);p.discipline=Math.max(0,(p.discipline||0)-6);p.scandalCount=(p.scandalCount||0)+1;unlockTitle("lockerroom");
   if(r()*100<chance&&leagueTeamPool(league).includes(origin)){
     let c=makeContract(league,Math.max(48,scoutingScore()-12),"forced-return-"+p.year,origin,true);
     c.years=c.remaining=1;c.type="球團壓力短約";c.role="板凳末端／更衣室觀察名單";c.bonus=0;c.salary=Math.max(20,Math.round(c.salary*.42));c=finalizeContract(c);
     logIt(`📣 公開施壓成功：${origin} 勉強提供1年低角色短約`);
     startVeteranExtension(c,"pressure",`<div class="notice fail"><b>📣 母隊讓步，但關係破裂</b><br>你得到最後一年合約，同時解鎖負面稱號【休息室毒瘤】；球隊信任、紀律與後續市場評價都受到影響。</div>`);
   }else{
     logIt(`📣 公開施壓失敗：${origin} 拒絕重啟談判`);
     retireCareer(`${reason}；你向母隊公開施壓仍未換得合約，更衣室關係也在爭議中破裂`);
   }
 }
}
function maybeForceRetire(){
 if(!isProPath()&&p.path!=="半職業")return false;
 if(p.lastDanceActive){
   p.year++;p.age++;
   retireCareer("完成家鄉最後一舞後，依照告別合約正式退休");return true;
 }
 // 有效合約必須先走完；球隊可以縮減角色，但不能把仍有保障年限的球員直接判定退休。
 // 正式退場只會發生在合約到期、全市場搜尋與公開測試都失敗之後。
 return false;
}
