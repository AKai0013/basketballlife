/* BasketballLife highlight-career pacing. Core season rules remain in the existing engines. */
const HIGHLIGHT_SCHEDULE_V1=Object.freeze({
  hblToEntry:{manual:["opening","careerStory","graduation","collegeEntry","draft","proEntry"],autoPrelude:["hblGrade2","hblGrade3","collegeEarly"],status:"vertical-slice"}
});
const HIGHLIGHT_CHAPTER_TARGET=12;
const HIGHLIGHT_STAGE_QUOTAS=Object.freeze({hbl:2,college:2,pro:5,veteran:3});
const HIGHLIGHT_STAGE_MILESTONES=Object.freeze({hbl:[1,3],college:[2,4],pro:[1,3,5,7,9],veteran:[10,14,18]});

function isHighlightCareer(player=p){return String(player?.careerMode||"complete")==="highlight"}
function highlightCareerStage(player=p){
  if(player?.path==="HBL")return "hbl";
  if(["UBA","UBA 強權","NCAA D2","NCAA D1","日本大學"].includes(player?.path))return "college";
  return Number(player?.careerSeason||0)>=10?"veteran":"pro";
}
function ensureHighlightChapterState(player=p){
  player.highlightChapterHistory=Array.isArray(player.highlightChapterHistory)?player.highlightChapterHistory:[];
  return player.highlightChapterHistory;
}
function highlightStageChapterCount(player=p,stage=highlightCareerStage(player)){
  return ensureHighlightChapterState(player).filter(row=>row?.stage===stage).length;
}
function highlightRoutineChapterDue(player=p){
  if(!isHighlightCareer(player))return false;
  const stage=highlightCareerStage(player),used=highlightStageChapterCount(player,stage),quota=HIGHLIGHT_STAGE_QUOTAS[stage]||0;
  if(used>=quota)return false;
  const marker=stage==="hbl"||stage==="college"?Number(player?.grade||0):Number(player?.careerSeason||0);
  return (HIGHLIGHT_STAGE_MILESTONES[stage]||[]).includes(marker);
}
function highlightForcedSpecial(event){
  return ["lastDance","national","tradeChoice","surgeryChoice","postOpRehab","returnChoice","medicalClearance"].includes(String(event?.kind||""));
}
function highlightRegisterChapter(events,reason="routine",player=p){
  const rows=ensureHighlightChapterState(player),stage=highlightCareerStage(player),id=`${Number(player.year)||0}:${stage}`;
  let row=rows.find(item=>item?.id===id);
  const kinds=events.map(event=>String(event?.kind||"event"));
  if(!row){
    row={id,number:rows.length+1,year:Number(player.year)||0,age:Number(player.age)||0,path:String(player.path||""),stage,reason,kinds:[]};
    rows.push(row);
  }
  row.kinds=[...new Set([...(row.kinds||[]),...kinds])];
  return row;
}
function highlightRegisterMidcareerChapter(player=p,season={}){
  if(!isHighlightCareer(player))return null;
  const arc=String(season?.chapter||"");
  if(!["peak","turn","legacy"].includes(arc))return null;
  const rows=ensureHighlightChapterState(player),id=`midcareer:${arc}`;
  let row=rows.find(item=>item?.id===id);
  if(!row){
    row={id,number:rows.length+1,year:Number(player.year)||0,age:Number(player.age)||0,path:String(player.path||""),stage:highlightCareerStage(player),reason:"midcareer",arc,label:String(season?.label||arc),kinds:[]};
    rows.push(row);
  }
  const kind=`midcareer:${arc}:${Number(season?.offset)||0}`;
  row.kinds=[...new Set([...(row.kinds||[]),kind])];
  row.lastYear=Number(player.year)||row.year;
  row.lastCareerSeason=Number(player.careerSeason)||0;
  return row;
}
function highlightTagChapter(events,reason="routine"){
  if(!events.length)return [];
  const row=highlightRegisterChapter(events,reason);
  return events.map(event=>({...event,highlightChapter:true,highlightChapterNumber:row.number,highlightChapterTarget:HIGHLIGHT_CHAPTER_TARGET,highlightChapterReason:reason}));
}
function highlightTagRoutine(events){return events.map(event=>({...event,highlightRoutine:true}))}
function highlightScheduleFor(player=p){
  if(!isHighlightCareer(player))return {mode:"complete",segment:"complete",action:"manual",reason:"完整生涯"};
  if(player?.path==="HBL"&&Number(player?.grade)>=2&&Number(player?.grade)<=3)return {mode:"highlight",segment:"hblToEntry",action:"autoPrelude",reason:"高中低影響球季"};
  if(["UBA","UBA 強權","NCAA D2","NCAA D1","日本大學"].includes(player?.path)&&Number(player?.grade)<4)return {mode:"highlight",segment:"hblToEntry",action:"autoPrelude",reason:"大學前段低影響球季"};
  if(["SBL／半職業","台灣職業","日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA","海外職業","職業"].includes(player?.path))return {mode:"highlight",segment:"proCareer",action:"autoPrelude",reason:"職業例行球季"};
  return {mode:"highlight",segment:"hblToEntry",action:"manual",reason:"重大節點或垂直切片尚未自動推進"};
}
function highlightTrainingOrder(player=p){
  const byPosition={PG:["handle","pass","iq","shoot","finish","defense","ath","rebound"],SG:["shoot","finish","handle","defense","iq","ath","pass","rebound"],SF:["finish","defense","shoot","rebound","ath","iq","pass","handle"],PF:["rebound","defense","finish","ath","iq","shoot","pass","handle"],C:["rebound","defense","finish","ath","iq","pass","shoot","handle"]};
  return byPosition[player?.pos]||Object.keys(player?.stats||{});
}
function highlightTrainingCandidates(player=p){
  const order=highlightTrainingOrder(player),v9=typeof isV9Progression==="function"&&isV9Progression(player);
  return order.filter(key=>Number(player?.stats?.[key])<99&&(!v9||typeof canUseManualGrowth!=="function"||canUseManualGrowth(player,key))&&(!v9||typeof availableTrainingGrowth!=="function"||availableTrainingGrowth(player,key)>0));
}
function highlightPointCandidates(player=p){
  const order=highlightTrainingOrder(player),v9=typeof isV9Progression==="function"&&isV9Progression(player);
  return order.filter(key=>Number(player?.stats?.[key])<99&&(!v9||typeof canUseManualGrowth!=="function"||canUseManualGrowth(player,key))&&(!v9||typeof availableManualGrowth!=="function"||availableManualGrowth(player,key)>0));
}
function highlightAutoTraining(){
  showTraining();
  if(typeof diceRevealTimer!=="undefined")window.clearTimeout(diceRevealTimer);
  p.diceRolling=false;p.diceRevealCount=p.dice.length;renderDice();
  let guard=Math.max(1,p.dice.length*Object.keys(p.stats||{}).length+1);
  while(p.used.some(value=>!value)&&guard-->0){
    const index=p.used.findIndex(value=>!value),candidates=highlightTrainingCandidates(p);
    let assigned=false;
    for(const key of candidates){
      const before=p.used[index];assignTraining(key);
      if(p.used[index]!==before){assigned=true;break}
    }
    if(!assigned){convertRemainingTrainingToRecovery();break}
  }
  return p.used.every(Boolean);
}
function highlightEventButtonScore(button,index=0,player=p){
  const data=button?.dataset||{},effect=String(data.highlightEffect||""),strategy=String(data.highlightStrategy||"");
  if(!effect)return null;
  const chance=Math.max(10,Math.min(95,Number(data.highlightChance)||50));
  const growth={shoot:3,three:3,finish:3,clutch:3,handle:3,defense:3,rebound:3,pass:3,iq:3,ath:3,risk:3,injrisk:3,team:2.5,compete:2.2,show:2.2,talk:1,study:1,normal:1,social:.4,safe:.3,check:.3,sitout:.3,minuteslimit:.8}[effect]??1;
  const strain=Math.max(Number(player?.fatigue||0),Number(player?.bodyLoad||0),Math.max(0,100-Number(player?.health??100)));
  let score=growth*chance;
  if(strategy==="risk")score-=strain*1.15;
  if(["safe","check","sitout","minuteslimit"].includes(effect)&&strain>=55)score+=strain*2;
  return score-index*.001;
}
function highlightChooseEventButton(buttons,roll=.5,player=p){
  const scored=buttons.map((button,index)=>({button,index,score:highlightEventButtonScore(button,index,player)})).filter(item=>item.score!==null);
  if(!scored.length)return buttons[Math.min(buttons.length-1,Math.floor(roll*buttons.length))];
  scored.sort((a,b)=>b.score-a.score||a.index-b.index);
  return scored[0].button;
}
function highlightAutoEvents(){
  const events=[];let guard=Math.max(1,Number(p.seasonEventCount)||0)+1;
  while(p.eventIndex<p.seasonEventCount&&guard-->0){
    showEvent();
    const buttons=[...choices.querySelectorAll("button.choice")];if(!buttons.length)break;
    const roll=typeof RNG==="function"?RNG(`${p.seed}-highlight-event-${p.year}-${p.eventIndex}`)():.5;
    const button=highlightChooseEventButton(buttons,roll,p);
    events.push({title:String(title.textContent||""),choice:String(button.querySelector("b")?.textContent||button.textContent||"").trim()});
    button.click();
  }
  return events;
}
function highlightEscape(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
function highlightPushHistory(entry){
  p.highlightHistory=Array.isArray(p.highlightHistory)?p.highlightHistory:[];
  p.highlightHistory.push(entry);p.highlightHistory=p.highlightHistory.slice(-40);
}
function highlightMajorSpecialKind(kind,event=null){
  if(event?.highlightRoutine)return false;
  if(event?.highlightChapter)return true;
  return ["careerStory","careerStoryClosure","lastDance","v8Chain","seasonKeyBattle","national","tradeChoice","surgeryChoice","postOpRehab","returnChoice","medicalClearance","agentCrossroads","teammateRole"].includes(kind);
}
function highlightPrepareSpecialQueue(queue){
  if(!isHighlightCareer(p))return queue;
  const source=Array.isArray(queue)?queue:[],forced=source.filter(highlightForcedSpecial);
  if(forced.length){
    const chapter=highlightTagChapter(forced,"forced"),routine=source.filter(event=>!forced.includes(event)&&event.kind!=="careerStory"&&event.kind!=="careerStoryClosure");
    return [...chapter,...highlightTagRoutine(routine)];
  }
  if(highlightRoutineChapterDue(p)){
    const stageCount=highlightStageChapterCount(p),story=source.find(event=>event.kind==="careerStory"||event.kind==="careerStoryClosure"),battle=source.find(event=>event.kind==="seasonKeyBattle");
    const selected=story&&(stageCount%2===0||!battle)?story:battle||story;
    if(!selected)return highlightTagRoutine(source);
    const routine=source.filter(event=>event!==selected&&event.kind!=="careerStory"&&event.kind!=="careerStoryClosure");
    return [...highlightTagChapter([selected],"scheduled"),...highlightTagRoutine(routine)];
  }
  return highlightTagRoutine(source.filter(event=>event.kind!=="careerStory"&&event.kind!=="careerStoryClosure"));
}
function highlightAutoResolveRoutineSpecials(){
  if(!isHighlightCareer(p))return false;
  let resolved=0,guard=Math.max(1,(p.specialQueue||[]).length+1);
  while(p.specialIndex<p.specialQueue.length&&guard-->0&&!highlightMajorSpecialKind(p.specialQueue[p.specialIndex].kind,p.specialQueue[p.specialIndex])){
    const event=p.specialQueue[p.specialIndex],beforeStats={...(p.stats||{})},beforeSpecialPoints=Number(p.specialBonusPoints||0);
    showSpecialEvent();
    const buttons=[...choices.querySelectorAll("button.choice")];
    if(!buttons.length)break;
    const roll=typeof RNG==="function"?RNG(`${p.seed}-highlight-special-${p.year}-${p.specialIndex}-${event.kind}`)():.5;
    buttons[Math.min(buttons.length-1,Math.floor(roll*buttons.length))].click();
    const afterStats=p.stats||{},statChanges=Object.keys(afterStats).map(key=>({key,delta:Number(afterStats[key])-Number(beforeStats[key]||0)})).filter(item=>item.delta);
    highlightPushHistory({year:p.year,path:p.path,team:p.team,kind:"autoSpecial",event:event.kind,title:event.title,statChanges,specialBonusDelta:Number(p.specialBonusPoints||0)-beforeSpecialPoints});
    resolved++;
  }
  if(!resolved)return false;
  showSpecialEvent();
  return true;
}
function highlightCollegeDecisionGate(player=p){
  if(!isHighlightCareer(player)||!["UBA","UBA 強權","NCAA D2","NCAA D1","日本大學"].includes(player?.path)||Number(player?.grade)>=4)return false;
  if(player.path!=="NCAA D2")return false;
  const score=typeof scoutingScore==="function"?scoutingScore():0;
  return score>=66||(typeof ncaaD2TransferInvite==="function"&&ncaaD2TransferInvite(score,58,.45,`grade-${player.grade}`));
}
function highlightAutoPointAllocation(){
  if(typeof showPointDistribution!=="function")return;
  showPointDistribution();
  let guard=Math.max(1,Object.keys(p.stats||{}).length*40);
  while(Number(p.bonusPoints||0)>0&&guard-->0){
    const before=Number(p.bonusPoints||0),candidates=highlightPointCandidates(p)
      .map((key,index)=>({key,index,cost:typeof pointCost==="function"?pointCost(key):Infinity}))
      .filter(item=>item.cost<=p.bonusPoints)
      .sort((a,b)=>a.cost-b.cost||a.index-b.index);
    const target=candidates[0],bought=!!target;
    if(target)buyPoint(target.key);
    if(!bought||Number(p.bonusPoints||0)>=before)break;
  }
  if(p.bonusPoints>0){p.bankedPoints=(p.bankedPoints||0)+p.bonusPoints;p.bonusPoints=0}
}
function highlightAutoFinishSeason(){
  if(!isHighlightCareer(p))return false;
  const injuryBefore=p.injury?`${p.injury.name||""}:${p.injury.level||""}:${p.injury.startYear||""}`:"",championshipsBefore=Number(p.championships||0);
  if(typeof showHealth==="function")showHealth();
  const injuryAfter=p.injury?`${p.injury.name||""}:${p.injury.level||""}:${p.injury.startYear||""}`:"";
  if(p.injury?.level==="重傷"&&injuryAfter!==injuryBefore){
    const row=highlightRegisterChapter([{kind:"majorInjury"}],"forced");
    chapter.textContent=`精華生涯 · 第 ${row.number} 章 · 重大傷病`;
    return true;
  }
  if(typeof showResults==="function")showResults();
  if(Number(p.championships||0)>championshipsBefore){
    const row=highlightRegisterChapter([{kind:"championship"}],"forced");
    chapter.textContent=`精華生涯 · 第 ${row.number} 章 · 冠軍球季`;
    return true;
  }
  if(p.lastDanceActive){finishSeason();return true}
  highlightAutoPointAllocation();
  const beforeTitles=new Set((p.titles||[]).map(title=>title.id||title.name));
  if(typeof titleChecks==="function")titleChecks();
  const newTitles=(p.titles||[]).filter(title=>!beforeTitles.has(title.id||title.name));
  if(newTitles.length)highlightPushHistory({year:p.year,path:p.path,team:p.team,kind:"autoTitles",titles:newTitles.map(title=>title.name)});
  finishSeason();
  return true;
}
function runHighlightSeasonPrelude(){
  const schedule=highlightScheduleFor(p);if(schedule.action!=="autoPrelude")return false;
  const beforeStats={...(p.stats||{})},beforeFatigue=Number(p.fatigue||0),beforeLoad=Number(p.bodyLoad||0),year=Number(p.year)||0;
  highlightAutoTraining();
  const events=highlightAutoEvents(),afterStats={...(p.stats||{})},statChanges=Object.keys(afterStats).map(key=>({key,delta:Number(afterStats[key])-Number(beforeStats[key])})).filter(item=>item.delta);
  highlightPushHistory({year,path:p.path,team:p.team,kind:"autoPrelude",events,statChanges,fatigueDelta:Number(p.fatigue||0)-beforeFatigue,bodyLoadDelta:Number(p.bodyLoad||0)-beforeLoad});
  if(typeof maybeStartV90MidcareerRhythm==="function"&&maybeStartV90MidcareerRhythm())return true;
  p.stage="transition";p.transition="toSpecial";resetMain();render();
  chapter.textContent=`${p.year} · ${p.age}歲 · ${p.path} · 精華推進`;
  title.textContent="精華推進｜本季低影響段落已整理";
  text.textContent="訓練與一般事件已依同一個 Seed 完成自動結算；真正會改變生涯的特殊事件，現在交回給你。";
  const statHTML=statChanges.length?statChanges.map(item=>`${highlightEscape(L[item.key]||item.key)} ${item.delta>0?"+":""}${item.delta}`).join("、"):"本次沒有永久能力變化";
  const eventHTML=events.length?events.map(item=>`<li>${highlightEscape(item.title)}｜${highlightEscape(item.choice)}</li>`).join(""):"<li>本季沒有一般事件</li>";
  special.innerHTML=`<section class="highlightDigest"><div class="highlightDigestKicker">HIGHLIGHT CAREER · ${year}</div><h3>${highlightEscape(p.team||p.path)} 本季摘要</h3><div class="highlightDigestGrid"><div><small>自動完成</small><b>訓練與 ${events.length} 個一般事件</b></div><div><small>能力變化</small><b>${statHTML}</b></div><div><small>身體狀態</small><b>疲勞 ${Number(p.fatigue||0)-beforeFatigue>=0?"+":""}${Number(p.fatigue||0)-beforeFatigue}｜負荷 ${Number(p.bodyLoad||0)-beforeLoad>=0?"+":""}${Number(p.bodyLoad||0)-beforeLoad}</b></div></div><details><summary>查看已整理的一般事件</summary><ul>${eventHTML}</ul></details><p>下一步會進入本季特殊事件、關鍵戰或故事回訪；這些節點不會被精華模式略過。</p></section>`;
  next.textContent="查看本季重大節點 →";next.classList.remove("hidden");scheduleCareerAutosave();
  return true;
}
