const parse=value=>{try{return JSON.parse(value||"")}catch{return {}}};
const flags=row=>parse(row.career_flags);
const option=(id,label,detail)=>({id,label,detail});
const pro=row=>+row.age>=23||+row.contract_years>0||!["HBL","UBA","UBA 強權","NCAA D2","NCAA D1","日本大學"].includes(row.league);

export const SHARED_SEASON_EVENTS={
 hbl_match:{title:"HBL 真人交會戰",detail:"你們的高中球隊在本季賽程窗口碰頭。每名玩家要先決定自己的攻防方案，系統才會把真人選擇組成同一場結果。",kind:"competitive"},
 hbl_elimination:{title:"HBL 淘汰賽臨場拆招",detail:"兩支真人球隊在淘汰賽窗口相遇。搶開局、封鎖第一選擇與保留暫停後調整會彼此克制，失敗會直接增加本季壓力。",kind:"competitive",options:[option("shared_attack","開場就提高持球壓力","先搶比分與氣勢；若對手預先收縮主武器，負荷會被放大。"),option("shared_contain","先封鎖對手第一選擇","用既定對位切斷主要進攻；遇到保留調整的玩家容易被換位破解。"),option("shared_adjust","把變招留到下半場","先閱讀真人對手再改防守與出手分配；若對方直接搶開局，會先承受壓力。")]},
 college_showcase:{title:"大學邀請賽真人對照組",detail:"不同大學路線在邀請賽窗口交會。這次只改變真人之間的表現、負荷與關係，不取代各自球季的正式錦標。",kind:"competitive"},
 college_recruiting_scrimmage:{title:"大學球探聯合測試賽",detail:"同聯盟教練把真人球員安排進同一組測試。你們爭的是對角色的理解，不會因一次選擇憑空產生轉學或職業報價。",kind:"competitive",options:[option("shared_attack","主動要求核心對位","把優勢直接呈現給球探；會被提前準備的封鎖方案限制。"),option("shared_contain","先證明防守可移植性","用換防與紀律封住真人對手；遇到臨場改位時可能失去比較優勢。"),option("shared_adjust","依測試內容切換角色","在無球、持球與防守間調整；若對手開場就搶主導權，前段評價會落後。")]},
 pro_matchup:{title:"職業例行賽真人對決",detail:"你們在同一職業聯盟的例行賽碰頭。進攻、封鎖與臨場調整彼此克制，沒有任何玩家能單獨決定共同勝負。",kind:"competitive"},
 same_team_possession:{title:"同隊關鍵回合",detail:"你們效力同一支球隊。發動、終結與防守收尾必須由不同真人接起來；責任重疊就會留下沒人處理的工作。",kind:"cooperative",roleSpecific:true},
 same_team_rotation:{title:"同隊短輪替責任分配",detail:"連戰壓縮輪替後，真人隊友必須分開承擔組織、主要產出與防守收尾。所有人都搶同一件事，球隊就會在另一端留下缺口。",kind:"cooperative",options:[option("shared_create","接管組織與節奏","降低其他真人的持球壓力，自己負責把回合送進正確位置。"),option("shared_finish","承擔主要產出","接住隊友創造的機會，接受出手與終結責任。"),option("shared_anchor","扛下防守與籃板收尾","保護隊友的體力與失誤風險，完成每個回合最後一道工作。")]},
 injury_rotation:{title:"傷病後的真人輪替",detail:"同隊真人的傷病正在改變輪替。傷者與健康隊友會收到不同任務，恢復、代扛與角色安排必須一起成立。",kind:"cooperative"},
 veteran_handoff:{title:"老將與新核心的比賽交接",detail:"同隊真人正處於不同生涯階段。有人要整理場上資訊、有人要接下產出，還要有人保護老將負荷；交棒不是自動加成。",kind:"cooperative",options:[option("shared_create","老將整理對位與節奏","把累積的閱讀交給真人隊友，降低全隊決策成本。"),option("shared_finish","新核心接下關鍵產出","使用隊友整理出的機會，承擔本場主要得分與失誤責任。"),option("shared_anchor","共同保護輪替負荷","補上防守與恢復安排，避免交接變成單純增加老將消耗。")]},
 national_unit:{title:"國家培訓隊共同回合",detail:"具備資格的真人同時進入培訓窗口。這次只決定搭配順位、健康與評價，不會憑空增加正式國家隊出賽。",kind:"cooperative",roleSpecific:true},
 cross_league_window:{title:"跨聯盟季中交流",detail:"你們分處不同聯盟，只在合理的停賽窗口交換影片與訓練資訊。各自原球隊賽程與合約完全保留。",kind:"cooperative",roleSpecific:true},
 cross_league_recovery:{title:"跨聯盟連戰恢復協議",detail:"至少一名真人正帶著明顯疲勞或低健康進入交流窗口。影片、替代訓練與恢復監督要由不同玩家接起來，不能只叫傷者自己休息。",kind:"cooperative",options:[option("shared_create","整理可替代的訓練內容","把對方聯盟的比賽需求轉成低負荷課表。"),option("shared_finish","完成有限強度實戰驗證","在安全範圍測試課表，回報哪些動作仍會造成壓力。"),option("shared_anchor","監督恢復與停止條件","依健康反應決定何時停止，避免交流變成額外消耗。")]}
};

const competitiveOptions=()=>[
 option("shared_attack","主動進攻對位","提高個人上限；會被預先封鎖的玩家克制。"),
 option("shared_contain","提前封鎖主武器","克制主動進攻；遇到臨場調整時容易失去先手。"),
 option("shared_adjust","保留臨場調整","克制固定封鎖；面對直接進攻時承受較大壓力。")
];
const cooperativeOptions=()=>[
 option("shared_create","創造下一步","發動進攻或整理資訊，需要另一名真人完成結果。"),
 option("shared_finish","完成主要任務","接住真人隊友創造的機會，單獨選擇無法成立。"),
 option("shared_anchor","保護回合與身體","處理防守、恢復或風險，避免共同成果被負荷吃掉。")
];

export function midseasonEventFor(rows,year){if(rows.length<2)return null;const sameTeam=new Set(rows.map(row=>`${row.league}|${row.team_name}`)).size===1,sameLeague=new Set(rows.map(row=>row.league)).size===1,allHbl=rows.every(row=>row.league==="HBL"),allCollege=rows.every(row=>!pro(row)&&row.league!=="HBL"),allPro=rows.every(pro),injured=rows.some(row=>+row.health<=55||flags(row).injured),strained=rows.some(row=>+row.health<75||+flags(row).fatigue>=65),veteran=rows.some(row=>+row.age>=35),eligible=rows.every(row=>flags(row).nationalEligible!==false);let type="";
 if(sameTeam&&injured)type="injury_rotation";
 else if(allPro&&sameTeam&&veteran)type="veteran_handoff";
 else if(allPro&&sameTeam)type=year%2?"same_team_rotation":"same_team_possession";
 else if(allHbl)type=year%2?"hbl_elimination":"hbl_match";
 else if(allCollege&&sameLeague)type=year%2?"college_recruiting_scrimmage":"college_showcase";
 else if(allPro&&sameLeague)type="pro_matchup";
 else if(eligible&&rows.every(row=>+row.age>=18)&&year%4===0)type="national_unit";
 else if(strained)type="cross_league_recovery";
 else type="cross_league_window";
 const source=SHARED_SEASON_EVENTS[type],options=(source.options||(source.kind==="competitive"?competitiveOptions():cooperativeOptions())).map(item=>({...item}));
 return{id:`shared-${year}-midseason-${type}`,type,checkpoint:"midseason",title:source.title,detail:source.detail,kind:source.kind,roleSpecific:!!source.roleSpecific,options};
}

export function personalizeMidseasonEvent(event,rows,userId){const mine=rows.find(row=>row.user_id===userId);if(!mine)return event;const others=rows.filter(row=>row.user_id!==userId),names=others.map(row=>row.player_name).join("、"),teams=[...new Set(others.map(row=>row.team_name))].join("、");let options=event.options.map(item=>({...item}));
 if(event.kind==="cooperative"&&event.roleSpecific){
  const roleCopy={guard:{shared_create:["持球發動","先吸引防守或整理資訊，再把下一步交給真人隊友。"],shared_finish:["接球完成終結","需要真人隊友先創造空間，自己負責完成。"],shared_anchor:["控制失誤與第一線防守","保護回合，避免共同成果被反擊或疲勞吃掉。"]},wing:{shared_create:["二次組織","接應後替另一名真人創造第二次機會。"],shared_finish:["弱側切入與空檔終結","讀取真人隊友的發動，完成無球任務。"],shared_anchor:["換防與弱側補位","補上其他真人最容易漏掉的防守責任。"]},big:{shared_create:["高位策應與掩護","用掩護和傳球替真人隊友創造路線。"],shared_finish:["順下完成終結","需要真人隊友先讀到掩護並送出球。"],shared_anchor:["護框與防守籃板","完成整個共同回合最後一道工作。"]}}[mine.position]||{};
  options=options.map(item=>roleCopy[item.id]?{...item,label:roleCopy[item.id][0],detail:roleCopy[item.id][1]}:item);
 }
 if(event.type==="injury_rotation"){
  const hurt=+mine.health<=55||flags(mine).injured;
  options=hurt?[option("shared_create","說明自己能負擔的工作","讓健康隊友知道哪些責任需要代扛。"),option("shared_finish","接受有限回合任務","只完成身體允許的工作，不假裝已完全恢復。"),option("shared_anchor","把恢復列為優先","需要真人隊友承擔主要回合，自己保護健康。")]:[option("shared_create","重新整理輪替","替傷者安排可完成的工作。"),option("shared_finish","代扛主要回合","承受額外疲勞，替傷者保留復出空間。"),option("shared_anchor","陪同控制負荷","降低全隊風險，但需要另一名真人負責主要產出。")];
 }
 return{...event,title:`${mine.team_name}｜${event.title}`,detail:`本回合與 ${names}（${teams}）共同結算。${event.detail}`,options};
}

const beats={shared_attack:"shared_adjust",shared_adjust:"shared_contain",shared_contain:"shared_attack"};
export function resolveMidseasonEvent(rows,choices,userId,year,event=midseasonEventFor(rows,year)){const choiceMap=new Map(choices.map(item=>[item.user_id,item.choice])),mine=choiceMap.get(userId)||event.options[0].id,row=rows.find(item=>item.user_id===userId),picked=new Set(choices.map(item=>item.choice));let commonOutcome="partial",cooperationDelta=0,score=0;
 if(event.kind==="cooperative"){
  const required=Math.min(3,rows.length),complete=picked.size>=required,partial=picked.size>=2;
  commonOutcome=complete?"success":partial?"partial":"failure";cooperationDelta=complete?18:partial?6:-12;score=complete?8:partial?3:-5;
 }else{
  const opponents=choices.filter(item=>item.user_id!==userId),wins=opponents.filter(item=>beats[mine]===item.choice).length,losses=opponents.filter(item=>beats[item.choice]===mine).length;
  commonOutcome=wins>losses?"success":wins===losses?"partial":"failure";cooperationDelta=0;score=wins*5-losses*4;
 }
 const base=commonOutcome==="success"?{rep:5,health:-2,confidence:5,fatigue:3,planRisk:1}:commonOutcome==="partial"?{rep:2,health:0,confidence:2,fatigue:1,planRisk:0}:{rep:-1,health:-3,confidence:-4,fatigue:4,planRisk:2};
 if(mine==="shared_anchor"){base.health+=3;base.fatigue=Math.max(0,base.fatigue-1);base.rep-=1}
 if(event.type==="injury_rotation"&&(+row.health<=55||flags(row).injured)&&commonOutcome!=="failure")base.health+=4;
 const personal=personalizeMidseasonEvent(event,rows,userId),label=personal.options.find(item=>item.id===mine)?.label||mine,standings=rows.map(item=>{const choice=choiceMap.get(item.user_id),power=+item.overall+(+item.reputation*.06)+(+item.health*.03)+(choice==="shared_anchor"?1:3);return{player_name:item.player_name,team_name:item.team_name,label:personalizeMidseasonEvent(event,rows,item.user_id).options.find(option=>option.id===choice)?.label||choice,score:Math.round(power)}}).sort((a,b)=>b.score-a.score),names=rows.map(item=>item.player_name).join("、"),title=event.kind==="cooperative"?(commonOutcome==="success"?"真人分工完整，共同回合成立":commonOutcome==="partial"?"部分責任接上，但仍留下缺口":"責任重疊，共同回合失敗"):(commonOutcome==="success"?"你的方案克制了真人對手":commonOutcome==="partial"?"真人方案互相抵銷":"真人對手的方案取得上風");
 return{eventId:event.id,eventType:event.type,checkpoint:"midseason",choice:mine,label,commonOutcome,effect:base,causedBy:[event.kind==="cooperative"?`${names} 的分工完整度直接決定本回合結果。`:`其他真人的攻防方案直接改變你的結果。`],followUp:{year,title:"本季後續",detail:commonOutcome==="failure"?"這次失敗已進入本季狀態；下一個事件會沿用新的健康、信心與疲勞。":"共同結果已立即進入本季狀態。"},shared:{title,detail:`${names} 已完成同一個季中共同回合；沒有任何玩家能單獨取得這個結果。`,eventType:event.type,checkpoint:"midseason",standings,cooperationDelta,cooperationScore:Math.max(0,cooperationDelta),year,score}};
}
