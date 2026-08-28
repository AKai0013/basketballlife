const parse=value=>{try{return JSON.parse(value||"")}catch{return {}}};
const flags=row=>parse(row.career_flags);
const STUDENT_LEAGUES=new Set(["HBL","UBA","UBA 強權","NCAA D2","NCAA D1","日本大學"]);
const stage=row=>row.league==="HBL"&&+row.age<=18?"hbl":+row.age>=35?"veteran":+row.age>=23||+row.contract_years>0||!STUDENT_LEAGUES.has(row.league)?"pro":"college";
const option=(id,label,detail)=>({id,label,detail});

export const STORY_NODES={
 rivalry:[
  {title:"第一次把真人名字寫進對位表",detail:"這不是隨機生成的宿敵。你們代表不同HBL球隊，今天的處理方式會成為下一次見面時的真實前情。",competitive:true,options:[option("rival_attack","從第一回合就點名他","向真人對手施壓，爭取最高評價，也承擔更高負荷。"),option("rival_adapt","先看懂他的主要武器","保留調整空間，降低被對手選擇直接克制的代價。"),option("rival_respect","把對決留在球場上","認真競爭但不挑釁，為多年後的尊重留下可能。")]},
  {title:"第二次見面，對方已經記得你的打法",detail:"前一次交手不再只是背景文字。你要延續施壓、改變策略，或重新定義這段競爭。",competitive:true,options:[option("rival_escalate","公開要求再次對位","把競爭升高，對方會直接承受你的壓力。"),option("rival_counter","拿前次紀錄做針對調整","以較低風險回應真人對手上次的選擇。"),option("rival_open","賽後主動交換觀察","保留競爭，同時降低關係繼續惡化的風險。")]},
  {title:"多年後，這段競爭進入職業舞台",detail:"你們從HBL走到職業，前兩次交手與選擇會一起出現在共同紀錄。這次決定它成為長期宿敵、互相尊重，或正式和解。",competitive:true,options:[option("rival_settle","把這場當成最終清算","爭取最高表現，失敗也會留下最大壓力。"),option("rival_team","只完成原隊需要的工作","不讓多年恩怨凌駕目前球隊與健康。"),option("rival_reconcile","承認彼此推動了對方","結束私人敵意，將競爭轉成共同生涯中的尊重。")]}
 ],
 recruiting:[
  {title:"同一批大學教練正在比較你們",detail:"你們的HBL履歷同時進入招募桌面。本事件只處理真人之間的情報、曝光與壓力，不會虛構尚未存在的學校報價。",competitive:false,options:[option("recruit_lead","先公開自己的志願順序","提高外界關注，也讓其他真人知道你的選校方向。"),option("recruit_trial","接受同場測試","以能力與健康正面比較，承擔額外負荷。"),option("recruit_share","交換已確認的招募情報","幫彼此避開不合適的承諾，不替任何人決定升學。")]},
  {title:"分流之後，第一份大學履歷開始成形",detail:"你們已走進不同學校或聯盟。高中時的招募選擇會改變這次比較是競爭、各走各路，或持續交換情報。",competitive:false,options:[option("route_prove","用大學表現證明選擇正確","提高個人評價，也把比較壓力帶給其他真人。"),option("route_focus","停止比較，專注目前球隊","保住健康與角色，不追逐對方路線的曝光。"),option("route_exchange","持續交換適應經驗","讓不同大學路線互相提供恢復與信心。")]},
  {title:"不同大學履歷在職業入口重新會合",detail:"你們各自完成了單人生涯的大學路線。這次只決定進入職業後如何看待彼此，不改寫選秀、合約或球隊去向。",competitive:false,options:[option("market_compete","要求市場直接比較你們","提高曝光與競爭壓力，不保證改變正式報價。"),option("market_independent","讓各自履歷單獨接受評估","維持穩定，不把另一人的結果當成自己的得失。"),option("market_alliance","在職業入口互相背書","增加合作信用，保留未來同隊或重逢的關係基礎。")]}
 ],
 partnership:[
  {title:"第一次同隊，真人角色必須接在一起",detail:"你們效力同一支職業球隊。每個位置會收到不同工作；只有不同責任互補，這次進攻與防守才算真正合作。",competitive:false,options:[option("create","承擔發動責任","替另一名真人隊友創造下一步。"),option("finish","承擔終結責任","需要真人隊友先創造空間。"),option("anchor","承擔掩護與防守責任","替其他真人隊友降低失誤與防守壓力。")]},
  {title:"合作成功後，球權與責任開始重疊",detail:"第一次配合留下的結果已進入球隊記憶。現在你們必須決定誰擴大角色、誰調整工作，或是否一起承擔犧牲。",competitive:false,options:[option("pair_claim","要求更多核心責任","提高個人聲量，也讓真人隊友承受角色壓力。"),option("pair_adjust","重新分配持球與防守工作","降低衝突，選擇互補時合作效果最高。"),option("pair_sacrifice","主動接下不顯眼的責任","犧牲個人曝光，替其他真人隊友保留健康與信心。") ]},
  {title:"同隊關係迎來正式驗收",detail:"前兩次合作已經證明你們是否能共享責任。這次會把共同選擇寫成搭檔、競爭關係或一段失敗的合作。",competitive:false,options:[option("pair_takeover","要求由自己主導關鍵回合","爭取最高表現，若其他人也搶同一責任就會衝突。"),option("pair_balance","依前兩次紀錄完成互補","將真人隊友真正缺少的責任補上。"),option("pair_legacy","把共同成果留給整支球隊","降低個人聲量，換取最高的長期合作紀錄。") ]}
 ],
 injury:[
  {title:"傷病第一次改變真人隊友的責任",detail:"你們效力同一支球隊，其中一人正處於傷病或低健康狀態。傷者與健康隊友會收到不同問題。",competitive:false,options:[option("rehab","共同調整訓練安排","所有人降低負荷，合作時恢復效果最好。") ]},
  {title:"復出後第一次重新分配角色",detail:"傷病期間誰支援、誰搶位，已經寫進共同紀錄。復出者與其他真人必須正面處理那次選擇。",competitive:false,options:[option("injury_confront","把傷病期的選擇攤開談","要求對方承擔當時決定，關係可能改善也可能惡化。"),option("injury_rebuild","重新建立場上分工","用新的角色配置修復信任與健康。"),option("injury_distance","只維持職業合作","不再追究私人關係，也不取得額外合作加成。") ]},
  {title:"傷病關係迎來最後回收",detail:"這段關係已經跨過受傷、支援或爭位與復出。你們要決定互相償還、繼續競爭，或結束這條共同主線。",competitive:false,options:[option("injury_repay","把當年的支援還給對方","大幅提高信任與合作紀錄。"),option("injury_compete","承認彼此就是角色競爭者","提高個人評價，也讓雙方承受較高壓力。"),option("injury_close","不再延伸傷病關係","保留已發生的紀錄，平穩結束這條主線。") ]}
 ],
 succession:[
  {title:"同隊老將與新核心第一次談到交棒",detail:"球隊同時有35歲以上老將與較年輕真人球員。兩種身分會收到不同選項，沒有人能替另一方決定角色。",competitive:false,options:[option("share_role","分階段共享責任","降低彼此負荷並建立交接基礎。") ]},
  {title:"交棒不再只是承諾，角色真的開始改變",detail:"上一季的選擇已經影響信任與壓力。老將與年輕球員必須處理上場責任、公開態度與剩餘時間。",competitive:false,options:[option("succession_hold","維持目前權力分配","保住自己的角色，也讓另一方承受更大壓力。"),option("succession_prove","用下一段表現決定責任","把結果交給能力、健康與真人選擇。"),option("succession_share","正式建立分階段交接","降低衝突並提高共同信心。") ]},
  {title:"交棒迎來正式驗收",detail:"這段關係已經跨過承諾與角色變化。你們要決定公開認可、最後競爭，或各自保留自己的結局。",competitive:false,options:[option("legacy_endorse","公開認可對方接住了責任","提高傳承與合作紀錄。"),option("legacy_challenge","用最後一次競爭決定核心位置","提高表現上限，也承擔最大的關係壓力。"),option("legacy_split","各自完成剩餘生涯","保留共同紀錄，不再強迫兩人的結局綁在一起。") ]}
 ],
 national:[
  {title:"第一次以真人組合進入培訓窗口",detail:"你們都符合本年度培訓資格。這條主線只處理集訓搭配、負荷與信任，不會把觀察名單寫成正式國家隊出賽。",competitive:false,options:[option("national_compete","爭取第一組順位","提高個人評價，也把訓練壓力帶給其他真人。"),option("national_pair","建立固定攻防搭配","需要其他真人選擇能接上的責任。"),option("national_manage","共同控制集訓負荷","保住健康，接受較慢的順位成長。")]},
  {title:"第二次徵召前，舊搭配必須重新驗收",detail:"上次集訓的合作或衝突已留下紀錄。不同聯盟角色改變後，你們不能假設仍適合相同分工。",competitive:false,options:[option("national_retest","重新競爭搭配順位","用目前能力與健康重新決定位置。"),option("national_adjust","依現況調整搭配","承認角色變化，降低重複責任。"),option("national_protect","先保護受傷或高負荷球員","犧牲部分曝光，讓真人組合維持可用性。")]},
  {title:"國家隊關係進入最後一次共同定義",detail:"你們已跨過兩個培訓窗口。這次只把真人關係寫成長期搭檔、公開競爭或各自完成國家隊道路。",competitive:false,options:[option("national_legacy","把搭配留成共同代表作","提高合作紀錄，不額外增加正式出賽。"),option("national_rival","公開競爭最後席次","提高個人聲量，也結束固定搭配。"),option("national_independent","各自完成國家隊道路","保留已發生紀錄，不再強迫共同徵召。")]}
 ],
 reunion:[
  {title:"一次真實轉隊讓兩條生涯重新接近",detail:"其中一人的球隊異動確實連到另一名真人目前或過去的球隊。你們要決定歡迎、觀望或先處理舊關係。",competitive:false,options:[option("reunion_welcome","公開歡迎這次重逢","提高共同聲量，不保證產生新的合約。"),option("reunion_wait","先觀察新角色是否成立","保護目前輪替，不預支尚未發生的合作。"),option("reunion_private","私下談清楚過去分歧","降低外界曝光，先處理真人關係。")]},
  {title:"重逢後的第一季開始暴露角色衝突",detail:"轉隊已經發生，現在才看得出球權、輪替與市場期待是否相容。前一次態度會改變這次談話的起點。",competitive:false,options:[option("reunion_claim","要求球隊明確排序","提高個人角色，也讓另一名真人承受壓力。"),option("reunion_fit","依場上需求重新分工","以互補責任保住雙方表現。"),option("reunion_distance","只維持必要合作","降低衝突，也放棄額外共同成果。")]},
  {title:"這次重逢要留下搭檔還是再次分開",detail:"你們已經歷轉隊、重新適應與角色壓力。最後一節只記錄已發生的關係，不替任何球團製造交易。",competitive:false,options:[option("reunion_stay","把重逢寫成長期搭檔","提高合作紀錄並共同承擔負荷。"),option("reunion_compete","承認彼此仍是角色競爭者","提高個人評價，關係轉向公開競爭。"),option("reunion_release","接受再次走向不同道路","保留共同紀錄，結束這條主線。")]}
 ],
 championship:[
  {title:"第一次同時進入職業季後賽壓力",detail:"真人玩家的單人生涯紀錄確實顯示季後賽資格。你們要處理情報、負荷與競爭，不會重算任何正式晉級結果。",competitive:true,options:[option("playoff_hide","封鎖自己的系列賽情報","降低被真人對手針對的風險。"),option("playoff_exchange","交換不涉及球隊機密的觀察","提高彼此穩定度，但不替對方決定戰術。"),option("playoff_push","公開要求最高強度對決","提高表現上限，也增加健康壓力。")]},
  {title:"下一次季後賽見面已帶著前次答案",detail:"上一輪誰施壓、誰保留情報、誰維持尊重都已經留下。這次必須用目前健康與球隊位置重新回應。",competitive:true,options:[option("playoff_counter","針對前次方案準備反制","提高對位結果，也讓真人競爭升溫。"),option("playoff_role","只完成原隊需要的工作","保護健康，不讓私人競爭凌駕正式賽程。"),option("playoff_respect","把勝負留在各自正式紀錄","降低關係壓力並保留往後合作。")]},
  {title:"冠軍舞台替多年真人競爭做出驗收",detail:"只有玩家的既有紀錄進入冠軍系列賽時才會來到這裡。本節不重複發冠軍，只決定共同時間線如何記住你們。",competitive:true,options:[option("finals_duel","把最後回合留給真人對決","爭取最高共同表現，也承擔最大負荷。"),option("finals_team","服從各自球隊的正式角色","不讓共同劇情改寫原本賽果。"),option("finals_salute","賽後承認彼此一路推動對方","把宿敵關係轉成共同尊重。")]}
 ],
 overseas:[
  {title:"不同職業聯盟第一次拉開生活距離",detail:"你們確實效力不同職業聯盟。時差、賽程與文化差異會影響聯絡，但不會虛構不存在的跨聯盟比賽。",competitive:false,options:[option("overseas_share","固定交換比賽與生活情報","降低適應風險，增加維持關係的成本。"),option("overseas_focus","先專注目前聯盟","保住個人狀態，接受關係暫時疏遠。"),option("overseas_visit","利用正式休賽窗口見面","增加共同紀錄，也承擔額外旅程負荷。")]},
  {title:"距離開始影響下一份職業選擇",detail:"前一次是否維持聯絡已經改變信任。市場出現變動時，你們要決定交換資訊、各自判斷或重新靠近。",competitive:false,options:[option("overseas_market","交換已確認的市場資訊","降低踩空風險，不替另一人製造報價。"),option("overseas_solo","各自處理下一份合約","維持自主，也放棄共同支援。"),option("overseas_reconnect","重新建立固定聯絡","修復距離造成的關係消耗。")]},
  {title:"跨聯盟關係迎來長期答案",detail:"你們已經歷離開、適應與市場選擇。最後決定這段關係成為長期同盟、遠距宿敵或安靜結束。",competitive:false,options:[option("overseas_alliance","維持跨聯盟長期同盟","提高合作與恢復紀錄。"),option("overseas_rival","把距離轉成跨聯盟競爭","提高聲量與壓力，不虛構正式交手。"),option("overseas_close","接受關係自然結束","保留歷史，不再強制回訪。")]}
 ],
 contract:[
  {title:"真人隊友第一次同時面對合約壓力",detail:"至少一人的既有合約進入最後一年。你們能交換資訊、爭取順位或保持距離，但本事件不會自行產生報價。",competitive:false,options:[option("contract_share","交換已確認的談判資訊","降低誤判市場的風險。"),option("contract_rank","要求球隊明確排序角色","提高個人籌碼，也向真人隊友施壓。"),option("contract_quiet","各自處理合約","保護當前關係，不取得額外資訊。")]},
  {title:"第一份決定之後，市場差距開始出現",detail:"上一節的情報與競爭已經留下結果。現在你們要面對續留、短約或不同聯盟路線造成的關係變化。",competitive:false,options:[option("contract_back","替真人隊友的職業態度背書","增加對方市場評價，不承諾實際報價。"),option("contract_compete","把市場比較公開化","提高個人曝光，也降低彼此信任。"),option("contract_boundary","不介入對方談判","保留各自決策與現有關係。")]},
  {title:"合約市場替這段真人關係做出結論",detail:"你們已經跨過資訊交換、角色競爭與市場分流。最後只記錄是否互相支持、持續競爭或結束市場綁定。",competitive:false,options:[option("contract_union","建立長期互相支援","提高合作紀錄與市場穩定。"),option("contract_rival","維持公開市場競爭","提高個人評價與關係壓力。"),option("contract_end","結束彼此市場介入","保留既有結果，不再互相影響合約事件。")]}
 ]
};

const COOP=new Set(["rival_respect","rival_open","rival_reconcile","recruit_share","route_exchange","market_alliance","create","finish","anchor","pair_adjust","pair_sacrifice","pair_balance","pair_legacy","rehab","accept_help","carry","protect_role","injury_rebuild","injury_repay","share_role","mentor","learn","succession_share","legacy_endorse","national_pair","national_manage","national_adjust","national_protect","national_legacy","national_independent","reunion_welcome","reunion_private","reunion_fit","reunion_stay","reunion_release","playoff_exchange","playoff_role","playoff_respect","finals_team","finals_salute","overseas_share","overseas_visit","overseas_market","overseas_reconnect","overseas_alliance","overseas_close","contract_share","contract_quiet","contract_back","contract_boundary","contract_union","contract_end","story_repair","story_deepen"]);
const PRESSURE=new Set(["rival_attack","rival_escalate","rival_settle","recruit_lead","recruit_trial","route_prove","market_compete","pair_claim","pair_takeover","compete_slot","injury_confront","injury_compete","hold_role","claim","succession_hold","legacy_challenge","national_compete","national_retest","national_rival","reunion_claim","reunion_compete","playoff_hide","playoff_push","playoff_counter","finals_duel","overseas_focus","overseas_solo","overseas_rival","contract_rank","contract_compete","contract_rival"]);

export function readSharedStoryState(rows){for(const row of rows){const state=flags(row).sharedStory;if(state?.lines)return JSON.parse(JSON.stringify(state))}return{version:1,lines:{},history:[]}}

function contextText(line){if(!line?.lastChoices?.length)return"";const choices=line.lastChoices.map(item=>`${item.player_name}選擇「${item.label}」`).join("；"),tone=line.tone==="cooperative"?"目前彼此信任較高":line.tone==="hostile"?"目前關係緊張":"目前關係仍未定型";return` 上一節：${choices}；${tone}。`}

function buildEvent(line,node,year,state){const source=STORY_NODES[line][node-1],prior=state.lines[line],options=source.options.map(item=>({...item}));if(node>1&&prior?.tone==="hostile")options.push(option("story_repair","先處理上次留下的衝突","放棄部分曝光，換取修復真人關係的機會。"));if(node>1&&prior?.tone==="cooperative")options.push(option("story_deepen","延續已建立的默契","利用前一節信任取得更穩定的共同結果。"));return{id:`shared-${year}-story-${line}-${node}`,type:`story_${line}`,storyLine:line,storyNode:node,title:source.title,detail:`${source.detail}${contextText(prior)}`,options,competitive:source.competitive}}

export function sharedStoryEventFor(rows,year){if(rows.length<2)return null;const state=readSharedStoryState(rows),lines=state.lines,stages=rows.map(stage),rowFlags=rows.map(flags),allHbl=stages.every(value=>value==="hbl"),allCollege=stages.every(value=>value==="college"),allPro=stages.every(value=>value==="pro"||value==="veteran"),sameTeam=new Set(rows.map(row=>`${row.league}|${row.team_name}`)).size===1,sameLeague=new Set(rows.map(row=>row.league)).size===1,injured=rows.some(row=>+row.health<=55||flags(row).injured),mixedAges=rows.some(row=>+row.age>=35)&&rows.some(row=>+row.age<35),allEligible=rowFlags.every(value=>value.nationalEligible!==false),linkedMove=rowFlags.some((value,index)=>value.recentMove?.year===year&&rows.some((row,other)=>other!==index&&[value.recentMove.fromTeam,value.recentMove.toTeam].includes(row.team_name))),playoffWindow=allPro&&rowFlags.some(value=>value.madePlayoffs),finalsWindow=allPro&&rowFlags.some(value=>["冠軍","亞軍"].includes(value.playoffFinish)),contractWindow=allPro&&rows.some(row=>+row.contract_years<=1);
 const canAdvance=(line,node,condition)=>lines[line]?.node===node-1&&year>Number(lines[line].lastYear||0)&&condition;
 if(canAdvance("injury",2,sameTeam&&rows.every(row=>+row.health>60&&!flags(row).injured)))return buildEvent("injury",2,year,state);
 if(canAdvance("injury",3,sameTeam))return buildEvent("injury",3,year,state);
 if(canAdvance("succession",2,allPro&&sameTeam&&mixedAges))return buildEvent("succession",2,year,state);
 if(canAdvance("succession",3,allPro&&sameTeam))return buildEvent("succession",3,year,state);
 if(canAdvance("partnership",2,allPro&&sameTeam))return buildEvent("partnership",2,year,state);
 if(canAdvance("partnership",3,allPro&&sameTeam))return buildEvent("partnership",3,year,state);
 if(canAdvance("rivalry",2,(allHbl&&Math.max(...rows.map(row=>+row.age))>=17)||allCollege))return buildEvent("rivalry",2,year,state);
 if(canAdvance("rivalry",3,allPro))return buildEvent("rivalry",3,year,state);
 if(canAdvance("recruiting",2,allCollege))return buildEvent("recruiting",2,year,state);
 if(canAdvance("recruiting",3,allPro))return buildEvent("recruiting",3,year,state);
 if(canAdvance("national",2,allEligible&&rows.every(row=>+row.age>=18)))return buildEvent("national",2,year,state);
 if(canAdvance("national",3,allEligible&&allPro))return buildEvent("national",3,year,state);
 if(canAdvance("reunion",2,allPro))return buildEvent("reunion",2,year,state);
 if(canAdvance("reunion",3,allPro))return buildEvent("reunion",3,year,state);
 if(canAdvance("championship",2,playoffWindow))return buildEvent("championship",2,year,state);
 if(canAdvance("championship",3,finalsWindow))return buildEvent("championship",3,year,state);
 if(canAdvance("overseas",2,allPro&&!sameLeague))return buildEvent("overseas",2,year,state);
 if(canAdvance("overseas",3,allPro))return buildEvent("overseas",3,year,state);
 if(canAdvance("contract",2,allPro))return buildEvent("contract",2,year,state);
 if(canAdvance("contract",3,allPro))return buildEvent("contract",3,year,state);
 if(!lines.injury&&sameTeam&&injured)return buildEvent("injury",1,year,state);
 if(!lines.succession&&allPro&&sameTeam&&mixedAges)return buildEvent("succession",1,year,state);
 if(!lines.partnership&&allPro&&sameTeam)return buildEvent("partnership",1,year,state);
 if(!lines.championship&&playoffWindow)return buildEvent("championship",1,year,state);
 if(!lines.reunion&&linkedMove)return buildEvent("reunion",1,year,state);
 if(!lines.national&&allEligible&&rows.every(row=>+row.age>=18)&&year%4===0)return buildEvent("national",1,year,state);
 if(!lines.contract&&contractWindow)return buildEvent("contract",1,year,state);
 if(!lines.overseas&&allPro&&!sameLeague)return buildEvent("overseas",1,year,state);
 if(!lines.rivalry&&allHbl&&Math.max(...rows.map(row=>+row.age))<=16)return buildEvent("rivalry",1,year,state);
 if(!lines.recruiting&&allHbl&&Math.max(...rows.map(row=>+row.age))>=18)return buildEvent("recruiting",1,year,state);
 return null;
}

export function advanceSharedStory(rows,event,choices,year){const state=readSharedStoryState(rows),previous=state.lines[event.storyLine]||{};if(Number(previous.node)>=Number(event.storyNode)&&Number(previous.lastYear)===Number(year))return state;const cooperation=choices.filter(item=>COOP.has(item.choice)).length,pressure=choices.filter(item=>PRESSURE.has(item.choice)).length,score=Math.max(-12,Math.min(12,Number(previous.score||0)+cooperation*2-pressure*2)),tone=score>=3?"cooperative":score<=-3?"hostile":"uncertain",line={...previous,node:event.storyNode,lastYear:year,status:event.storyNode>=3?"complete":"active",score,tone,lastChoices:choices.map(item=>{const row=rows.find(candidate=>candidate.user_id===item.user_id),personal=personalizeStoryEvent(event,rows,item.user_id),label=personal.options.find(option=>option.id===item.choice)?.label||item.choice;return{player_name:row?.player_name||"真人球員",choice:item.choice,label}})};state.lines[event.storyLine]=line;state.history=(state.history||[]).concat([{line:event.storyLine,node:event.storyNode,year,tone,score}]).slice(-20);return state}

export function storyChoiceKind(choice){return COOP.has(choice)?"cooperative":PRESSURE.has(choice)?"pressure":"neutral"}

export function personalizeStoryEvent(event,rows,userId){const mine=rows.find(row=>row.user_id===userId);if(!mine||!event.storyLine)return event;const others=rows.filter(row=>row.user_id!==userId),otherNames=others.map(row=>row.player_name).join("、"),otherTeams=[...new Set(others.map(row=>row.team_name))].join("、");let title=`${mine.team_name}｜${event.title}`,detail=`與你共同進入這條主線的真人是 ${otherNames}（${otherTeams}）。${event.detail}`,options=event.options.map(item=>({...item}));
 if(event.storyLine==="partnership"&&event.storyNode===1){const copy={guard:{create:["持球發動","先吸引防守，再把下一步交給真人隊友。"],finish:["切入完成終結","利用真人隊友創造的空間攻擊籃框。"],anchor:["全場領防與控失誤","穩住球權並接下外圍第一線防守。"]},wing:{create:["二次組織","接應後再替真人隊友創造機會。"],finish:["弱側空切終結","等待真人隊友發動後完成空切。"],anchor:["換防與弱側補位","處理最容易被漏掉的防守責任。"]},big:{create:["高位策應","用掩護與傳球替真人隊友創造空間。"],finish:["掩護後順下","需要真人隊友先讀到掩護並送出球。"],anchor:["護框與防守籃板","替全隊完成回合最後一道防守。"]}}[mine.position]||{};options=options.map(item=>copy[item.id]?{...item,label:copy[item.id][0],detail:copy[item.id][1]}:item)}
 if(event.storyLine==="injury"&&event.storyNode===1){const injured=+mine.health<=55||flags(mine).injured;if(injured)options=[option("accept_help","接受真人隊友分擔責任","降低自己的復出壓力；隊友是否支援會改變恢復幅度。"),option("rehab","提出共同調整訓練","邀請真人隊友一起降低負荷。"),option("protect_role","與教練談清楚復出角色","保住信心，不要求其他玩家替你冒險。")];else options=[option("carry","分擔傷者留下的責任","自己承受額外疲勞，讓傷者獲得恢復空間。"),option("rehab","陪同調整訓練","一起降低負荷並提高合作結果。"),option("compete_slot","爭取空出的角色","提高個人評價，但會直接降低傷者得到的支援。") ]}
 if(event.storyLine==="succession"&&event.storyNode===1){const veteran=+mine.age>=35;options=(veteran?[["mentor","主動帶著年輕球員交接","把比賽閱讀與責任交給真人隊友。"],["hold_role","要求維持目前角色","保留自己的聲量，也提高隊內競爭。"],["share_role","分階段共享責任","讓真人隊友逐步接手。"]]:[["learn","先接住老將交出的責任","提高信心，不急著公開搶位。"],["claim","直接爭取核心角色","提高聲量，也讓老將承受角色壓力。"],["share_role","接受分階段交接","以較低衝突換取穩定成長。"]]).map(([id,label,text])=>option(id,label,text))}
 return{...event,title,detail,options};
}
