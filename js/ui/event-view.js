function showCareerChapter(type){
 if(["newSchoolYear","renewal","newTeam"].includes(type))p.seasonNaturalInjuryChecked=false;
 const playerName=escapeFeedText(p.name);
 p.stage="transition";resetMain();render();
 flow.innerHTML="";
 if(type==="highschoolStart"){
   chapter.textContent=`${p.year} · ${p.age}歲 · 生涯起點`;
   title.textContent="高中籃球生涯";
   text.textContent="你的名字第一次被寫進正式球隊名單。";
   special.innerHTML=`<div class="chapterCard">
     <div class="chapterEyebrow">CAREER BEGINS</div>
     <div class="chapterYear">${p.year} 年夏天</div>
     <div class="chapterHero">${p.age} 歲的 <b>${playerName}</b> 正式加入<br><span class="chapterTeam">${p.team} 籃球隊</span></div>
     <div class="mut">三年的高中籃球生涯，從今天開始。沒有人知道你最後會走到哪裡。</div>
     <div class="chapterMeta"><span>#${p.jerseyNumber??7}・${p.pos}・${p.handedness||"右手"}</span><span>${p.heightCm} cm・臂展 ${p.wingspanCm} cm</span><span>${escapeFeedText(p.birthplace)}出身</span><span>高一新生</span><span>HBL</span></div>
   </div>`;
   next.textContent="開始高中生涯 →";next.classList.remove("hidden");p.transition="toTraining";
 }else if(type==="newSchoolYear"){
   chapter.textContent=`${p.year} · ${p.age}歲 · ${p.path}`;
   title.textContent=p.path==="HBL"?`高中第 ${p.grade} 年`:"新賽季";
   text.textContent="";
   special.innerHTML=`<div class="chapterCard">
     <div class="chapterEyebrow">NEW SEASON</div>
     <div class="chapterYear">${p.year} 年</div>
     <div class="chapterHero">${p.path==="HBL"?`<span class="chapterTeam">${p.team}</span>｜高中第 ${p.grade} 年`:isDevelopmentPath()?`<span class="chapterTeam">${p.team}</span>｜再拚一年職業機會`:`<span class="chapterTeam">${p.team}</span>｜${p.age} 歲球季`}</div>
     <div class="chapterMeta"><span>${p.pos}</span><span>${p.age}歲</span><span>${p.path}</span></div>
   </div>${p.pendingAgingHTML||""}`;p.pendingAgingHTML="";
   next.textContent="進入季初特訓 →";next.classList.remove("hidden");p.transition="toTraining";
 }else if(type==="renewal"){
   chapter.textContent=`${p.year} · ${p.age}歲 · ${p.path} · 續約`;
   title.textContent="留在熟悉的球隊";
   text.textContent="";
   special.innerHTML=`<div class="chapterCard">
     <div class="chapterEyebrow">CONTRACT EXTENSION</div>
     <div class="chapterYear">${p.year} 年</div>
     <div class="chapterHero">${playerName} 與 <span class="chapterTeam">${p.team}</span> 完成續約</div>
     <div class="chapterMeta"><span>${p.pos}</span><span>${p.age}歲</span><span>${contractText()}</span></div>
   </div>`;
   next.textContent="準備新賽季 →";next.classList.remove("hidden");p.transition="toTraining";
 }else if(type==="newTeam"){
   chapter.textContent=`${p.year} · ${p.age}歲 · 人生岔路`;
   title.textContent="新的篇章";
   text.textContent="你離開熟悉的環境，走進下一個籃球舞台。";
   special.innerHTML=`<div class="chapterCard">
     <div class="chapterEyebrow">NEW CHAPTER</div>
     <div class="chapterYear">${p.year} 年</div>
     <div class="chapterHero">${playerName} 正式加入<br><span class="chapterTeam">${p.team}</span></div>
     <div class="mut">${p.path} 生涯正式開始。${p.contract?`<br><span class="gold">${contractText()}</span>`:""}</div>
     <div class="chapterMeta"><span>${p.pos}</span><span>${p.age}歲</span><span>${p.path}</span></div>
   </div>`;
   next.textContent=`開始 ${p.path} 生涯 →`;next.classList.remove("hidden");p.transition="toTraining";
 }
}

function showTraining(){
 if(p.eventIndex===0)p.seasonEventSuccess=0;
 if(typeof resetPermanentGrowthSeason==="function")resetPermanentGrowthSeason(p);
 p.preseasonRecoveryRisk=0;p.preseasonRecoveryYear=p.year;
 p.stage="training";resetMain();render();chapter.textContent=`${p.year} · ${p.age}歲 · ${p.path} · 新賽季`;
 title.textContent="季初特訓";
 text.textContent="把本季訓練點數投入最適合你的能力，未完成的進度會保留到下一次成長。";
 let planNotice=p.preseasonPlanNotice?`<div class="notice ${p.injury?"fail":""}"><b>開季規劃結果</b><br>${p.preseasonPlanNotice}</div>`:"";
 p.preseasonPlanNotice="";
 let r=RNG(p.seed+"training-"+p.year+"-"+p.path);
 let count=p.age<22?ri(r,4,6):ri(r,3,6);
 p.dice=Array.from({length:count},()=>ri(r,1,6));p.used=Array(count).fill(false);p.trainingUndo=[];selectedDie=null;
 p.diceRevealCount=0;p.diceRolling=true;
 let sixes=p.age<22?p.dice.filter(x=>x===6).length:0;
 if(!p.genius&&p.age<22&&sixes){
   p.six=Math.min(5,p.six+sixes);
   if(p.six>=5)awaken();
 }
 let highText=(!p.genius&&!p.geniusResolved&&p.age<22&&p.six>0)?` 最高點數「6」累計 <b class="gold">${p.six}/5</b> 次。`:"";
 p.trainingRevealSummary=highText||" 點數已全部揭曉。";
 let resolution="";
 if(p.genius&&!p.geniusAwakeningShown){
   resolution=`<div class="notice awake"><b>✨ 潛能覺醒</b><br>你在22歲前完成五次最高強度特訓，隱藏特質 <b class="gold">${p.geniusType}</b> 正式覺醒。</div>`;
   p.geniusAwakeningShown=true;
 }else if(p.geniusFailed&&!p.geniusFailureShown){
   resolution=`<div class="notice fail"><b>潛能覺醒失敗</b><br>22歲前未能累積 5 次最高點數「6」。這條隱藏成長路線已關閉。</div>`;
   p.geniusFailureShown=true;
 }
 const seasonContext=typeof trainingSeasonContextHTML==="function"?trainingSeasonContextHTML():"";
 special.innerHTML=`${planNotice}<div class="v9TrainingShell">${abilityPanel()}<div class="dicewrap"><div class="trainingTitle"><small>SEASON TRAINING</small>選擇養成方向</div><div class="trainingSummary">本季有 <b class="gold">${count}</b> 次訓練機會。<span id="diceRevealSummary">訓練點數揭曉中……</span></div><div id="dicepool" class="dicepool"></div><div id="assign" class="assign"></div><button id="undoTraining" class="undo" onclick="undoTrainingPoint()" disabled>↶ 返回上一步</button><div id="diceMsg" class="mut">選擇這次要加強的能力。</div></div>${seasonContext}</div>${resolution?`<div id="trainingRevealResolution" class="hidden">${resolution}</div>`:""}`;
 if(typeof hydrateTrainingPlayerCard==="function")hydrateTrainingPlayerCard();
 startDiceReveal();
 if(Object.values(p.stats).every(v=>v>=99)){
   p.used=p.used.map(()=>true);p.diceRolling=false;
   if(diceMsg)diceMsg.textContent="八項能力皆已達 99，本季特訓自動完成。";
   next.textContent="進入本季事件 →";next.classList.remove("hidden");
 }
}
function rebuildTrainingScreenFromSave(){
 // Saved training screens may contain HTML from an older version. Rebuild the
 // current view from the saved dice/progress without rerolling or changing stats.
 if(!Array.isArray(p.dice)||!p.dice.length){showTraining();return}
 if(typeof resetPermanentGrowthSeason==="function")resetPermanentGrowthSeason(p);
 p.stage="training";resetMain();render();chapter.textContent=`${p.year} · ${p.age}歲 · ${p.path} · 新賽季`;
 title.textContent="季初特訓";
 text.textContent="把本季訓練點數投入最適合你的能力，未完成的進度會保留到下一次成長。";
 p.used=Array.from({length:p.dice.length},(_,i)=>!!p.used?.[i]);
 if(!Array.isArray(p.trainingUndo))p.trainingUndo=[];
 p.diceRolling=!!p.diceRolling;
 if(!Number.isFinite(p.diceRevealCount))p.diceRevealCount=p.diceRolling?0:p.dice.length;
 if(!p.trainingRevealSummary)p.trainingRevealSummary=" 點數已全部揭曉。";
 p.trainingRevealSummary=String(p.trainingRevealSummary)
   .replace(/高標值「6」/g,"最高點數「6」")
   .replace(/骰子數字已全部揭曉/g,"點數已全部揭曉");
 const planNotice=p.preseasonPlanNotice?`<div class="notice ${p.injury?"fail":""}"><b>開季規劃結果</b><br>${p.preseasonPlanNotice}</div>`:"";
 p.preseasonPlanNotice="";
 let resolution="";
 if(p.genius&&!p.geniusAwakeningShown){
   resolution=`<div class="notice awake"><b>✨ 潛能覺醒</b><br>你在22歲前完成五次最高強度特訓，隱藏特質 <b class="gold">${p.geniusType}</b> 正式覺醒。</div>`;
   p.geniusAwakeningShown=true;
 }else if(p.geniusFailed&&!p.geniusFailureShown){
   resolution=`<div class="notice fail"><b>潛能覺醒失敗</b><br>22歲前未能累積 5 次最高點數「6」。這條隱藏成長路線已關閉。</div>`;
   p.geniusFailureShown=true;
 }
 const count=p.dice.length;
 const seasonContext=typeof trainingSeasonContextHTML==="function"?trainingSeasonContextHTML():"";
 special.innerHTML=`${planNotice}<div class="v9TrainingShell">${abilityPanel()}<div class="dicewrap"><div class="trainingTitle"><small>SEASON TRAINING</small>選擇養成方向</div><div class="trainingSummary">本季有 <b class="gold">${count}</b> 次訓練機會。<span id="diceRevealSummary">${p.diceRolling?"訓練點數揭曉中……":p.trainingRevealSummary}</span></div><div id="dicepool" class="dicepool"></div><div id="assign" class="assign"></div><button id="undoTraining" class="undo" onclick="undoTrainingPoint()" disabled>↶ 返回上一步</button><div id="diceMsg" class="mut">選擇這次要加強的能力。</div></div>${seasonContext}</div>${resolution?`<div id="trainingRevealResolution" class="hidden">${resolution}</div>`:""}`;
 if(typeof hydrateTrainingPlayerCard==="function")hydrateTrainingPlayerCard();
 if(Object.values(p.stats).every(v=>v>=99)){
   p.used=p.used.map(()=>true);p.diceRolling=false;
   renderDice();
   if(diceMsg)diceMsg.textContent="八項能力皆已達 99，本季特訓自動完成。";
   next.textContent="進入本季事件 →";next.classList.remove("hidden");
 }else if(p.diceRolling)startDiceReveal();
 else{
   renderDice();
   if(p.used.every(Boolean)){
     assign.innerHTML="";
     next.textContent="進入本季事件 →";
     next.classList.remove("hidden");
   }
 }
}
function trainingCreditFromDie(val){
 // V7.47: the die face IS the training-point value.
 // A 3 gives exactly 3 points; a 6 gives exactly 6 points.
 return Math.max(0,Number(val)||0);
}
function ensureTrainingProgress(){
 if(!p.trainingProgress)p.trainingProgress={};
 Object.keys(p.stats).forEach(k=>{
   if(!Number.isFinite(p.trainingProgress[k]))p.trainingProgress[k]=0;
 });
}
function convertRemainingTrainingToRecovery(){
 const remaining=(p.dice||[]).map((value,index)=>p.used?.[index]?0:trainingCreditFromDie(value));
 const total=remaining.reduce((sum,value)=>sum+value,0);
 if(!total)return;
 const fatigue=Math.min(Number(p.fatigue||0),Math.max(1,Math.ceil(total/4)));
 const bodyLoad=Math.min(Number(p.bodyLoad||0),Math.max(1,Math.ceil(total/3)));
 const health=Math.min(Math.max(0,100-Number(p.health??100)),Math.max(1,Math.ceil(total/6)));
 p.fatigue=Math.max(0,Number(p.fatigue||0)-fatigue);
 p.bodyLoad=Math.max(0,Number(p.bodyLoad||0)-bodyLoad);
 p.health=Math.min(100,Number(p.health??100)+health);
 p.preseasonRecoveryRisk=Math.max(Number(p.preseasonRecoveryRisk||0),Math.min(.18,total*.008));
 p.preseasonRecoveryYear=p.year;
 p.used=p.used.map(()=>true);p.trainingUndo=[];
 p.trainingRecoverySummary=`剩餘 ${total} 點課表已轉為恢復：疲勞 -${fatigue}、身體負荷 -${bodyLoad}${health?`、健康 +${health}`:""}，並降低本季傷病風險 ${Math.round(p.preseasonRecoveryRisk*100)}%。`;
 render();renderDice();
 if(assign)assign.innerHTML=`<div class="trainingMaxNotice">${p.trainingRecoverySummary}</div>`;
 if(diceMsg)diceMsg.textContent="本季永久成長完成，剩餘訓練已用於身體維持。";
 next.textContent="進入本季事件 →";next.classList.remove("hidden");
 scheduleCareerAutosave();
}
let diceRevealTimer=0;
function prefersReducedDiceMotion(){
 try{return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches}catch(_){return false}
}
function startDiceReveal(){
 window.clearTimeout(diceRevealTimer);
 if(!p?.dice?.length)return;
 const playerRef=p,diceRef=p.dice;
 if(prefersReducedDiceMotion()){
   p.diceRevealCount=p.dice.length;p.diceRolling=false;renderDice();return;
 }
 p.diceRevealCount=0;p.diceRolling=true;renderDice();
 const revealNext=()=>{
   if(p!==playerRef||p?.dice!==diceRef||p?.stage!=="training")return;
   p.diceRevealCount=Math.min(p.dice.length,(p.diceRevealCount||0)+1);
   if(p.diceRevealCount>=p.dice.length){
     p.diceRolling=false;renderDice();scheduleCareerAutosave();return;
   }
   renderDice();diceRevealTimer=window.setTimeout(revealNext,95);
 };
 diceRevealTimer=window.setTimeout(revealNext,430);
}
function renderDice(){
 ensureTrainingProgress();
 const current=p.used.findIndex(x=>!x);
 const v9Career=typeof isV9Progression==="function"&&isV9Progression(p);
 const trainable=key=>!v9Career?p.stats[key]<99:p.stats[key]<99&&(typeof canUseManualGrowth!=="function"||canUseManualGrowth(p,key))&&(typeof availableTrainingGrowth!=="function"||availableTrainingGrowth(p,key)>0);
 const allMax=Object.keys(p.stats).every(key=>!trainable(key));
 const revealCount=Number.isFinite(p.diceRevealCount)?p.diceRevealCount:p.dice.length;
 const revealSummary=document.getElementById("diceRevealSummary");
 if(revealSummary)revealSummary.innerHTML=p.diceRolling?`正在揭曉 ${revealCount}/${p.dice.length}……`:(p.trainingRevealSummary||"點數已全部揭曉。");
 if(!p.diceRolling)document.getElementById("trainingRevealResolution")?.classList.remove("hidden");
 dicepool.innerHTML=p.dice.map((d,i)=>{
   const revealed=!p.diceRolling||i<revealCount;
   const used=!!p.used[i],active=revealed&&!used&&i===current;
   const stateLabel=used?"，已使用":active?"，目前待分配":"";
   return `<div class="die ${revealed?"revealed":"rolling"} ${revealed&&d===6?"six":""} ${used?"used":""} ${active?"sel":""}" aria-label="${revealed?`骰子 ${d}${stateLabel}`:"骰子翻滾中"}">${revealed?`<span class="dieValue">${d}</span>`:`<span class="dieRollGlyph">🎲</span>`}</div>`;
 }).join("");

 if(p.diceRolling){
   assign.innerHTML=`<div class="diceRollingNotice">🎲 骰子落桌中……數字揭曉後即可分配訓練點數</div>`;
   if(diceMsg)diceMsg.textContent=`已揭曉 ${revealCount}/${p.dice.length} 顆骰子。`;
   const ub=document.getElementById("undoTraining");if(ub)ub.disabled=true;
   return;
 }
 if(diceMsg&&p.used.every(used=>!used))diceMsg.textContent="骰子已全部揭曉，請選擇第一顆骰子要訓練的能力。";

 if(allMax && current>=0){
   const remaining=p.dice.reduce((sum,value,index)=>sum+(p.used[index]?0:trainingCreditFromDie(value)),0);
   assign.innerHTML=`<div class="trainingMaxNotice">本季主動特訓已沒有可增加的永久能力，剩餘 ${remaining} 點課表可改為恢復、負荷管理與傷病預防。</div><button class="choice" onclick="convertRemainingTrainingToRecovery()"><b>轉為身體維持</b><small>不浪費剩餘訓練，也不突破年齡限制。</small></button>`;
   if(diceMsg)diceMsg.textContent="主動特訓額度用完後，剩餘課表仍可投入身體維持。";
   next.classList.add("hidden");
 }else{
   const dieVal=current>=0?p.dice[current]:0;
   const credit=current>=0?trainingCreditFromDie(dieVal):0;
   assign.innerHTML=Object.keys(p.stats).map(k=>{
     const v9=typeof isV9Progression==="function"&&isV9Progression(p),cap=typeof careerStatCap==="function"?careerStatCap(p,k):p.caps[k],limit=typeof careerStatLimit==="function"?careerStatLimit(p,k):cap;
     const maxed=v9?p.stats[k]>=99||(typeof canUseManualGrowth==="function"&&!canUseManualGrowth(p,k))||(typeof availableTrainingGrowth==="function"&&availableTrainingGrowth(p,k)<=0):p.stats[k]>=99;
     const cost=maxed?0:pointCost(k);
     const prog=Math.floor(p.trainingProgress[k]||0);
     const need=Math.max(0,cost-prog);
     const breaking=!maxed&&p.stats[k]>=(v9?limit:p.caps[k]);
     const affinity=typeof v90TalentAffinity==="function"?v90TalentAffinity(p,k):"legacy";
     const affinityLabel=affinity==="core"?"核心適性":affinity==="support"?"延伸適性":"一般養成";
    const progress=maxed?100:Math.max(0,Math.min(100,Math.round(p.stats[k])));
    const capProgress=Math.max(0,Math.min(100,Math.round(p.caps[k]||99)));
    return `<button class="${maxed?"maxed":breaking?"breaking":""}" ${(current<0||maxed)?"disabled":""} onclick="assignTraining('${k}')">
       <span class="trainChoiceName"><b>${L[k]}</b><small>${affinityLabel}</small></span>
        <span class="trainChoiceProgress" style="--value:${progress}%;--cap:${capProgress}%" role="progressbar" aria-label="${L[k]}目前 ${p.stats[k]}，Seed 基準 ${cap}，可培養至 ${limit}" aria-valuemin="0" aria-valuemax="99" aria-valuenow="${p.stats[k]}"><i></i></span>
        ${maxed
          ? `<span class="maxTag">本季特訓完成</span>`
          : `<span class="trainCostTag"><b>${p.stats[k]}</b><em>→ ${p.stats[k]+1}</em></span><span class="trainNeedTag">還差 ${need} 點｜本次 +${credit}</span>`}
      </button>`;
   }).join("");
 }
 const ub=document.getElementById("undoTraining"); if(ub)ub.disabled=p.trainingUndo.length===0;
}
function assignTraining(k){
 const idx=p.used.findIndex(x=>!x); if(idx<0)return;
 ensureTrainingProgress();

 const v9=typeof isV9Progression==="function"&&isV9Progression(p),cap=typeof careerStatCap==="function"?careerStatCap(p,k):99,limit=typeof careerStatLimit==="function"?careerStatLimit(p,k):cap;
 if((p.stats[k]||0)>=99||(v9&&typeof canUseManualGrowth==="function"&&!canUseManualGrowth(p,k))||(v9&&typeof availableTrainingGrowth==="function"&&availableTrainingGrowth(p,k)<=0)){
   if(diceMsg)diceMsg.textContent=v9?`${L[k]} 本季已無永久成長空間，請改選其他能力。`:`${L[k]} 已達 99 滿值，請選擇其他能力。`;
   renderDice();
   return;
 }

 const val=p.dice[idx];
 const credit=trainingCreditFromDie(val);
 const beforeStat=p.stats[k];
 const beforeProgress=p.trainingProgress[k]||0;

 p.trainingProgress[k]=beforeProgress+credit;
 let spent=0,gain=0;

 while(p.stats[k]<99){
   const cost=pointCost(k);
   if(p.trainingProgress[k]<cost)break;
   const outcome=v9&&typeof applyCareerStatChange==="function"?applyCareerStatChange(p,k,1,{source:"training"}):null;
   if(v9&&!outcome?.applied)break;
   if(!v9)p.stats[k]++;
   p.trainingProgress[k]-=cost;spent+=cost;gain++;
 }

 p.trainingUndo.push({
   idx,k,
   beforeStat,
   beforeProgress,
   credit,
   permanentGain:gain
 });
 p.used[idx]=true;

 const nextCost=p.stats[k]>=99||v9&&typeof canUseManualGrowth==="function"&&!canUseManualGrowth(p,k)||v9&&typeof availableTrainingGrowth==="function"&&availableTrainingGrowth(p,k)<=0?0:pointCost(k);
 const progress=Math.floor(p.trainingProgress[k]||0);
 if(gain>0){
   diceMsg.textContent=`第 ${idx+1} 顆骰子（${val}點）→ ${L[k]}｜能力 ${beforeStat}→${p.stats[k]}${p.stats[k]>=99?"｜已滿":`｜剩餘進度 ${progress}/${nextCost}`}`;
 }else{
   diceMsg.textContent=`第 ${idx+1} 顆骰子（${val}點）→ ${L[k]}｜目前進度 ${progress}/${nextCost}`;
 }

 render();renderDice();
 if(typeof refreshTrainingOverview==="function")refreshTrainingOverview();
 else{const panel=special.querySelector(".trainingPanel");if(panel)panel.outerHTML=abilityPanel()}
 if(p.used.every(Boolean)){assign.innerHTML="";next.textContent="進入本季事件 →";next.classList.remove("hidden")}
}
function undoTrainingPoint(){
 const last=p.trainingUndo.pop();if(!last)return;
 ensureTrainingProgress();
 p.stats[last.k]=last.beforeStat;
 if(last.permanentGain&&p.seasonTrainingGrowth){p.seasonTrainingGrowth[last.k]=Math.max(0,(p.seasonTrainingGrowth[last.k]||0)-last.permanentGain);if(!p.seasonTrainingGrowth[last.k])delete p.seasonTrainingGrowth[last.k];}
 p.trainingProgress[last.k]=last.beforeProgress;
 p.used[last.idx]=false;
 next.classList.add("hidden");
 diceMsg.textContent=`已返回：第 ${last.idx+1} 顆骰子的分配已取消。`;
 render();renderDice();
 if(typeof refreshTrainingOverview==="function")refreshTrainingOverview();
 else{const panel=special.querySelector(".trainingPanel");if(panel)panel.outerHTML=abilityPanel()}
}

function awaken(){
 p.genius=true;
 let r=RNG(p.seed+"genius"),types=["得分天才","控場天才","攻防怪物","運動天才","大心臟王牌"];
 p.geniusType=types[ri(r,0,types.length-1)];

 const bump=(keys,min,max)=>keys.forEach(k=>p.caps[k]=Math.min(99,p.caps[k]+ri(r,min,max)));
 if(p.geniusType==="得分天才")bump(["shoot","finish"],7,12);
 else if(p.geniusType==="控場天才")bump(["handle","pass","iq"],6,10);
 else if(p.geniusType==="攻防怪物")bump(["finish","defense","rebound"],5,9);
 else if(p.geniusType==="運動天才")bump(["ath","finish","defense"],6,10);
 else bump(["shoot","finish","iq"],5,8);

 p.geniusCostDiscount=1;
 p.geniusResolved=true;
 if(!p.titles.some(t=>t.id==="genius")){
   p.titles.push({id:"genius",name:"天才",effect:`潛能覺醒：${p.geniusType}`,rarity:"legendary",rare:true,negative:false});
 }
 logIt(`✨ 潛能覺醒：${p.geniusType}`);
 pushNews(`✨ ${p.name} 在22歲前完成潛能覺醒，獲得【天才】`);
}
function nextStep(){
 if(p.stage==="transition"){
   if(p.transition==="toTraining"){
     p.transition=null;
     if(typeof runHighlightSeasonPrelude==="function"&&runHighlightSeasonPrelude())return;
     if(isProPath())showProSeasonPlan();else showTraining();
   }else if(p.transition==="toSpecial"){
     p.transition=null;startSpecialPhase();
   }
   return
 }
 if(p.stage==="training"){
   p.eventIndex=0;p.specialQueue=[];p.specialIndex=0;
   if(typeof maybeStartV90MidcareerRhythm==="function"&&maybeStartV90MidcareerRhythm())return;
   if(typeof startOpeningCareerStory==="function"&&startOpeningCareerStory())return;
   p.stage="events";showEvent();return
 }
 if(p.stage==="midcareer"){startSpecialPhase();return}
 if(p.stage==="events"){if(window.BasketballLifeKeyBattle?.maybeMidseasonCheckpoint?.(()=>{if(p.eventIndex<p.seasonEventCount)showEvent();else startSpecialPhase()}))return;if(p.eventIndex<p.seasonEventCount)showEvent();else startSpecialPhase();return}
 if(p.stage==="special"){if(p.specialIndex<p.specialQueue.length){if(typeof highlightAutoResolveRoutineSpecials==="function"&&highlightAutoResolveRoutineSpecials())return;showSpecialEvent()}else if(p.specialReturnStage==="events"){p.specialReturnStage="";p.stage="events";showEvent()}else showHealth();return}
 if(p.stage==="health"){showResults();return}
 if(p.stage==="results"){if(p.lastDanceActive){finishSeason();return}showPointDistribution();return}
 if(p.stage==="points"){finishSeason();return}
}
