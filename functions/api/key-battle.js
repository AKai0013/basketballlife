const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const fail=(message,status=400)=>json({error:message},status);
const clean=value=>String(value??"").trim();
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const ROLES=["guard","wing","big"];
const HBL_TEAMS=["男山高中","崧山高中","能人家商","光富高中","東杉高中","南弧高中","鈦山高中","冬泰高中"];
const COLLEGE_TEAMS={UBA:["政治大學","建行科大","輔人大學"],"UBA 強權":["國立體大","世新大學","臺灣師大"],"NCAA D2":["洛磯山礦業大學","五大湖州立大學","加州紅杉大學"],"日本大學":["東京明和大學","東海星陵大學","筑波科學大學"],"NCAA D1":["北卡藍嶺大學","肯塔基藍草州立大學","堪薩斯平原大學"]};
const ROLE_LABEL={guard:"後衛",wing:"側翼",big:"內線"};
const PRO_TEAMS=["港灣聯隊","北城飛隼","山線先鋒","南岸浪潮","島嶼雷霆"];

const HBL_EVENTS={guard:{id:"hbl_guard",eyebrow:"個人生涯・HBL",title:"高一隊內賽最後兩分鐘，教練把球交給你",detail:"你與其他玩家都從 HBL 開始，但可能效力不同高中。這次持球決定只改變你的輪替。"},wing:{id:"hbl_wing",eyebrow:"個人生涯・HBL",title:"對手王牌連得八分，教練第一次點名你對位",detail:"同一個共享年份裡，其他玩家會遇到符合自己位置與球隊的 HBL 問題。"},big:{id:"hbl_big",eyebrow:"個人生涯・HBL",title:"禁區輪替只剩一席，犯規與護框必須同時控制",detail:"你的身體負荷、健康與教練評價會獨立保存，不會和其他玩家共用數值。"}};
const PERSONAL_OPTIONS={
 start:[{id:"train",label:"押上個人武器",detail:"OVR 成長較快，健康與教練耐心承受代價。"},{id:"team",label:"先完成球隊任務",detail:"評價與關係提高，個人成長較穩。"},{id:"balance",label:"保留身體與學業節奏",detail:"健康提高，曝光與順位成長較慢。"}],
 pro:[{id:"domestic",label:"投入台灣職業新人市場",detail:"較快取得合約與本土上場機會。"},{id:"development",label:"挑戰 NBA G League 入口",detail:"門檻更高，成功會增加海外市場。"},{id:"overseas",label:"接受日韓／海外育成合約",detail:"適應成本較高，但職業市場範圍擴大。"}],
 contract:[{id:"accept",label:"接受目前球隊報價",detail:"確定留下，角色與年限較保守。"},{id:"negotiate",label:"要求更大角色再簽",detail:"可能取得更長合約，也可能失去原報價。"},{id:"return",label:"回到原路線的職業市場",detail:"放棄部分海外聲量，換取熟悉環境。"}],
};
const INTERSECTION_EVENTS={
 3:{id:"u20_camp",eyebrow:"共享世界・第一次交會",title:"U20 國家培訓觀察營把不同大學路線排進同一週",detail:"UBA、UBA 強權、日本大學與 NCAA 球員回到同一個觀察窗口。這只是培訓觀察，不等於正式入選；玩家可能對位、合作或保護自己的校隊賽季。",options:[{id:"challenge",label:"正面挑戰另一名玩家",detail:"個人評價與共同競爭關係提高。"},{id:"connect",label:"主動交換比賽情報",detail:"建立跨路線人物關係，降低未來交會壓力。"},{id:"protect",label:"先保護自己的大學賽季",detail:"健康提高，但這次觀察營存在感下降。"}]},
 5:{id:"summer_league",eyebrow:"共享世界・夏季聯賽",title:"五場夏季聯賽決定第一批職業名單",detail:"三場小組賽後依戰績進入排名賽，再決定是否取得冠軍戰或合約面談。玩家可能同隊，也可能成為對手；各自的前四章履歷會改變上場角色。",options:[{id:"showcase",label:"把五場當成個人展示",detail:"選秀與合約聲量提高，低效率會放大壓力。"},{id:"winning",label:"優先做能贏球的工作",detail:"球隊評價提高，數據不一定最好看。"},{id:"durable",label:"控制負荷走完整個賽制",detail:"健康提高，單場爆發機會較少。"}]},
};
const PRO_CAREER_EVENTS={
 2:{id:"pro_turning_point",eyebrow:"個人生涯・球季轉折",title:"輪替定位改變後，你必須決定這一季要留下哪種比賽價值",detail:"這是職業球季事件，不會再要求已成為職業球員的人重選高中或大學。",options:[{id:"train",label:"強化目前角色的核心武器",detail:"能力成長較快，但賽季負荷上升。"},{id:"team",label:"先完成教練要求的戰術任務",detail:"球隊評價提高，個人成長較穩。"},{id:"balance",label:"控制上場與恢復節奏",detail:"健康回升，本季曝光與市場聲量較慢。"}]},
 3:{id:"pro_shared_window",eyebrow:"共享世界・職業交會",title:"同一個休賽期窗口，讓不同聯盟的你們再次出現在彼此的球探報告",detail:"有人參加國家隊觀察、有人打跨聯盟邀請賽，也有人留隊復健；只同步已經發生的交會，不強迫同隊。",options:[{id:"challenge",label:"正面回應跨聯盟競爭",detail:"提高市場評價，但增加身體負荷。"},{id:"connect",label:"交換對手與訓練情報",detail:"建立跨隊關係，穩定人物線。"},{id:"protect",label:"優先處理原隊球季需求",detail:"保住健康與原隊角色，降低本次曝光。"}]},
 4:{id:"pro_market",eyebrow:"個人生涯・職業市場",title:"球隊重新評估你的角色、合約與下一站",detail:"你可以回到台灣市場、挑戰 G League 入口或轉往日韓／海外；結果只改變自己的球隊與履歷。",options:[{id:"domestic",label:"進入台灣職業市場",detail:"在本土爭取更清楚的輪替與合約。"},{id:"development",label:"挑戰 NBA G League 入口",detail:"門檻與負荷更高，成功會擴大海外市場。"},{id:"overseas",label:"轉往日韓／海外職業市場",detail:"適應成本較高，但能建立不同聯盟履歷。"}]},
 5:{id:"pro_key_run",eyebrow:"共享世界・關鍵賽段",title:"不同聯盟同時進入決定季後賽與下一份合約的關鍵賽段",detail:"你們不必同隊或打同一場，但每個人的選擇都會在同一世界年份留下可比較的結果。",options:INTERSECTION_EVENTS[5].options},
};

function hash(value){return [...String(value)].reduce((sum,char)=>(sum*33+char.charCodeAt(0))>>>0,5381)}
function parse(value,fallback={}){try{return JSON.parse(value||"")}catch{return fallback}}
function roomCode(){const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return [...bytes].map(byte=>alphabet[byte%alphabet.length]).join("")}
async function roomRow(env,code){return env.DB.prepare("SELECT * FROM online_key_battle_rooms WHERE room_code=?").bind(code).first()}
async function worldRow(env,code){return env.DB.prepare("SELECT * FROM online_shared_worlds WHERE room_code=?").bind(code).first()}
async function lobbyPlayers(env,code){return (await env.DB.prepare("SELECT p.user_id,p.nickname,p.role,c.origin_route,c.player_name FROM online_key_battle_players p JOIN online_shared_player_careers c ON c.room_code=p.room_code AND c.user_id=p.user_id WHERE p.room_code=? ORDER BY p.joined_at").bind(code).all()).results||[]}
async function careerRows(env,code){return (await env.DB.prepare("SELECT user_id,player_name,position,origin_route,league,team_name,age,overall,health,reputation,draft_stock,contract_years,last_result FROM online_shared_player_careers WHERE room_code=? ORDER BY position").bind(code).all()).results||[]}
function collegeOptions(career){const options=[{id:"uba",label:"進入 UBA 一級",detail:"穩定升學路線，保留本土發展與轉學空間。"}];if(Number(career.reputation)>=27)options.push({id:"uba_elite",label:"接受 UBA 強權招募",detail:"爭冠資源更完整，上場競爭也更激烈。"});if(Number(career.draft_stock)>=16)options.push({id:"ncaa_d2",label:"接受 NCAA D2 招募",detail:"赴美加入四年制 D2 校隊，靠表現爭取更高層級。"});if(Number(career.health)>=88)options.push({id:"japan_college",label:"接受日本大學獎學金",detail:"走海外學生球員路線，適應新的球隊制度。"});if(Number(career.draft_stock)>=25)options.push({id:"ncaa_d1",label:"接受 NCAA D1 正式招募",detail:"挑戰最高層級大學賽事與職業球探競爭。"});return options}

function eventFor(world,career){
 const chapter=Number(world.chapter_number);
 if(Number(world.cycle_number)>1&&chapter>1&&chapter<6)return {...PRO_CAREER_EVENTS[chapter],scope:[3,5].includes(chapter)?"intersection":"personal"};
 if(chapter===1){
  if(Number(world.cycle_number)===1)return {...HBL_EVENTS[career.position],scope:"personal",options:PERSONAL_OPTIONS.start};
  return {id:"pro_role",eyebrow:`個人生涯・第 ${world.cycle_number} 季`,title:`${career.team_name} 要求你重新證明 ${ROLE_LABEL[career.position]} 的輪替價值`,detail:"上一季的合約與交會事件會保留；你不會因為新季開始就被重置成同一種球員。",scope:"personal",options:PRO_CAREER_EVENTS[2].options};
 }
 if(chapter===2)return {id:"hbl_graduation",eyebrow:"個人生涯・高中畢業",title:"HBL 三年履歷換來的升學邀請已經到齊",detail:"UBA 是穩定選項；UBA 強權、日本大學、NCAA D2 與 NCAA D1 只會依你的評價、健康與球探聲量出現，不保證每名玩家拿到相同邀請。",scope:"personal",options:collegeOptions(career)};
 if(chapter===3||chapter===5)return {...INTERSECTION_EVENTS[chapter],scope:"intersection"};
 if(chapter===4)return {id:"pro_entry",eyebrow:"個人生涯・職業入口",title:"大學生涯走到第一份職業履歷前",detail:`你從 ${career.league} 的 ${career.team_name} 進入市場；現在的 OVR、健康與球探聲量會決定每個選項的真實代價。`,scope:"personal",options:PERSONAL_OPTIONS.pro};
 if(Number(world.cycle_number)>1)return {id:"pro_renewal",eyebrow:"個人生涯・續約決定",title:"球季結束後，球隊根據你真正留下的履歷提出下一份條件",detail:"續留、談判或回到台灣市場都只影響自己的生涯；其他玩家不會被迫跟著轉隊。",scope:"personal",options:PERSONAL_OPTIONS.contract};
 return {id:"first_contract",eyebrow:"個人生涯・合約決定",title:"夏季聯賽結束後，每個人收到的不是同一份報價",detail:"你可以和其他玩家待在不同聯盟、不同球隊。共享世界只同步年份與交會事件，不替你綁定隊伍。",scope:"personal",options:PERSONAL_OPTIONS.contract};
}

function choiceResult(world,career,event,choice){
 let overall=0,health=0,reputation=0,draft=0,contract=Number(career.contract_years),league=career.league,team=career.team_name,age=Number(career.age),title="",detail="";
 if(choice==="train"){overall=2;health=-7;reputation=2;draft=3;title="個人武器被看見，身體負荷也留下";detail="能力成長不是免費贈送；下一章會使用降低後的健康。"}
 if(choice==="team"){overall=1;health=-2;reputation=6;draft=2;title="教練先記住你完成了哪一項責任";detail="球權沒有立刻增加，但輪替評價與人物關係提高。"}
 if(choice==="balance"){health=8;reputation=-1;draft=-1;title="你保住整季節奏，暫時離開曝光中心";detail="健康提高，球探聲量成長較慢。"}
 if(["uba","uba_elite","ncaa_d2","japan_college","ncaa_d1"].includes(choice)){const collegePath={uba:"UBA",uba_elite:"UBA 強權",ncaa_d2:"NCAA D2",japan_college:"日本大學",ncaa_d1:"NCAA D1"}[choice];league=collegePath;team=COLLEGE_TEAMS[collegePath][hash(`${career.user_id}:${collegePath}`)%COLLEGE_TEAMS[collegePath].length];age+=3;overall+=collegePath==="NCAA D1"?4:["UBA 強權","NCAA D2"].includes(collegePath)?3:2;health+=collegePath==="NCAA D1"?-7:collegePath==="NCAA D2"?-5:-3;reputation+=collegePath==="NCAA D1"?8:collegePath==="UBA 強權"?6:4;draft+=collegePath==="NCAA D1"?10:collegePath==="NCAA D2"?7:4;title=`你接受 ${team} 的正式招募`;detail=`${collegePath} 成為接下來的真實大學路線；上場競爭、健康與選秀聲量都已分別寫入。`}
 if(choice==="challenge"){health=-4;reputation=6;draft=6;title="另一名玩家成為你世界裡可追蹤的對手";detail="這次對位會寫進共同時間線，未來交會不再是陌生人。"}
 if(choice==="connect"){reputation=4;draft=2;title="不同大學路線第一次交換真正有用的情報";detail="你們沒有被強迫同隊，但已建立可以回訪的人物關係。"}
 if(choice==="protect"){health=9;reputation=-2;title="你離開聚光燈，保住自己的大學賽季";detail="這是合理的生涯選擇，不會被寫成無條件失敗。"}
 if(choice==="domestic"){overall=2;reputation=5;draft=3;league="台灣職籃";team=PRO_TEAMS[hash(`${career.user_id}:domestic`)%PRO_TEAMS.length];contract=1;title=`你進入 ${team} 的新人名單`;detail="較快取得職業回合，海外市場仍要靠後續交會打開。"}
 if(choice==="development"){overall=3;health=-7;reputation=6;draft=8;league="NBA G League";team="灣岸發展隊";contract=1;title="你取得 G League 訓練營與夏季名單入口";detail="這不是 NBA 保證合約；你必須在後續夏季賽制裡爭取正式席次。"}
 if(choice==="overseas"){overall=3;health=-6;reputation=7;draft=6;league="海外職業育成";team="東亞發展隊";contract=1;title="海外合約讓你先成為職業球員";detail="你帶著不同聯賽經驗進入共享世界的夏季交會。"}
 if(choice==="showcase"){overall=1;health=-8;reputation=7;draft=9;title="五場比賽把你的強項推上球探報告第一頁";detail="個人聲量大幅提高，健康與低效率風險也被完整記錄。"}
 if(choice==="winning"){health=-4;reputation=9;draft=5;title="球隊把你列為能留在輪替裡的球員";detail="數據不是最高，但五場賽制裡的決策與防守提高合約機率。"}
 if(choice==="durable"){health=8;reputation=3;draft=2;title="你完成五場賽制，沒有用一場爆發透支身體";detail="市場聲量較慢，健康會直接帶進第一份合約。"}
 if(choice==="accept"){contract=Math.max(2,contract);reputation=3;title=`你接受 ${team} 的保守報價`;detail="合約確定，但角色與年限沒有因共享世界而自動等同其他玩家。"}
 if(choice==="negotiate"){const success=Number(career.reputation)+Number(career.draft_stock)>=75;contract=success?3:1;reputation+=success?5:-5;title=success?"談判換到更長合約與明確角色":"球隊撤回原條件，你只能接受短約";detail=success?"前面章節累積的市場地位實際進入談判。":"要求不是免費選項；履歷不足時會承受真實代價。"}
 if(choice==="return"){contract=2;league="台灣職籃";team=PRO_TEAMS[hash(`${career.user_id}:return`)%PRO_TEAMS.length];reputation=4;title=`你回到台灣職業市場，加入 ${team}`;detail="放棄部分海外聲量，換取更清楚的本土輪替入口。"}
 return {title,detail,overall,health,reputation,draft,contract,league,team,age,event_id:event.id,choice};
}

function worldResult(event,results){
 if(event.scope!=="intersection")return {};
 const counts={};for(const row of results)counts[row.choice]=(counts[row.choice]||0)+1;
 if(event.id==="u20_camp")return {title:(counts.challenge||0)>=2?"共享世界的第一組宿敵關係正式成立":(counts.connect||0)>=2?"不同大學路線建立了第一條跨隊人物線":"第一次交會沒有共識，但每條生涯都留下自己的結果",detail:"玩家仍在不同大學與路線；只有這次已發生的觀察營交會被寫入共同時間線。"};
 return {title:(counts.winning||0)>=2?"夏季聯賽把這一屆玩家寫成能改變勝負的群體":(counts.showcase||0)>=2?"球探把共享世界的玩家分別列入重點名單":"五場賽制結束，每個人以不同方式留在職業市場",detail:"合約將依各自 OVR、健康、評價與選擇產生，不會發同一張合約。"};
}

async function submitChoice(env,room,profile,choice){
 const world=await worldRow(env,room.room_code);if(!world||!["personal","intersection","offseason"].includes(world.phase))return fail("目前不是可選擇的生涯節點",409);
 const career=await env.DB.prepare("SELECT * FROM online_shared_player_careers WHERE room_code=? AND user_id=?").bind(room.room_code,profile.user_id).first();if(!career)return fail("找不到你的共享世界球員",403);
 const event=eventFor(world,career),allowed=new Set(event.options.map(row=>row.id));if(!allowed.has(choice))return fail("這個選擇不適用於目前生涯節點");
 try{await env.DB.prepare("INSERT INTO online_shared_choices(room_code,cycle_number,chapter_number,user_id,choice) VALUES(?,?,?,?,?)").bind(room.room_code,world.cycle_number,world.chapter_number,profile.user_id,choice).run()}catch(error){return fail(String(error).includes("UNIQUE")?"你已經完成這個節點":"無法保存生涯選擇",409)}
 const result=choiceResult(world,career,event,choice),flags={...parse(career.career_flags,{}),[event.id]:choice};
 await env.DB.batch([
  env.DB.prepare("UPDATE online_shared_player_careers SET league=?,team_name=?,age=?,overall=MIN(99,MAX(40,overall+?)),health=MIN(100,MAX(20,health+?)),reputation=MIN(100,MAX(0,reputation+?)),draft_stock=MIN(100,MAX(0,draft_stock+?)),contract_years=?,career_flags=?,last_result=?,updated_at=CURRENT_TIMESTAMP WHERE room_code=? AND user_id=?").bind(result.league,result.team,result.age,result.overall,result.health,result.reputation,result.draft,result.contract,JSON.stringify(flags),JSON.stringify(result),room.room_code,profile.user_id),
  env.DB.prepare("INSERT OR REPLACE INTO online_shared_history(room_code,cycle_number,chapter_number,user_id,event_id,title,choice,result) VALUES(?,?,?,?,?,?,?,?)").bind(room.room_code,world.cycle_number,world.chapter_number,profile.user_id,event.id,event.title,choice,JSON.stringify(result)),
 ]);
 const players=await lobbyPlayers(env,room.room_code),choices=(await env.DB.prepare("SELECT user_id,choice FROM online_shared_choices WHERE room_code=? AND cycle_number=? AND chapter_number=?").bind(room.room_code,world.cycle_number,world.chapter_number).all()).results||[];
 if(choices.length===players.length){
  const lock=await env.DB.prepare("UPDATE online_shared_worlds SET phase='resolving' WHERE room_code=? AND cycle_number=? AND chapter_number=? AND phase!='resolving'").bind(room.room_code,world.cycle_number,world.chapter_number).run();
  if(Number(lock?.meta?.changes||0)){
   const results=[];for(const row of choices){const player=await env.DB.prepare("SELECT last_result FROM online_shared_player_careers WHERE room_code=? AND user_id=?").bind(room.room_code,row.user_id).first();results.push({...parse(player.last_result,{}),choice:row.choice})}
   const shared=worldResult(event,results),chapter=Number(world.chapter_number);
   if(chapter===6){
    await env.DB.batch([
     env.DB.prepare("UPDATE online_shared_player_careers SET age=age+1,updated_at=CURRENT_TIMESTAMP WHERE room_code=?").bind(room.room_code),
     env.DB.prepare("UPDATE online_shared_worlds SET cycle_number=cycle_number+1,timeline_year=timeline_year+1,chapter_number=1,phase='personal',last_world_result=?,updated_at=CURRENT_TIMESTAMP WHERE room_code=?").bind(JSON.stringify({title:"共享世界進入下一個職業球季",detail:"玩家保留各自球隊、聯盟、OVR、健康、人物線與合約；年份與年齡各前進一季。"}),room.room_code),
    ]);
   }else{
    if(chapter===3&&Number(world.cycle_number)===1)await env.DB.prepare("UPDATE online_shared_player_careers SET age=age+3,overall=MIN(99,overall+3),health=MAX(20,health-5),reputation=MIN(100,reputation+4),draft_stock=MIN(100,draft_stock+5),updated_at=CURRENT_TIMESTAMP WHERE room_code=?").bind(room.room_code).run();
    const yearJump=Number(world.cycle_number)===1&&[2,3].includes(chapter)?3:0;
    await env.DB.prepare("UPDATE online_shared_worlds SET timeline_year=timeline_year+?,chapter_number=chapter_number+1,phase=?,last_world_result=?,updated_at=CURRENT_TIMESTAMP WHERE room_code=?").bind(yearJump,[3,5].includes(chapter+1)?"intersection":chapter+1===6?"offseason":"personal",JSON.stringify(shared.title?shared:{}),room.room_code).run();
   }
  }
 }
 return null;
}

async function payload(env,room,profile){
 const players=await lobbyPlayers(env,room.room_code),world=await worldRow(env,room.room_code),careers=await careerRows(env,room.room_code),mine=careers.find(row=>row.user_id===profile.user_id);if(!mine)return fail("你尚未加入這個共享世界",403);
 const submitted=world?(await env.DB.prepare("SELECT user_id FROM online_shared_choices WHERE room_code=? AND cycle_number=? AND chapter_number=?").bind(room.room_code,world.cycle_number,world.chapter_number).all()).results.map(row=>row.user_id):[];
 const history=(await env.DB.prepare("SELECT cycle_number,chapter_number,user_id,event_id,title,choice,result FROM online_shared_history WHERE room_code=? ORDER BY cycle_number DESC,chapter_number DESC LIMIT 18").bind(room.room_code).all()).results||[];
 const event=world?eventFor(world,mine):null;
 return json({room:{code:room.room_code,owner:room.owner_user_id===profile.user_id},world:world?{cycle:Number(world.cycle_number),year:Number(world.timeline_year),chapter:Number(world.chapter_number),phase:world.phase,last_result:parse(world.last_world_result,{})}:null,players:players.map(({user_id,...row})=>row),careers:careers.map(({user_id,...row})=>({...row,is_me:user_id===profile.user_id,last_result:parse(row.last_result,{})})),my_role:mine.position,my_route:mine.origin_route,my_career:{...mine,last_result:parse(mine.last_result,{})},submitted_count:submitted.length,submitted:submitted.includes(profile.user_id),can_start:!world&&players.length>=2&&room.owner_user_id===profile.user_id,event:event?{...event,options:submitted.includes(profile.user_id)?[]:event.options}:null,history:history.map(row=>({...row,result:parse(row.result,{})})),server_time:Date.now()});
}

async function addPlayer(env,code,profile,role){const used=(await env.DB.prepare("SELECT team_name FROM online_shared_player_careers WHERE room_code=?").bind(code).all()).results.map(row=>row.team_name),available=HBL_TEAMS.filter(team=>!used.includes(team)),team=available[hash(`${code}:${profile.user_id}`)%available.length];await env.DB.batch([env.DB.prepare("INSERT INTO online_key_battle_players(room_code,user_id,role,nickname) VALUES(?,?,?,?)").bind(code,profile.user_id,role,profile.nickname),env.DB.prepare("INSERT INTO online_shared_player_careers(room_code,user_id,player_name,position,origin_route,league,team_name) VALUES(?,?,?,?,?,?,?)").bind(code,profile.user_id,profile.nickname,role,"hbl","HBL",team)])}
export async function handleOnlineKeyBattle({request,env,path,profile}){
 if(path[0]!=="rooms")return fail("ONLINE 共享世界路徑不存在",404);
 if(path.length===1&&request.method==="POST"){
  const body=await request.json().catch(()=>({})),role=clean(body.role);if(!ROLES.includes(role))return fail("請選擇球員位置");
  const active=await env.DB.prepare("SELECT COUNT(*) AS total FROM online_key_battle_rooms WHERE owner_user_id=?").bind(profile.user_id).first();if(Number(active?.total||0)>=3)return fail("你已有 3 個共享世界房間",409);
  let code="";for(let attempt=0;attempt<5;attempt++){code=roomCode();if(!await roomRow(env,code))break}
  await env.DB.prepare("INSERT INTO online_key_battle_rooms(room_code,owner_user_id) VALUES(?,?)").bind(code,profile.user_id).run();await addPlayer(env,code,profile,role);return payload(env,await roomRow(env,code),profile);
 }
 const code=clean(path[1]).toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return fail("房間代碼格式錯誤");const room=await roomRow(env,code);if(!room)return fail("找不到這個共享世界",404);
 if(path[2]==="join"&&request.method==="POST"){
  const body=await request.json().catch(()=>({})),role=clean(body.role);if(!ROLES.includes(role))return fail("請選擇球員位置");
  if(await env.DB.prepare("SELECT 1 FROM online_shared_player_careers WHERE room_code=? AND user_id=?").bind(code,profile.user_id).first())return payload(env,room,profile);if(await worldRow(env,code))return fail("這個共享世界已經開始",409);
  try{await addPlayer(env,code,profile,role)}catch(error){return fail(String(error).includes("UNIQUE")?"這個位置已經有人建立球員":"加入共享世界失敗",409)}return payload(env,room,profile);
 }
 if(path[2]==="start"&&request.method==="POST"){
  const players=await lobbyPlayers(env,code);if(room.owner_user_id!==profile.user_id)return fail("只有房主可以開始共享世界",403);if(players.length<2)return fail("至少需要兩名玩家",409);if(!await worldRow(env,code))await env.DB.prepare("INSERT INTO online_shared_worlds(room_code,world_seed) VALUES(?,?)").bind(code,`${code}-${Date.now()}`).run();return payload(env,room,profile);
 }
 if(path[2]==="choices"&&request.method==="POST"){const body=await request.json().catch(()=>({})),response=await submitChoice(env,room,profile,clean(body.choice));if(response)return response;return payload(env,room,profile)}
 if(path.length===2&&request.method==="GET")return payload(env,room,profile);
 return fail("Method not allowed",405);
}
