function developmentPromotionOffer(sc){
 if(p.path!=="SBL／半職業")return null;
 const seasons=developmentSeasonCount(),ov=overall(),ss=p.seasonStats||{};
 const impact=(ss.pts||0)+(ss.ast||0)*.75+(ss.reb||0)*.38+(ss.stl||0)*1.6+(ss.blk||0)*1.3;
 // Strong SBL players should reach the real pro market while they are still developing,
 // instead of waiting until their physical peak is already over.
 const readyAfterTwo=seasons>=2&&(sc>=61||(ov>=60&&impact>=15));
 const readyAfterThree=seasons>=3&&(sc>=57||(ov>=56&&impact>=12));
 if(!readyAfterTwo&&!readyAfterThree)return null;
 let c=makeContract("台灣職業",Math.max(sc,67),`sbl-pro-bridge-${p.year}-${seasons}`);
 if(sc<65){
   c.type="測試／證明短約";c.role=contractTypeInfo(c.type).role;c.years=c.remaining=1;c.bonus=0;
 }
 return finalizeContract(c);
}

function showDevelopmentMarketReview(){
 p.pendingSeasonAdvance=true;
 p.stage="decision";resetMain();render();flow.innerHTML="";
 const sc=scoutingScore(),cur=p.path,curLevel=developmentLevel(cur),devSeasons=developmentSeasonCount();
 let all=proOffersForScore(sc,"dev-market-"+p.year);
 // Only show a genuine step up; otherwise the player is just being recycled through the same level.
 let upgrades=all.filter(c=>developmentLevel(c.league)>curLevel);
 const bridge=developmentPromotionOffer(sc);
 if(bridge&&!upgrades.some(c=>c.league===bridge.league))upgrades.unshift(bridge);

 chapter.textContent=`${p.year} · ${p.age}歲 · ${cur} · 市場評估`;
 title.textContent="SBL｜年度市場評估";
 text.innerHTML=`成人籃球每一季結束後都會重新評估你的市場價值。SBL是成人籃球與職業邊緣的跳板，不是可以無限停留的等待區：正常發展期最多3季，之後只能接受職籃測試，或使用一次晚成球員的最後一年。<br>
 <span class="mut">目前球隊 <b>${p.team}</b>｜SBL第 <b>${devSeasons}</b> 季｜職涯評價 <b class="gold">${sc}</b>｜綜合能力 ${overall()}｜年齡 ${p.age}</span>`;

 let html=`<div class="offerGrid">`;
 if(upgrades.length){
   html+=`<div class="offerCard"><b>📈 升級邀約</b><div class="mut">你本季的表現已經讓更高層級球隊提出正式報價。</div></div>${upgrades.map(proOfferCard).join("")}`;
 }else{
   const noOfferText=devSeasons<3
     ? "你仍可留在目前層級再拚一季，但市場不會無限等待。"
     : devSeasons===3&&!p.developmentLastChanceUsed&&p.age<=24
       ? "一般發展期已滿；只能立即挑戰職籃，或使用唯一一次晚成最後一年。"
       : "發展名額已到期，只剩最後職籃測試，不能再續留SBL。";
   html+=`<div class="offerCard"><b>目前沒有更高層級正式報價</b><div class="mut">${noOfferText}</div></div>`;
 }

 // Normal development is capped at three SBL seasons.
 if(devSeasons<3&&p.age<=24){
   html+=`<div class="offerCard"><b>續留 ${cur}</b><div class="mut">再拚1季，下一季結束後重新接受市場評估。</div>
   <button class="btn" style="margin-top:9px" onclick="continueDevelopment()">接受1年續留</button></div>`;
 }else if(devSeasons===3&&!p.developmentLastChanceUsed&&p.age<=24){
   html+=`<div class="offerCard"><b>🌒 晚成球員最後一年</b><div class="mut">一般發展期已結束。你可以再留SBL最後1季；下一季無論能力高低，都只能投入職籃測試或離開球員市場。</div>
   <button class="btn" style="margin-top:9px" onclick="continueDevelopment(true)">使用最後一年</button></div>
   <div class="offerCard"><b>直接挑戰職籃測試</b><div class="mut">不再等待，現在就爭取台灣職籃的一年證明約。</div>
   <button class="btn" style="margin-top:9px" onclick="developmentTryout()">參加職籃測試</button></div>`;
 }else{
   html+=`<div class="offerCard"><b>發展名額到期</b><div class="mut">你已完成 ${devSeasons} 季SBL發展期，不能再用一年短約無限等待。這是進入正式職籃的最後測試。</div>
   <button class="btn" style="margin-top:9px" onclick="developmentTryout()">最後職籃測試</button></div>`;
 }
 html+=`</div>`;special.innerHTML=html;choices.innerHTML="";
}
function continueDevelopment(lastChance=false){
 if(lastChance)p.developmentLastChanceUsed=true;
 let c=makeContract("SBL／半職業",scoutingScore(),"sbl-renew-"+p.year,p.team,true);
 c.years=c.remaining=1;
 if(c.type==="核心長約"||c.type==="明星合約")c.type="先發合約",c.role=contractTypeInfo(c.type).role;
 c=finalizeContract(c);
 p.contract=c;
 logIt(`${lastChance?"🌒 晚成最後一年":"📝"} 與 ${p.team} 完成【${c.type}】1年續留｜年薪 ${moneyText(c.salary)}｜${c.role||contractTierLabel(c.multiplier)}`);
 p.developmentSeasons=developmentSeasonCount()+1;
 if(!consumePendingSeasonAdvance())advanceCareerCalendar(true);
 showCareerChapter("newSchoolYear");
}
function developmentTryout(){
 const sc=scoutingScore(),r=RNG(p.seed+"dev-last-tryout-"+p.year),seasons=developmentSeasonCount();
 const test=sc+ri(r,0,12)+Math.min(4,Math.max(0,seasons-1));
 if(test>=62&&overall()>=54&&(sc>=58||overall()>=58)){
   let c=makeContract("台灣職業",Math.max(sc,67),"dev-final-"+p.year);
   c.type="測試／證明短約";c.role=contractTypeInfo(c.type).role;c.years=c.remaining=1;c.bonus=0;c=finalizeContract(c);
   showTryoutOffer(c,"最後測試成功｜收到台灣職籃證明約");
   return;
 }
 retireCareer(`完成${seasons}季SBL發展期後，最後職籃測試仍沒有球隊提出正式合約`);
}

function currentCareerLabel(){
 if(p.path==="HBL")return `高${p.grade}`;
 if(isCollegePath())return `大學第${p.grade}年`;
 if(isProPath())return `職業第${Math.max(1,p.careerSeason)}季`;
 return p.path;
}
function moneyText(v){
 v=Math.max(0,Math.round(v||0));
 if(v>=10000){
   const yi=Math.floor(v/10000),wan=v%10000;
   return wan?`${yi}億${wan.toLocaleString()}萬`:`${yi}億`;
 }
 return `${v.toLocaleString()}萬`;
}
function exposureLevel(n){
 n=Number(n||0);
 if(n>=9)return 5;
 if(n>=6)return 4;
 if(n>=4)return 2;
 if(n>=1)return 1;
 return 0;
}
function exposureStars(n){
 const lv=exposureLevel(n);
 return `<span class="exposureScale">${Array.from({length:5},(_,i)=>`<span class="star ${i<lv?"on":""}">★</span>`).join("")}<span class="num">${lv}/5</span></span>`;
}
function contractTypeInfo(type){
 const map={
  "測試／證明短約":{years:[1,1],mult:[.68,.92],role:"名單競爭／輪替",bonus:[.03,.08]},
  "短約":{years:[1,2],mult:[.90,1.16],role:"輪替球員",bonus:[.06,.12]},
  "標準合約":{years:[2,3],mult:[1.08,1.38],role:"主要輪替",bonus:[.10,.18]},
  "先發合約":{years:[2,4],mult:[1.30,1.68],role:"先發主力",bonus:[.14,.23]},
  "明星合約":{years:[3,4],mult:[1.65,2.22],role:"明星／核心",bonus:[.18,.30]},
  "核心長約":{years:[4,5],mult:[2.18,3.00],role:"建隊核心",bonus:[.24,.38]},
  "NBA雙向合約":{years:[1,1],mult:[1.45,2.05],role:"NBA／G League雙向球員",bonus:[.04,.10]},
  "母隊回歸約":{years:[1,2],mult:[.70,1.05],role:"輪替／老將角色",bonus:[0,.06]}
 };
 return map[type]||map["標準合約"];
}
function contractTierLabel(multiplier=1){
 multiplier=Number(multiplier||1);
 if(multiplier>=2.18)return "建隊核心";
 if(multiplier>=1.65)return "明星主力";
 if(multiplier>=1.30)return "先發主力";
 if(multiplier>=1.08)return "主要輪替";
 if(multiplier>=.90)return "輪替合約";
 return "證明合約";
}
function contractRolePromise(type,multiplier=1,direction="playoff"){
 let role=type==="核心長約"?"先發核心":type==="明星合約"?"固定先發":type==="先發合約"?"固定先發":type==="標準合約"?"主要輪替":type==="短約"?"板凳輪替":type==="NBA雙向合約"?"NBA／G League雙向競爭":"名單競爭";
 if(direction==="contend"&&["主要輪替","板凳輪替"].includes(role))role="季後賽輪替";
 if(direction==="rebuild"&&role==="主要輪替")role="先發競爭";
 return role;
}
function contractRoleMinutes(role=""){
 if(/核心/.test(role))return "30～36分鐘";if(/固定先發/.test(role))return "26～33分鐘";if(/先發競爭/.test(role))return "22～30分鐘";if(/主要|季後賽/.test(role))return "18～27分鐘";if(/板凳/.test(role))return "10～20分鐘";return "依名單競爭";
}
function roleIdFromPromise(role=""){
 if(/核心/.test(role))return "core";if(/固定先發/.test(role))return "starter";if(/第六/.test(role))return "sixth";if(/板凳/.test(role))return "benchLeader";if(/名單/.test(role))return "garbage";return "worker";
}
function buildContractOption(c,r){
 if(c.type==="NBA雙向合約"||c.years<2)return {type:"none",label:"全額保障",status:"none"};
 if(["核心長約","明星合約"].includes(c.type)&&r()<.58)return {type:"player",label:"球員選項",status:"pending",yearSalary:Math.round(c.salary*1.05)};
 if(["標準合約","先發合約","短約"].includes(c.type)&&r()<.42)return {type:"team",label:"球隊選項",status:"pending",yearSalary:Math.round(c.salary*1.03)};
 return {type:"none",label:"全額保障",status:"none"};
}
function normalizeV8Contract(c){
 if(!c||typeof c!=="object")return c;
 if(!c.rolePromise)c.rolePromise=contractRolePromise(c.type,c.multiplier,c.teamDirection||"playoff");
 if(!c.promisedMinutes)c.promisedMinutes=contractRoleMinutes(c.rolePromise);
 if(!c.option||typeof c.option!=="object")c.option={type:"none",label:"全額保障",status:"none"};
 return c;
}
function contractMarketScore(league,scout){
 const cfg=LEAGUE_CFG[league]||{market:68},aw=(p.lastSeasonAwards?.length||0);
 let score=(scout-cfg.market)+(p.rep||0)*.10+confidencePerformanceMod()*2+Math.min(7,aw*1.2);
 score+=(p.careerMVP||0)*2.5+(p.careerFinalsMVP||0)*2.1+(p.careerDPOY||0)*1.8+(p.careerFirstTeam||0)*.8+(p.careerAllStar||0)*.35;
 if(hasTitle("asia_journey"))score+=2;
 score-=Math.min(8,(p.injuryHistory?.length||0)*.55+(p.majorInjuryCount||0)*1.3);
 if(hasTitle("lockerroom"))score-=6;
 if(p.age>=35)score-=(p.age-34)*1.35;
 else if(p.age>=31)score-=(p.age-30)*.45;
 return score;
}
function chooseContractType(league,scout,r,renewal=false){
 const cs=contractMarketScore(league,scout);
 // A real NBA two-way deal is created only after the player clears the
 // G League call-up résumé. G League offers no longer borrow the NBA label.
 let type=cs<1?"測試／證明短約":cs<5?"短約":cs<10?"標準合約":cs<16?"先發合約":cs<23?"明星合約":"核心長約";
 // A late-career superstar can still be paid and start, but a club should not
 // describe a 40+ player as the long-term cornerstone of a rebuild.
 if(p.age>=42&&["核心長約","明星合約","先發合約"].includes(type))type="標準合約";
 else if(p.age>=38&&type==="核心長約")type="明星合約";
 return type;
}
function finalizeContract(c){
 const cfg=LEAGUE_CFG[c.league]||{salary:220,exposure:0,trait:"職業聯盟"};
 c.baseSalary=leagueSalaryBase(c.league,c.startYear||p?.year||SALARY_BASE_YEAR);
 c.multiplier=Math.max(.05,Math.round((c.salary/c.baseSalary)*100)/100);
 c.total=Math.round(c.salary*c.years+(c.bonus||0));
 c.exposure=c.type==="NBA雙向合約"?10:(cfg.exposure||0);
 c.trait=cfg.trait||"職業聯盟";
 return normalizeV8Contract(c);
}
function makeContract(league,scout,salt,forcedTeam=null,renewal=false){
 const cfg=LEAGUE_CFG[league]||{salary:220,market:68,exposure:0,trait:"職業聯盟"};
 const r=RNG(p.seed+"contract-"+league+"-"+p.year+"-"+salt+(forcedTeam||""));
 const type=chooseContractType(league,scout,r,renewal),info=contractTypeInfo(type);
 let lo=info.mult[0],hi=info.mult[1],cs=contractMarketScore(league,scout);
 let mult=lo+(hi-lo)*r();
 // Reward being clearly above the market inside the same contract tier without jumping absurdly.
 mult*=Math.max(.94,Math.min(1.10,1+Math.max(-3,Math.min(8,cs))*.008));
 mult=Math.round(mult*100)/100;
 let years=ri(r,info.years[0],info.years[1]);
 // Evaluate G League players after every season so a call-up cannot be hidden
 // behind a multi-year contract.
 if(league==="NBA G League")years=1;
 if(p.age>=38)years=1;
 else if(p.age>=35)years=Math.min(years,2);
 else if(p.age>=32)years=Math.min(years,3);
 let salary;
 if(league==="NBA"){
   const band=NBA_SALARY_BANDS[type]||NBA_SALARY_BANDS["標準合約"];
   const marketLift=Math.max(.96,Math.min(1.10,1+Math.max(-2,Math.min(10,cs))*.008));
   salary=Math.round((band[0]+(band[1]-band[0])*r())*salaryEraIndex(p.year)*marketLift);
 }else salary=Math.max(20,Math.round(leagueSalaryBase(league,p.year)*mult));
 const bp=info.bonus[0]+(info.bonus[1]-info.bonus[0])*r();
 let bonus=Math.round(salary*bp);
 let pool=leagueTeamPool(league),team=forcedTeam||seedPick(pool,league+"-contract-"+salt);
 const direction=v8Pick(V8_TEAM_DIRECTIONS,`${p.seed}-${team}-${p.year}-direction`).id;
 if(direction==="finance")salary=Math.max(20,Math.round(salary*.90));
 let c={league,team,salary,bonus,years,startYear:p.year,remaining:years,type,role:info.role,renewal,teamDirection:direction};
 c.rolePromise=contractRolePromise(type,mult,direction);c.promisedMinutes=contractRoleMinutes(c.rolePromise);c.option=buildContractOption(c,r);
 const agentPriority=p.pendingAgentPriority||"";
 if(agentPriority==="money"){
   c.salary=Math.round(c.salary*1.08);c.bonus=Math.round(c.bonus*1.10);
   if(["固定先發","先發競爭"].includes(c.rolePromise))c.rolePromise="主要輪替";
   c.promisedMinutes=contractRoleMinutes(c.rolePromise);c.agentNote="最高報價優先：薪資提高，角色保障降低";
 }else if(agentPriority==="role"){
   c.salary=Math.max(20,Math.round(c.salary*.92));
   if(["名單競爭","板凳輪替"].includes(c.rolePromise))c.rolePromise="主要輪替";
   else if(c.rolePromise==="主要輪替")c.rolePromise="先發競爭";
   c.promisedMinutes=contractRoleMinutes(c.rolePromise);c.agentNote="角色承諾優先：薪資讓步，輪替承諾提高";
 }else if(agentPriority==="overseas")c.agentNote="海外舞台優先：跨聯盟球隊評價提高";
 return finalizeContract(c);
}
function repriceContract(c,factor,yearsOverride=null,typeOverride=null){
 c={...c};
 if(typeOverride){c.type=typeOverride;c.role=contractTypeInfo(typeOverride).role}
 c.salary=Math.max(20,Math.round(c.salary*factor));
 if(c.option?.type!=="none")c.option={...c.option,yearSalary:Math.max(20,Math.round((c.option.yearSalary||c.salary)*factor))};
 if(yearsOverride!=null)c.years=c.remaining=yearsOverride;
 c.bonus=Math.max(0,Math.round((c.bonus||0)*Math.min(1,factor)));
 return finalizeContract(c);
}
function contractText(){
 if(!p.contract)return "";
 const c=normalizeV8Contract(p.contract);return `${c.type||"職業合約"}｜${c.years}年｜年薪 ${moneyText(c.salary)}｜承諾 ${c.rolePromise}｜${c.option?.label||"全額保障"}`;
}
function teamDirectionEffect(direction,age=p?.age||25){
 const map={
  contend:"爭冠｜主力責任較高，邊緣輪替較少",
  playoff:"季後賽競爭｜上場時間依戰績與對位調整",
  rebuild:age<=26?"重建｜年輕球員會得到更多上場時間":"重建｜老將時間可能讓給年輕球員",
  finance:"財務緊縮｜薪資較保守，交易機率較高",
  turmoil:"球隊動盪｜角色與教練決策較常變動"
 };
 return map[direction]||"球隊將依戰績調整輪替";
}
function contractOfferHTML(c){
 c=normalizeV8Contract(c);
 const cfg=LEAGUE_CFG[c.league]||{label:c.league,exposure:0,trait:"職業聯盟"};
 const directionLabel=(V8_TEAM_DIRECTIONS.find(x=>x.id===c.teamDirection)||{}).label||"球隊評估中";
 return `<div>
   <span class="contractTypeBadge">${c.type||"職業合約"}｜${c.years}年</span>
   <span class="contractRoleBadge">${c.role||"輪替球員"}</span>
   <div class="contractMain">年薪 ${moneyText(c.salary)}｜${contractTierLabel(c.multiplier)}</div>
   <div class="contractSub">${cfg.label}｜${c.trait||cfg.trait||""}<br>保障總值 <b>${moneyText(c.total||((c.salary||0)*(c.years||1)+(c.bonus||0)))}</b>｜簽約金 ${moneyText(c.bonus||0)}</div>
   <div class="contractMetaGrid">
    <div class="contractMetaCell"><small>球隊定位</small><b>${c.role||"輪替"}</b></div>
    <div class="contractMetaCell"><small>角色承諾</small><b>${c.rolePromise}・${c.promisedMinutes}</b></div>
    <div class="contractMetaCell"><small>合約選項</small><b>${c.option?.label||"全額保障"}${c.option?.type!=="none"?`・另1年 ${moneyText(c.option.yearSalary||c.salary)}`:""}</b></div>
    <div class="contractMetaCell"><small>球隊狀態</small><b>${teamDirectionEffect(c.teamDirection)}</b></div>
   <div class="contractMetaCell"><small>NBA關注</small><b class="exposureStars">${exposureStars(c.exposure??cfg.exposure)}</b></div>
   </div>
   ${c.agentNote?`<div class="balanceNote">📑 經紀人的談判結果：${c.agentNote}</div>`:""}
  </div>`;
}
function makeRenewalOffer(){
 if(p.contract?.terminated)return null;
 const sc=scoutingScore();
 // 35歲後母隊不再只因「仍在陣中」就固定續約；近期出勤、角色與實際表現
 // 共同決定市場是否仍開著。結果依 Seed 固定，但不採硬性隔年冷卻。
 if(p.age>=35){
   const ss=p.seasonStats||{},schedule=Math.max(1,scheduledGamesForSeason(p.path,p.year));
   const availability=Math.min(1,(ss.games||0)/schedule),impact=(ss.pts||0)+(ss.ast||0)*.7+(ss.reb||0)*.35+(ss.stl||0)*1.4+(ss.blk||0)*1.2;
   let chance=82-(p.age-35)*6.5+availability*16+Math.min(14,impact*.55)+Math.min(9,(p.rep||0)*.18);
   chance+=(p.lastSeasonAwards||[]).length*4+(p.careerMVP||0)*2;chance-=Math.max(0,(p.bodyLoad||0)-55)*.22+(p.majorInjuryCount||0)*2;
   chance=Math.max(4,Math.min(92,Math.round(chance)));
   if(RNG(`${p.seed}-veteran-renewal-${p.team}-${p.year}`)()*100>=chance)return null;
 }
 const nbaKind=nbaPathwayOfferKind(sc);
 // NBA teams must also evaluate what the player actually did on an NBA court.
 // A productive two-way player can be converted, while a useful incumbent is
 // never discarded only because his hidden talent tier missed a roster floor.
 if(p.path==="NBA"&&nbaKind){
   const c=makeNBAPathwayContract(sc,nbaKind,`${nbaKind}-renewal-${p.year}`,p.team);c.renewal=true;return c;
 }
 if(!canReceiveStandardContract(p.path,sc,true))return null;
 let c=makeContract(p.path,sc,"renewal-"+p.year+"-"+p.team,p.team,true);
 // A solid incumbent generally does not receive an inexplicable huge pay cut before testing the market.
 if(p.contract?.salary && sc>=(LEAGUE_CFG[p.path]?.market||60)+2 && c.salary<p.contract.salary*.88){
   const floor=p.contract.salary*.88/c.salary;
   c=repriceContract(c,floor);
 }
 c.renewal=true;
 return c;
}
function handleV8ContractOptionAtExpiry(){
 const c=normalizeV8Contract(p.contract);
 if(!c||!c.option||c.option.type==="none"||c.option.status!=="pending")return false;
 // 已簽入正式合約的選項應受到尊重。50歲才是正式球員登錄的
 // 絕對上限；40歲以後是否留下，交由能力、出勤與市場逐年判斷。
 if(p.age>=50){c.option.status="expired_by_age";recordV8Story("turning",`${c.option.label||"合約選項"}在50歲生涯上限後失效，正式進入退役程序`,4);return false}
 if(c.option.type==="team"){
   const score=scoutingScore(),floor=(LEAGUE_CFG[p.path]?.market||60)-2,exercise=score>=floor&&overall()>=contractRosterOverallFloor(p.path,true)-2&&!c.terminated;
   if(!exercise){c.option.status="declined";recordV8Story("turning",`${p.team} 放棄球隊選項，你正式進入自由市場`,4,{person:p.careerCast?.coach?.name});return false}
   p.stage="decision";resetMain();render();flow.innerHTML="";
   chapter.textContent=`${p.year} · ${p.age}歲 · 球隊選項`;
   title.textContent="球團決定留下你";
   text.innerHTML=`${proHeaderHTML()}<b>${p.team}</b> 依照上一季表現執行合約中的球隊選項。這不是重新談約；原條款會自動延長一年。`;
   special.innerHTML=`<div class="contractDecision"><b>球隊選項｜另1年</b><br>年薪 ${moneyText(c.option.yearSalary||c.salary)}｜角色承諾 ${c.rolePromise}｜${c.promisedMinutes}</div>`;
   choices.innerHTML=`<button class="choice" onclick="exerciseV8ContractOption('team')"><b>依約回到球隊</b><small>球隊選項由球團單方執行，球員不能改投自由市場。</small></button><button class="choice" onclick="retireFromTeamOption()"><b>選擇退休</b><small>不違約轉隊，但可以結束球員生涯、不再履行選項年。</small></button>`;
   return true;
 }
 p.stage="decision";resetMain();render();flow.innerHTML="";
 chapter.textContent=`${p.year} · ${p.age}歲 · 球員選項`;
 title.textContent="最後一年由你決定";
 text.innerHTML=`${proHeaderHTML()}你可以執行合約中的球員選項，再留在 <b>${p.team}</b> 一年；也能放棄保障，測試完整自由市場。`;
 special.innerHTML=`<div class="contractDecision"><b>球員選項｜另1年</b><br>年薪 ${moneyText(c.option.yearSalary||c.salary)}｜角色承諾 ${c.rolePromise}｜${c.promisedMinutes}</div>`;
 choices.innerHTML=`<button class="choice" onclick="exerciseV8ContractOption('player')"><b>執行球員選項</b><small>保留一年保障與目前球隊關係，不進入自由市場。</small></button><button class="choice" onclick="declineV8PlayerOption()"><b>跳脫合約、測試市場</b><small>放棄選項年；可能取得更好的合約，也可能遇到市場降溫。</small></button>`;
 return true;
}
function retireFromTeamOption(){
 retireCareer("球團執行選項後，你選擇結束球員生涯");
}
function exerciseV8ContractOption(source){
 const c=normalizeV8Contract(p.contract);if(!c?.option||c.option.status!=="pending")return;
 c.option.status="exercised";c.remaining=1;c.years+=1;c.salary=c.option.yearSalary||c.salary;c.total=Math.round((c.total||0)+c.salary);
 const who=source==="team"?`${p.team} 執行球隊選項`:`你執行球員選項`;
 recordV8Story("turning",`${who}，以 ${moneyText(c.salary)} 再留隊一年`,4,{person:p.careerCast?.agent?.name});
 logIt(`📄 ${who}｜另1年 ${moneyText(c.salary)}`);showCareerChapter("renewal");
}
function declineV8PlayerOption(){
 const c=normalizeV8Contract(p.contract);if(!c?.option||c.option.type!=="player")return;
 c.option.status="declined";recordV8Story("turning",`你放棄 ${moneyText(c.option.yearSalary||c.salary)} 的球員選項，選擇進入自由市場`,4,{person:p.careerCast?.agent?.name});
 showContractExpiryDecision();
}
function showContractExpiryDecision(){
 if(handleV8ContractOptionAtExpiry())return;
 p.stage="decision";resetMain();render();flow.innerHTML="";
 const dismissed=!!p.contract?.terminated,sc=scoutingScore(),nbaKind=nbaPathwayOfferKind(sc),nbaOffer=p.path==="NBA G League"&&nbaKind?makeNBAPathwayContract(sc,nbaKind,"expiry-callup-"+p.year):null;
 const offer=makeRenewalOffer();p.pendingRenewalOffer=offer;p.pendingNBAOffer=nbaOffer;p.marketOriginTeam=p.team;p.marketOriginLeague=p.path;
 chapter.textContent=`${p.year} · ${p.age}歲 · ${dismissed?"合約遭終止":"合約到期"}`;
 if(nbaOffer){
   const directNBA=nbaKind==="standard";
   title.textContent=directNBA?"NBA 正式合約邀請":"NBA 正式徵召｜雙向合約";
   text.innerHTML=`你在 <b>${p.team}</b> 的 G League 球季已達到 NBA 徵召標準。${directNBA?"球隊認為你的出勤、產量與主要榮譽已足以取得正式名單合約。":"接受後，生涯聯盟會正式進入 NBA，並以雙向球員身分競爭輪替。"}`;
   special.innerHTML=`<div class="offerGrid"><div class="offerCard"><b>${nbaOffer.team}｜NBA</b>${contractOfferHTML(nbaOffer)}<button class="btn" style="margin-top:10px" onclick="acceptContract(p.pendingNBAOffer)">接受 ${directNBA?"NBA 正式合約":"NBA 雙向合約"}</button></div>${offer?`<div class="offerCard"><b>留在 ${offer.team}</b>${contractOfferHTML(offer)}<button class="btn" style="margin-top:10px" onclick="acceptContract(p.pendingRenewalOffer)">續留 G League</button></div>`:""}<div class="offerCard"><b>比較完整自由市場</b><div class="mut">查看其他職業聯盟與 NBA 報價；原隊回歸條件會依市場結果調整。</div><button class="btn" style="margin-top:10px" onclick="listenFreeAgencyMarket()">聆聽其他球隊報價</button></div>${voluntaryRetirementCardHTML()}</div>`;
   choices.innerHTML="";return;
 }
 if(!offer){
   title.textContent=dismissed?"球團解約｜職業市場重新評估":"母隊不續約｜重新尋找下一站";
   text.innerHTML=dismissed?`<b>${p.team}</b> 已因重大場外違紀終止合約。母隊不會提出續約；其他球隊仍會依能力、紀律紀錄與市場風險決定是否接觸。`:`與 <b>${p.team}</b> 的合約正式到期。球團評估目前能力、身體狀況與名單後，決定不提出續約；這不等於立刻退休，你仍會完整測試其他聯盟與較低層級市場。`;
   special.innerHTML=`<div class="marketEmpty"><b>${dismissed?"球團正式終止合約":"球隊正式通知不續約"}</b><div class="mut">目前總評 ${overall()}｜職涯評價 ${scoutingScore()}${dismissed?"｜場外紀律紀錄將影響報價":""}｜接下來將尋找願意提供正式角色的球隊。</div><button class="btn" style="margin-top:10px" onclick="listenFreeAgencyMarket()">進入自由市場</button></div><div class="offerGrid">${voluntaryRetirementCardHTML()}</div>`;
   choices.innerHTML="";
   return;
 }
 title.textContent="續留，還是聆聽自由市場？";
   text.innerHTML=`與 <b>${p.team}</b> 的舊合約已經結束。母隊正式提出續約；經紀團隊提醒你，也可以測試自由市場，但原本的角色承諾與報價不一定會一直保留。`;
 special.innerHTML=`<div class="contractDecision">
   <b>🏠 母隊續約｜${offer.team}</b>
   ${contractOfferHTML(offer)}
 </div>
 <div class="choices">
   <button class="choice" onclick="acceptContract(p.pendingRenewalOffer)"><b>接受母隊續約</b><small>${offer.type}｜直接續留，不進入自由市場。</small></button>
   <button class="choice" onclick="listenFreeAgencyMarket()"><b>聆聽其他球隊報價</b><small>比較聯盟、薪資、年限、球隊角色與 NBA 機會；若市場冷清，原本的母隊報價可能降低。</small></button>
   <button class="choice" onclick="chooseVoluntaryRetirement()"><b>在合約到期後退休</b><small>不進入自由市場，以現在累積的成績與故事結束球員生涯。</small></button>
 </div>`;
 choices.innerHTML="";
}
function voluntaryRetirementCardHTML(){
 return `<div class="offerCard retirementOffer"><b>自己決定終點</b><div class="mut">合約已經結束，你可以不再等待市場決定去留，直接以目前履歷正式退休。</div><button class="btn" style="margin-top:10px" onclick="chooseVoluntaryRetirement()">宣布退休</button></div>`;
}
function chooseVoluntaryRetirement(){
 if(!isProPath()||p.retired)return;
 if(!window.confirm("確定要結束這段球員生涯嗎？退休後會直接進入生涯總結。"))return;
 retireCareer(`合約到期後，你選擇不再進入自由市場，主動結束球員生涯`);
}
function marketReturnTerms(base,offers,originLeague){
 if(!base)return {offer:null,mode:"none"};
 const rows=Array.isArray(offers)?offers:[];
 if(!rows.length){
   const offer=repriceContract(base,.75,1,"母隊回歸約");offer.bonus=0;finalizeContract(offer);
   return {offer,mode:"cold"};
 }
 const originRank=leagueMarketRank(originLeague),higher=rows.some(c=>leagueMarketRank(c.league)>originRank);
 if(higher){
   // A formal offer from a stronger league validates the player's market value.
   // Returning home is a player choice, so the club honors its original renewal proposal.
   return {offer:finalizeContract({...base}),mode:"validated"};
 }
 return {offer:repriceContract(base,.90,Math.min(2,base.years),"母隊回歸約"),mode:"discount"};
}
function listenFreeAgencyMarket(){
 const sc=scoutingScore(),origin=p.marketOriginTeam,originLeague=p.marketOriginLeague,r=RNG(p.seed+"listen-market-"+p.year+"-"+origin);
 const candidates=proOffersForScore(sc,"listen-"+p.year).filter(c=>c.team!==origin);
 let offers=candidates
   .filter(c=>{
      let cfg=LEAGUE_CFG[c.league]||{market:99};
      let edge=sc-cfg.market,exposurePull=(cfg.exposure||0)*.006;
      let tierPull=(p.seedTier==="S+"?.16:p.seedTier==="S"?.12:p.seedTier==="A"?.05:0);
      let underLevel=leagueMarketRank(p.path)<seedExpectedLeagueRank()?.06:0;
      let chance=Math.max(.20,Math.min(.96,.46+edge*.055+exposurePull+tierPull+underLevel-(p.age>=38?.08:0)));
      return r()<chance;
   });
 // A player who still clears a real roster threshold cannot randomly receive zero interest.
 // If every interest roll misses, the best viable club supplies a one-year proof contract.
 if(!offers.length&&candidates.length){
   const fallback=[...candidates].sort((a,b)=>leagueMarketRank(b.league)-leagueMarketRank(a.league)||b.salary-a.salary)[0];
   offers=[repriceContract(fallback,.84,1,"測試／證明短約")];
 }
 // Offer diversity: not only highest salary; G League can survive because its exposure is valuable.
 offers=offers.sort((a,b)=>(b.salary+b.exposure*90)-(a.salary+a.exposure*90)).slice(0,5);

 const base=p.pendingRenewalOffer,returnTerms=marketReturnTerms(base,offers,originLeague),back=returnTerms.offer;
 p.marketReturnOffer=back;p.marketReturnMode=returnTerms.mode;

 p.stage="decision";resetMain();render();flow.innerHTML="";
 chapter.textContent=`${p.year} · ${p.age}歲 · 自由市場`;
 title.textContent=offers.length?"市場報價出爐":"市場遇冷";
 text.innerHTML=offers.length
   ? `經紀團隊帶回 ${offers.length} 份正式報價。除了薪資與年限，也要比較<b>聯盟層級、球隊角色與未來機會</b>；老將若仍能打，也可能透過轉換聯盟延續生涯。${back?(returnTerms.mode==="validated"?"你已取得更高層級正式報價，原隊認定市場價值獲得證明，因此原續約條件仍然有效。":"外隊報價沒有高於原聯盟，母隊的新條件會小幅調整。 "):""}`
   : `母隊與其他球隊都沒有提出正式合約。現在還不會直接退休；你將透過公開測試爭取最後的現役資格。`;

 let cards=offers.map(proOfferCard).join("");
 special.innerHTML=`<div class="offerGrid">${cards}
   ${back?`<div class="${offers.length?"marketReturn":"marketEmpty"}">
     <b>↩ 回到 ${origin}</b>${contractOfferHTML(back)}
     <div class="mut" style="margin-top:7px">${returnTerms.mode==="validated"?"更高層級球隊的正式邀請已證明你的市場價值；即使選擇回歸，母隊仍維持原續約薪資、年限與角色。":returnTerms.mode==="discount"?"外隊只提供同級或較低層級機會；測試市場後回歸，母隊將原報價小幅下修。":"市場沒有其他正式報價，這是母隊最後的一年保底機會。"}</div>
     <button class="btn" style="margin-top:9px" onclick="acceptContract(p.marketReturnOffer)">接受回歸合約</button>
   </div>`:""}
   ${!offers.length&&!back?`<div class="offerCard"><b>參加公開測試</b><div class="mut">標準合約市場已經關閉。測試通過仍能取得一年證明約；測試失敗才會進入正式退場程序。</div><button class="btn" style="margin-top:9px" onclick="openTryout()">參加最後測試</button></div>`:""}
 </div>`;
 choices.innerHTML="";
}

function proOfferCard(c){
 return `<div class="offerCard">
   <b>${c.team}｜${leagueDisplay(c.league)}</b>
   ${contractOfferHTML(c)}
   <button class="btn" style="margin-top:10px" onclick='acceptContract(${JSON.stringify(c)})'>接受合約</button>
 </div>`;
}
function advanceCareerCalendar(advanceCareerSeason=isProPath()){
 p.year++;p.age++;p.round++;p.eventIndex=0;
 if(advanceCareerSeason)p.careerSeason=Math.max(0,p.careerSeason||0)+1;
 p.seasonEventCount=ri(RNG(p.seed+"events-"+p.year),2,4);
 p.seasonPlan=null;p.planRiskMod=0;p.planGrowthMod=0;p.planStatMod=0;
 p.pendingSeasonAdvance=false;
}
function consumePendingSeasonAdvance(){
 if(!p.pendingSeasonAdvance)return false;
 advanceCareerCalendar(isProPath());
 return true;
}
function acceptContract(c){
 const wasPro=isProPath();
 const previousTeam=p.team,previousLeague=p.path;
 consumePendingSeasonAdvance();
 c=finalizeContract({...c});
 c.startYear=p.year;
 const stayedWithTeam=wasPro && c.team===previousTeam && c.league===previousLeague;
 p.pendingRenewalOffer=null;p.pendingNBAOffer=null;p.pendingTryoutOffer={};p.marketReturnOffer=null;p.marketReturnMode="";p.marketOriginTeam="";p.marketOriginLeague="";
 const usedAgentPriority=p.pendingAgentPriority||"";p.pendingAgentPriority="";
 p.contract=c;p.path=c.league;p.team=c.team;p.careerSeason=wasPro?Math.max(1,p.careerSeason):1;p.grade=1;ensureTeamHistory();
 ensureV8CareerState(p);ensureV8TeamWorld(p);refreshV8Role(p,stayedWithTeam?"續約定位":"新球隊定位");
 p.roleState.promised=roleIdFromPromise(c.rolePromise);p.roleState.promisedLabel=c.rolePromise;p.roleState.promiseYear=p.year;p.roleState.promisedMinutes=c.promisedMinutes;
 if(c.league==="SBL／半職業"){
   p.developmentSeasons=previousLeague==="SBL／半職業"?developmentSeasonCount():1;
   if(previousLeague!=="SBL／半職業")p.developmentLastChanceUsed=false;
 }
 if(c.league!=="SBL／半職業"&&(p.firstFullProAge==null||!Number.isFinite(Number(p.firstFullProAge)))){
   p.firstFullProAge=p.age;
   logIt(`🏀 ${p.age}歲正式進入${leagueDisplay(c.league)}`);
 }
 p.careerSigningBonus+=(c.bonus||0);
 p.careerBasketballSalary+=(c.bonus||0);
 p.careerSalary+=(c.bonus||0);
 logIt(`✍️ 與 ${c.team} 簽下【${c.type}】${c.years}年｜年薪 ${moneyText(c.salary)}｜承諾 ${c.rolePromise}｜${c.option?.label||"全額保障"}｜保障總值 ${moneyText(c.total)}`);
 pushNews(`💰 ${p.name} 與 ${c.team} 簽下${c.type}，${c.years}年總值 ${moneyText(c.total)}`);
 showCareerChapter(stayedWithTeam?"renewal":"newTeam");
}
function seedMarketBonus(){
 const t=p.seedTier;
 return t==="S+"?8:t==="S"?6:t==="A"?3:t==="B"?1:-1;
}
function seedExpectedLeagueRank(){
 return p.seedTier==="S+"?5:p.seedTier==="S"?4:p.seedTier==="A"?4:p.seedTier==="B"?2:1;
}

function scoutingScore(){
 let vals=Object.values(p.stats),ov=overall(),talent=Object.values(p.caps).reduce((a,b)=>a+b,0)/8,season=p.seasonStats||{};
 let production=Math.min(15,(season.pts||0)*.30+(season.ast||0)*.45+(season.reb||0)*.22+(season.stl||0)*.7+(season.blk||0)*.6);
 let recentAwards=(p.lastSeasonAwards||[]).length,awardBonus=Math.min(7,recentAwards*1.4);
 let levelBonus=isProPath()?Math.max(0,(leagueStrength()-1)*18):p.path==="NCAA D1"?4:p.path==="NCAA D2"?2:0;
 let exposureBonus=isProPath()?Math.min(4,(LEAGUE_CFG[p.path]?.exposure||0)*.38):0;
 let upside=Math.max(-2.5,Math.min(3.5,(p.growth-70)*.075));
 let injuryPenalty=Math.min(12,p.injuryHistory.length*1.8)+(p.injury&&p.injury.level==="重傷"?5:0);
 const conductPenalty=Math.max(0,Number(p.conductMarketPenalty)||0);
 return Math.max(30,Math.min(99,Math.round(ov*.63+talent*.11+production+awardBonus+levelBonus+exposureBonus+p.rep*.12+upside+seedMarketBonus()+confidencePerformanceMod()*2+(p.genius?3:0)-injuryPenalty-conductPenalty)));
}
function leagueRosterOverallFloor(league){
 const floors={
   "SBL／半職業":p.age<=23?45:50,
   "台灣職業":58,"韓國職業":66,"日本職業":70,"CBA":71,
   "NBA G League":72,"NBA":86
 };
 return floors[league]??60;
}
function contractRosterOverallFloor(league,incumbent=false){
 // 老將門檻逐年上升，但不再在42歲突然跳高。45歲後只有仍具真正
 // 輪替能力的少數球員能續命，48～49歲則保留給歷史級極端案例。
 const agePremium={37:1,38:2,39:3,40:5,41:7,42:9,43:11,44:13,45:16,46:19,47:22,48:25,49:28};
 const veteranPremium=agePremium[p.age]||(p.age>=50?99:0);
 return leagueRosterOverallFloor(league)-(incumbent?2:0)+veteranPremium;
}
function canReceiveStandardContract(league,score=scoutingScore(),incumbent=false){
 const cfg=LEAGUE_CFG[league];if(!cfg)return false;
 if(p.age>=50)return false;
 const ovrFloor=contractRosterOverallFloor(league,incumbent);
 const scoutFloor=cfg.market-(incumbent?3:0);
 const ov=overall(),provenAbility=ov>=ovrFloor+8&&score>=scoutFloor-10;
 return ov>=ovrFloor&&(score>=scoutFloor||provenAbility);
}
function gLeaguePathwayEligible(score=scoutingScore()){
 const ov=overall(),standard=canReceiveStandardContract("NBA G League",score,false)&&ov>=76;
 if(standard)return true;
 if(p.age>30)return false;
 const resume=["NCAA D1","NCAA D2","日本大學","台灣職業","韓國職業","日本職業","CBA","NBA G League","NBA"].includes(p.path);
 if(!resume)return false;
 if(p.seedTier==="S+")return ov>=74&&score>=78;
 if(p.seedTier==="S")return ov>=76&&score>=81;
 // A 級沒有保送，但在 29 歲前若已累積 NCAA／旅外／完整職業履歷，
 // 達到實際輪替能力與球探門檻時可取得少量 G League 試訓機會。
 if(p.seedTier==="A"&&p.age<=29)return ov>=75&&score>=78;
 return false;
}
function nbaPerformanceOfferKind(score=scoutingScore()){
 const ss=p.seasonStats||{},ov=overall(),games=Number(ss.games||0),mins=Number(ss.mins||0);
 const impact=Number(ss.pts||0)+Number(ss.ast||0)*.75+Number(ss.reb||0)*.38+Number(ss.stl||0)*1.6+Number(ss.blk||0)*1.3;
 const awards=(p.lastSeasonAwards||[]).map(String);
 if(p.path==="NBA G League"){
   const major=awards.filter(name=>/年度第一隊|年度第二隊|得分王|助攻王|籃板王|最佳防守球員|年度MVP/.test(name)).length;
   const played=games>=28&&mins>=18;
   // Truly dominant G League production is a basketball résumé, not a Seed bonus.
   // This rare route lets any talent tier earn a two-way chance on the court.
   if(p.age<=32&&played&&impact>=25&&major>=2&&ov>=70&&score>=78)return "two-way";
   if(p.age<=31&&played&&impact>=20&&major>=1&&ov>=73&&score>=81)return "two-way";
 }
 if(p.path==="NBA"){
   const currentTwoWay=p.contract?.type==="NBA雙向合約";
   // A real NBA rotation season outweighs the hidden prospect grade. Twenty-plus
   // minutes with useful production earns a standard offer somewhere in the league.
   if(games>=24&&mins>=18&&impact>=13&&ov>=72&&score>=76)return "standard";
   if(currentTwoWay&&p.age<=33&&games>=12&&mins>=8&&impact>=8&&ov>=68&&score>=72)return "two-way";
 }
 return "";
}
function nbaPathwayOfferKind(score=scoutingScore()){
 const ov=overall();
 const earnedByPerformance=nbaPerformanceOfferKind(score);
 if(earnedByPerformance)return earnedByPerformance;
 const standardResume=(
   p.path==="NCAA D1"||p.path==="NBA G League"||p.path==="CBA"||p.path==="日本職業"||p.path==="NBA"||
   p.careerMVP>=1||p.careerFirstTeam>=2||p.careerAllStar>=3
 );
 if(canReceiveStandardContract("NBA",score,false)&&ov>=86&&standardResume)return "standard";

 const currentTwoWay=p.path==="NBA"&&p.contract?.type==="NBA雙向合約";
 if(p.path!=="NBA G League"&&!currentTwoWay)return "";
 const ss=p.seasonStats||{},impact=(ss.pts||0)+(ss.ast||0)*.75+(ss.reb||0)*.38+(ss.stl||0)*1.6+(ss.blk||0)*1.3;
 const awards=(p.lastSeasonAwards||[]).length;
 const gLeagueDPOY=(p.lastSeasonAwards||[]).some(name=>/NBA G League.*最佳防守球員/.test(String(name)));
 const playedEnough=(ss.games||0)>=(p.path==="NBA G League"?30:38)&&(ss.mins||0)>=6;
 const provedIt=awards>0||(playedEnough&&impact>=11.5);
 if(!provedIt||p.age>31)return "";
 // G League DPOY 是明確的 NBA 防守履歷。仍需基本能力、出勤與球探評價，
 // 但不再與普通單季獎項共用較高門檻。
 if(gLeagueDPOY&&p.age<=30&&playedEnough){
   if(p.seedTier==="S+"&&ov>=75&&score>=81)return "two-way";
   if(p.seedTier==="S"&&ov>=77&&score>=83)return "two-way";
   if(p.seedTier==="A"&&ov>=79&&score>=86)return "two-way";
   if(p.seedTier==="B"&&ov>=81&&score>=89)return "two-way";
 }
 if(p.seedTier==="S+"&&ov>=77&&score>=84)return "two-way";
 if(p.seedTier==="S"){
   if(ov>=79&&score>=87)return "two-way";
   // 少一點能力／球探分只限真正打出壓倒性 G League 球季的破格案例。
   if(ov>=77&&score>=83&&((playedEnough&&impact>=13)||awards>0))return "two-way";
 }
 if(p.seedTier==="A"&&ov>=80&&score>=88&&(awards>0||(playedEnough&&impact>=15)))return "two-way";
 return "";
}
function makeNBAPathwayContract(score,kind,salt,forcedTeam=null){
 if(kind==="standard")return makeContract("NBA",Math.max(score,(LEAGUE_CFG.NBA?.market||90)+5),salt,forcedTeam);
 const r=RNG(p.seed+"nba-two-way-"+p.year+"-"+salt+(forcedTeam||""));
 const salary=Math.round((1900+r()*900)*salaryEraIndex(p.year)),bonus=Math.round(salary*(.04+r()*.06));
 return finalizeContract({league:"NBA",team:forcedTeam||seedPick(NBA_TEAMS,"nba-two-way-team-"+salt),salary,bonus,years:1,startYear:p.year,remaining:1,type:"NBA雙向合約",role:"NBA／G League雙向球員",renewal:!!forcedTeam,nbaPathway:"g-league-callup"});
}
function proOffersForScore(score,salt){
 let out=[];
 const eligible=(league)=>canReceiveStandardContract(league,score,false);
 if(eligible("SBL／半職業"))out.push(makeContract("SBL／半職業",score,salt+"semi"));
 if(eligible("台灣職業"))out.push(makeContract("台灣職業",score,salt+"tw"));
 if(eligible("韓國職業"))out.push(makeContract("韓國職業",score,salt+"kr"));
 if(eligible("日本職業"))out.push(makeContract("日本職業",score,salt+"jp"));
 if(eligible("CBA"))out.push(makeContract("CBA",score,salt+"cn"));
 if(gLeaguePathwayEligible(score))out.push(makeContract("NBA G League",score,salt+"gl"));
 const nbaKind=nbaPathwayOfferKind(score);
 if(nbaKind)out.push(makeNBAPathwayContract(score,nbaKind,salt+"nba"));
 return out;
}

function ncaaD2TransferInvite(score,minScore=58,baseChance=.45,salt="d1"){ 
 if(score<minScore)return false;
 const r=RNG(p.seed+"ncaa-d2-to-d1-"+p.year+"-"+salt);
 const extra=Math.max(0,score-minScore)*.055;
 const tier=p.seedTier==="S+"?.12:p.seedTier==="S"?.09:p.seedTier==="A"?.04:0;
 return r()<Math.min(.98,baseChance+extra+tier);
}
function transferFromNCAAD2(){
 const oldTeam=p.team;
 p.path="NCAA D1";
 p.contract=null;
 p.careerSeason=0;
 // A D2-to-D1 move keeps academic progression instead of resetting eligibility.
 p.grade=Math.min(4,p.grade+1);
 p.team=seedPick(NCAA_D1_TEAMS,"ncaa-d2-transfer-"+p.year+"-"+oldTeam);
 if(!consumePendingSeasonAdvance())advanceCareerCalendar(false);
 logIt(`🎓 NCAA 轉學門戶｜從 ${oldTeam}（D2）轉往 ${p.team}（D1），以大${p.grade}身分續讀。`);
 showCareerChapter("newTeam");
}
// Compatibility aliases for buttons stored inside pre-V7.50 local save screens.
function transferFromNJCAA(){transferFromNCAAD2()}
function transferNCAAEarly(){transferFromNCAAD2()}

function showCollegeDecision(){
 p.pendingSeasonAdvance=true;
 p.stage="decision";resetMain();render();flow.innerHTML="";
 let sc=scoutingScore(),max=collegeMaxYears(),offers=proOffersForScore(sc,"college-"+p.grade),collegeComplete=p.grade>=max;
 chapter.textContent=`${p.year} · ${p.age}歲 · ${p.path} · 季末抉擇`;

 // ----------------------------------------------------------
 // Normal college season decision
 // ----------------------------------------------------------
 title.textContent=collegeComplete?"大學生涯完成，選擇你的職業去向":"留下，轉換跑道，還是投入職業？";
 text.innerHTML=collegeComplete
  ? `大學生涯已正式完成。各隊已依你的完整大學表現、健康狀況與發展潛力提出評估；請從收到的職業合約中選擇去向，若沒有正式報價則可投入公開測試。<br><span class="mut">職涯評價 <b class="gold">${sc}</b>｜大學畢業</span>`
  : `本季結束後，各隊重新評估你的發展。你可以繼續完成大學生涯，也可能提前接受職業邀約。<br><span class="mut">職涯評價 <b class="gold">${sc}</b>｜${currentCareerLabel()}</span>`;

 let html='<div class="offerGrid">';
 if(p.grade<max){
   html+=`<div class="offerCard"><b>留在 ${p.team}</b><div class="mut">繼續完成下一個大學賽季，累積能力、數據與曝光。</div><button class="btn" style="margin-top:9px" onclick="stayCollege()">繼續就讀</button></div>`;
 }
 if(p.path==="NCAA D2" && p.grade<max && (sc>=66||ncaaD2TransferInvite(sc,58,.45,`grade-${p.grade}`))){
   html+=`<div class="offerCard"><b>🎓 NCAA D1 轉學邀請</b><div class="mut">D1 球隊注意到你在 ${p.team} 的表現。轉學後保留年級進度，下一季以大${p.grade+1}身分加入更高曝光與更激烈的輪替競爭。</div><div class="offerMeta"><span>D2 → D1</span><span>球探 ${sc}</span></div><button class="btn" style="margin-top:9px" onclick="transferFromNCAAD2()">接受 D1 邀請</button></div>`;
 }

 html+=offers.length?offers.map(proOfferCard).join(""):`<div class="offerCard"><b>目前沒有正式職業合約</b><div class="mut">${collegeComplete?"大學生涯已完成，請透過公開測試爭取職業或半職業機會。":"可以留校繼續累積身價；下一季仍會重新評估。"}</div></div>`;

 if(p.grade>=max && !offers.length){
   html+=`<div class="offerCard"><b>投入公開測試</b><div class="mut">學籍年限結束，只能從職業測試或半職業重新尋找機會。</div><button class="btn" style="margin-top:9px" onclick="openTryout()">參加測試</button></div>`;
 }
 html+='</div>';
 special.innerHTML=html;
 choices.innerHTML="";
}
function stayCollege(){
 p.grade++;if(!consumePendingSeasonAdvance())advanceCareerCalendar(false);
 if(p.age>=22&&!p.genius&&!p.geniusResolved){p.geniusFailed=true;p.geniusResolved=true;logIt(`潛能覺醒失敗：22歲前高標值「6」累計 ${p.six}/5 次。`);}
 showCareerChapter("newSchoolYear");
}
function showTryoutOffer(contract,headline="測試通過｜收到合約"){
 p.stage="decision";resetMain();render();flow.innerHTML="";
 contract=finalizeContract({...contract});
 p.pendingTryoutOffer={...contract};
 chapter.textContent=`${p.year} · ${p.age}歲 · 公開測試結果`;
 title.textContent=headline;
 text.innerHTML=`測試結束後，球隊決定正式向你提出報價。<br><span class="mut">只有按下「接受合約」後，才會正式加入球隊。</span>`;
 special.innerHTML=`<div class="offerGrid">
   <div class="offerCard">
     <b>${contract.team}｜${leagueDisplay(contract.league)}</b>
     ${contractOfferHTML(contract)}
     <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
       <button class="btn" onclick='acceptContract(${JSON.stringify(contract)})'>接受合約</button>
       <button class="btn" onclick="declineTryoutOffer()">拒絕合約</button>
     </div>
   </div>
 </div>`;
 choices.innerHTML="";
}
function declineTryoutOffer(){
 const offer=p.pendingTryoutOffer&&p.pendingTryoutOffer.team?p.pendingTryoutOffer:null;
 if(!offer){openTryout();return}
 p.declinedTryoutCount=(p.declinedTryoutCount||0)+1;
 p.stage="decision";resetMain();render();flow.innerHTML="";
 chapter.textContent=`${p.year} · ${p.age}歲 · 合約市場`;
 title.textContent="拒絕這份報價，不等於直接退休";
 text.textContent=`你拒絕了 ${offer.team} 的報價，但其他球隊與原報價尚未立刻關門。現在要決定繼續談判、尋找另一支球隊，或由你主動結束生涯。`;
 special.innerHTML=`<div class="offerGrid"><div class="offerCard"><b>剛才拒絕的報價｜${offer.team}</b>${contractOfferHTML(offer)}</div></div>`;
 const alternativeButton=(p.declinedTryoutCount||0)<2?`<button class="choice" onclick="seekAlternativeTryoutOffer()"><b>請經紀團隊聯絡其他球隊</b><small>尋找同級或下一層級的另一份短約；薪資與角色通常會比原報價差。</small></button>`:`<div class="notice fail"><b>其他球隊已完成本輪評估</b><br>經紀團隊已替你找過另一份報價；本輪市場不會無限產生新合約。</div>`;
 choices.innerHTML=`
   <button class="choice" onclick="reconsiderTryoutOffer()"><b>重新考慮原報價</b><small>回到談判桌接受原合約；球隊不會因一次拒絕就立刻撤案。</small></button>
   ${alternativeButton}
   <button class="choice" onclick="retireAfterDeclinedOffer()"><b>主動結束球員生涯</b><small>只有選擇這一項，才會因拒絕報價正式退休。</small></button>`;
}
function reconsiderTryoutOffer(){
 const offer=p.pendingTryoutOffer;if(!offer?.team){openTryout();return}
 acceptContract({...offer});
}
function seekAlternativeTryoutOffer(){
 const previous=p.pendingTryoutOffer;if(!previous?.team){openTryout();return}
 const sameLeague=previous.league||"SBL／半職業",fallback=sameLeague==="台灣職業"&&overall()<contractRosterOverallFloor("台灣職業")+4?"SBL／半職業":sameLeague;
 const teams=leagueTeamPool(fallback).filter(team=>team!==previous.team),r=RNG(`${p.seed}-alternative-offer-${p.year}-${p.declinedTryoutCount||1}`);
 const team=teams.length?teams[ri(r,0,teams.length-1)]:previous.team;
 let contract=makeContract(fallback,Math.max(46,scoutingScore()-6),`alternative-offer-${p.year}-${p.declinedTryoutCount||1}`,team,true);
 contract.years=contract.remaining=1;contract.type="測試／證明短約";contract.role=contractTypeInfo(contract.type).role;contract.bonus=0;contract.salary=Math.max(20,Math.round(contract.salary*.82));contract=finalizeContract(contract);
 logIt(`拒絕 ${previous.team} 後，經紀團隊從 ${contract.team} 找到另一份一年證明約。`);
 showTryoutOffer(contract,"繼續尋找市場｜收到另一份證明約");
}
function retireAfterDeclinedOffer(){
 const team=p.pendingTryoutOffer?.team||"球隊";p.pendingTryoutOffer={};
 retireCareer(`拒絕 ${team} 的報價後，你決定不再繼續尋找其他合約，主動結束球員生涯`);
}

function openTryout(){
 let sc=scoutingScore(),r=RNG(p.seed+"tryout-"+p.year),test=sc+ri(r,0,20);

 if(isProPath()&&p.age>=50){
   showRetirementCrisis("母隊與各層級市場都沒有合約；50歲後不再有球隊提供正式公開測試名額");
   return;
 }

 // 公開測試可以讓邊緣球員多一次機會，但不能讓履歷或隨機值掩蓋已不足以出賽的能力。
 if(test>=75 && overall()>=contractRosterOverallFloor("台灣職業")-2){
   const c=makeContract("台灣職業",Math.max(sc,66),"tryout-pro-"+p.year);
   showTryoutOffer(c,"測試表現出色｜收到一軍合約");
   return;
 }

 // 沒拿到一軍不等於自動加入半職業；能力尚可時，SBL球隊可能提出短約。
 if(overall()>=contractRosterOverallFloor("SBL／半職業")-2 && test>=52){
   let c=makeContract("SBL／半職業",Math.max(sc,50),"tryout-semi-"+p.year);
   c.type="測試／證明短約";c.role=contractTypeInfo(c.type).role;c.years=c.remaining=1;c=finalizeContract(c);
   showTryoutOffer(c,"一軍未錄取｜SBL球隊提出證明短約");
   logIt(`公開測試未獲一軍合約，但 ${c.team} 提出半職業1年短約。`);
   return;
 }

 if(isProPath()){
   showRetirementCrisis("母隊不續約、自由市場沒有正式報價，公開測試後也沒有任何球隊願意提供合約");
   return;
 }
 retireCareer("公開測試結束後沒有任何球隊提出合約，職業夢在此結束");
}
