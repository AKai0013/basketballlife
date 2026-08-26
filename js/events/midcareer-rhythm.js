(function(global){
"use strict";

const PRO_PATHS=new Set(["SBL／半職業","台灣職業","日本職業","韓國職業","CBA","NBA G League","歐洲聯賽","NBA","海外職業","職業"]);
const STAT_KEYS=["shoot","finish","handle","pass","defense","rebound","ath","iq"];
const CHAPTER_ORDER=["peak","turn","legacy"];
const CHAPTER_OFFSETS={peak:[0,1],turn:[2,3],legacy:[4,5,6]};
const ROLE_LEVEL={garbage:0,benchLeader:1,worker:2,sixth:3,starter:4,core:5};
const CHAPTERS={
 peak:{label:"巔峰延續",start:0,objectives:[
  {id:"peak_signature",label:"維持代表作能力",copy:"保留主導比賽與競爭個人榮譽的能力。"},
  {id:"peak_title",label:"把巔峰換成勝利",copy:"接受球權調整，讓球隊更接近冠軍。"},
  {id:"peak_health",label:"把巔峰拉得更長",copy:"管理負荷，保留後續幾季的完整狀態。"}
 ]},
 turn:{label:"角色轉折",start:2,objectives:[
  {id:"turn_compete",label:"繼續守住核心位置",copy:"用場上表現回應接班與角色競爭。"},
  {id:"turn_redefine",label:"建立第二種核心價值",copy:"把組織、防守與判斷變成新的影響力。"},
  {id:"turn_mentor",label:"把經驗變成球隊資產",copy:"讓隊友成長，同時保留自己的決勝角色。"}
 ]},
 legacy:{label:"生涯收束",start:4,objectives:[
  {id:"legacy_title",label:"再追一次最高舞台",copy:"承擔風險，爭取最後一段冠軍窗口。"},
  {id:"legacy_home",label:"留下能被記住的關係",copy:"重視球隊、球迷與下一代對你的記憶。"},
  {id:"legacy_long",label:"保留繼續打球的選擇",copy:"不因章節結束而退休，維持下一份職業價值。"}
 ]}
};

const SEASONS=[
 {chapter:"peak",title:"球權第一次不再只屬於你",lead:"球隊加入另一名主要持球者。教練希望兩個核心都能走到季後賽，你必須決定怎麼重新分配自己的影響力。",choices:[
  {id:"share_claim",title:"重新證明第一進攻順位",copy:"用表現把關鍵球權留在自己手上。",base:52,skills:["shoot","finish","handle","ath"],align:["peak_signature","turn_compete"],sure:{rep:-4,confidence:6,fatigue:5,bodyLoad:5},success:{rep:4,confidence:3},failure:{rep:-3,bodyLoad:3},bonusPoints:1,memory:"你要求球隊繼續以自己為第一進攻點。",successText:"開季表現讓球隊重新把決勝球交到你手上。",failureText:"使用量提高了，但雙核心仍沒有找到穩定共存方式。"},
  {id:"share_team",title:"改打無球並接下最難對位",copy:"讓出部分持球，用防守、空切與判斷維持核心價值。",base:64,skills:["shoot","defense","iq","ath"],align:["peak_title","turn_redefine"],sure:{rep:6,confidence:1,fatigue:2},success:{rep:3,confidence:3},failure:{confidence:-2},memory:"你第一次主動讓出部分球權。",successText:"兩名核心找到共存方式，你仍留在決勝陣容。",failureText:"你完成了髒活，但進攻存在感比預期更快下降。"},
  {id:"share_health",title:"降低例行賽負荷",copy:"接受數據降溫，把完整身體留給真正重要的比賽。",base:72,skills:["iq","discipline","durability"],align:["peak_health","legacy_long"],sure:{health:5,fatigue:-6,bodyLoad:-6,confidence:-2},success:{health:3,rep:2},failure:{rep:-2},memory:"你首次把健康排在完整例行賽數據之前。",successText:"負荷調整奏效，你以更完整的狀態進入關鍵賽程。",failureText:"身體得到休息，但輪替節奏沒有完全接回來。"}
 ]},
 {chapter:"peak",title:"續約條件開始定義你的使用方式",lead:"球隊願意談新合約，但年限、角色與負荷被放在同一張談判桌上。這次選擇不只是在比較薪資。",choices:[
  {id:"contract_star",title:"要求完整核心條件",copy:"保住明星定位，也接受更高的表現與出勤壓力。",base:48,skills:["shoot","finish","handle","iq"],align:["peak_signature","turn_compete"],sure:{confidence:6,rep:-3,fatigue:4,bodyLoad:4},success:{rep:5,confidence:2},failure:{rep:-5,confidence:-2},bonusPoints:1,memory:"你用談判要求球隊承認自己仍是明星核心。",successText:"球隊接受你的核心定位，使用方式沒有提前縮減。",failureText:"談判沒有得到完整承諾，球隊開始保留調整角色的空間。"},
  {id:"contract_team",title:"短一點的保障換取爭冠補強",copy:"少拿長期承諾，要求球隊把資源投入當下陣容。",base:61,skills:["pass","defense","iq"],align:["peak_title","legacy_title"],sure:{rep:6,confidence:1},success:{rep:4,confidence:4},failure:{confidence:-3},memory:"你用部分保障交換球隊的爭冠補強。",successText:"球隊完成關鍵補強，你的讓步換成了更完整的陣容。",failureText:"補強效果有限，你少拿的保障沒有立即換成勝利。"},
  {id:"contract_health",title:"把負荷與出勤保障寫進合約",copy:"接受較保守的定位，避免短期傷勢直接改變整份合約。",base:75,skills:["iq","discipline","durability"],align:["peak_health","legacy_long"],sure:{health:5,fatigue:-4,bodyLoad:-5,rep:1},success:{health:3,confidence:2},failure:{rep:-2},memory:"你把健康保障正式放進下一階段的規劃。",successText:"球隊接受長期使用方式，你不必每場重新證明身體。",failureText:"健康得到保護，球隊也更早開始準備新的持球核心。"}
 ]},
 {chapter:"turn",title:"球隊選進了和你同位置的新人",lead:"新人在訓練營迅速進入輪替。教練沒有宣布取代誰，但戰術已開始讓他站在你熟悉的位置。",choices:[
  {id:"rookie_compete",title:"正面競爭每一分鐘",copy:"用得分與對位守住位置，不接受提前交棒。",base:50,skills:["finish","defense","ath","clutch"],align:["turn_compete","peak_signature"],sure:{confidence:6,rep:-5,fatigue:5,bodyLoad:5},success:{rep:5,confidence:3},failure:{rep:-4,bodyLoad:3},bonusPoints:1,memory:"你選擇和接班人正面競爭。",successText:"你守住了主要輪替，新人必須先從替補學習。",failureText:"競爭拖累更衣室，新人的效率反而得到更多支持。"},
  {id:"rookie_redefine",title:"轉成組織與防守核心",copy:"降低出手，把比賽閱讀與防守指揮變成新價值。",base:66,skills:["pass","defense","iq","handle"],align:["turn_redefine","peak_title"],sure:{rep:7,confidence:1,fatigue:-1},success:{rep:4,confidence:3},failure:{confidence:-3},memory:"你從主要得分者轉向組織與防守核心。",successText:"新角色讓你和新人同時留在決勝陣容。",failureText:"轉型初期數據下滑，外界暫時把調整解讀成退化。"},
  {id:"rookie_mentor",title:"把新人帶進自己的訓練圈",copy:"分享錄影、讀秒球與防守細節，接受舞台逐步轉移。",base:76,skills:["pass","iq","discipline"],align:["turn_mentor","legacy_home"],sure:{rep:6,health:2,confidence:-1},success:{rep:4,confidence:3},failure:{confidence:-2},memory:"你公開把接班人帶進自己的訓練圈。",successText:"新人快速成長，你的影響開始超出個人數據。",failureText:"新人進步了，但媒體也過早把你寫成即將退場的前輩。"}
 ]},
 {chapter:"turn",title:"身體在季後賽前發出警訊",lead:"這還不是大傷，但醫療團隊警告：繼續提高負荷，短期問題可能留下跨季影響。",choices:[
  {id:"warning_play",title:"維持完整輪替",copy:"保住排名與角色，也承擔警訊惡化的代價。",base:43,skills:["ath","durability","clutch"],align:["turn_compete","legacy_title"],sure:{rep:4,confidence:4,health:-8,fatigue:7,bodyLoad:8},success:{rep:3,confidence:3},failure:{health:-5,bodyLoad:5},bonusPoints:1,memory:"你在季後賽前選擇維持完整輪替。",successText:"你撐住關鍵賽程，球隊保住原有位置。",failureText:"身體反應惡化，季後賽爆發力受到影響。"},
  {id:"warning_clutch",title:"限時上場，只打決勝段",copy:"把出場集中在真正重要的回合。",base:65,skills:["iq","clutch","defense","pass"],align:["turn_redefine","peak_title"],sure:{rep:5,health:2,fatigue:-2,bodyLoad:-2},success:{rep:3,confidence:4},failure:{confidence:-3},memory:"你接受限時輪替，只負責決勝段。",successText:"有限時間放大了你的判斷與防守價值。",failureText:"節奏切得太碎，你沒能在決勝段完全接管比賽。"},
  {id:"warning_rest",title:"完整休養到季後賽",copy:"放棄短期數據，避免警訊變成真正的生涯轉折。",base:78,skills:["discipline","durability","iq"],align:["turn_mentor","peak_health","legacy_long"],sure:{health:8,fatigue:-7,bodyLoad:-8,rep:-2},success:{health:3,confidence:2},failure:{confidence:-2},memory:"你在季後賽前選擇完整休養。",successText:"你健康回歸，仍能完成季後賽任務。",failureText:"傷勢穩定了，新人也利用這段時間站穩主要輪替。"}
 ]},
 {chapter:"legacy",title:"球隊只剩一段清楚的爭冠窗口",lead:"核心陣容未來可能拆散。球隊問你願意付出多少，換取最後一次真正接近冠軍的機會。",choices:[
  {id:"window_allin",title:"把負荷壓在今年",copy:"不替下一季保留，承擔最重的比賽責任。",base:44,skills:["finish","defense","ath","clutch"],align:["legacy_title","turn_compete"],sure:{rep:4,confidence:5,health:-9,fatigue:8,bodyLoad:9},success:{rep:4,confidence:4},failure:{health:-5,bodyLoad:5},bonusPoints:1,memory:"你把身體押在這次爭冠窗口。",successText:"高風險投入把球隊推進更深的季後賽。",failureText:"負荷沒有換成最後勝利，身體卻留下明確代價。"},
  {id:"window_team",title:"用團隊角色維持完整陣容",copy:"把勝負交給防守、傳球與輪替深度。",base:65,skills:["pass","defense","iq"],align:["legacy_title","legacy_home","turn_redefine"],sure:{rep:7,confidence:1,fatigue:2},success:{rep:4,confidence:3},failure:{confidence:-3},memory:"你用團隊角色參與最後一段爭冠窗口。",successText:"完整輪替讓球隊走得更遠，你仍是決勝陣容的一員。",failureText:"團隊打法沒有突破上限，球隊仍缺少最後的接管回合。"},
  {id:"window_preserve",title:"保留下一季的身體",copy:"拒絕透支，接受今年不再是絕對中心。",base:76,skills:["discipline","durability","iq"],align:["legacy_long","peak_health"],sure:{health:7,fatigue:-6,bodyLoad:-7,confidence:-2},success:{health:3,rep:2},failure:{rep:-3},memory:"你拒絕為單一窗口透支剩餘生涯。",successText:"你完整走過球季，為下一份角色保留選擇。",failureText:"身體保持穩定，市場卻開始提前縮小你的角色。"}
 ]},
 {chapter:"legacy",title:"球隊不再保證原本的先發位置",lead:"母隊、爭冠隊與家鄉舞台各有不同期待。現在要決定的不是退休，而是下一段角色的優先順序。",choices:[
  {id:"role_sixth",title:"接受更精簡的母隊角色",copy:"留在熟悉體系，用更少時間維持高影響。",base:72,skills:["shoot","iq","clutch"],align:["legacy_long","turn_redefine"],sure:{rep:6,health:4,fatigue:-3,confidence:-1},success:{rep:4,confidence:3},failure:{confidence:-2},memory:"你留在熟悉體系，接受更精簡的輪替角色。",successText:"你成為替補席的穩定核心，決勝時刻仍有位置。",failureText:"角色縮減比預期更快，你開始離開主要比賽畫面。"},
  {id:"role_chase",title:"向新的爭冠環境表達意願",copy:"接受重新競爭輪替，爭取最後一段高層級舞台。",base:54,skills:["defense","ath","iq","clutch"],align:["legacy_title","turn_compete"],sure:{confidence:5,rep:-4,fatigue:4,bodyLoad:3},success:{rep:4,confidence:4},failure:{rep:-4,confidence:-2},bonusPoints:1,memory:"你向新的爭冠環境表達意願。",successText:"市場重新看見你的即戰力，下一份角色保留競爭空間。",failureText:"市場只願意提供有限輪替，你必須重新評估優先順序。"},
  {id:"role_home",title:"把返鄉與傳承放進下一步",copy:"重視球迷與年輕球員的連結，但不把返鄉等同退休。",base:69,skills:["pass","iq","discipline"],align:["legacy_home","turn_mentor"],sure:{rep:6,health:2,confidence:1},success:{rep:4,confidence:3},failure:{confidence:-2},memory:"你把返鄉與傳承列入下一段生涯的優先考量。",successText:"新的舞台理解你的角色，情感價值與球場責任同時成立。",failureText:"情感方向得到回應，但市場仍要求你證明場上價值。"}
 ]},
 {chapter:"legacy",title:"這段後半場篇章，要留下哪一種畫面？",lead:"這個階段即將結束，但退休仍由市場、身體與你的選擇決定。這一季只決定後半段生涯最清楚的記憶。",choices:[
  {id:"final_signature",title:"再搶一次代表作",copy:"重新拉高使用量，讓這段篇章以競爭收尾。",base:42,skills:["shoot","finish","handle","clutch"],align:["legacy_title","peak_signature"],sure:{confidence:7,health:-8,fatigue:7,bodyLoad:8},success:{rep:5,confidence:4},failure:{health:-4,confidence:-2},bonusPoints:1,memory:"你在章節最後再次拉高使用量。",successText:"你打出足以成為後半段生涯代表作的一季。",failureText:"你沒有重回最高峰，但所有人都看見你仍選擇競爭。"},
  {id:"final_handoff",title:"把決勝責任交給下一代",copy:"留在場上指揮與防守，讓接班人完成最後一擊。",base:72,skills:["pass","defense","iq","discipline"],align:["legacy_home","turn_mentor","turn_redefine"],sure:{rep:7,health:2,confidence:1},success:{rep:4,confidence:4},failure:{confidence:-2},memory:"你把這段篇章的決勝責任交給下一代。",successText:"接班人在關鍵回合完成任務，你的傳承有了具體畫面。",failureText:"交棒沒有立即換成勝利，但球隊理解了你留下的角色。"},
  {id:"final_continue",title:"健康走完整季，保留續戰選擇",copy:"不宣布退休，也不追求過量使用；球季後再接受市場評估。",base:79,skills:["discipline","durability","iq"],align:["legacy_long","peak_health"],sure:{health:8,fatigue:-7,bodyLoad:-8,rep:1},success:{health:3,confidence:3},failure:{rep:-2},memory:"你健康走完整季，把是否續戰留給下一次市場評估。",successText:"完整出勤保住了下一年的職業角色。",failureText:"身體保持穩定，但市場只剩更精簡的輪替位置。"}
 ]}
];

function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0))}
function currentOverall(player){
 const values=STAT_KEYS.map(key=>Number(player?.stats?.[key])).filter(Number.isFinite);
 return values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0;
}
function isV9(player){return String(player?.careerVersion||"").startsWith("9.")}
function isProfessional(player){return PRO_PATHS.has(String(player?.path||""))}
function ensureState(player){
 if(!isV9(player))return null;
 const state=player.midcareerArc&&typeof player.midcareerArc==="object"&&!Array.isArray(player.midcareerArc)?player.midcareerArc:{};
 player.midcareerArc=state;state.version=2;
 state.startCareerSeason=Math.max(0,Math.round(Number(state.startCareerSeason)||0));state.startYear=Math.max(0,Math.round(Number(state.startYear)||0));
 state.startOverall=clamp(state.startOverall,0,99);state.triggerReason=String(state.triggerReason||"");
 state.startOffset=Math.max(0,Math.min(SEASONS.length-1,Math.round(Number(state.startOffset)||0)));
 state.startRole=String(state.startRole||"");state.startRoleLevel=clamp(state.startRoleLevel,0,5);
 if(!state.chapterObjectives||typeof state.chapterObjectives!=="object"||Array.isArray(state.chapterObjectives))state.chapterObjectives={};
 if(!state.chapterStarts||typeof state.chapterStarts!=="object"||Array.isArray(state.chapterStarts))state.chapterStarts={};
 if(!state.chapterReasons||typeof state.chapterReasons!=="object"||Array.isArray(state.chapterReasons))state.chapterReasons={};
 state.results=Array.isArray(state.results)?state.results.filter(row=>row&&Number.isFinite(Number(row.offset))).slice(-7):[];
 const openingChapter=SEASONS[state.startOffset]?.chapter||"peak";
 if(state.startCareerSeason&&!state.chapterStarts[openingChapter])state.chapterStarts[openingChapter]=state.startCareerSeason;
 if(state.triggerReason&&!state.chapterReasons[openingChapter])state.chapterReasons[openingChapter]=state.triggerReason;
 for(const chapter of CHAPTER_ORDER){
  const rows=state.results.filter(row=>row.chapter===chapter);
  if(rows.length&&!state.chapterStarts[chapter])state.chapterStarts[chapter]=Math.min(...rows.map(row=>Number(row.careerSeason)||0).filter(Boolean));
 }
 state.completed=!!state.completed||state.results.some(row=>Number(row.offset)===SEASONS.length-1);
 return state;
}
function recentProfessionalOvrs(player){
 return (Array.isArray(player?.seasonHistory)?player.seasonHistory:[])
  .filter(row=>row&&PRO_PATHS.has(String(row.path||""))&&Number.isFinite(Number(row.ovr)))
  .slice(-3).map(row=>Math.round(Number(row.ovr)));
}
function triggerProfile(player){
 const season=Math.max(0,Math.round(Number(player?.careerSeason)||0)),current=currentOverall(player),recent=recentProfessionalOvrs(player);
 if(!isV9(player)||!isProfessional(player)||season<8)return {eligible:false,season,current,recent,stillRising:false,reason:"尚未進入職業生涯轉折期"};
 if(recent.length<3)return {eligible:false,season,current,recent,stillRising:false,reason:"職業樣本仍不足，先讓目前角色繼續發展"};
 if(current>=97)return {eligible:true,season,current,recent,stillRising:false,reason:`OVR ${current}，能力已進入成熟平台`};
 const oldest=recent[0],latest=recent[recent.length-1],gain=latest-oldest,lastGain=latest-recent[recent.length-2],trainingGain=current-latest;
 const stillRising=current>=latest&&((recent.length>=3&&gain>=4&&lastGain>=1)||trainingGain>=2);
 if(stillRising)return {eligible:false,season,current,recent,stillRising:true,reason:`最近 OVR ${recent.join(" → ")}，目前 ${current}，仍在明顯上升`};
 if(current<latest)return {eligible:true,season,current,recent,stillRising:false,reason:`最近高點 OVR ${latest}，目前 ${current}，角色進入轉折`};
 return {eligible:true,season,current,recent,stillRising:false,reason:`最近 OVR ${recent.join(" → ")}，目前 ${current}，成長進入平台`};
}
function shouldStart(player){
 const state=ensureState(player);
 if(!state||state.completed||state.startCareerSeason)return false;
 return triggerProfile(player).eligible;
}
function roleLevel(player){return ROLE_LEVEL[String(player?.roleState?.current||"")]??-1}
function strongestRecordedRole(player,state){
 let strongest=Number(state?.startRoleLevel)||0;
 for(const row of Array.isArray(player?.roleHistory)?player.roleHistory:[]){
  if(state?.startYear&&Number(row?.year)<state.startYear)continue;
  strongest=Math.max(strongest,ROLE_LEVEL[String(row?.role||row?.current||"")]??0);
 }
 return strongest;
}
function careerPeak(player,state){
 const history=(Array.isArray(player?.seasonHistory)?player.seasonHistory:[]).filter(row=>row&&PRO_PATHS.has(String(row.path||""))).map(row=>Number(row.ovr)||0);
 return Math.max(currentOverall(player),Number(player?.peakOverall)||0,Number(state?.startOverall)||0,...history);
}
function nextOffset(state){
 const completed=new Set(state.results.map(row=>Number(row.offset)));
 for(let offset=Math.max(0,Number(state.startOffset)||0);offset<SEASONS.length;offset++)if(!completed.has(offset))return offset;
 return SEASONS.length;
}
function previousResult(state,offset){return state.results.find(row=>Number(row.offset)===offset-1)||null}
function transitionProfile(player,state){
 const current=currentOverall(player),peak=careerPeak(player,state),drop=Math.max(0,peak-current),currentRole=roleLevel(player),strongestRole=strongestRecordedRole(player,state);
 const roleDrop=currentRole>=0?Math.max(0,strongestRole-currentRole):0;
 const eligible=drop>=3||roleDrop>=1;
 const reason=drop>=3?`生涯高點 OVR ${peak}，目前 ${current}，能力曲線開始轉折`:roleDrop>=1?`球隊角色由高點下修 ${roleDrop} 級，使用方式開始改變`:"能力與角色仍維持在原有高點";
 return {eligible,current,peak,drop,currentRole,strongestRole,roleDrop,reason};
}
function legacyProfile(player,state){
 const current=currentOverall(player),peak=careerPeak(player,state),drop=Math.max(0,peak-current),currentRole=roleLevel(player),strongestRole=strongestRecordedRole(player,state),roleDrop=currentRole>=0?Math.max(0,strongestRole-currentRole):0;
 const contract=player?.contract||{},promise=String(contract.rolePromise||player?.roleState?.promisedLabel||"");
 const shortContract=Number(contract.remaining??contract.years??0)<=1,limitedPromise=/輪替|板凳|雙向|訓練營|垃圾時間/.test(promise);
 const strained=(Number(player?.health)||100)<78||(Number(player?.bodyLoad)||0)>=65||!!player?.injury;
 const marketPressure=(Number(player?.retirementCrisisCount)||0)>0||!!player?.lastDanceActive;
 const limitedRole=currentRole>=0&&currentRole<=2,benchRole=currentRole>=0&&currentRole<=1;
 const eligible=marketPressure||drop>=10||(drop>=7&&currentRole>=0&&currentRole<=3)||(drop>=5&&limitedRole&&(shortContract||limitedPromise||strained))||(drop>=3&&benchRole&&roleDrop>=2);
 let reason="球員仍有穩定市場與主要輪替，不急著進入生涯收束";
 if(marketPressure)reason="市場已要求重新證明續戰價值";
 else if(drop>=10)reason=`生涯高點 OVR ${peak}，目前 ${current}，生涯進入重新定位期`;
 else if(drop>=7&&currentRole>=0&&currentRole<=3)reason=`OVR 已由高點下降 ${drop}，實際角色也不再是固定核心`;
 else if(drop>=5&&limitedRole)reason=`OVR 已由高點下降 ${drop}，合約與輪替空間開始縮小`;
 else if(benchRole)reason="實際角色已退到板凳末端，下一段市場需要重新選擇";
 return {eligible,current,peak,drop,currentRole,strongestRole,roleDrop,shortContract,limitedPromise,strained,marketPressure,reason};
}
function openingOffset(player,state){
 const legacy=legacyProfile(player,state);if(legacy.eligible)return {offset:4,chapter:"legacy",reason:legacy.reason};
 const turn=transitionProfile(player,state);if(turn.eligible)return {offset:2,chapter:"turn",reason:turn.reason};
 return {offset:0,chapter:"peak",reason:triggerProfile(player).reason};
}
function pacingProfile(player){
 const state=ensureState(player),season=Math.max(0,Math.round(Number(player?.careerSeason)||0));
 if(!state)return {eligible:false,offset:-1,chapter:"",reason:"不適用此生涯版本"};
 const saved=state.results.find(row=>Number(row.year)===Number(player?.year));
 if(saved)return {eligible:true,offset:Number(saved.offset),chapter:saved.chapter||SEASONS[Number(saved.offset)]?.chapter||"",reason:state.chapterReasons?.[saved.chapter]||state.triggerReason};
 if(state.completed)return {eligible:false,offset:-1,chapter:"",reason:"生涯篇章已完成"};
 const offset=nextOffset(state);
 if(offset>=SEASONS.length)return {eligible:false,offset:-1,chapter:"",reason:"生涯篇章已完成"};
 if(!state.startCareerSeason){
  const trigger=triggerProfile(player);
  const opening=openingOffset(player,state);
  return {...trigger,eligible:trigger.eligible,offset:trigger.eligible?opening.offset:-1,chapter:opening.chapter,reason:opening.reason};
 }
 const previous=previousResult(state,offset);
 if(previous&&season<=Number(previous.careerSeason||0))return {eligible:false,offset:-1,chapter:SEASONS[offset].chapter,reason:"本季篇章選擇已完成"};
 const chapter=SEASONS[offset].chapter,isChapterStart=[0,2,4].includes(offset);
 if(offset===0)return {eligible:true,offset,chapter,reason:state.chapterReasons?.peak||state.triggerReason};
 if(!isChapterStart)return {eligible:true,offset,chapter,reason:state.chapterReasons?.[chapter]||state.triggerReason};
 if(previous&&season<Number(previous.careerSeason||0)+2)return {eligible:false,offset:-1,chapter,reason:"先讓一般球季承接上一階段的結果"};
 const profile=chapter==="turn"?transitionProfile(player,state):legacyProfile(player,state);
 return {...profile,offset:profile.eligible?offset:-1,chapter};
}
function activeOffset(player){
 return pacingProfile(player).offset;
}
function definition(player){const offset=activeOffset(player);return offset>=0&&offset<SEASONS.length?{...SEASONS[offset],offset}:null}
function objective(player,chapterId){
 const state=ensureState(player),id=state?.chapterObjectives?.[chapterId];
 return CHAPTERS[chapterId]?.objectives.find(item=>item.id===id)||null;
}
function valueForFit(player,key){
 if(Number.isFinite(Number(player?.stats?.[key])))return Number(player.stats[key]);
 return Number.isFinite(Number(player?.[key]))?Number(player[key]):50;
}
function chanceBreakdown(player,choice){
 const fit=Math.round(choice.skills.reduce((sum,key)=>sum+valueForFit(player,key),0)/choice.skills.length);
 const health=Number.isFinite(Number(player.health))?Number(player.health):100,confidence=Number.isFinite(Number(player.confidence))?Number(player.confidence):50;
 const condition=clamp(Math.round(health-((Number(player.fatigue)||0)*.42)-((Number(player.bodyLoad)||0)*.38)),0,100);
 const activeChapter=choice.chapter||definition(player)?.chapter,objectiveId=activeChapter?objective(player,activeChapter)?.id||"":"";
 const aligned=choice.align.includes(objectiveId);
 let chance=choice.base+Math.round((fit-65)*.38)+Math.round((confidence-50)*.10)+Math.round(clamp(player.rep,-60,120)*.04);
 const strain=100-condition;
 if(choice.id.includes("health")||choice.id.includes("rest")||choice.id.includes("preserve")||choice.id.includes("continue"))chance+=Math.round(strain*.12);
 else chance-=Math.round(strain*(choice.base<55?.18:.09));
 if(aligned)chance+=4;
 chance=clamp(Math.round(chance),22,92);
 return {chance,fit,condition,aligned,objectiveId};
}
function deterministicRoll(player,choiceId){
 const key=`${player.seed||"V9"}-midcareer-${player.year}-${player.careerSeason}-${choiceId}`;
 if(typeof global.RNG==="function")return 1+Math.floor(global.RNG(key)()*100);
 let hash=2166136261;for(const char of key){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return 1+(Math.abs(hash)>>>0)%100;
}
function applyDelta(player,delta={}){
 const bounds={health:[0,100],confidence:[0,100],fatigue:[0,100],bodyLoad:[0,100],rep:[-100,200]};
 Object.entries(delta).forEach(([key,amount])=>{
  if(!(key in bounds)||!Number.isFinite(Number(amount)))return;
  const [min,max]=bounds[key];player[key]=clamp((Number(player[key])||0)+Number(amount),min,max);
 });
}
function resultForChoice(player,choiceId){
 const season=definition(player),choice=season?.choices.find(item=>item.id===choiceId);
 if(!season||!choice)return null;
 const breakdown=chanceBreakdown(player,{...choice,chapter:season.chapter}),selectedObjective=objective(player,season.chapter),state=ensureState(player);
 if(!state)return null;
 const prior=state.results.find(item=>Number(item.year)===Number(player.year));
 if(prior)return prior;
 const roll=deterministicRoll(player,choice.id),success=roll<=breakdown.chance;
 applyDelta(player,choice.sure);applyDelta(player,success?choice.success:choice.failure);
 if(success&&choice.bonusPoints)player.specialBonusPoints=Math.max(0,Number(player.specialBonusPoints)||0)+choice.bonusPoints;
 const result={
  offset:season.offset,careerSeason:Number(player.careerSeason)||0,year:Number(player.year)||0,age:Number(player.age)||0,ovr:currentOverall(player),chapter:season.chapter,
  objectiveId:selectedObjective?.id||"",objective:selectedObjective?.label||"",choiceId:choice.id,choice:choice.title,chance:breakdown.chance,roll,success,
  aligned:breakdown.aligned,guaranteed:{...choice.sure},extra:{...(success?choice.success:choice.failure)},bonusPoints:success?(choice.bonusPoints||0):0,
  memory:choice.memory,story:success?choice.successText:choice.failureText
 };
 state.results=state.results.filter(item=>Number(item.year)!==result.year);state.results.push(result);state.results=state.results.slice(-7);
 if(season.offset===SEASONS.length-1)state.completed=true;
 return result;
}
function effectText(delta={}){
 const labels={rep:"球隊信任",confidence:"信心",health:"健康",fatigue:"疲勞",bodyLoad:"身體負荷"};
 return Object.entries(delta).filter(([,value])=>Number(value)).map(([key,value])=>`${labels[key]} ${Number(value)>0?"+":""}${value}`);
}
function escape(value){
 if(typeof global.escapeFeedText==="function")return global.escapeFeedText(value);
 return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function chapterEvidence(player,chapterId){
 const state=ensureState(player),rows=state?.results?.filter(item=>item.chapter===chapterId)||[];
 return rows.filter(item=>item.aligned).length;
}
function progressHtml(player,offset){
 const state=ensureState(player),active=SEASONS[offset]?.chapter;
 return `<div class="v9MidcareerProgress" aria-label="生涯三階段進度">${CHAPTER_ORDER.map(chapter=>{
  const total=CHAPTER_OFFSETS[chapter].length,done=state.results.filter(row=>row.chapter===chapter).length,classes=[done>=total?"done":"",chapter===active?"now":""].filter(Boolean).join(" ");
  return `<span class="${classes}"><b>${escape(CHAPTERS[chapter].label)}</b><small>${done}/${total} 已完成</small></span>`;
 }).join("")}</div>`;
}
function followupHtml(player,offset){
 const previous=ensureState(player)?.results?.find(item=>item.offset===offset-1);
 return previous?`<div class="v9MidcareerFollow"><small>前一段選擇留下的影響</small><b>${escape(previous.choice)}</b><p>${escape(previous.story)}</p></div>`:"";
}
function renderObjectives(player,season){
 const group=CHAPTERS[season.chapter];
 title.textContent=`${group.label}，你想留下什麼？`;
 text.textContent="先決定這一階段最重要的方向。目標不會鎖死選項，但一致的選擇更容易形成清楚的生涯軌跡。";
 const state=ensureState(player),reason=state.chapterReasons?.[season.chapter]||state.triggerReason;
 special.innerHTML=`${progressHtml(player,season.offset)}<div class="v9MidcareerContext"><small>這段篇章現在出現</small><b>${escape(reason)}</b><span>職業第 ${player.careerSeason} 季｜OVR ${currentOverall(player)}</span></div>`;
 choices.innerHTML=`<div class="v9MidcareerGoals">${group.objectives.map((item,index)=>`<button class="choice v9MidcareerGoal" data-v9-approach="goal" onclick="chooseV90MidcareerObjective('${item.id}')"><span class="v9MidcareerIndex">0${index+1}</span><b>${escape(item.label)}</b><small>${escape(item.copy)}</small></button>`).join("")}</div>`;
}
function renderDecision(player,season){
 const group=CHAPTERS[season.chapter],selected=objective(player,season.chapter);
 title.textContent=season.title;text.textContent=season.lead;
 special.innerHTML=`${progressHtml(player,season.offset)}${followupHtml(player,season.offset)}<div class="v9MidcareerObjective"><small>${escape(group.label)}目標</small><b>${escape(selected?.label||"尚未選擇")}</b><span>${chapterEvidence(player,season.chapter)} 次選擇已呼應目標</span></div>`;
 choices.innerHTML=`<div class="v9MidcareerChoices">${season.choices.map((choice,index)=>{
  const odds=chanceBreakdown(player,{...choice,chapter:season.chapter}),sure=effectText(choice.sure);
  const condition=odds.condition>=76?"穩定":odds.condition>=52?"需留意":"高負荷";
  return `<button class="choice v9MidcareerChoice" data-v9-approach="decision" onclick="resolveV90MidcareerChoice('${choice.id}')"><span class="v9MidcareerIndex">0${index+1}</span><span class="v9MidcareerChoiceCopy"><b>${escape(choice.title)}</b><small>${escape(choice.copy)}</small><em>${sure.map(escape).join("・")}</em></span><span class="v9MidcareerOdds"><small>額外成果</small><b>${odds.chance}%</b><em>能力適配 ${odds.fit}｜身體 ${condition}${odds.aligned?"｜符合目標":""}</em></span></button>`;
 }).join("")}</div>`;
}
function renderResult(player,season,result){
 title.textContent=result.success?"這次選擇帶來額外成果":"固定取捨已生效";
 text.textContent="機率只決定額外成果；選項上列出的固定影響已經完整套用。";
 const sure=effectText(result.guaranteed),extra=effectText(result.extra);
 special.innerHTML=`${progressHtml(player,season.offset)}<div class="v9MidcareerResult ${result.success?"success":"miss"}"><small>${escape(CHAPTERS[season.chapter].label)}｜職業第 ${result.careerSeason} 季</small><h3>${escape(result.choice)}</h3><p>${escape(result.story)}</p><div class="v9MidcareerResultFacts"><span><small>額外成果機率</small><b>${result.chance}%</b></span><span><small>本次判定</small><b>${result.roll}／100</b></span><span><small>目標呼應</small><b>${result.aligned?"是":"否"}</b></span></div><div class="v9MidcareerEffects"><span><small>固定影響</small>${sure.map(item=>`<b>${escape(item)}</b>`).join("")}</span><span><small>${result.success?"額外成果":"未取得額外成果"}</small>${extra.length?extra.map(item=>`<b>${escape(item)}</b>`).join(""):`<b>沒有額外數值變動</b>`}${result.bonusPoints?`<b>能力點 +${result.bonusPoints}</b>`:""}</span></div></div>`;
 choices.innerHTML="";next.textContent="進入本季特殊事件 →";next.classList.remove("hidden");
}
function showScreen(){
 const player=p,state=ensureState(player),season=definition(player);if(!state||!season)return false;
 player.stage="midcareer";player.seasonEventCount=0;resetMain();render();
 chapter.textContent=`${player.year} · ${player.age}歲 · ${player.path} · 職業第 ${player.careerSeason} 季`;
 const savedResult=state.results.find(item=>Number(item.year)===Number(player.year));
 if(savedResult)renderResult(player,season,savedResult);
 else if(!objective(player,season.chapter))renderObjectives(player,season);
 else renderDecision(player,season);
 scheduleCareerAutosave();return true;
}
function maybeStart(){
 const player=p,state=ensureState(player);if(!state||state.completed)return false;
 if(!state.startCareerSeason){
  const trigger=triggerProfile(player);if(!trigger.eligible)return false;
  const opening=openingOffset(player,state);
  state.startCareerSeason=trigger.season;state.startYear=Number(player.year)||0;state.startOverall=trigger.current;state.triggerReason=opening.reason;state.startOffset=opening.offset;
  state.startRole=String(player.roleState?.current||"");state.startRoleLevel=Math.max(0,roleLevel(player));state.chapterStarts[opening.chapter]=trigger.season;state.chapterReasons[opening.chapter]=opening.reason;
 }
 const pacing=pacingProfile(player),offset=pacing.offset;if(!pacing.eligible||offset<0||offset>=SEASONS.length)return false;
 const chapter=SEASONS[offset].chapter;
 if(!state.chapterStarts[chapter])state.chapterStarts[chapter]=Number(player.careerSeason)||0;
 if(!state.chapterReasons[chapter])state.chapterReasons[chapter]=pacing.reason||state.triggerReason;
 return showScreen();
}
function chooseObjective(id){
 const player=p,season=definition(player),group=season&&CHAPTERS[season.chapter];
 if(!group?.objectives.some(item=>item.id===id))return false;
 ensureState(player).chapterObjectives[season.chapter]=id;showScreen();return true;
}
function resolveChoice(id){
 const player=p,season=definition(player),result=resultForChoice(player,id);if(!season||!result)return false;
 if(typeof recordV8Story==="function")recordV8Story("turning",`${result.memory}${result.success?` ${result.story}`:""}`,5,{major:true,midcareer:true,chapter:result.chapter,choiceId:result.choiceId,aligned:result.aligned});
 if(typeof logIt==="function")logIt(`生涯轉折：${result.choice}｜${result.success?"取得額外成果":"固定取捨生效"}`);
 showScreen();return true;
}

Object.assign(global,{
 ensureV90MidcareerState:ensureState,v90MidcareerTriggerProfile:triggerProfile,v90ShouldStartMidcareer:shouldStart,
 v90MidcareerTransitionProfile:transitionProfile,v90MidcareerLegacyProfile:legacyProfile,v90MidcareerPacingProfile:pacingProfile,
 v90MidcareerActiveOffset:activeOffset,v90MidcareerDefinition:definition,v90MidcareerChanceBreakdown:chanceBreakdown,
 v90ResolveMidcareerChoice:resultForChoice,maybeStartV90MidcareerRhythm:maybeStart,showV90MidcareerScreen:showScreen,
 rebuildV90MidcareerScreenFromSave:showScreen,chooseV90MidcareerObjective:chooseObjective,resolveV90MidcareerChoice:resolveChoice
});
})(globalThis);
