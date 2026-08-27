/* V9 in-career story callbacks. Retirement pages only summarize completed history. */
function careerStoryStage(player=p){
 const path=String(player?.path||"");
 if(path==="HBL")return "hbl";
 if(["UBA","UBA 強權","NCAA D1","NCAA D2","日本大學"].includes(path))return "college";
 if(["SBL／半職業","台灣職業","日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA","海外職業","職業"].includes(path)){
  // A decline alone is not a veteran story. It also needs a genuinely long
  // professional career, so a young player in a bad season does not receive
  // farewell, mentoring or legacy scenes.
  const firstAge=Number(player?.firstFullProAge),proYears=Number.isFinite(firstAge)?Math.max(0,Number(player?.age||0)-firstAge):0;
  const seasoned=Number(player?.careerSeason||0)>=10||proYears>=8;
  if(seasoned&&typeof careerLifecycleProfile==="function"&&careerLifecycleProfile(player).chapter==="legacy")return "veteran";
  if(typeof careerLifecycleProfile!=="function"&&(Number(player?.age)>=34||Number(player?.careerSeason)>=12))return "veteran";
  return "pro";
 }
 return "other";
}
function ensureCareerStoryState(player=p){
 if(!player||typeof player!=="object")return player;
 player.careerStoryHistory=Array.isArray(player.careerStoryHistory)?player.careerStoryHistory:[];
 player.careerStoryPending=Array.isArray(player.careerStoryPending)?player.careerStoryPending:[];
 player.careerStorySeen=Array.isArray(player.careerStorySeen)?player.careerStorySeen:[];
 player.careerStoryThemeYears=player.careerStoryThemeYears&&typeof player.careerStoryThemeYears==="object"&&!Array.isArray(player.careerStoryThemeYears)?player.careerStoryThemeYears:{};
 player.careerIntroductions=player.careerIntroductions&&typeof player.careerIntroductions==="object"&&!Array.isArray(player.careerIntroductions)?player.careerIntroductions:{};
 player.careerStoryPending.forEach(item=>{
  if(!item||typeof item!=="object")return;
  const target=careerStoryEventById(item.eventId),source=careerStoryEventById(item.sourceEventId)||((target?.line&&Number(target.node)>1)?(CAREER_STORY_EVENTS||[]).find(event=>event.line===target.line&&Number(event.node)===Number(target.node)-1):null);
  if(!item.line)item.line=source?.line||careerStoryEventById(item.eventId)?.line||"";
  if(!item.sourceEventId&&source)item.sourceEventId=source.id;
  if(!item.sourceTitle&&source)item.sourceTitle=careerStoryText(source.title,player,item);
  if(!Number.isFinite(Number(item.earliestYear)))item.earliestYear=Number(item.dueYear)||Number(player.year)||2026;
  if(!Number.isFinite(Number(item.latestYear)))item.latestYear=Number(item.earliestYear)+2;
  if(!item.createdYear)item.createdYear=Math.min(Number(item.earliestYear)-1,Number(player.year)||2026);
 });
 return player;
}
function careerStoryEventById(id){return (CAREER_STORY_EVENTS||[]).find(event=>event.id===id)||null}
function careerStoryEscape(value){
 return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
}
function careerStoryOverall(player=p){
 const values=Object.values(player?.stats||{}).map(Number).filter(Number.isFinite);
 return values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0;
}
function careerStoryRecognition(player=p){
 const arrays=[player?.lastSeasonAwards,player?.awards,player?.honors,player?.internationalHistory];
 return arrays.reduce((sum,rows)=>sum+(Array.isArray(rows)?rows.length:0),0)+Number(player?.championships||0)+Number(player?.mvpCount||0);
}
function careerStoryRequirementEligible(event,player=p){
 const req=event?.requirements||{},season=player?.seasonStats||{},contract=player?.contract||{};
 const age=Number(player?.age||0),grade=Number(player?.grade||0),careerSeason=Number(player?.careerSeason||0);
 const games=Number(season.games||0),mins=Number(season.mins||0),pts=Number(season.pts||0),rep=Number(player?.rep||0);
 const health=Number(player?.health??100),bodyLoad=Number(player?.bodyLoad||0),careerGames=Number(player?.careerGames||0);
 const path=String(player?.path||""),overseas=CAREER_STORY_OVERSEAS_PATHS.has(path);
 if(Array.isArray(req.paths)&&!req.paths.includes(path))return false;
 if(Array.isArray(req.excludePaths)&&req.excludePaths.includes(path))return false;
 if(Number.isFinite(Number(req.minAge))&&age<Number(req.minAge))return false;
 if(Number.isFinite(Number(req.maxAge))&&age>Number(req.maxAge))return false;
 if(Number.isFinite(Number(req.minGrade))&&grade<Number(req.minGrade))return false;
 if(Number.isFinite(Number(req.minCareerSeason))&&careerSeason<Number(req.minCareerSeason))return false;
 if(Number.isFinite(Number(req.minGames))&&games<Number(req.minGames))return false;
 if(Number.isFinite(Number(req.minMins))&&mins<Number(req.minMins))return false;
 if(Number.isFinite(Number(req.maxMins))&&mins>Number(req.maxMins))return false;
 if(Number.isFinite(Number(req.minPts))&&pts<Number(req.minPts))return false;
 if(Number.isFinite(Number(req.minRep))&&rep<Number(req.minRep))return false;
 if(Number.isFinite(Number(req.minHealth))&&health<Number(req.minHealth))return false;
 if(Number.isFinite(Number(req.maxHealth))&&health>Number(req.maxHealth))return false;
 if(Number.isFinite(Number(req.minBodyLoad))&&bodyLoad<Number(req.minBodyLoad))return false;
 if(Number.isFinite(Number(req.minCareerGames))&&careerGames<Number(req.minCareerGames))return false;
 if(Number.isFinite(Number(req.minRecognition))&&careerStoryRecognition(player)<Number(req.minRecognition))return false;
 if(Number.isFinite(Number(req.contractMinRemaining))&&(!player?.contract||Number(contract.remaining||0)<Number(req.contractMinRemaining)))return false;
 if(Number.isFinite(Number(req.contractMaxRemaining))&&(!player?.contract||Number(contract.remaining||0)>Number(req.contractMaxRemaining)))return false;
 if(req.contractOptionPending===true&&(!player?.contract||String(contract?.option?.type||"none")==="none"||String(contract?.option?.status||"")!=="pending"))return false;
 if(req.overseas===true&&!overseas||req.overseas===false&&overseas)return false;
 if(req.hasPartner===true&&!(player?.married||player?.partnerName))return false;
 if(req.hasNationalCaps===true&&Number(player?.nationalCaps||0)<1)return false;
 if(req.medicalConcern===true&&!player?.injury&&!(player?.injuryHistory||[]).length&&health>88&&bodyLoad<48)return false;
 if(Array.isArray(req.roles)&&!req.roles.includes(String(player?.roleState?.current||"")))return false;
 return true;
}
function careerStoryEventEligible(event,player=p,{followUp=false}={}){
 if(!event||!player||player.retired)return false;
 const stage=careerStoryStage(player),stages=Array.isArray(event.stages)?event.stages:[];
 if(!stages.includes(stage))return false;
 if(!careerStoryRequirementEligible(event,player))return false;
 if(event.theme==="injury"&&event.line==="playoff_injury"&&!followUp&&!player.injury&&(player.bodyLoad||0)<48&&(player.health||100)>80)return false;
 if(event.id==="pro_trade_arrival"&&!followUp&&Number(player.tradeCount||0)<1)return false;
 if(event.id==="national_miss_1"&&!followUp){
  const overall=typeof progressionOverall==="function"?progressionOverall(player):careerStoryOverall(player);
  const season=player.seasonStats||{},scheduled=Math.max(1,Number(season.scheduledGames)||36),availability=Number(season.games||0)/scheduled;
  const credibleStage=stage==="college"||["台灣職業","日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA"].includes(String(player.path||""));
  const candidate=player.nationalObservationCandidate;
  if(!candidate||Number(candidate.year)!==Number(player.year)||Number(player.age||0)>34||overall<72||!credibleStage||Number(season.games||0)>0&&(availability<.5||Number(season.mins||0)<14)||Number(player.nationalCaps||0)>0||(player.internationalHistory||[]).length>0)return false;
 }
 if(event.id==="family_city_1"&&!followUp){
  const move=player.careerRelocationPending;
  if(!move||!move.meaningful||!(player.married||player.partnerName))return false;
 }
 if(event.id==="rebuild_core_1"&&!followUp&&player.teamWorld?.direction!=="rebuild")return false;
 if(event.id==="rebuild_core_1"&&!followUp&&!["core","starter"].includes(String(player.roleState?.current||""))&&Number(player.seasonStats?.mins||0)<22&&Number(player.rep||0)<8)return false;
 if(event.id==="market_choice_1"&&!followUp&&(!player.contract||Number(player.contract.remaining||0)>2))return false;
 if(event.id==="college_draft_feedback"&&!followUp&&Number(player.age||0)<19&&Number(player.grade||0)<3&&Number(player.careerSeason||0)<3)return false;
 if(event.id==="pro_rookie_vet"&&!followUp){
  const firstAge=Number(player.firstFullProAge),proYears=Number.isFinite(firstAge)?Number(player.age||0)-firstAge:Number(player.careerSeason||0)-1;
  if(proYears>1)return false;
 }
 if(event.id==="pro_language_room"&&!followUp&&!["日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA","海外職業"].includes(String(player.path||"")))return false;
 if(!followUp){
  const season=player.seasonStats||{},recognition=careerStoryRecognition(player),rep=Number(player.rep||0),careerSeason=Number(player.careerSeason||0);
  const contractWindow=!player.contract||Number(player.contract.remaining||0)<=1||(player.offers||[]).length>0||!!player.pendingRenewalOffer;
  if(event.id==="hbl_captain_vote"&&Number(player.grade||0)<2&&Number(season.mins||0)<16&&rep<3)return false;
  if(event.id==="hbl_social_clip"&&Number(season.pts||0)<10&&rep<4)return false;
  if(event.id==="college_alumni"&&Number(season.mins||0)<20&&rep<6&&recognition<1)return false;
  if(event.id==="pro_sponsor_day"&&Number(season.pts||0)<18&&rep<8&&recognition<1)return false;
  if(event.id==="media_identity_1"&&Number(season.pts||0)<12&&Number(season.mins||0)<20&&rep<4)return false;
  if(event.id==="late_role_offer"&&!contractWindow)return false;
  if(event.id==="late_body_warning"&&!player.injury&&Number(player.health??100)>88&&Number(player.bodyLoad||0)<48&&Number(player.fatigue||0)<50)return false;
  if(event.id==="late_family_calendar"&&!(player.married||player.partnerName))return false;
  if(event.id==="late_fan_chant"&&Number(player.peakOverall||careerStoryOverall(player))<82&&rep<18&&recognition<3&&Number(player.careerGames||0)<360)return false;
  if(event.id==="late_youth_camp"&&(careerSeason<10||rep<8&&recognition<2&&Number(player.careerGames||0)<240))return false;
  if(event.id==="late_contract_physical"&&(!player.contract||Number(player.contract.remaining||0)>1&&!player.pendingRenewalOffer))return false;
  if(event.id==="veteran_mentor_1"&&(careerSeason<10||Number(season.mins||0)<12&&rep<6))return false;
  if(event.id==="final_chapter_1"&&careerSeason<12)return false;
 }
 return true;
}
function careerStoryActor(player,key){
 const cast=player?.careerCast||{};
 if(key==="friend")return cast.friend||null;
 return cast[key]||null;
}
const CAREER_STORY_GROUP_ACTORS={
 family:{category:"家庭對話",name:"家人",role:"和你一起承擔生活選擇的人"},
 schoolOffice:{category:"校園協調",name:"導師與校隊窗口",role:"協調課業、請假與比賽行程"},
 schoolStaff:{category:"校隊決策",name:"學校與校隊",role:"確認轉學資格與球隊承諾"},
 medicalTeam:{category:"醫療評估",name:"球隊醫療團隊",role:"負責傷勢、負荷與復健判斷"},
 media:{category:"外界關注",name:"採訪與輿論",role:"影響外界如何理解你的比賽"},
 nationalStaff:{category:"代表隊評估",name:"國家隊教練團",role:"獨立於目前球隊的選訓單位"},
 frontOffice:{category:"球團會議",name:"球團管理層",role:"負責陣容方向、角色與合約決策"},
 roommate:{category:"大學生活",name:"同住室友",role:"和你共享宿舍作息的同學"},
 alumniOffice:{category:"校友會邀請",name:"學校校友會",role:"負責招生與校友宣傳"},
 scout:{category:"選秀評估",name:"職業球探",role:"提供市場觀察，不代表任何順位保證"},
 veteranTeammate:{category:"更衣室關係",name:"隊內老將",role:"帶新人適應職業球隊文化"},
 playersUnion:{category:"球員自治",name:"球員代表",role:"依所在聯盟機制協調賽程負荷與集體訴求"},
 communityOffice:{category:"球隊社區活動",name:"球隊社區部",role:"安排球員參與在地學校與社區活動"},
 formerTeammate:{category:"昔日隊友",name:"曾經同隊的老朋友",role:"和你共享過一段職業更衣室的人"},
 youngerTeammate:{category:"校隊關係",name:"一名校隊學弟",role:"第一次面對輪替與教練壓力的年輕隊友"},
 fans:{category:"球迷回應",name:"支持你的球迷",role:"從看台與訊息回應你職業生涯的人"},
 almaMater:{category:"回到起點",name:"母校校隊",role:"邀請你把職業經驗帶回學生球員"}
};
const CAREER_STORY_PERSON_LABELS={friend:"最早的球友",rival:"長期競爭對手",coach:"目前球隊總教練",agent:"合作經紀人",teammate:"同隊球員"};
const CAREER_STORY_SAME_TEAM_LINES=new Set(["coach_role","teammate_scandal","veteran_mentor","rebuild_core"]);
const CAREER_STORY_SAME_PERSON_LINES=new Set(["coach_role","teammate_scandal","veteran_mentor"]);
function careerStoryActorPresentation(event,player=p,pending=null){
 if(pending&&!pending.sourceTitle)ensureCareerStoryState(player);
 const key=event?.actor;
 if(!key)return null;
 const group=CAREER_STORY_GROUP_ACTORS[key];
 if(group)return {...group,key,isPerson:false};
 const saved=pending?.lineActors?.[key];
 if(saved?.name)return {...saved,key,isPerson:true};
 if(pending&&Number(event?.node)>1&&CAREER_STORY_SAME_PERSON_LINES.has(event.line)){
  const legacy={coach:{name:"當時與你談角色的教練",role:"承接原本的角色承諾，不套用目前教練姓名"},teammate:{name:"當時事件中的隊友",role:"承接原本的隊友關係，不套用目前隊友姓名"}}[key];
  if(legacy)return {key,isPerson:false,category:"前一段事件人物",...legacy};
 }
 const actor=careerStoryActor(player,key);
 if(!actor?.name)return null;
 const relationValue=key==="rival"?Number(actor.respect||50):Number(actor.trust||50);
 const relationLabel=key==="rival"
  ?(relationValue>=75?"彼此高度尊重":relationValue>=58?"競爭中帶著尊重":relationValue>=42?"仍在觀察彼此":relationValue>=25?"火藥味正在升高":"關係幾乎決裂")
  :(relationValue>=75?"彼此高度信任":relationValue>=58?"關係穩定":relationValue>=42?"仍在建立默契":relationValue>=25?"關係有明顯裂痕":"幾乎不再往來");
 return {key,isPerson:true,category:"生涯人物",name:actor.name,role:CAREER_STORY_PERSON_LABELS[key]||"生涯關係人物",note:actor.trait||"這段關係會跟著你的選擇改變",relationLabel,metYear:Number(actor.metYear)||null};
}
function careerStoryText(value,player=p,pending=null){
 const cast=player?.careerCast||{};
 const savedActors=pending?.lineActors||{};
 const pendingEvent=pending?.eventId?careerStoryEventById(pending.eventId):null;
 const legacyCoach=pending&&pendingEvent?.line==="coach_role"&&!savedActors.coach?"當時與你談角色的教練":"";
 const legacyTeammate=pending&&["teammate_scandal","veteran_mentor"].includes(pendingEvent?.line)&&!savedActors.teammate?"當時事件中的隊友":"";
 const replacements={
  friend:savedActors.friend?.name||cast.friend?.name||"最早陪你練球的朋友",
  rival:savedActors.rival?.name||cast.rival?.name||"長期競爭對手",
  coach:savedActors.coach?.name||legacyCoach||cast.coach?.name||"目前教練",
  agent:savedActors.agent?.name||cast.agent?.name||"你的經紀人",
  teammate:savedActors.teammate?.name||legacyTeammate||cast.teammate?.name||"同位置隊友",
  previousChoice:pending?.sourceChoice||"上一季的選擇",
  fromTeam:pending?.relocation?.fromTeam||player?.careerRelocationPending?.fromTeam||"原球隊",
  toTeam:pending?.relocation?.toTeam||player?.careerRelocationPending?.toTeam||player?.team||"新球隊",
  fromLeague:pending?.relocation?.fromLeague||player?.careerRelocationPending?.fromLeague||"原聯盟",
  toLeague:pending?.relocation?.toLeague||player?.careerRelocationPending?.toLeague||player?.path||"新聯盟"
 };
 return String(value||"").replace(/\{(friend|rival|coach|agent|teammate|previousChoice|fromTeam|toTeam|fromLeague|toLeague)\}/g,(_,key)=>replacements[key]);
}
const CAREER_STORY_OVERSEAS_PATHS=new Set(["日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA","海外職業"]);
function careerStoryTaiwanRegion(team=""){
 const name=String(team),regions={north:/台北|臺北|新北|桃園|基隆|新竹/,central:/台中|臺中|彰化|雲林|苗栗/,south:/嘉義|台南|臺南|高雄|屏東/,east:/宜蘭|花蓮|台東|臺東/};
 return Object.entries(regions).find(([,pattern])=>pattern.test(name))?.[0]||"";
}
function recordCareerRelocation(player=p,fromLeague="",fromTeam="",toLeague="",toTeam=""){
 if(!player||!fromLeague||!toLeague||fromLeague===toLeague&&fromTeam===toTeam)return null;
 const fromOverseas=CAREER_STORY_OVERSEAS_PATHS.has(String(fromLeague)),toOverseas=CAREER_STORY_OVERSEAS_PATHS.has(String(toLeague));
 const fromRegion=careerStoryTaiwanRegion(fromTeam),toRegion=careerStoryTaiwanRegion(toTeam);
 const crossBorder=fromOverseas!==toOverseas||fromOverseas&&toOverseas&&fromLeague!==toLeague;
 const domesticDistance=!fromOverseas&&!toOverseas&&fromRegion&&toRegion&&fromRegion!==toRegion;
 const meaningful=!!(crossBorder||domesticDistance);
 if(!meaningful)return null;
 ensureCareerStoryState(player);
 // A newer real move supersedes an unfinished relocation conversation. The
 // old one closes silently; the new city receives its own event.
 player.careerStoryPending.forEach(item=>{
  if(item?.status==="pending"&&item.line==="family_city"){
   item.status="closed";item.closedYear=Number(player.year)||0;item.closureReason="新的實際搬遷已取代原本尚未完成的生活安排。";
  }
 });
 const row={id:`${Number(player.year)||0}:${fromLeague}:${fromTeam}>${toLeague}:${toTeam}`,year:Number(player.year)||0,fromLeague:String(fromLeague),fromTeam:String(fromTeam),toLeague:String(toLeague),toTeam:String(toTeam),crossBorder,domesticDistance,meaningful};
 player.careerRelocationPending=row;
 player.careerRelocationHistory=Array.isArray(player.careerRelocationHistory)?player.careerRelocationHistory:[];
 player.careerRelocationHistory.push(row);player.careerRelocationHistory=player.careerRelocationHistory.slice(-20);
 return row;
}
function careerStoryIntroduce(event,player=p,pending=null){
 ensureCareerStoryState(player);
 const presentation=careerStoryActorPresentation(event,player,pending);
 if(!presentation?.isPerson||!presentation.name)return "";
 return careerStoryMarkPersonIntroduced(player,presentation.key,presentation,presentation.role);
}
function careerStoryMarkPersonIntroduced(player=p,key,person,role=""){
 ensureCareerStoryState(player);
 if(!key||!person?.name)return "";
 const introductionKey=`${key}:${person.name}`;
 if(player.careerIntroductions[introductionKey])return "";
 const personRole=role||person.role||CAREER_STORY_PERSON_LABELS[key]||"生涯關係人物";
 player.careerIntroductions[introductionKey]={year:player.year,person:person.name,type:key,role:personRole};
 player.relationshipHistory=Array.isArray(player.relationshipHistory)?player.relationshipHistory:[];
 player.relationshipHistory.push({year:player.year,person:person.name,type:key,action:"introduced",story:`${person.name} 以「${personRole}」身分正式進入你的生涯`});
 return `人物登場｜${person.name}・${personRole}`;
}
function careerStoryUnusedPool(player=p){
 ensureCareerStoryState(player);
 const seen=new Set(player.careerStorySeen);
 return (CAREER_STORY_EVENTS||[]).filter(event=>event.node<=1&&(event.id==="family_city_1"&&player.careerRelocationPending?.meaningful||!seen.has(event.id))&&careerStoryEventEligible(event,player));
}
function careerStoryPendingBreak(pending,player=p){
 if(!pending||pending.status!=="pending"||!CAREER_STORY_SAME_TEAM_LINES.has(pending.line))return null;
 if(pending.sourceTeam&&pending.sourceTeam!==player.team)return {title:"換隊讓原來的故事提前結束",reason:`你已離開 ${pending.sourceTeam}，當時的角色與承諾不會轉移到 ${player.team||"新球隊"}。`};
 if(CAREER_STORY_SAME_PERSON_LINES.has(pending.line)){
  const actorKey=Object.keys(pending.lineActors||{}).find(key=>["coach","teammate"].includes(key));
  const previous=pending.lineActors?.[actorKey],current=careerStoryActor(player,actorKey);
  if(previous?.name&&current?.name&&previous.name!==current.name)return {title:"人事變動改寫了原定後續",reason:`當時參與這件事的 ${previous.name} 已不在原本位置，先前的安排因此結束。`};
 }
 return null;
}
function careerStorySnapshot(player=p){
 const season=player?.seasonStats||{},contract=player?.contract||{};
 return {year:Number(player?.year)||0,team:player?.team||"",path:player?.path||"",age:Number(player?.age)||0,health:Number(player?.health)||0,bodyLoad:Number(player?.bodyLoad)||0,role:player?.roleState?.currentLabel||"",games:Number(season.games)||0,mins:Number(season.mins)||0,pts:Number(season.pts)||0,nationalCaps:Number(player?.nationalCaps)||0,teamDirection:player?.teamWorld?.direction||"",contractYears:Number(contract.remaining)||0};
}
function careerStoryPendingResolution(pending,player=p){
 const sourceId=String(pending?.sourceEventId||""),sourceChoice=String(pending?.sourceChoice||pending?.sourceChoiceId||"");
 const sourceRecorded=!!(sourceId&&sourceChoice);
 if(!sourceRecorded)return {title:"缺少可驗證的前情",reason:"這筆舊後續沒有對應的來源事件與玩家選擇，因此不會在生涯中憑空出現。"};
 const broken=careerStoryPendingBreak(pending,player);if(broken)return broken;
 const source=pending?.sourceSnapshot||{};
 if(pending?.line==="national_miss"&&Number(player.nationalCaps||0)>Number(source.nationalCaps||0))return {title:"正式徵召替觀察名單給了答案",reason:`你在後續球季正式進入代表隊紀錄。先前的觀察已由正式名單接手，之後只記錄真正的國際賽結果。`};
 if(pending?.line==="rebuild_core"&&player.teamWorld?.direction&&player.teamWorld.direction!=="rebuild")return {title:"球團方向改變，重建承諾重新結算",reason:`${player.team||"球隊"} 已不再以重建作為本季方向，當時的承諾保留在紀錄中，現在則依新的球隊計畫重新出發。`};
 const expired=Number(player.year)>Number(pending?.latestYear||pending?.dueYear||player.year);
 if(expired&&pending?.line==="market_choice")return {title:"等待的市場窗口沒有照預期打開",reason:"合約與報價沒有在原先預想的時間內形成真正選項。你保留了當時的判斷，也接受市場最後沒有給出更好答案。"};
 if(expired&&pending?.line==="final_chapter")return {title:"生涯後段沒有立刻變成告別",reason:"球隊與市場在這段期間沒有提出需要立即收束的條件；你繼續依健康、出勤與表現接受年度評估。"};
 return null;
}
function careerStoryPendingReady(pending,player=p){
 if(!pending||Number(player.year)<Number(pending.earliestYear||pending.dueYear||0))return false;
 if(pending.line==="market_choice")return Number(player.contract?.remaining||0)<=1||(player.offers||[]).length>0||!!player.pendingRenewalOffer||pending.sourceTeam!==player.team||pending.sourcePath!==player.path;
 if(pending.line==="final_chapter"&&String(pending.eventId).endsWith("_2"))return Number(player.contract?.remaining||0)<=1||(player.offers||[]).length>0||!!player.pendingRenewalOffer;
 return true;
}
function careerStoryFollowUpFacts(pending,player=p){
 const season=player.seasonStats||{},role=player.roleState?.currentLabel||"尚未固定",source=pending?.sourceSnapshot||{};
 const lines={
  school_rivalry:`現在你在 ${player.path||"目前舞台"}，站在面前的仍是當年那名對手。`,
  friendship:`這段關係已累積到現在，這次聯絡不再只是一次偶遇。`,
  coach_role:`當時角色是「${source.role||"尚未固定"}」，現在是「${role}」；本季平均上場 ${Number(season.mins||0).toFixed(1)} 分鐘。`,
  playoff_injury:`目前健康 ${Math.round(Number(player.health||0))}、身體負荷 ${Math.round(Number(player.bodyLoad||0))}；醫療團隊依這些真實狀態回看當時選擇。`,
  teammate_scandal:`這次只承接同一名隊友與同一支球隊留下的關係。`,
  family_city:`當時在 ${pending.sourcePath||"原聯盟"} 的 ${pending.sourceTeam||"原球隊"} 做出規劃；現在所在位置是 ${player.path||"目前聯盟"}・${player.team||"目前球隊"}。`,
  market_choice:`目前合約剩餘 ${Math.max(0,Number(player.contract?.remaining||0))} 年，市場資訊以真正存在的報價為準。`,
  media_identity:`現在的角色是「${role}」，本季 ${Number(season.pts||0).toFixed(1)} 分、${Number(season.ast||0).toFixed(1)} 助攻；外界標籤必須接受實際比賽內容檢驗。`,
  veteran_mentor:`當時角色是「${source.role||"老將輪替"}」，現在是「${role}」；這次只處理同一名隊友與實際上場變化。`,
  national_miss:`當時只是觀察名單；目前成人國家隊紀錄為 ${Number(player.nationalCaps||0)} 次，接下來只看真正公布的名單與比賽。`,
  rebuild_core:`當時球隊方向是重建；現在方向是「${player.teamWorld?.directionLabel||"尚未明確"}」，後續依真實球團狀態繼續。`,
  final_chapter:`目前健康 ${Math.round(Number(player.health||0))}、身體負荷 ${Math.round(Number(player.bodyLoad||0))}、角色「${role}」；續戰仍看完整狀態，不預設退休日期。`
 };
 return lines[pending?.line]||"這次只承接已經發生、仍然成立的前情。";
}
function buildCareerStorySpecial(player=p,{blockedThemes=[],openingOnly=false}={}){
 ensureCareerStoryState(player);
 if(player.retired)return null;
 const dueItems=player.careerStoryPending
  .filter(item=>item.status==="pending"&&Number(item.dueYear)<=Number(player.year))
  .sort((a,b)=>Number(a.dueYear)-Number(b.dueYear)||String(a.id).localeCompare(String(b.id)));
 dueItems.forEach(item=>{
  const closure=careerStoryPendingResolution(item,player);
  if(!closure)return;
  item.status="closed";item.closedYear=player.year;item.closureReason=closure.reason;
 });
 const blocked=new Set(blockedThemes);
 const due=dueItems.find(item=>{const event=careerStoryEventById(item.eventId);return item.status==="pending"&&event&&!blocked.has(event.theme)&&careerStoryPendingReady(item,player)&&careerStoryEventEligible(event,player,{followUp:true})});
 if(due){
  const event=careerStoryEventById(due.eventId);
  return {kind:"careerStory",storyEventId:event.id,storyPendingId:due.id,title:careerStoryText(event.title,player,due),desc:`${careerStoryFollowUpFacts(due,player)} ${careerStoryText(event.desc,player,due)}`,careerStory:true,careerStoryTheme:event.theme};
 }
 let pool=careerStoryUnusedPool(player).filter(event=>!blocked.has(event.theme));
 if(openingOnly){
  const opening=pool.filter(event=>Number(event.node)===1&&["friendship","school_rivalry"].includes(event.line)&&["friend","rival"].includes(event.actor));
  if(opening.length)pool=opening;
 }
 const relocation=pool.find(event=>event.id==="family_city_1");
 if(relocation&&player.careerRelocationPending?.meaningful)pool=[relocation];
 const firstFinalChapter=pool.find(event=>event.id==="final_chapter_1");
 if(!relocation&&firstFinalChapter)pool=[firstFinalChapter];
 if(!pool.length)return null;
 const fresh=pool.filter(event=>Number(player.careerStoryThemeYears[event.theme]||0)<=Number(player.year)-2);
 if(fresh.length)pool=fresh;
 const index=hash(`${player.seed}-career-story-${player.year}-${careerStoryStage(player)}-${pool.length}`)%pool.length;
 const event=pool[index];
 return {kind:"careerStory",storyEventId:event.id,title:careerStoryText(event.title,player),desc:careerStoryText(event.desc,player),careerStory:true,careerStoryTheme:event.theme};
}
function careerStoryEffectLabel(key){
 return ({confidence:"信心",rep:"球隊評價",fatigue:"疲勞",bodyLoad:"身體負荷",health:"健康",discipline:"紀律",clutch:"關鍵能力",iq:"球商",pass:"傳球",defense:"防守",shoot:"投射",finish:"終結",handle:"控球",rebound:"籃板",ath:"體能",coachTrust:"教練信任",teamTrust:"球團信任",agentTrust:"經紀人信任",teammateTrust:"隊友信任",friendTrust:"朋友信任",rivalRespect:"宿敵尊重",familyHarmony:"家庭關係",planStatMod:"數據機會",careerSalary:"生涯收入",financialLosses:"生涯支出"})[key]||key;
}
function careerStoryEffectTone(key,delta){
 const inverse=new Set(["fatigue","bodyLoad","financialLosses"]);
 return (inverse.has(key)?delta<0:delta>0)?"pos":"neg";
}
function applyCareerStoryEffects(effects={},player=p,pending=null,event=null){
 const changes=[],stats=new Set(["shoot","finish","handle","pass","defense","rebound","ath","iq"]);
 const bounded100=new Set(["confidence","fatigue","bodyLoad","health","discipline","clutch","familyHarmony","teamTrust","teammateTrust"]);
 const relationMap={coachTrust:"coach",agentTrust:"agent",friendTrust:"friend",rivalRespect:"rival"};
 Object.entries(effects||{}).forEach(([key,raw])=>{
  const delta=Number(raw)||0;if(!delta)return;
  if(stats.has(key)){
   // Family, friendship, identity and legacy choices change relationships or circumstance,
   // not permanent basketball ability. Basketball-context choices still use the shared cap.
   const basketballContext=["coach","team","injury","contract"].includes(String(event?.theme||""));
   if(!basketballContext)return;
   const before=Number(player.stats?.[key]||0);
   const outcome=typeof applyCareerStatChange==="function"
    ?applyCareerStatChange(player,key,delta,{source:"story",seasonalFallback:delta>0})
    :{applied:(player.stats[key]=Math.max(20,Math.min(99,before+delta)))-before,converted:0};
   if(outcome.applied)changes.push({key,label:careerStoryEffectLabel(key),delta:outcome.applied});
   if(outcome.converted)changes.push({key:"planStatMod",label:"本季數據機會",delta:outcome.converted});
   return;
  }
  else if(key==="teammateTrust"&&event?.actor==="teammate"){
   const actor=careerStoryActor(player,"teammate"),saved=pending?.lineActors?.teammate;
   if(!actor||saved?.name&&saved.name!==actor.name)return;
   actor.trust=Math.max(0,Math.min(100,Number(actor.trust||50)+delta));
  }else if(relationMap[key]){
   const actor=careerStoryActor(player,relationMap[key]),saved=pending?.lineActors?.[relationMap[key]];
   if(!actor||saved?.name&&saved.name!==actor.name)return;
   const property=key==="rivalRespect"?"respect":"trust";actor[property]=Math.max(0,Math.min(100,Number(actor[property]||50)+delta));
  }else if(key==="rep")player.rep=Math.max(-40,Math.min(100,Number(player.rep||0)+delta));
  else if(bounded100.has(key))player[key]=Math.max(0,Math.min(100,Number(player[key]||0)+delta));
  else player[key]=Number(player[key]||0)+delta;
  changes.push({key,label:careerStoryEffectLabel(key),delta});
 });
 return changes;
}
function scheduleCareerStoryFollowUp(event,choice,player=p){
 if(!event?.line||Number(event.node)>=3)return null;
 const next=CAREER_STORY_EVENTS.find(candidate=>candidate.line===event.line&&Number(candidate.node)===Number(event.node)+1);
 if(!next)return null;
 const threeYearChoices=new Set(["wait","delay","careerFirst","saveLater"]),twoYearChoices=new Set(["distance","stayPlan","oneYear","review"]);
 let delay=threeYearChoices.has(choice.id)?3:twoYearChoices.has(choice.id)?2:1;
 if(["friendship","school_rivalry"].includes(event.line)&&Number(player.careerSeason||0)<5)delay=Number(event.node)===1?Math.min(2,delay):1;
 const dueYear=Number(player.year)+delay;
 const current=(player.careerStoryPending||[]).find(item=>item.status==="resolved"&&item.eventId===event.id&&Number(item.dueYear)<=Number(player.year));
 const lineActors={...(current?.lineActors||{})},presentation=careerStoryActorPresentation(event,player,current);
 if(presentation?.isPerson&&!lineActors[presentation.key])lineActors[presentation.key]={name:presentation.name,role:presentation.role,note:presentation.note||""};
 const relocation=current?.relocation||player.careerRelocationPending||null;
 const pending={id:`${event.line}-${next.node}-${player.year}-${player.careerStoryPending.length}`,eventId:next.id,line:event.line,dueYear,earliestYear:dueYear,latestYear:dueYear+2,createdYear:Number(player.year)||0,status:"pending",sourceEventId:event.id,sourceTitle:careerStoryText(event.title,player,current),sourceChoiceId:choice.id,sourceChoice:choice.label,sourceMemory:choice.memory,sourceTeam:current?.sourceTeam||player.team||"",sourcePath:current?.sourcePath||player.path||"",sourceSnapshot:careerStorySnapshot(player),lineActors,relocation};
 player.careerStoryPending.push(pending);
 return pending;
}
function resolveCareerStoryClosure(pendingId){
 ensureCareerStoryState(p);
 const pending=(p.careerStoryPending||[]).find(item=>item.id===pendingId&&item.status==="pending");
 if(!pending)return;
 const closure=careerStoryPendingResolution(pending,p);if(!closure)return;
 pending.status="closed";pending.closedYear=p.year;pending.closureReason=closure.reason;
 if(Number.isFinite(Number(p.specialIndex)))p.specialIndex++;
 if(typeof showSpecialEvent==="function")showSpecialEvent();
}
function resolveCareerStoryEvent(eventId,choiceId){
 ensureCareerStoryState(p);ensureV8CareerState(p);
 const event=careerStoryEventById(eventId),choice=event?.choices?.find(item=>item.id===choiceId);
 if(!event||!choice)return;
 const pending=(p.careerStoryPending||[]).find(item=>item.status==="pending"&&item.eventId===event.id&&Number(item.dueYear)<=Number(p.year));
 const introduction=careerStoryIntroduce(event,p,pending),changes=applyCareerStoryEffects(choice.effects,p,pending,event);
 if(!p.careerStorySeen.includes(event.id))p.careerStorySeen.push(event.id);
 p.careerStoryThemeYears[event.theme]=p.year;
 if(pending)pending.status="resolved";
 const followUp=scheduleCareerStoryFollowUp(event,choice,p);
 if(event.id==="family_city_1")p.careerRelocationPending=null;
 const presentation=careerStoryActorPresentation(event,p,pending);
 const row={year:p.year,age:Number(p.age)||0,team:p.team||"",path:p.path||"",overall:typeof overall==="function"?Number(overall())||careerStoryOverall(p):careerStoryOverall(p),eventId:event.id,line:event.line||"standalone",node:event.node,title:careerStoryText(event.title,p,pending),choice:choice.label,result:choice.result,memory:choice.memory,theme:event.theme,person:presentation?.isPerson?presentation.name:"",actorLabel:presentation?.name||"",actorRole:presentation?.role||"",sourceTitle:pending?.sourceTitle||"",sourceChoice:pending?.sourceChoice||"",followUpEventId:followUp?.eventId||"",followUpDueYear:followUp?.dueYear||0};
 p.careerStoryHistory.push(row);p.careerStoryHistory=p.careerStoryHistory.slice(-160);
 const changeHTML=changes.length?changes.map(item=>`<span class="change ${careerStoryEffectTone(item.key,item.delta)}">${careerStoryEscape(item.label)} ${item.delta>0?"+":""}${item.delta}</span>`).join(""):`<span class="change info">沒有立即數值變化</span>`;
 const followEvent=followUp?careerStoryEventById(followUp.eventId):null;
 const followTitle=followEvent?careerStoryText(followEvent.title,p,followUp):"下一次相遇";
 const followHTML=followUp?`<div class="careerStoryFuture"><small>這段關係還沒結束</small><b>${careerStoryEscape(followTitle)}</b><span>${Number(followUp.dueYear)||Number(p.year)+1} 年起，${careerStoryEscape(row.actorLabel||"這個人")}會帶著你今天的選擇再次出現。</span></div>`:`<div class="careerStoryFuture resolved"><small>這段故事已完成</small><b>後果已寫入生涯紀錄</b></div>`;
 const introHTML=introduction?`<div class="careerStoryIntroduction">${careerStoryEscape(introduction)}</div>`:"";
 const html=`${introHTML}<div class="outcome success careerStoryOutcome"><div class="outcomeHead"><b>選擇後果｜${careerStoryEscape(choice.label)}</b><span class="outcomeRate">生涯事件</span></div><div class="eventMain">${careerStoryEscape(choice.result)}</div><div class="changes">${changeHTML}</div><div class="careerStoryMemory"><small>留下的記憶</small><b>${careerStoryEscape(choice.memory)}</b></div>${followHTML}</div>`;
 recordV8Story("life",`${row.title}｜${row.choice}：${row.result}`,5,{chain:followUp?event.line:"",person:row.person,careerStory:true});
 p.relationshipHistory=p.relationshipHistory||[];
 if(row.person)p.relationshipHistory.push({year:p.year,person:row.person,type:event.actor||"story",action:choice.id,story:choice.memory});
 finishSpecialEvent(html,`${row.title}：${row.choice} → ${row.result}`);
}
function careerStoryPeople(player=p,{includeUnintroduced=false}={}){
 if(!player)return [];
 ensureCareerStoryState(player);
 const cast=player.careerCast||{},stage=careerStoryStage(player),rows=[];
 const add=(key,label,person,note)=>{if(person?.name){const introduced=!!player.careerIntroductions[`${key}:${person.name}`];if(includeUnintroduced||introduced)rows.push({key,label,name:person.name,note,introduced})}};
 add("friend","最早的球友",cast.friend,cast.friend?.trait||"從學生時期就認識你");
 add("rival","長期對手",cast.rival,cast.rival?.trait||"一路被拿來比較");
 add("coach","目前教練",cast.coach,cast.coach?.trait||"決定你的輪替與角色");
 if(stage==="pro"||stage==="veteran")add("agent","經紀人",cast.agent,cast.agent?.trait||"處理合約與市場方向");
 add("teammate","隊內關係",cast.teammate,cast.teammate?.trait||"同位置輪替競爭者");
 return rows;
}
