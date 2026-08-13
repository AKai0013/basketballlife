const fs=require("fs");
const {JSDOM,VirtualConsole}=require("jsdom");

const html=fs.readFileSync("BasketballLife_V7_50_CompleteEdition.html","utf8");
const runtimeErrors=[];
const vc=new VirtualConsole();
vc.on("jsdomError",e=>runtimeErrors.push(e.message));
vc.on("error",e=>runtimeErrors.push(String(e)));
const dom=new JSDOM(html,{
  runScripts:"dangerously",url:"https://local.test",pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){
    w.confirm=()=>true;w.scrollTo=()=>{};
    w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
  }
});
const w=dom.window;
w.setTimeout=()=>0;w.clearTimeout=()=>{};
w.BasketballLifeOnline.requiresNickname=()=>false;
const P=()=>w.eval("p");
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

function begin(seed,pos,index){
  if(P())w.clearCareerSave(false);
  w.document.getElementById("seed").textContent=seed;
  w.document.getElementById("playerNameInput").value=`模擬球員${index}`;
  w.eval(`chosenPos=${JSON.stringify(pos)}`);
  w.startCareer();
  assert(P().careerVersion==="7.50.1","new career version tag missing");
}

function assignTraining(){
  const p=P();p.diceRolling=false;p.diceRevealCount=p.dice.length;w.renderDice();
  let guard=0;
  while(p.used.some(x=>!x)&&guard++<20){
    const keys=Object.keys(p.stats).sort((a,b)=>p.stats[a]-p.stats[b]);
    w.assignTraining(keys[0]);
  }
  assert(p.used.every(Boolean),"training dice did not finish");
}

function clickFirstChoice(){
  const button=w.document.querySelector("#choices .choice,#special .choice,#choices .btn,#special .btn");
  if(!button)return false;
  button.click();return true;
}

function handleDecision(route){
  const p=P(),heading=w.document.getElementById("title").textContent;
  if(heading.includes("高中畢業")){w.chooseGraduate(route);return}
  if(w.isCollegePath()){
    if(p.grade<w.collegeMaxYears()){w.stayCollege();return}
    const c=w.makeContract("SBL／半職業",Math.max(58,w.scoutingScore()),`audit-college-${p.year}`);
    w.acceptContract(c);return;
  }
  if(w.isDevelopmentPath()){
    if(w.developmentSeasonCount()<2){w.continueDevelopment();return}
    const c=w.makeContract("台灣職業",Math.max(70,w.scoutingScore()),`audit-pro-${p.year}`);
    w.acceptContract(c);return;
  }
  if(p.retirementCrisisReason){w.resolveRetirementCrisis("retire");return}
  if(p.pendingRenewalOffer){w.acceptContract(p.pendingRenewalOffer);return}
  if(!clickFirstChoice())throw new Error(`unhandled decision: ${heading}`);
}

function simulate(seed,pos,route,index){
  begin(seed,pos,index);
  let steps=0,stageCounts={};
  while(!P().retired&&steps++<5000){
    const p=P();
    stageCounts[p.stage]=(stageCounts[p.stage]||0)+1;
    if(p.stage==="transition")w.nextStep();
    else if(p.stage==="plan")w.chooseSeasonPlan(index%3===0?"attack":index%3===1?"normal":"care");
    else if(p.stage==="training"){
      if(p.diceRolling||p.used.some(x=>!x))assignTraining();
      w.nextStep();
    }else if(p.stage==="events"){
      if(!clickFirstChoice())w.nextStep();
    }else if(p.stage==="special"){
      if(!clickFirstChoice())w.nextStep();
    }else if(p.stage==="health"||p.stage==="results")w.nextStep();
    else if(p.stage==="points"){
      p.bonusPoints=0;w.finishSeason();
    }else if(p.stage==="decision")handleDecision(route);
    else throw new Error(`unknown stage ${p.stage}`);
  }
  const p=P();
  assert(p.retired,`career did not retire: ${seed}, stage=${p.stage}, age=${p.age}, special=${p.specialIndex}/${p.specialQueue.length}, title=${w.document.getElementById("title").textContent}, counts=${JSON.stringify(stageCounts)}`);
  assert(p.age<=43,`career exceeded realistic basketball age cap: ${seed}/${route}, age=${p.age}, OVR=${w.overall()}, path=${p.path}`);
  assert(w.overall()<=60,`career retired while still clearly roster-capable: ${seed}/${route}, age=${p.age}, OVR=${w.overall()}, path=${p.path}`);
  assert(p.age===16+(p.year-2026),`calendar mismatch: ${p.year}/${p.age}`);
  const years=p.seasonHistory.map(x=>x.year);
  assert(new Set(years).size===years.length,`duplicate season year: ${years.join(",")}`);
  for(const s of p.seasonHistory){
    const [lo,hi]=w.seasonScheduleRange(s.path);
    assert(s.scheduledGames>=lo&&s.scheduledGames<=hi,`schedule range ${s.path}: ${s.scheduledGames}`);
    assert(s.games>=0&&s.games<=s.scheduledGames,`games invalid ${s.year}: ${s.games}/${s.scheduledGames}`);
    assert((s.missedGames||0)+s.games===s.scheduledGames,`missed-game mismatch ${s.year}`);
    for(const k of ["mins","pts","reb","ast","stl","blk","fg","three"])assert(Number.isFinite(s[k]),`non-finite ${k}`);
  }
  return {seed,pos,route,seasons:p.seasonHistory.length,retiredAge:p.age,retiredOVR:w.overall(),games:p.careerGames,injuries:p.injuryHistory.length,titles:p.titles.length+p.chainTitles.length};
}

const schedules={
  HBL:[18,24],UBA:[20,26],"UBA 強權":[22,28],"日本大學":[24,30],"NCAA D2":[26,30],"NCAA D1":[29,31],
  "SBL／半職業":[20,24],"台灣職業":[36,36],"韓國職業":[54,54],"日本職業":[60,60],CBA:[42,46],"NBA G League":[50,50],NBA:[82,82]
};
for(const [path,range] of Object.entries(schedules))assert(JSON.stringify(w.seasonScheduleRange(path))===JSON.stringify(range),`schedule config ${path}`);

begin("ABCDEFGH","PG",0);
let p=P();
p.path="HBL";p.injury={name:"測試ACL",area:"膝蓋",level:"重傷",originalMissedGames:41,remainingGames:41};
let h=w.ensureInjuryRecoveryState();assert(h.schedule>=18&&h.schedule<=24,"HBL injury schedule");
assert(p.injury.remainingGames>=9&&p.injury.remainingGames<=12,"HBL normalized injury");
p.path="NBA";let n=w.ensureInjuryRecoveryState();assert(n.schedule===82&&p.injury.remainingGames===41,"NBA normalized injury");

const tickerCases=[
  ["球員入選年度第一隊",{},0],["球員獲得年度MVP",{},5],["球員獲得台灣職籃得分王",{},0],
  ["球員遭遇生涯級重傷",{},0],["球員率隊拿下季後賽冠軍",{type:"championship",league:"台灣職業"},5],
  ["球員率隊拿下HBL高中籃球聯賽冠軍",{type:"championship",league:"HBL"},0],
  ["球員解鎖稱號【中華隊國手】",{},0],["球員於 39 歲正式退休",{},0],
  ["傳奇生涯｜球員於 41 歲正式退休",{type:"legacy"},5]
];
for(const [message,meta,importance] of tickerCases)assert(w.tickerNewsInfo(message,meta).importance===importance,`ticker filter: ${message}`);

const awardYears=w.groupedCareerAwards([
  {year:2023,name:"台灣職籃 得分王"},{year:2024,name:"台灣職籃 得分王"},
  {year:2024,name:"台灣職籃 得分王"},{year:2026,name:"台灣職籃 得分王"}
]);
assert(awardYears[0].count===3&&awardYears[0].years.join(",")==="2023,2024,2026","award year grouping failed");

begin("NTSTATS1","SF",0);p=P();
Object.keys(p.stats).forEach(k=>p.stats[k]=72);p.rep=38;p.specialQueue=[];p.specialIndex=0;
for(const [index,level] of ["U18","U20","SENIOR"].entries()){
  p.year=2028+index;p.age=18+index;w.resolveNationalCallup(level);
  const row=p.internationalHistory.at(-1);
  assert(row.level===level&&row.games>=3&&row.games<=7,`national games missing: ${level}`);
  for(const key of ["mins","pts","reb","ast","stl","blk","fg","three"])assert(Number.isFinite(row[key]),`national ${key} missing: ${level}`);
  assert(w.document.getElementById("special").textContent.includes("GP")&&w.document.getElementById("special").textContent.includes("PTS"),`national result table missing: ${level}`);
}
const nationalSummary=w.careerNationalSummary();
assert(nationalSummary.U18.games>0&&nationalSummary.U20.games>0&&nationalSummary.SENIOR.games>0,"national levels were not aggregated separately");
p.internationalHistory.push({year:2027,level:"U18",event:"舊版青年賽",finish:"八強",reward:0});
const nationalHTML=w.legacyNationalCareerHTML();
assert(nationalHTML.includes("舊存檔")&&nationalHTML.includes("各屆紀錄")&&!nationalHTML.includes("NaN"),"legacy national history fallback failed");
assert(html.includes("publicNationalTable(cd.international_history)")&&html.includes("國家隊生涯"),"public/retirement national sections missing");

const legacy=JSON.parse(JSON.stringify(P()));
delete legacy.oldInjuries;delete legacy.medicalHistory;delete legacy.strategyStats;delete legacy.u18Caps;delete legacy.pendingSeasonAdvance;delete legacy.careerVersion;
legacy.injury={name:"舊傷",area:"膝蓋",level:"大傷",originalMissedGames:20,remainingGames:10};
const migrated=w.normalizeCareerPlayer(legacy);
assert(migrated.oldInjuries&&Array.isArray(migrated.medicalHistory),"legacy fields not restored");
assert(Array.isArray(migrated.offCourtHistory),"legacy off-court history not restored");
assert(Math.abs(migrated.injury.remainingSeasonShare-10/82)<1e-9,"legacy injury not normalized");
assert(migrated.careerVersion==="legacy","old save should stay on historical ranking era");
const oldD2=w.normalizeCareerPlayer({...JSON.parse(JSON.stringify(P())),path:"NJCAA",team:"NJCAA 東區學院"});
const oldD1=w.normalizeCareerPlayer({...JSON.parse(JSON.stringify(P())),path:"NCAA",team:"NCAA 大學校隊"});
assert(oldD2.path==="NCAA D2"&&w.eval("NCAA_D2_TEAMS").includes(oldD2.team),"old NJCAA route not migrated to D2");
assert(oldD1.path==="NCAA D1"&&w.eval("NCAA_D1_TEAMS").includes(oldD1.team),"old NCAA route not migrated to D1");

w.saveCareerNow();
const stored=JSON.parse(w.localStorage.getItem("basketballlife.career.v1"));
delete stored.player.oldInjuries;delete stored.player.medicalHistory;delete stored.player.strategyStats;
w.localStorage.setItem("basketballlife.career.v1",JSON.stringify(stored));
const restored=w.readCareerSave();
assert(restored&&restored.player.oldInjuries&&Array.isArray(restored.player.medicalHistory),"saved career migration failed");

const posLabels=[...w.document.querySelectorAll("#posgrid .pos small")].map(x=>x.textContent);
assert(posLabels.join(",")==="控球後衛,得分後衛,小前鋒,大前鋒,中鋒","position labels missing");
assert(w.document.querySelector(".setupIdentity h1").textContent.includes("HBL"),"setup copy lacks career starting point");
assert(!("rankingEra" in w.BasketballLifeOnline.state),"version era state should be removed from leaderboard");
assert(!html.includes("rankEraTab")&&!html.includes("changeRankEra")&&!html.includes("rankingVersionLabel"),"version-era leaderboard controls should be removed");
assert(html.includes("名人堂 ×${hof}")&&html.includes("球衣退休 ×${jersey}"),"leaderboard legacy badges should use readable labels");
assert(html.includes("分享生涯紀念圖")&&!html.includes("分享生涯連結 ↗"),"retirement share should use image");

begin("HJKMNPQR","SF",0);p=P();
p.injury={name:"跨季重傷",area:"膝蓋",level:"重傷",originalSeasonShare:1.10,remainingSeasonShare:1.10,originalMissedGames:0,remainingGames:0,recovery:"跨季"};
w.showResults();
const severeSeason=p.seasonHistory.at(-1);
assert(severeSeason.missedGames===severeSeason.scheduledGames&&severeSeason.games===0,"cross-season injury did not erase current season");
assert(p.injury.remainingSeasonShare>.08&&p.injury.remainingSeasonShare<.12,"cross-season injury remainder invalid");

begin("RSTUVWXY","PF",0);p=P();
p.path="台灣職業";p.team="臺北猛獅";p.careerSeason=1;p.contract=w.makeContract("台灣職業",75,"plan-audit");
p.seasonPlan="attack";p.planGrowthMod=.18;p.planStatMod=2.5;
w.showResults();
assert(w.document.getElementById("special").textContent.includes("賽季規劃修正"),"season plan growth was not applied");

begin("Z2345678","C",0);p=P();
p.u18Caps=1;p.u20Caps=2;p.nationalCaps=12;p.careerNationalAwards=2;p.careerGames=500;
p.seasonHistory=[];
for(let i=0;i<6;i++)p.seasonHistory.push({year:2030+i,team:"忠誠隊",path:"台灣職業",games:36,pts:15,reb:8,ast:3,stl:1,blk:1});
p.seasonHistory.push({year:2036,team:"旅外隊",path:"日本職業",games:60,pts:15,reb:8,ast:3,stl:1,blk:1});
p.seasonHistory.push({year:2037,team:"旅美隊",path:"NBA G League",games:50,pts:15,reb:8,ast:3,stl:1,blk:1});
w.titleChecks();
for(const id of ["youth_taiwan","u20_core","senior_taiwan","national_ace","national_legend","asia_journey","franchise","evergreen"]){
  assert(p.titles.some(t=>t.id===id),`new title missing: ${id}`);
}

begin("234EFGHJ","PG",0);p=P();
p.path="NCAA D2";p.team="洛磯山礦業大學";p.grade=2;p.year=2028;p.age=18;p.pendingSeasonAdvance=true;
w.transferFromNCAAD2();
assert(p.path==="NCAA D1"&&p.grade===3&&p.year===2029&&p.age===19&&!p.pendingSeasonAdvance,"D2 to D1 transfer calendar failed");
assert(!w.eval("NCAA_D2_TEAMS").includes(p.team)&&w.eval("NCAA_D1_TEAMS").includes(p.team),"D1 transfer school pool failed");
const usSchools=[...w.eval("NCAA_D1_TEAMS"),...w.eval("NCAA_D2_TEAMS")];
assert(new Set(usSchools).size===usSchools.length&&usSchools.every(x=>!x.includes("NCAA")&&!x.includes("籃球")),"US fictional school names invalid");

begin("456JKLMN","SG",0);p=P();
p.path="UBA";p.team="政治大學";p.grade=4;p.year=2029;p.age=19;p.pendingSeasonAdvance=true;
const collegeContract=w.makeContract("SBL／半職業",60,"calendar-contract");
w.acceptContract(collegeContract);
assert(p.year===2030&&p.age===20&&!p.pendingSeasonAdvance,"college-to-pro calendar failed");

begin("89BCDFGH","SF",0);p=P();
p.path="台灣職業";p.team="臺北猛獅";p.age=36;p.year=2046;p.careerSeason=15;p.bodyLoad=36;
Object.keys(p.stats).forEach(k=>p.stats[k]=76);Object.keys(p.caps).forEach(k=>p.caps[k]=80);
p.contract=w.makeContract("台灣職業",76,"active-veteran",p.team,true);p.contract.remaining=2;
assert(w.overall()===76&&w.maybeForceRetire()===false&&!p.retired,"OVR 76 veteran was forced to retire under contract");
assert(w.canReceiveStandardContract("台灣職業",w.scoutingScore(),true),"OVR 76 veteran should clear renewal market");
w.showContractExpiryDecision();
assert(p.pendingRenewalOffer&& !w.document.getElementById("special").textContent.includes("正式退休"),"renewable veteran should not see retirement action");
w.showProSeasonPlan();
assert(!w.document.getElementById("choices").textContent.includes("考慮退休"),"preseason should not offer age-only retirement");

begin("DUIAUDIT","SG",0);p=P();
p.path="台灣職業";p.team="臺北猛獅";p.age=27;p.year=2037;p.careerSeason=6;p.rep=20;
Object.keys(p.stats).forEach(k=>p.stats[k]=75);Object.keys(p.caps).forEach(k=>p.caps[k]=82);
p.contract=w.makeContract("台灣職業",75,"conduct-audit",p.team,true);p.contract.remaining=3;
const scoutBefore=w.scoutingScore();w.resolveOffCourtSpecial("driveAfterDrinking");
assert(p.contract.terminated&&p.contract.remaining===1,"DUI should terminate the current contract");
assert(p.nationalTeamBanUntil===2040&&p.conductSuspensionGames>=999,"DUI sanctions missing");
assert(p.offCourtHistory.at(-1).type==="酒駕事件"&&w.scoutingScore()<scoutBefore,"DUI history/market penalty missing");
assert(w.document.getElementById("special").textContent.includes("立即解約"),"DUI dismissal result copy missing");
w.showResults();assert(p.seasonHistory.at(-1).games===0,"DUI dismissal should remove the remaining season");
p.bonusPoints=0;w.finishSeason();
assert(!p.pendingRenewalOffer&&w.document.getElementById("title").textContent.includes("球團解約"),"dismissed player should not receive mother-team renewal");

begin("8BCDFGHJ","C",0);p=P();
p.path="台灣職業";p.team="臺北猛獅";p.age=42;p.year=2052;p.careerSeason=22;p.bodyLoad=22;
Object.keys(p.stats).forEach(k=>p.stats[k]=90);Object.keys(p.caps).forEach(k=>p.caps[k]=94);
assert(w.canReceiveStandardContract("台灣職業",w.scoutingScore(),true),"legendary age-42 player should still be contract eligible");
p.age=43;
assert(!w.canReceiveStandardContract("台灣職業",w.scoutingScore(),true),"age-43 player should leave the standard contract market");
p.contract=w.makeContract("台灣職業",90,"age-43-active",p.team,true);p.contract.remaining=1;
assert(w.maybeForceRetire()===false&&!p.retired,"existing age-43 contract should still be honored");

begin("9CDFGHJK","PF",0);p=P();
p.path="台灣職業";p.team="臺北猛獅";p.age=42;p.year=2052;p.careerSeason=20;p.rep=0;p.seasonStats={};
Object.keys(p.stats).forEach(k=>p.stats[k]=45);Object.keys(p.caps).forEach(k=>p.caps[k]=45);
p.contract=w.makeContract("台灣職業",45,"expired-veteran",p.team,true);p.contract.remaining=0;
assert(w.makeRenewalOffer()===null,"OVR 45 veteran should not receive automatic renewal");
w.showContractExpiryDecision();
assert(w.document.getElementById("title").textContent.includes("不續約"),"declined renewal screen missing");
w.listenFreeAgencyMarket();
assert(w.document.getElementById("special").textContent.includes("最後測試"),"no-market veteran should reach final tryout");
w.openTryout();
assert(!p.retired&&p.retirementCrisisReason,"failed veteran tryout should enter final retirement decision");
assert(w.document.getElementById("special").textContent.includes("45")&&!w.document.getElementById("special").textContent.includes("6.480000"),"retirement market formatting failed");

const fakeGradient={addColorStop(){}};
const fakeContext={fillStyle:"",strokeStyle:"",lineWidth:0,font:"",textAlign:"left",fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){},measureText(s){return {width:String(s).length*20}},createLinearGradient(){return fakeGradient}};
w.HTMLCanvasElement.prototype.getContext=()=>fakeContext;
const shareCanvas=w.buildCareerShareCanvas();
assert(shareCanvas.width===1200&&shareCanvas.height===1500,"career share canvas dimensions invalid");
assert(typeof w.shareCareerImage==="function"&&typeof w.copyCareerImage==="function","career image sharing functions missing");

const seeds=["A1B2C3D4","E5F6G7H8","J9K1L2M3","N4P5Q6R7","S8T9U1V2","W3X4Y5Z6","23456789","BCDFGHJK","LMNPQRST","VWXYZ234","56789BCD","FGHJKLMN","PQRSTUV2","TUVWX345","YZ6789AB","CDEFGH23","KLMN4567","QRST89CD","UVW234EF","XYZ567GH","BCD89JKL","GHJ234MN","MNP567QR","STU89VWX"];
const positions=["PG","SG","SF","PF","C"];
const routes=["UBA","NCAA D1","NCAA D2","日本大學"];
const careers=seeds.map((seed,i)=>simulate(seed,positions[i%positions.length],routes[i%routes.length],i+1));
assert(runtimeErrors.length===0,`runtime errors: ${runtimeErrors.join(" | ")}`);
console.log(JSON.stringify({careers,schedules:Object.keys(schedules).length,runtimeErrors},null,2));
dom.window.close();
