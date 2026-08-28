function legacyWeeklyTalent(r,tier,pos,bodyMods={}){
 const boost=()=>ri(r,tier.start[0],tier.start[1]);
 const stats={
   shoot:ri(r,31,45)+boost(),finish:ri(r,31,45)+boost(),handle:ri(r,29,45)+boost(),pass:ri(r,29,45)+boost(),
   defense:ri(r,29,45)+boost(),rebound:ri(r,27,43)+boost(),ath:ri(r,33,48)+boost(),iq:ri(r,30,45)+boost()
 };
 if(pos==="PG"){stats.handle+=7;stats.pass+=7}
 if(pos==="SG"){stats.shoot+=7;stats.finish+=4}
 if(pos==="SF"){stats.finish+=5;stats.defense+=4}
 if(pos==="PF"){stats.rebound+=7;stats.defense+=4}
 if(pos==="C"){stats.rebound+=10;stats.defense+=7}
 Object.entries(bodyMods).forEach(([key,value])=>{stats[key]+=value});
 Object.keys(stats).forEach(key=>{stats[key]=Math.max(22,Math.min(58,stats[key]))});
 const caps={};Object.keys(stats).forEach(key=>{caps[key]=Math.min(99,stats[key]+ri(r,tier.cap[0],tier.cap[1]))});
 return {stats,caps,growth:ri(r,tier.growth[0],tier.growth[1])};
}

function startCareer(sharedContext=null){
 // A career is always playable offline. Online nickname and authentication are
 // requested only when publishing a retired career or opening community data.
 const seed=sharedContext?.seed||setupSeedValue();
 if(!/^[A-Z0-9]{8}$/.test(seed)){
   normalizeSeedInput();
   const el=document.getElementById("seed"),err=document.getElementById("seedError");
   el?.classList.add("invalid");if(err)err.textContent="請輸入完整的 8 碼英文字母／數字 Seed。";el?.focus();return;
 }
 const previousSave=sharedContext?null:readCareerSave();
 if(previousSave&&!window.confirm("開始新人生會覆蓋目前的本機生涯存檔，確定要繼續嗎？"))return;
 if(previousSave)clearCareerSave(false);
 if(sharedContext){chosenPos=POSITIONS.includes(sharedContext.pos)?sharedContext.pos:"PG";chosenHeight=Number(sharedContext.height)||chosenHeight;chosenWingspan=Number(sharedContext.wingspan)||chosenWingspan;chosenBirthplace=sharedContext.birthplace||chosenBirthplace;chosenCareerMode=sharedContext.mode==="highlight"?"highlight":"complete"}
 const n=sharedContext?.name||document.getElementById("playerNameInput").value.trim()||"籃球癡漢",r=RNG(seed+chosenPos);
 const weekly=weeklyChallengeProfile(),weeklyBoard=weeklyLeaderboardProfile();
 const weeklySetupMatches=weeklySetupActive&&seed===weekly.seed&&chosenPos===weekly.pos&&chosenHeight===weekly.height&&chosenWingspan===weekly.wingspan;
 const legacyWeeklyChallenge=weeklySetupMatches&&weeklyBoard.legacy;
 const seedTierMapVersion=legacyWeeklyChallenge?V90_LEGACY_SEED_TIER_MAP_VERSION:V90_SEED_TIER_MAP_VERSION,tier=seedTierProfile(seed,seedTierMapVersion);
 const bodyMods=bodyAttributeModifiers(chosenPos,chosenHeight,chosenWingspan);
 const talent=legacyWeeklyChallenge?legacyWeeklyTalent(r,tier,chosenPos,bodyMods):v90GenerateTalent(seed,chosenPos,tier,bodyMods),s=talent.stats,caps=talent.caps;

 const birthplaceChoice=chosenBirthplace;
 const birthplace=birthplaceChoice==="RANDOM"?TAIWAN_BIRTHPLACES[ri(RNG(`${seed}-birthplace`),0,TAIWAN_BIRTHPLACES.length-1)]:birthplaceChoice;
 const jerseyNumber=Math.max(0,Math.min(99,Math.round(Number(sharedContext?.jerseyNumber??document.getElementById("jerseyNumberInput")?.value)||7)));
 const handedness=sharedContext?.handedness||document.getElementById("handednessInput")?.value||"右手";
 const friendName=document.getElementById("careerFriendNameInput")?.value.trim()||v8Pick(V8_TEAMMATES,`${seed}-friend`);
 const rivalName=document.getElementById("careerRivalNameInput")?.value.trim()||v8Pick(V8_RIVALS,`${seed}-rival`);
 const weeklyChallenge=weeklySetupMatches?{active:true,id:weeklyBoard.id,label:weekly.label,seed:weekly.seed,pos:weekly.pos,height:weekly.height,wingspan:weekly.wingspan}:{active:false};
 resetLiveTicker();
 p={name:n,pos:chosenPos,seed,avatarSeed:selectedAvatarSeed(),heightCm:chosenHeight,wingspanCm:chosenWingspan,birthplace,jerseyNumber,handedness,readingMode:"standard",careerMode:weeklySetupMatches?"complete":chosenCareerMode,weeklyChallenge,careerVersion:legacyWeeklyChallenge?"8.1.1":"9.1.1",...(legacyWeeklyChallenge?{}:{talentVersion:1,talentProfile:talent.profile,seedTierMapVersion}),seedTier:tier.key,seedTierLabel:tier.label,seedTierDesc:tier.desc,
 age:16,year:2026,path:"HBL",grade:1,stage:"training",stats:s,caps,growth:talent.growth,
 durability:ri(r,38,94),clutch:ri(r,35,96),discipline:ri(r,38,94),confidence:50,health:100,fatigue:0,six:0,genius:false,geniusType:"",round:0,eventIndex:0,
 seasonEventCount:ri(r,2,4),dice:[],used:[],trainingUndo:[],trainingProgress:{shoot:0,finish:0,handle:0,pass:0,defense:0,rebound:0,ath:0,iq:0},pointUndo:[],seasonPoints:0,bonusPoints:0,rep:0,injury:null,injuryHistory:[],log:[],seasonStats:null,team:"",geniusResolved:false,geniusFailed:false,transition:null,geniusCostDiscount:0,titles:[],titleHistory:[],seasonPointFocus:[],clutchWins:0,eventSuccesses:0,healthySeasons:0,championships:0,severeInjuryRecovered:false,offers:[],strategyStats:{risk:{pick:0,success:0,streak:0,best:0},balance:{pick:0,success:0,streak:0,best:0},safe:{pick:0,success:0,streak:0,best:0}},seasonEventSuccess:0,geniusFailureShown:false,careerSeason:0,contract:null,seasonPlan:null,planRiskMod:0,planGrowthMod:0,planStatMod:0,nationalCaps:0,relationship:"單身",lifeEventCount:0,news:[],seasonHistory:[],careerAwards:[],careerSalary:0,careerGames:0,careerPtsTotal:0,careerRebTotal:0,careerAstTotal:0,chainTitles:[],retired:false,retirementReason:"",peakOverall:0,ageDeclineStage:0,careerMVP:0,careerFirstTeam:0,careerSecondTeam:0,careerDPOY:0,careerScoringTitles:0,careerAssistTitles:0,
 careerReboundTitles:0,careerAllStar:0,careerFinalsMVP:0,careerNationalAwards:0,leagueHistory:{},teamsPlayed:[],tradeCount:0,
 surgeries:0,children:0,familyPlanningClosed:false,married:false,partnerName:"",partnerProfile:{},romanceCandidate:{},formerPartners:[],relationshipYears:0,romanceAttempts:0,affairCount:0,endorsementIncome:0,careerBlocksTotal:0,
 hallOfFame:[],jerseyRetired:[],careerRating:0,retirementSummaryReady:false,missedSeasons:0,peakAge:16,
 geniusAwakeningShown:false,bankedPoints:0,careerBasketballSalary:0,careerSigningBonus:0,
 bodyVulnerability:0,bodyNote:"",preseasonPlanNotice:"",
 specialQueue:[],specialIndex:0,seasonKeyBattleResult:null,pendingSeasonKeyBattle:null,romanceStage:0,romanceNextYear:0,romanceLastResult:"",nationalCallups:0,u18Caps:0,u20Caps:0,youthNationalAwards:0,lastNationalCallupYear:0,nationalSelectionStreak:0,familyHarmony:60,scandalCount:0,divorced:false,
 conductMarketPenalty:0,conductSuspensionGames:0,nationalTeamBanUntil:0,conductPenaltySetYear:0,offCourtHistory:[],offCourtEventKinds:[],lastOffCourtEventYear:0,financialLosses:0,
 specialBonusPoints:0,internationalHistory:[],championshipHistory:[],awardHistoryByLeague:{},lastSeasonAwards:[],hallVotes:[],
    bodyLoad:0,oldInjuries:{},oldInjuryFloors:{},oldInjuryLastYear:{},rehabBoost:0,medicalHistory:[],medicalPressureHistory:[],lastMedicalPressureYear:0,majorInjuryCount:0,careerThreatInjuries:0,recoverySeasons:0,seasonInjuryRiskTarget:0,seasonInjurySurvival:1,seasonInjuryChecksDone:0,seasonInjuryExtra:0,seasonMedicalEventShown:false,seasonNaturalInjuryChecked:false,
    recentEvents:[],eventMemory:{},specialEventMemory:{},feedHistory:[],relationshipHistory:[],chainQueue:[],storyBeats:[],seasonStoryCandidates:[],roleHistory:[],careerStoryHistory:[],careerStoryPending:[],careerStorySeen:[],careerStoryThemeYears:{},careerIntroductions:{},careerStoryLineSelection:{version:1,character:[],team:[],life:[],late:[]},highlightHistory:[],highlightChapterHistory:[],openingCareerStoryYear:0,specialReturnStage:"",careerCast:{friend:{name:friendName,trait:"從學生時期就陪你練球",trust:58,metYear:2026},rival:{name:rivalName,trait:"從學生時期一路被拿來比較",respect:42,metYear:2026}},teamWorld:{},roleState:{},expandedFeedYear:null,showOlderFeedYears:false,pendingRenewalOffer:null,pendingNBAOffer:null,pendingTryoutOffer:{},declinedTryoutCount:0,marketOriginTeam:"",marketOriginLeague:"",marketReturnOffer:null,marketReturnMode:"",
    medicalProtectionUntilYear:0,medicalProtectionReason:"",medicalProtectedArea:"",postOpCareChosen:false,lastMajorInjuryYear:0,
    lastDanceActive:false,lastDanceUsed:false,retirementDefianceUsed:false,retirementDefianceSucceeded:false,retirementPressureUsed:false,retirementCrisisCount:0,retirementCrisisReason:"",homecomingTeam:"",homecomingRegion:"",
    publicCareerId:"",publicCareerUploadId:"",leaderboardChoice:null,retirementRankSummary:null,careerUploadError:null,diceRevealCount:0,diceRolling:false,
    developmentSeasons:0,developmentLastChanceUsed:false,firstFullProAge:null,pendingSeasonAdvance:false,freshmanDraftAttempted:false,collegeDraftHistory:[],draftEntrySelections:[],proEntrySource:"",proEntryYear:0,franchiseTeam:""};

 if(sharedContext)p.onlineSharedWorld={code:sharedContext.code,role:sharedContext.role,mode:chosenCareerMode,readyYear:null};
 p.team=HBL_TEAMS[ri(RNG(p.seed+"hbl-team"),0,HBL_TEAMS.length-1)];
 ensureV8CareerState(p);if(!legacyWeeklyChallenge)ensureV90MidcareerState(p);refreshV8Role(p,"生涯起點");
 document.getElementById("setup").classList.add("hidden");document.getElementById("game").classList.remove("hidden");
 logIt(`16歲，加入 ${p.team} 籃球隊。`);ensureTeamHistory();pushNews(`🆕 ${p.name} 加入 ${p.team}，籃球人生正式開始`);showCareerChapter("highschoolStart");saveCareerNow();
}
function safeStartCareer(){
 try{return startCareer()}
 catch(err){
   console.error("BasketballLife start failed:",err);
   const box=document.getElementById("seedError"),btn=document.getElementById("startCareerBtn");
   if(box)box.textContent=`開局失敗：${err?.message||"未知錯誤"}`;
   if(btn){btn.disabled=false;btn.textContent="重新踏上球場"}
   return false;
 }
}
function overall(){return Math.round(Object.values(p.stats).reduce((a,b)=>a+b,0)/8)}
function setReadingMode(mode,skipSave=false){
 mode=["standard","large","compact"].includes(mode)?mode:"standard";
 document.body.classList.remove("read-large","read-compact");
 if(mode!=="standard")document.body.classList.add(`read-${mode}`);
 document.querySelectorAll(".densityBtn").forEach(btn=>btn.classList.toggle("active",btn.dataset.mode===mode));
 try{localStorage.setItem("basketballlife_reading_mode",mode)}catch(_){}
 if(p){p.readingMode=mode;if(!skipSave)scheduleCareerAutosave()}
 setTimeout(fitGameToViewport,0);
}
function logIt(x){p.log.unshift(`${p.year}｜${x}`);p.log=p.log.slice(0,50)}
function render(){
 const gameEl=document.getElementById("game");if(gameEl)gameEl.dataset.stage=p.stage||"";
 const quickRestartBtn=document.getElementById("quickRestartBtn");
 if(quickRestartBtn)quickRestartBtn.classList.toggle("hidden",!p||p.retired);
 renderFeedHistory();
 setTimeout(fitGameToViewport,0);
 setReadingMode(p.readingMode||"standard",true);
 pname.textContent=displayPlayerName(p.name);ppos.textContent=`#${p.jerseyNumber??7}・${p.pos}・${p.heightCm||"—"}cm`;
 ppos.title=`${p.handedness||"右手"}｜臂展 ${p.wingspanCm||"—"} cm｜出生地 ${p.birthplace||"未設定"}`;teamname.textContent=currentTeam()?`・${currentTeam()}`:"";
 renderPlayerAvatar(document.getElementById("playerAvatar"),p.avatarSeed,p.pos,p.age,`${p.name} 的球員頭像`);
 age.textContent=p.age;year.textContent=p.year;ovr.textContent=overall();path.textContent=p.path;
 if(injurySummary)injurySummary.innerHTML=p.injury?`目前傷勢：<span class="bad">${p.injury.name}（${p.injury.level}）</span>`:(p.injuryHistory.length?`傷病履歷：${p.injuryHistory.length} 次正式傷勢`:"目前沒有正式傷病紀錄。");
 if(log)log.innerHTML=p.log.map(x=>`<div>• ${x}</div>`).join("");
 const cl=confidenceLabel();
 titleShelf.innerHTML=([...[...p.titles,...p.chainTitles].map(t=>{const def=typeof titleDefinition==="function"?titleDefinition(t):{};const effect=t.id==="genius"?(t.effect||def.effect):(def.effect||t.effect);return `<span class="titleBadge ${titleRarityClass(t)}" tabindex="0" data-tip="${escapeFeedText(effect||"生涯特殊稱號")}">${def.name||t.name}</span>`}),
 `<span class="mentalBadge ${cl.cls}" tabindex="0" data-tip="影響重大選擇的結果、臨場表現與市場評價">心理｜${cl.name} ${p.confidence}</span>`,
 `<span class="mentalBadge" tabindex="0" data-tip="影響上場時間、續約與市場價值">球隊信任｜${p.rep>=0?"+":""}${p.rep}</span>`]).join("");
 refreshTicker();
 if(isProPath()){
   proTopStrip.classList.remove("hidden");
   proTopStrip.innerHTML=`
    <div class="proTopItem"><small>目前合約</small><b>${p.contract?.terminated?"已遭球團終止":p.contract?(p.contract.type||"職業合約"):"-"}</b></div>
    <div class="proTopItem"><small>目前年薪</small><b>${p.contract&&!p.contract.terminated?moneyText(p.contract.salary||0):"0萬"}</b></div>
    <div class="proTopItem"><small>生涯總得分</small><b>${Math.round(p.careerPtsTotal||0).toLocaleString("en-US")}分</b></div>
    <div class="proTopItem"><small>球員薪資累計</small><b>${moneyText(p.careerBasketballSalary||0)}</b></div>
    <div class="proTopItem"><small>合約剩餘</small><b>${p.contract?.terminated?"已終止":`${p.contract?Math.max(0,p.contract.remaining||0):0}年`}</b></div>`;
 }else{
   proTopStrip.classList.add("hidden");proTopStrip.innerHTML="";
 }
 flow.innerHTML=p.stage==="transition"?"":[["training","季初特訓"],["events","一般事件"],["special","特殊事件"],["health","健康"],["results","賽季結算"],["points","能力點"]].map(([k,t])=>`<span class="${p.stage===k?"on":""}">${t}</span>`).join("");
}

function abilityHelpPopover(){
 let pop=document.getElementById("abilityHelpPopover");
 if(pop)return pop;
 pop=document.createElement("div");pop.id="abilityHelpPopover";pop.className="abilityHelpPopover";pop.hidden=true;pop.setAttribute("role","tooltip");
 pop.innerHTML='<b class="abilityHelpTitle"></b><span class="abilityHelpText"></span>';
 document.body.appendChild(pop);return pop;
}
function closeAbilityHelp(el=null){
 const pop=document.getElementById("abilityHelpPopover"),active=el||document.querySelector(".abilityHelpCard.helpOpen");
 if(active){active.classList.remove("helpOpen");active.setAttribute("aria-expanded","false")}
 if(pop){pop.hidden=true;pop.removeAttribute("data-ability");pop.removeAttribute("data-pinned")}
}
function showAbilityHelp(el,pinned=false){
 if(!el)return;const key=el.dataset.ability,pop=abilityHelpPopover();
 document.querySelectorAll(".abilityHelpCard.helpOpen").forEach(node=>{if(node!==el){node.classList.remove("helpOpen");node.setAttribute("aria-expanded","false")}});
 el.classList.add("helpOpen");el.setAttribute("aria-expanded","true");pop.dataset.ability=key;if(pinned)pop.dataset.pinned="1";pop.querySelector(".abilityHelpTitle").textContent=L[key]||"能力影響";pop.querySelector(".abilityHelpText").textContent=ABILITY_HELP[key]||"影響球場表現。";pop.hidden=false;
 requestAnimationFrame(()=>{const box=el.getBoundingClientRect(),gap=8,pad=12,w=pop.offsetWidth,h=pop.offsetHeight;let left=Math.max(pad,Math.min(box.left+(box.width-w)/2,innerWidth-w-pad)),top=box.bottom+gap;if(top+h>innerHeight-pad)top=Math.max(pad,box.top-h-gap);pop.style.left=`${Math.round(left)}px`;pop.style.top=`${Math.round(top)}px`});
}
function pinAbilityHelp(el){showAbilityHelp(el,true)}
function leaveAbilityHelp(el){const pop=document.getElementById("abilityHelpPopover");if(pop?.dataset.pinned!=="1")closeAbilityHelp(el)}
function toggleAbilityHelp(el){
 if(!el)return;const pop=document.getElementById("abilityHelpPopover"),same=el.classList.contains("helpOpen")&&!pop?.hidden&&pop.dataset.pinned==="1";same?closeAbilityHelp(el):pinAbilityHelp(el);
}
document.addEventListener("pointerdown",event=>{if(!event.target.closest?.(".abilityHelpCard")&&!event.target.closest?.("#abilityHelpPopover"))closeAbilityHelp()});
window.addEventListener("resize",()=>closeAbilityHelp());window.addEventListener("scroll",()=>closeAbilityHelp(),true);
function trainingCardStage(){
 const ov=overall(),ageBand=typeof progressionAgeBand==="function"?progressionAgeBand(p):(p.age>=35?"veteran":"prime");
 if(["veteran","maintenance"].includes(ageBand)){
  if(ov>=85)return {id:"icon",label:"傳奇老將",eyebrow:"LEGEND"};
  return {id:"veteran",label:"老將篇章",eyebrow:"VETERAN"};
 }
 if(ov>=85)return {id:"icon",label:"傳奇戰力",eyebrow:"LEGEND"};
 if(ov>=75)return {id:"prime",label:"菁英戰力",eyebrow:"ELITE"};
 if(ov>=60)return {id:"pro",label:"主力戰力",eyebrow:"CORE"};
 return {id:"campus",label:"潛力戰力",eyebrow:"PROSPECT"};
}
function trainingRadarMetrics(){
 const s=p.stats||{};
 return ["shoot","finish","handle","pass","defense","rebound","ath","iq"]
  .map((key,index)=>({key,index,label:L[key]||key,value:Math.max(0,Math.min(99,Math.round(Number(s[key])||0)))}))
  .sort((a,b)=>b.value-a.value||a.index-b.index);
}
function trainingRadarHTML(){
 const ranked=trainingRadarMetrics(),metrics=ranked.slice(0,5),secondary=ranked.slice(5),centerX=70,centerY=66,point=(radius,index)=>{const angle=-Math.PI/2+index*Math.PI*2/metrics.length;return `${(centerX+Math.cos(angle)*radius).toFixed(1)},${(centerY+Math.sin(angle)*radius).toFixed(1)}`};
 const rings=[14,28,42].map(radius=>`<polygon points="${metrics.map((_,index)=>point(radius,index)).join(" ")}"/>`).join("");
 const axes=metrics.map((_,index)=>`<line x1="${centerX}" y1="${centerY}" x2="${point(42,index).replace("," , '" y2="')}"/>`).join("");
 const values=metrics.map((metric,index)=>point(42*Math.max(0,Math.min(100,metric.value))/100,index)).join(" ");
 const labels=metrics.map((metric,index)=>{const [x,y]=point(59,index).split(",");return `<text x="${x}" y="${y}" text-anchor="middle"><tspan x="${x}">${metric.label}</tspan><tspan x="${x}" dy="11">${metric.value}</tspan></text>`}).join("");
 return `<div class="careerCardRadar"><svg viewBox="0 0 140 132" role="img" aria-label="球員最高五項能力：${metrics.map(metric=>`${metric.label} ${metric.value}`).join("、")}；其餘能力：${secondary.map(metric=>`${metric.label} ${metric.value}`).join("、")}"><g class="careerCardRadarGrid">${rings}${axes}</g><polygon class="careerCardRadarValue" points="${values}"/><circle cx="${centerX}" cy="${centerY}" r="2.5"/><g class="careerCardRadarLabels">${labels}</g></svg><div class="careerCardRadarRest">${secondary.map(metric=>`<span><em>${metric.label}</em><b>${metric.value}</b></span>`).join("")}</div></div>`;
}
function trainingPlayerCardHTML(derived){
 const stage=trainingCardStage(),role=derived?.role?.label||p.talentProfile?.label||"攻守平衡",team=currentTeam()||leagueDisplay(p.path),league=leagueDisplay(p.path),ov=overall();
 return `<article class="careerPlayerCard card-${stage.id}" data-card-tier="${stage.eyebrow}" aria-label="${escapeFeedText(p.name)} 的本季球員卡">
  <header><span><i aria-hidden="true"></i>${stage.eyebrow} · ${stage.label}</span><b title="${escapeFeedText(team)}">${escapeFeedText(team)}</b></header>
  <div class="careerPlayerCardHero"><div class="careerCardPortrait"><div class="careerCardAvatar" data-training-avatar></div><span>#${p.jerseyNumber??7}</span></div><div class="careerCardOvr"><small>OVR</small><strong>${ov}</strong><span>${escapeFeedText(p.pos||"—")} · ${escapeFeedText(role)}</span><em>${escapeFeedText(league)}</em></div></div>
  <div class="careerCardIdentity"><b>${escapeFeedText(p.name)}</b><small>${p.age||"—"} 歲 · ${p.heightCm||"—"} cm</small></div>
  ${trainingRadarHTML()}
 </article>`;
}
function trainingRelationshipRows(){
 const cast=p.careerCast||{},rows=[];
 const introduced=(key,person)=>!!person?.name&&!!p.careerIntroductions?.[`${key}:${person.name}`];
 if(introduced("coach",cast.coach))rows.push({type:"教練",name:cast.coach.name,note:`信任 ${Math.round(cast.coach.trust??50)} · ${cast.coach.trait||"負責本季輪替"}`});
 if(introduced("agent",cast.agent))rows.push({type:"經紀人",name:cast.agent.name,note:`信任 ${Math.round(cast.agent.trust??50)} · ${cast.agent.trait||"處理合約與市場"}`});
 if(introduced("friend",cast.friend))rows.push({type:"朋友",name:cast.friend.name,note:`${cast.friend.trait||"從學生時期認識"} · ${cast.friend.metYear||2026} 年相識`});
 if(introduced("rival",cast.rival))rows.push({type:"宿敵",name:cast.rival.name,note:`${cast.rival.trait||"長期競爭對手"} · 尊重 ${Math.round(cast.rival.respect??42)}`});
 return rows.slice(0,4);
}
function trainingSeasonContextHTML(){
 const derived=typeof v811AbilityProfile==="function"?v811AbilityProfile(p):null,role=p.roleState?.currentLabel||derived?.role?.label||(isProPath()?"競爭輪替":"校隊球員");
 const total=Array.isArray(p.dice)?p.dice.length:0,used=Array.isArray(p.used)?p.used.filter(Boolean).length:0,remaining=Math.max(0,total-used),health=Math.max(0,Math.min(100,Math.round(Number(p.health)||0))),load=Math.max(0,Math.min(100,Math.round(Number(p.bodyLoad)||0)));
 const people=trainingRelationshipRows(),recent=String(p.log?.[0]||"新球季剛開始，尚無新的生涯紀錄。").replace(/^\d{4}｜/,"");
 const open=typeof window!=="undefined"&&window.matchMedia?.("(min-width:820px)").matches?" open":"";
 return `<details class="trainingContextPanel"${open}><summary><span><small>THIS SEASON</small><b>本季脈絡</b></span><em>${escapeFeedText(role)}</em></summary><div class="trainingContextBody">
  <section class="trainingSituation"><small>目前情境</small><b>${escapeFeedText(currentTeam()||leagueDisplay(p.path))}</b><span>${escapeFeedText(leagueDisplay(p.path))} · ${p.year} 賽季</span><strong>${escapeFeedText(role)}</strong></section>
  <section><small>本季目標</small><div class="trainingGoal"><span><b>建立 ${escapeFeedText(derived?.growthDirection?.label||"穩定角色")}</b><em>${remaining}/${total||0} 次訓練待分配</em></span><i style="--progress:${total?Math.round(used/total*100):0}%"></i></div><div class="trainingGoal"><span><b>維持可出賽狀態</b><em>健康 ${health} · 負荷 ${load}</em></span><i style="--progress:${health}%"></i></div></section>
  <section><small>生涯人物</small><div class="trainingPeople">${people.length?people.map(person=>`<article><span>${escapeFeedText(person.type)}</span><b>${escapeFeedText(person.name)}</b><small>${escapeFeedText(person.note)}</small></article>`).join(""):`<p>這段生涯尚未建立固定人物關係。</p>`}</div></section>
  <section class="trainingRecent"><small>最近紀錄</small><p>${escapeFeedText(recent)}</p></section>
 </div></details>`;
}
function hydrateTrainingPlayerCard(){
 const avatar=document.querySelector("[data-training-avatar]");
 if(avatar&&typeof renderPlayerAvatar==="function")renderPlayerAvatar(avatar,p.avatarSeed,p.pos,p.age,`${p.name} 的球員頭像`);
}
function refreshTrainingOverview(){
 const panel=special?.querySelector(".trainingPanel");if(panel)panel.outerHTML=abilityPanel();
 const context=special?.querySelector(".trainingContextPanel");if(context)context.outerHTML=trainingSeasonContextHTML();
 hydrateTrainingPlayerCard();
}
function abilityPanel(){
 const derived=typeof v811AbilityProfile==="function"?v811AbilityProfile(p):null;
 const talent=typeof v90TalentPanelHTML==="function"?v90TalentPanelHTML(p):"";
 const stats=`<details class="trainingAbilityDetails"><summary><span><b>八項能力</b><small>查看能力、上限與升級進度</small></span><strong>詳細資料</strong></summary><div class="trainingStats">${Object.entries(p.stats).map(([k,v])=>{
   const talent=p.caps[k],over=v>talent,maxed=v>=99;
   const cost=maxed?0:pointCost(k),progress=Math.floor(p.trainingProgress?.[k]||0),need=Math.max(0,cost-progress);
   const detail=maxed
     ? `<div class="trainingCostDetail"><b>已達 99</b>｜無法再提升</div>`
     : `<div class="trainingCostDetail"><b>${v}→${v+1} 需要 ${cost} 點</b>｜已存 ${progress}/${cost}｜還差 ${need} 點</div>`;
    return `<div class="stat abilityHelpCard" data-ability="${k}" tabindex="0" role="button" aria-expanded="false" aria-label="${L[k]}：${ABILITY_HELP[k]||"影響球場表現。"}" onclick="pinAbilityHelp(this)" onmouseenter="showAbilityHelp(this)" onmouseleave="leaveAbilityHelp(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleAbilityHelp(this)}"><div class="sl"><b>${L[k]} <span class="abilityHelpMark">?</span></b><span class="abilityValue"><span class="abilityScore">${v} / ${talent}</span>${over?` <span class="breakthroughTag">突破 +${v-talent}</span>`:""}</span></div><div class="track"><div class="fill" style="width:${Math.min(v,99)}%"></div></div>${detail}</div>`;
 }).join("")}</div></details>`;
 return `<aside class="trainingPanel">${trainingPlayerCardHTML(derived)}${talent?`<details class="trainingTalentDetails"><summary><span><b>天賦輪廓</b><small>查看核心與延伸適性</small></span><strong>${escapeFeedText(p.talentProfile?.label||derived?.role?.label||"球員特性")}</strong></summary>${talent}</details>`:""}${stats}${typeof v811AbilityPanelHTML==="function"?v811AbilityPanelHTML(derived):""}</aside>`;
}


function escapeFeedText(v){
 return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function feedMetaFromScreen(){
 const c=chapter?.textContent||"";
 const ym=c.match(/(20\d{2})/),am=c.match(/(\d{1,2})歲/);
 return {
   year:ym?Number(ym[1]):(p?.year||0),
   age:am?Number(am[1]):(p?.age||0),
   path:(p?.path||"")
 };
}
function compactFeedSpecial(stage){
 if(!special)return "";
 const clone=special.cloneNode(true);
 clone.querySelectorAll("button,input,select,textarea").forEach(x=>x.remove());

 // Training history should look like a season note, not preserve the whole
 // interactive dice / ability board forever.
 if(stage==="training"){
   const diceCount=p?.dice?.length||0;
   const sixText=(!p?.genius&&!p?.geniusResolved&&p?.age<22&&p?.six>0)
     ? `｜最高點數「6」累計 ${p.six}/5`
     : "";
   return `<div class="feedSimple"><b>本季完成 ${diceCount} 次自主訓練。</b>${sixText}</div>`;
 }

 // Point allocation is an interaction screen rather than a career event.
 if(stage==="points")return "";

 // Strip controls and oversized duplicate skill grids from archived screens.
 clone.querySelectorAll(".trainingPanel,.trainingStats,#assign,#dicepool,#diceMsg,.undo,.retireBtns").forEach(x=>x.remove());
 return clone.innerHTML;
}
function archiveCurrentFeedCard(){
 if(!p||!feedHistory)return;
 const gameEl=document.getElementById("game");
 const stage=gameEl?.dataset?.stage||"";
 if(!["transition","training","events","special","health","results"].includes(stage))return;

 const hasContent=(special?.textContent||"").trim()||(text?.textContent||"").trim();
 if(!hasContent)return;

 const meta=feedMetaFromScreen();
 const screenTitle=(title?.textContent||"").trim();
 const screenText=(text?.textContent||"").trim();
 const specialHTML=compactFeedSpecial(stage);

 // Only archive resolved event screens. An event with active choice buttons is
 // still waiting for the player and should remain the current screen.
 if(stage==="events" && choices && choices.children.length>0)return;

 // Same for special events that have not been resolved yet.
 if(stage==="special" && choices && choices.children.length>0)return;

 const signature=[stage,meta.year,screenTitle,(special?.textContent||"").trim().slice(0,180)].join("|");
 p.feedHistory=p.feedHistory||[];
 if(p.feedHistory.some(x=>x.signature===signature))return;

 const isBirth=stage==="transition" && meta.year===2026 && /高中籃球生涯|生涯起點/.test(screenTitle+" "+(chapter?.textContent||""));
 const label=
   stage==="transition"?(isBirth?"球員誕生":"生涯篇章"):
   stage==="training"?"季初特訓":
   stage==="events"?"事件結果":
   stage==="special"?"特殊事件":
   stage==="health"?"健康回報":
   stage==="results"?"年度賽季":"生涯紀錄";

 p.feedHistory.push({
   signature,stage,year:meta.year,age:meta.age,path:meta.path,
   title:screenTitle,label,
   text:screenText,
   html:specialHTML,
   pinned:false
 });
 // Long careers remain light: full history is stored, but rendered by year.
 if(p.feedHistory.length>90)p.feedHistory=p.feedHistory.slice(-90);
}
function feedYearLabel(entries){
 const e=entries[entries.length-1]||{};
 let path=e.path||"";
 if(path==="HBL"){
   const age=e.age||0;
   path=age<=16?"高一":age===17?"高二":"高三";
 }else{
   path=leagueDisplay?leagueDisplay(path):path;
 }
 return `${e.year} 年 ・ ${e.age||""} 歲 ・ ${path}`;
}
function timelineScreenBudget(){
 const h=window.innerHeight||900;
 return {
   fullCurrent:h>=900?2:1,
   visibleYears:h>=900?3:2
 };
}
function toggleFeedYear(year){
 if(!p)return;
 p.expandedFeedYear=(p.expandedFeedYear===year)?null:year;
 p.showOlderFeedYears=false;
 renderFeedHistory();
}
function toggleOlderFeedYears(){
 if(!p)return;
 p.showOlderFeedYears=!p.showOlderFeedYears;
 p.expandedFeedYear=null;
 renderFeedHistory();
}
function feedArchivedCards(entries){
 if(!entries?.length)return `<div class="feedEmpty">這一年沒有可展開的事件紀錄。</div>`;
 return entries.map(e=>`<div class="feedArchiveCard feed-${e.stage}">
   <div class="feedKicker">◆ ${escapeFeedText(e.label)}${e.title?`｜${escapeFeedText(e.title)}`:""}</div>
   ${e.text?`<div class="feedArchiveText">${escapeFeedText(e.text)}</div>`:""}
   ${e.html?`<div class="feedBody">${e.html}</div>`:""}
 </div>`).join("");
}
function feedYearRow(year,entries){
 const open=p.expandedFeedYear===year;
 return `<button class="feedYearLine ${open?"open":""}" onclick="toggleFeedYear(${year})">
   <span>${escapeFeedText(feedYearLabel(entries))}</span>
   <span>${open?"▾":"▸"}</span>
 </button>
 ${open?`<div class="feedYearDrawer">${feedArchivedCards(entries)}</div>`:""}`;
}
function renderFeedHistory(){
 if(!feedHistory||!p)return;
 const all=p.feedHistory||[];
 if(!all.length){feedHistory.innerHTML="";return;}

 const budget=timelineScreenBudget();
 const normal=all.filter(x=>!x.pinned);
 const years=[...new Set(normal.map(x=>x.year))].sort((a,b)=>a-b);
 let html="";

 const oldYears=years.filter(y=>y<p.year);
 const visibleOld=oldYears.slice(-budget.visibleYears);
 const hiddenOld=oldYears.slice(0,Math.max(0,oldYears.length-budget.visibleYears));

 // Older seasons collapse into one clickable group.
 if(hiddenOld.length){
   html+=`<button class="feedYearLine feedOlder ${p.showOlderFeedYears?"open":""}" onclick="toggleOlderFeedYears()">
     <span>${hiddenOld[0]}～${hiddenOld[hiddenOld.length-1]} ・ 更早生涯 ${hiddenOld.length} 季</span>
     <span>${p.showOlderFeedYears?"▾":"▸"}</span>
   </button>`;
   if(p.showOlderFeedYears){
     html+=`<div class="feedOlderList">`;
     hiddenOld.forEach(y=>{
       const entries=normal.filter(x=>x.year===y);
       html+=feedYearRow(y,entries);
     });
     html+=`</div>`;
   }
 }

 // Recent completed seasons are clickable one-line rows.
 for(const y of visibleOld){
   const entries=normal.filter(x=>x.year===y);
   html+=feedYearRow(y,entries);
 }

 // Current season keeps only newest resolved cards expanded automatically.
 const current=normal.filter(x=>x.year===p.year);
 if(current.length){
   const fullCount=Math.min(budget.fullCurrent,current.length);
   const compactCount=current.length-fullCount;

   if(compactCount>0){
     const currentOpen=p.expandedFeedYear===p.year;
     html+=`<button class="feedYearLine current ${currentOpen?"open":""}" onclick="toggleFeedYear(${p.year})">
       <span>${p.year} 年 ・ 本季較早紀錄 ${compactCount} 筆</span>
       <span>${currentOpen?"▾":"▸"}</span>
     </button>`;
     if(currentOpen){
       html+=`<div class="feedYearDrawer">${feedArchivedCards(current.slice(0,compactCount))}</div>`;
     }
   }

   current.slice(-fullCount).forEach(e=>{
     html+=`<div class="feedCard feed-${e.stage}">
       <div class="feedKicker">◆ ${escapeFeedText(e.label)}${e.title?`｜${escapeFeedText(e.title)}`:""}</div>
       ${e.stage==="transition"&&e.text?`<div class="feedLead">${escapeFeedText(e.text)}</div>`:""}
       ${e.html?`<div class="feedBody">${e.html}</div>`:""}
     </div>`;
   });
 }

 feedHistory.classList.toggle("hasOpenYear",!!p.expandedFeedYear||!!p.showOlderFeedYears);
 feedHistory.innerHTML=html;
}

let viewportFitRAF=0;
function fitGameToViewport(){
 if(viewportFitRAF)cancelAnimationFrame(viewportFitRAF);
 viewportFitRAF=requestAnimationFrame(()=>{
   const game=document.getElementById("game");
   const layout=game?.querySelector(".layout");
   const story=layout?.querySelector("main.story");
   const current=document.getElementById("currentPanel");
   const history=document.getElementById("feedHistory");
   if(!game||game.classList.contains("hidden")||!layout||!story)return;

   const vh=window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 900;
   const stage=game.dataset.stage||"";
   const retiredStage=stage==="retired";
   // Use the current retirement presentation for legacy and V9 saves alike.
   // careerVersion remains untouched so old saves keep their original data rules.
   const v9RetiredStage=retiredStage;
   document.body.classList.toggle("retirementMode",retiredStage);
   document.body.classList.toggle("v9RetirementMode",v9RetiredStage);

   if(v9RetiredStage){
     layout.style.height="";
     story.style.height="";
     if(history){history.style.flexBasis="";history.style.minHeight="";}
     if(current)current.style.maxHeight="";
     document.documentElement.style.removeProperty("--actual-game-height");
     document.body.dataset.viewportBand="retirement";
     return;
   }

   if((window.innerWidth||document.documentElement.clientWidth||999)>0 && (window.innerWidth||document.documentElement.clientWidth)<=700){
     layout.style.height="";
     story.style.height="";
     if(history){
       history.style.flexBasis="";
       history.style.minHeight="";
     }
     if(current)current.style.maxHeight="";
     document.documentElement.style.removeProperty("--actual-game-height");
     document.body.dataset.viewportBand="mobile";
     return;
   }

   const top=layout.getBoundingClientRect().top;
   const bottomGap=8;
   const available=Math.max(420,Math.floor(vh-top-bottomGap));

   layout.style.height=available+"px";
   story.style.height=available+"px";

   if(history){
     history.style.flexBasis="0px";
     history.style.minHeight="0px";
   }
   if(current){
     current.style.maxHeight=Math.max(330,available)+"px";
   }

   document.documentElement.style.setProperty("--actual-game-height",available+"px");
   document.body.dataset.viewportBand=
     vh<720?"xs":vh<820?"sm":vh<940?"md":"lg";
 });
}
function focusCurrentScreen(){
 const current=document.getElementById("currentPanel"),history=document.getElementById("feedHistory");
 if(!current||document.getElementById("game")?.classList.contains("hidden"))return;
 document.body.tabIndex=-1;window.focus();document.body.focus({preventScroll:true});
 if(!window.matchMedia?.("(max-width:700px)").matches)return;
 if(history&&!history.classList.contains("hasOpenYear"))history.scrollTop=history.scrollHeight;
 current.scrollIntoView({block:"start",inline:"nearest",behavior:"auto"});
}
window.addEventListener("resize",fitGameToViewport,{passive:true});
window.addEventListener("orientationchange",fitGameToViewport,{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener("resize",fitGameToViewport,{passive:true});

function resetMain(){
 archiveCurrentFeedCard();
 renderFeedHistory();
 document.getElementById("currentPanel")?.classList.remove("eventOrdinary","eventRare","eventMedical","eventOffCourt");
 if(chapter)chapter.textContent="";
 if(title)title.textContent="";
 if(text){text.textContent="";text.innerHTML="";}
 if(special)special.innerHTML="";
 if(choices)choices.innerHTML="";
 if(next)next.classList.add("hidden");
 setTimeout(()=>{fitGameToViewport();focusCurrentScreen()},0);
}



function isCollegePath(){
 return ["UBA","UBA 強權","NCAA D2","日本大學","NCAA D1"].includes(p.path);
}
function isProPath(){
 return ["SBL／半職業","台灣職業","日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA","海外職業","職業"].includes(p.path);
}
function collegeMaxYears(){
 return 4;
}

function isDevelopmentPath(){
 // 年輕球員把 SBL 當成限期發展跳板；24 歲後回到 SBL 的老將則依一般
 // 職業合約、續約與自由市場運作，不能再套用新秀發展期或升級測試。
 return p.path==="SBL／半職業"&&p.age<=24;
}
function developmentLevel(path){
 return {"SBL／半職業":1,"台灣職業":2,"韓國職業":3,"日本職業":4,"CBA":4,"NBA G League":5,"歐洲聯賽":6,"NBA":7}[path]||0;
}
function leagueMarketRank(path){return developmentLevel(path)}
function developmentSeasonCount(){
 const tracked=Number(p.developmentSeasons||0);
 if(tracked>0)return Math.max(1,tracked);
 // Compatibility for saves created before SBL tenure was tracked separately.
 return Math.max(1,Math.min(4,Number(p.careerSeason||1)));
}
