/* BasketballLife V9 career-story data. Loaded as a classic script. */
const careerStoryChoice=(id,label,detail,result,memory,effects={})=>({id,label,detail,result,memory,effects});
const careerStoryNode=(id,line,node,theme,stages,title,desc,actor,choices,requirements={})=>({id,line,node,theme,stages,title,desc,actor,choices,requirements,once:true});

const CAREER_STORY_LINES=[
 careerStoryNode("school_rival_1","school_rivalry",1,"rivalry",["hbl"],"第一次被放進同一張比較表",`校際盃開打前，球探把你和 {rival} 列成同位置最值得觀察的兩人。你們甚至還沒真正交談，網路上已經有人替這段競爭決定輸贏。`,"rival",[
  careerStoryChoice("challenge","主動約一場單挑","把比較拉回球場，也接受輸贏會被所有隊友記住。","你在訓練館正面迎戰，兩人的競爭從傳聞變成真正的對決。","你選擇用比賽認識宿敵，而不是躲開比較。",{confidence:3,rivalRespect:5,fatigue:4}),
  careerStoryChoice("team","只談球隊目標","不否認競爭，但拒絕讓個人話題蓋過正式比賽。","你把焦點留在校隊，教練認為你沒有被話題帶走。","第一次被拿來比較時，你先守住了球隊。",{discipline:3,rep:2,rivalRespect:1}),
  careerStoryChoice("dismiss","公開說他不值得比較","搶回聲量，卻可能讓一句話跟著你很多年。","你的話迅速傳到對方球隊，下一次碰面不再只是普通比賽。","你用挑釁替這段宿敵關係點了火。",{rep:2,confidence:2,rivalRespect:-8})
 ]),
 careerStoryNode("school_rival_2","school_rivalry",2,"rivalry",["hbl","college"],"比較沒有隨下一次碰面消失",`再次同場前，{rival} 在訪問裡提到你當年的選擇。如今兩人站在不同隊伍與不同角色，外界又把那次故事拿來解釋這場比賽。`,"rival",[
  careerStoryChoice("answer","承認這場對決對你很重要","正面承擔壓力，勝敗也會更直接寫進評價。","你沒有閃避過去，並把壓力轉成比賽準備。","你承認宿敵是推著自己前進的人。",{confidence:3,clutch:2,rivalRespect:4}),
  careerStoryChoice("private","賽後私下和他談","外界看不到答案，但兩人可以決定競爭要走向敵意或尊重。","你們第一次沒有透過媒體說話，關係開始出現新的界線。","你讓宿敵關係從口水回到兩個人的選擇。",{iq:1,discipline:2,rivalRespect:8}),
  careerStoryChoice("fuel","把舊話再說一次","提高比賽火藥味，也讓自己沒有退路。","話題再度升高，教練提醒你必須用表現承擔。","你讓舊衝突成為下一場比賽的燃料。",{rep:3,fatigue:4,rivalRespect:-6})
 ]),
 careerStoryNode("school_rival_3","school_rivalry",3,"rivalry",["college","pro"],"多年後的同場採訪",`你和 {rival} 已走上不同路線。節目把早年的比較畫面重新播出，主持人要你用現在的身分，重新定義這段一路跟來的競爭。`,"rival",[
  careerStoryChoice("credit","公開說他讓你變得更好","放下輸贏口氣，承認競爭本身留下的價值。","兩人第一次在鏡頭前互相肯定，宿敵關係轉為長期尊重。","你把多年競爭留下的最好部分說了出來。",{rep:4,discipline:2,rivalRespect:12}),
  careerStoryChoice("unfinished","說勝負還沒有結束","保留競爭張力，也接受每次交手仍會被放大。","節目把這句話當成下一次對決的標題。","即使走到更高舞台，你仍不願替競爭寫下句點。",{confidence:4,clutch:2,rivalRespect:3}),
  careerStoryChoice("moveOn","拒絕再談學生時代","切斷舊標籤，但也可能讓一路關注的人失望。","你把焦點轉回現在，話題很快降溫。","你決定不再讓早年的比較定義生涯。",{iq:2,rep:-1,rivalRespect:-2})
 ]),

 careerStoryNode("friend_thread_1","friendship",1,"friendship",["hbl"],"看台上最早認識你的人",`{friend} 從你還沒有固定上場時間時就會來看球。這次他提醒你，最近為了競爭輪替，你連原本約好的投籃練習都忘了。`,"friend",[
  careerStoryChoice("makeTime","留下來把約定練完","犧牲一點休息，保住兩人最早建立的默契。","夜裡的球館只剩你們，熟悉的節奏讓壓力慢慢降下來。","你沒有讓上場順位拿走最早的朋友。",{confidence:3,fatigue:3,friendTrust:8}),
  careerStoryChoice("explain","坦白自己正在搶位置","不勉強赴約，但讓對方知道你不是故意疏遠。","他接受你的說明，也提醒你別把所有失敗都自己吞下去。","你第一次把競爭壓力說給朋友聽。",{discipline:2,confidence:1,friendTrust:5}),
  careerStoryChoice("ignore","先把所有時間留給球隊","短期最專注，關係卻可能在沒有爭吵的情況下變遠。","訊息停在已讀，接下來幾個月你們幾乎沒有見面。","你為了輪替，暫時放下了最早的陪伴。",{rep:2,friendTrust:-9})
 ]),
 careerStoryNode("friend_thread_2","friendship",2,"friendship",["hbl","college","pro"],"那則沒有立刻回覆的訊息",`新的球季開始，{friend} 傳來一段舊球館整修前的影片。影片裡的你還不是明星，只是在一次次撿球與失誤裡學會留下來。`,"friend",[
  careerStoryChoice("visit","安排一天回到舊球館","少一次個人訓練，換回被職業節奏遮住的生活感。","你們在空球場重投當年的位置，沒有媒體，也沒有數據。","你回到起點，確認有人記得成名以前的你。",{confidence:5,fatigue:-4,friendTrust:10}),
  careerStoryChoice("call","打電話把近況說清楚","不改變行程，但讓關係重新有了真實對話。","一通電話沒有解決所有距離，至少停止彼此猜測。","你用一次坦白，沒有讓朋友只剩觀眾身分。",{iq:1,friendTrust:6}),
  careerStoryChoice("saveLater","把影片存下來，等休賽季再說","維持工作節奏，卻讓未完成的約定繼續往後推。","你沒有刪掉訊息，但也沒有真正回到那段關係。","你把朋友留在『之後再說』的位置。",{discipline:1,friendTrust:-4})
 ]),
 careerStoryNode("friend_thread_3","friendship",3,"friendship",["college","pro"],"朋友不只想當你的觀眾",`{friend} 說，他不希望每次見面都只聽你談下一場比賽。他想知道這段關係能不能在籃球以外，也留下真正屬於你們的時間。`,"friend",[
  careerStoryChoice("tradition","約定每年固定留一天給彼此","建立一個不因球隊、聯盟或名氣改變的習慣。","你們把日期寫進行事曆，這段友誼有了能跨城市延續的方式。","你替最早的朋友保留了一個不被賽程拿走的位置。",{confidence:3,friendTrust:12}),
  careerStoryChoice("include","邀他參與自己的訓練計畫","讓友情靠近籃球，也冒著彼此界線變模糊的風險。","他開始偶爾加入休賽季訓練，重新理解你現在的生活。","你讓朋友走進職業生涯，而不只是遠遠旁觀。",{discipline:2,fatigue:-2,friendTrust:8}),
  careerStoryChoice("distance","承認彼此已走向不同生活","不勉強維持過去的形式，也接受關係可能變淡。","你們沒有爭吵，只是把彼此放回偶爾問候的位置。","你接受有些同行者不一定會走完整段生涯。",{iq:2,friendTrust:-6})
 ]),

 careerStoryNode("coach_role_1","coach_role",1,"coach",["college","pro"],"第一次真正談角色",`{coach} 把你留下來，攤開最近五場的輪替表。他說能力不是唯一問題，球隊需要你決定：要先守住上場時間，還是爭取更大的持球責任。`,"coach",[
  careerStoryChoice("earn","先把現有角色做到最好","短期球權不變，以穩定換取教練信任。","你接受明確工作，輪替變得穩定，但明星曝光仍有限。","你第一次選擇先贏得信任，再談更多球權。",{coachTrust:8,rep:2,planStatMod:-1}),
  careerStoryChoice("ask","提出可驗證的升級條件","要求教練說清楚什麼表現能換來更多責任。","雙方訂出具體目標，壓力提高，承諾也不再模糊。","你要求角色變動必須有清楚標準。",{iq:2,coachTrust:3,confidence:2}),
  careerStoryChoice("challenge","直接質疑輪替決定","可能立刻逼出答案，也可能讓關係先出現裂痕。","會議不歡而散，接下來每次換人都成為外界話題。","你用公開衝突換取角色談判。",{rep:-2,confidence:3,coachTrust:-10})
 ]),
 careerStoryNode("coach_role_2","coach_role",2,"coach",["college","pro"],"承諾遇上連敗",`球隊連敗後，{coach} 改變輪替，你先前談好的角色也被縮減。那份沒有兌現的承諾，現在成為新球季裡必須當場處理的問題。`,"coach",[
  careerStoryChoice("review","帶著影片逐條檢視承諾","用比賽內容談，不讓對話只剩情緒。","教練同意恢復部分責任，但要求你先改善兩個細節。","你讓舊承諾在新球季接受具體檢驗。",{iq:2,coachTrust:6,rep:1}),
  careerStoryChoice("adapt","先適應新角色一個月","保住團隊關係，也承擔市場數據下降。","你沒有立刻反抗，隊內氣氛穩住，外界卻開始問你是否失勢。","你暫時把球隊需要放在個人角色之前。",{discipline:3,coachTrust:5,planStatMod:-2}),
  careerStoryChoice("public","向媒體說承諾沒有兌現","把壓力交給球團，也讓關係難以回到私下。","新聞迫使球隊回應，你與教練的每個互動都被放大。","你把角色爭議帶到公開場合。",{rep:-3,coachTrust:-12,confidence:2})
 ]),
 careerStoryNode("coach_role_3","coach_role",3,"coach",["college","pro"],"這段教練關係留下什麼",`又一個球季的輪替變化後，{coach} 再次和你談角色。這次他沒有先拿出表格，而是問你：經過衝突與調整後，你想成為哪一種球員。`,"coach",[
  careerStoryChoice("leader","把經驗轉成帶隊責任","接受球權不一定最多，改用溝通與判斷影響球隊。","教練把你放進領導小組，角色從數據延伸到更衣室。","你把角色衝突轉成了領導位置。",{iq:2,rep:4,coachTrust:10}),
  careerStoryChoice("specialist","要求一項清楚的場上任務","縮小角色範圍，換取真正能累積的比賽價值。","你們定出明確任務，輪替與合約評價都更容易被理解。","你不再追求空泛定位，而是選擇可被信任的專長。",{discipline:3,coachTrust:8,confidence:2}),
  careerStoryChoice("separate","承認彼此理念不合","不再消耗關係，為下一個環境保留選擇。","雙方結束拉扯，球團開始評估新的去向。","你接受不是每段教練關係都必須修復。",{confidence:2,coachTrust:-5,rep:-1})
 ]),

 careerStoryNode("playoff_injury_1","playoff_injury",1,"injury",["pro"],"關鍵賽程前的止痛選擇",`球隊醫療團隊確認傷勢沒有立即斷裂風險，但疼痛與代償已經明顯。球季最重要的一段賽程前，醫療報告要求你在正常上場、限時出賽與完整休養之間做決定。`,"medicalTeam",[
  careerStoryChoice("play","接受止痛並照常上場","保住關鍵賽程角色，復發與長期負荷明顯上升。","你帶著疼痛出賽，完成當下任務，也把風險帶進下一季。","你在關鍵賽程選擇先替球隊承擔身體代價。",{rep:4,bodyLoad:14,health:-6,coachTrust:5}),
  careerStoryChoice("limit","接受嚴格時間限制","仍參與比賽，但把部分球權與關鍵時間交給隊友。","你在限制中完成輪替，沒有英雄畫面，也避免傷勢失控。","你用限時上場平衡關鍵賽程與未來。",{rep:1,bodyLoad:5,health:-2,coachTrust:2}),
  careerStoryChoice("rest","退出關鍵賽程完整治療","保護長期健康，承擔球隊與球迷的不滿。","你沒有上場，醫療報告則顯示傷勢開始穩定。","你在最難休息的時候選擇保住生涯。",{health:6,bodyLoad:-12,rep:-3,coachTrust:-2})
 ]),
 careerStoryNode("playoff_injury_2","playoff_injury",2,"injury",["pro"],"關鍵賽程的傷勢進入新球季評估",`訓練營開始，醫療團隊依照上一季的處理方式重新檢查同一部位。當時的選擇現在影響負荷限制、輪替安排與合約風險。`,"medicalTeam",[
  careerStoryChoice("protocol","接受完整負荷計畫","犧牲季初數據，降低同部位復發機率。","你照表完成恢復，教練也承諾不在短期內追加上場時間。","你讓關鍵賽程的傷勢得到真正的後續處理。",{health:7,bodyLoad:-15,planStatMod:-2,coachTrust:4}),
  careerStoryChoice("reinvent","改變打法減少碰撞","把部分爆發與得分機會換成判斷、傳球與防守位置。","你的角色開始轉型，數據結構也不再和受傷前相同。","你為了延長生涯，第一次主動改變打法。",{iq:2,pass:1,bodyLoad:-7,planStatMod:-1}),
  careerStoryChoice("prove","拒絕限制，要求正常競爭","有機會搶回原角色，復發風險仍未消失。","你在訓練營全力競爭，身體負荷再次逼近警戒。","你選擇用表現證明傷勢已經過去。",{confidence:4,bodyLoad:11,health:-4,rep:2})
 ]),
 careerStoryNode("playoff_injury_3","playoff_injury",3,"injury",["pro"],"長期傷勢評估有了結論",`醫療團隊完成跨季追蹤，確認那次關鍵賽程的傷勢是否仍是固定限制。先前的恢復方式、上場選擇與角色轉型，現在都有明確結果。`,"medicalTeam",[
  careerStoryChoice("maintain","把負荷管理變成長期習慣","接受不是每季都打滿，以穩定出勤延長競爭力。","球隊把管理方案寫進年度計畫，復發風險明顯下降。","你把一次傷勢轉成長期照顧身體的方法。",{health:6,bodyLoad:-10,discipline:3}),
  careerStoryChoice("normal","逐步回到一般輪替","不再被特殊對待，但仍保留固定檢查。","你重新回到正常競爭，醫療限制只剩定期追蹤。","你讓那次關鍵賽程的傷勢真正走完復原過程。",{confidence:3,health:2,rep:2}),
  careerStoryChoice("allOut","取消所有保護措施","完整追求單季上限，也重新承擔累積負荷。","球隊解除限制，你的數據空間提高，身體警訊也重新出現。","你在健康與巔峰之間選擇再次全力衝刺。",{planStatMod:2,bodyLoad:10,health:-4})
 ]),

 careerStoryNode("teammate_scandal_1","teammate_scandal",1,"teammate",["pro"],"隊友的名字出現在調查新聞",`{teammate} 被捲入一則尚未查清的場外指控。球團要求全隊保持沉默，他則私下說自己需要有人陪著面對第一次正式詢問。`,"teammate",[
  careerStoryChoice("support","陪他接受球團詢問","支持隊友但不替未知事實背書，自己也會被放進新聞。","你陪他進入會議室，並要求所有說法以調查結果為準。","你在隊友最孤立時選擇陪伴，也保留事實界線。",{teammateTrust:10,rep:1,discipline:2}),
  careerStoryChoice("distance","遵守球團指示保持距離","保護自己與球隊，可能讓隊友認為你只在順境出現。","你沒有公開表態，更衣室氣氛因此變得拘謹。","你把球隊紀律放在私人支持之前。",{discipline:3,teammateTrust:-6}),
  careerStoryChoice("defend","直接公開替他保證","立刻給出支持，也冒著調查結果反轉的風險。","你的發言成為新聞標題，球團要求你停止追加評論。","你在事實未明時用自己的名聲替隊友作保。",{rep:2,teammateTrust:8,discipline:-4})
 ]),
 careerStoryNode("teammate_scandal_2","teammate_scandal",2,"teammate",["pro"],"調查結果沒有讓事情立刻結束",`初步調查公布後，{teammate} 雖未遭最重處分，市場與更衣室仍把他當成風險。你先前的態度，也成了他判斷誰值得信任的依據。`,"teammate",[
  careerStoryChoice("accountability","要求他把責任說清楚","支持不等於護短，關係可能短期緊張。","他第一次完整說明自己的錯誤與未被證實的部分。","你把支持變成要求隊友真正負責。",{discipline:3,teammateTrust:5,rep:2}),
  careerStoryChoice("basketball","只幫他回到訓練節奏","避開公開爭議，讓場上配合先恢復。","你們重新一起訓練，外界問題仍留待他自己處理。","你用籃球陪隊友重建日常，但沒有替他回答所有問題。",{teammateTrust:7,confidence:2}),
  careerStoryChoice("cutTies","明確結束私下往來","降低自己被牽連的機會，也關上修復關係的門。","你們仍是隊友，場外已不再交談。","你決定不再讓隊友的風波影響自己的生涯。",{rep:1,teammateTrust:-12})
 ]),
 careerStoryNode("teammate_scandal_3","teammate_scandal",3,"teammate",["pro"],"處分結束後，他回到同一間更衣室",`{teammate} 完成球團要求的處分與輔導，卻不再擁有原本的角色。新球員只知道新聞，你則知道整段過程，必須決定如何面對他的回歸。`,"teammate",[
  careerStoryChoice("welcome","公開歡迎他重新競爭","承認已完成處分，也接受外界重新檢視你的立場。","更衣室有人跟著你伸出手，復出不再只是公關流程。","你讓一段場外風波以承擔與重新開始收尾。",{teammateTrust:12,rep:3}),
  careerStoryChoice("quiet","私下支持，不替球團宣傳","保留關係，也避免把復出變成自己的形象工程。","你們恢復正常互動，沒有安排任何鏡頭。","你選擇讓隊友的復出屬於他自己。",{teammateTrust:8,discipline:2}),
  careerStoryChoice("compete","把他當一般輪替對手","不排斥也不特別照顧，所有位置重新靠表現決定。","兩人在訓練中正面競爭，關係回到職業界線。","你用公平競爭替這段隊友關係畫下新界線。",{rep:2,confidence:2,teammateTrust:1})
 ]),

 careerStoryNode("family_city_1","family_city",1,"family",["pro","veteran"],"從 {fromTeam} 到 {toTeam}，生活也必須搬過去",`你已經確定從 {fromLeague} 的 {fromTeam} 轉往 {toLeague} 的 {toTeam}。這不是假設中的報價；交通、住處與彼此工作都要在開季前處理，你和家人現在必須決定怎麼搬。`,"family",[
  careerStoryChoice("overseas","你先報到，家人分階段移動","先處理訓練營與住處，等生活穩定後再讓家人跟上。","你先抵達新球隊，家人保留原本生活幾個月；距離壓力增加，但搬遷不必一次賭完。","你選擇分階段完成這次真實轉隊的搬遷。",{rep:2,familyHarmony:-4,confidence:2}),
  careerStoryChoice("stay","全家一起搬到新城市","一起處理工作、學校與住處，開季前完成共同生活的移動。","所有人都付出適應成本，但新球季不再從長期分隔開始。","你讓全家共同承擔這次跨城市或跨國轉隊。",{familyHarmony:10,rep:-1,financialLosses:60}),
  careerStoryChoice("delay","先維持兩地生活一季","保留家人目前的工作與生活，排出固定返家和通話時間。","你們沒有假裝距離不存在，而是先用一季檢查兩地安排能不能長久。","你用明確期限測試兩地生活，而不是無限延期。",{familyHarmony:4,fatigue:3,discipline:2})
 ]),
 careerStoryNode("family_city_2","family_city",2,"family",["pro","veteran"],"搬到 {toTeam} 之後，原本的安排撐得住嗎？",`轉隊後的第一段生活已經過去。現在可以用真正的客場天數、返家距離與家庭節奏檢查：你們當初為這次搬遷做的安排，哪些有效，哪些必須重來？`,"family",[
  careerStoryChoice("schedule","建立固定返家與通話安排","減少部分休息與商業活動，讓關係不靠臨時補救。","新的生活節奏逐漸穩定，家人也能預先知道你何時出現。","你用固定承諾處理旅外與家庭的距離。",{familyHarmony:10,fatigue:3,discipline:2}),
  careerStoryChoice("relocate","協助家人搬到目前城市","投入金錢與適應成本，讓共同生活更接近可能。","搬遷沒有立刻解決所有問題，但你們不再隔著整個賽季。","你讓生涯城市也開始成為家人的生活。",{familyHarmony:12,confidence:3,financialLosses:80}),
  careerStoryChoice("careerFirst","要求大家再撐一季","維持競技專注，家庭關係承受更多延後。","你把問題留到休賽季，家人接受了答案，卻沒有真正放心。","你再次把家庭決定延後到球季之後。",{rep:2,familyHarmony:-10})
 ]),
 careerStoryNode("family_city_3","family_city",3,"family",["pro","veteran"],"哪一座城市算是家",`幾個球季後，你和家人已經一起經歷搬遷、等待與短暫團聚。下一次談判要只看競技條件，還是把真正住過的地方也算進去，你們終於能用共同經歷回答。`,"agent",[
  careerStoryChoice("homeClause","要求經紀人把地點列為優先","縮小市場範圍，換取更可持續的共同生活。","經紀人重新排序報價，最貴的選項不再必然排第一。","你第一次把『家』寫進職業生涯的條件。",{familyHarmony:10,agentTrust:4,rep:-1}),
  careerStoryChoice("bestLeague","仍以最高層級為唯一目標","保留競技上限，也接受家庭繼續跟著變動。","你沒有改變路線，家人要求未來每次搬遷都一起決定。","你繼續追逐最高舞台，但不再假裝距離沒有代價。",{rep:4,confidence:2,familyHarmony:-4}),
  careerStoryChoice("return","主動尋找回鄉機會","可能提早離開高階聯盟，換回長期歸屬與陪伴。","經紀人開始聯絡家鄉球隊，生涯方向出現明確轉彎。","你選擇讓最後幾段職業生涯靠近家。",{familyHarmony:14,rep:-2,agentTrust:2})
 ]),

 careerStoryNode("market_choice_1","market_choice",1,"contract",["pro"],"合約進入後段，先決定下次談什麼",`目前合約仍有效，桌上也沒有正式報價。{agent} 要你先說清楚：下一個市場窗口打開時，你最不願意犧牲的是舞台、角色，還是保障？`,"agent",[
  careerStoryChoice("test","把聯盟升級列為第一順位","未來若有正式窗口，願意用保障與角色換更高舞台。","經紀人把聯盟層級排到搜尋條件最前面，沒有對外宣稱已有報價。","你先決定願意承擔哪種市場風險。",{confidence:3,agentTrust:6,rep:1}),
  careerStoryChoice("extend","把留隊穩定列為第一順位","優先比較熟悉角色與保障，但不代表提前完成續約。","經紀人先準備留隊方案，真正條件仍等球團提出。","你讓確定性成為下次談判的起點。",{teamTrust:5,agentTrust:2,discipline:2}),
  careerStoryChoice("option","把短約彈性列為第一順位","保留再次決定去向的空間，也接受更頻繁的市場評估。","經紀人把短期方案寫進談判筆記，提醒你彈性也代表明年還要再證明一次。","你選擇把未來選擇權放進談判排序。",{agentTrust:3,rep:1})
 ]),
 careerStoryNode("market_choice_2","market_choice",2,"contract",["pro"],"真正的談約窗口到了",`合約年限、目前角色與已經出現的市場訊號，終於能檢查先前排序。{agent} 劃掉沒有具體條件的傳聞，只留下值得繼續談的方向。`,"agent",[
  careerStoryChoice("level","維持最高競技層級優先","授權經紀人在正式選項中先比較舞台，再看保障。","你的市場清單依聯盟層級重新排序；沒有球隊名稱與條件的傳聞，一律不算答案。","你仍願意為更高舞台承擔較小角色。",{rep:3,confidence:3,planStatMod:-1}),
  careerStoryChoice("role","改以上場角色優先","要求每個正式選項說清楚輪替，而不是只看隊名。","經紀人刪掉角色完全不明的方向，沒有替球團保證分鐘。","你讓下一次選擇先回答自己能否真正上場。",{agentTrust:4,rep:1}),
  careerStoryChoice("money","改以保障與薪資優先","接受舞台可能不最高，但不把尚未簽下的金額計入收入。","經紀人把保障排在前面，生涯收入仍只在真正簽約後增加。","你清楚說出這次市場願意承擔的取捨。",{agentTrust:8,rep:2})
 ]),
 careerStoryNode("market_choice_3","market_choice",3,"contract",["pro"],"經紀人要求你回頭檢查答案",`合約進入後段，{agent} 拿出去年的選擇與實際上場、收入和球隊狀態逐項比較。他要你決定，下次談判要修正方向，還是接受原本代價。`,"agent",[
  careerStoryChoice("correct","承認判斷有誤並調整優先順序","不替過去辯護，讓下一份合約重新排序。","經紀人重寫談判條件，你也清楚說出不願再承擔的代價。","你用實際結果修正了自己的合約價值觀。",{iq:2,agentTrust:8,confidence:1}),
  careerStoryChoice("stayCourse","維持原本路線","接受短期不順，繼續追求當初選定的目標。","你沒有因一季結果改變方向，團隊開始準備下一次談判。","你選擇承擔原本決定，而不是追逐每次市場風向。",{discipline:3,agentTrust:4}),
  careerStoryChoice("resetTerms","重訂合作規則","把責任、資訊與談判底線寫清楚，也代表彼此不再靠默契帶過。","你與經紀人重新劃定合作方式，下一次市場判斷必須說清楚依據。","你要求經紀合作留下可以檢驗的承諾。",{agentTrust:-8,confidence:2,discipline:2})
 ]),

 careerStoryNode("media_identity_1","media_identity",1,"identity",["college","pro"],"一個標籤開始比名字更快被記住",`連續幾場比賽後，媒體用「只會得分」或「沒有進攻威脅」概括你的打法。標籤不完全公平，卻已經影響教練、球迷與球探看待你的方式。`,"media",[
  careerStoryChoice("expand","刻意補上被忽略的能力","短期效率可能下降，換取角色不被單一標籤限制。","你在比賽中主動展示不同工作，數據沒有立刻更漂亮。","你選擇用新的比賽內容反駁外界標籤。",{iq:2,pass:1,defense:1,planStatMod:-1}),
  careerStoryChoice("own","把標籤變成招牌","集中強化最有辨識度的價值，也接受弱點被更仔細攻擊。","你不再迴避稱呼，反而用表現把它變成市場定位。","你選擇先把一件事做到無法忽視。",{confidence:4,rep:3,fatigue:3}),
  careerStoryChoice("ignore","不回應，照原本方式打球","避免被媒體牽著走，標籤也可能在沉默中固定。","你沒有改變訓練與訪談，話題暫時沒有新材料。","你拒絕讓外界替你安排成長方向。",{discipline:2,rep:-1})
 ]),
 careerStoryNode("media_identity_2","media_identity",2,"identity",["college","pro"],"對手開始針對你的打法",`新球季對手開始按照外界對你的評價安排防守，{coach} 也拿出影片詢問你是否願意調整角色。去年的新聞標籤，現在變成真正的戰術問題。`,"coach",[
  careerStoryChoice("study","和教練設計反制方案","投入時間理解對手如何利用你的習慣。","你們建立新的第二選項，標籤第一次被戰術破解。","你把媒體評語轉成可研究、可修正的比賽問題。",{iq:3,coachTrust:7,fatigue:2}),
  careerStoryChoice("double","把原有優勢再推到極致","逼對手即使知道也無法阻止，風險是弱點更加固定。","你的招牌表現更強，球隊也更依賴同一種解法。","你用更極端的專長回應所有針對。",{shoot:1,finish:1,confidence:3,bodyLoad:4}),
  careerStoryChoice("switch","要求完全不同的角色","有機會擺脫標籤，也可能失去原本最穩定的價值。","教練給你試驗期，輪替一度變得不穩定。","你寧願重新競爭，也不願被一個標籤困住。",{confidence:2,coachTrust:-2,planStatMod:-1})
 ]),
 careerStoryNode("media_identity_3","media_identity",3,"identity",["pro"],"由你替這段打法命名",`多年後，採訪節目再次提到當年的標籤。這次你已經有足夠比賽證據，不必只反駁別人的說法，而能主動解釋自己如何改變。`,"media",[
  careerStoryChoice("whole","用完整生涯說明轉型","承認早期限制，也讓後來的調整得到位置。","訪談把你的成長分成幾個階段，不再只剩一句標籤。","你親自說清楚自己不是一季數據能定義的球員。",{rep:5,iq:2}),
  careerStoryChoice("signature","保留招牌稱號","接受外界用一項能力記住你，並強調那是長年磨出的成果。","稱號從批評變成肯定，成為球迷辨識你的方式。","你把曾經限制自己的標籤，變成真正的招牌。",{confidence:5,rep:4}),
  careerStoryChoice("next","不回顧，只談下一個角色","讓生涯繼續向前，也放棄替舊故事補上解釋。","訪談沒有懷舊段落，焦點留在下一季。","你選擇不替過去辯護，用下一段生涯回答。",{discipline:3,confidence:2})
 ]),

 careerStoryNode("veteran_mentor_1","veteran_mentor",1,"veteran",["veteran"],"年輕隊友開始問你怎麼撐過來",`{teammate} 在訓練後留下來，問你如何處理角色下降、舊傷與短約。你仍在競爭自己的位置，分享經驗可能幫助球隊，也可能培養取代你的人。`,"teammate",[
  careerStoryChoice("teach","完整分享訓練與比賽筆記","提高隊友成長與信任，自己的獨特優勢可能縮小。","你把多年累積的細節交出去，年輕球員開始真正理解職業節奏。","你第一次把生涯經驗當成可以傳下去的資產。",{iq:2,rep:4,teammateTrust:12,planStatMod:-1}),
  careerStoryChoice("boundaries","只分享恢復與準備方法","願意幫忙，也保留場上競爭所需的界線。","你們建立固定交流，但輪替競爭仍照表現決定。","你選擇成為有界線的老將導師。",{discipline:3,teammateTrust:7,rep:2}),
  careerStoryChoice("compete","告訴他位置只能自己搶","守住競爭心態，也可能失去更衣室領導機會。","訓練強度立刻提高，兩人的關係回到純粹競爭。","你拒絕提早成為只負責教人的老將。",{confidence:3,teammateTrust:-6,bodyLoad:4})
 ]),
 careerStoryNode("veteran_mentor_2","veteran_mentor",2,"veteran",["veteran"],"他真的搶走了一部分時間",`新球季，{teammate} 的成長讓教練重新分配輪替。你先前提供的幫助與現在失去的分鐘同時存在，必須決定如何面對這個具體後果。`,"teammate",[
  careerStoryChoice("accept","接受新分工並帶第二陣容","個人數據下降，領導與球隊穩定性提升。","你不再追討每一分鐘，第二陣容因你的存在變得可靠。","你接受培養後輩也會改變自己的角色。",{rep:5,coachTrust:6,teammateTrust:8,planStatMod:-2}),
  careerStoryChoice("competeFair","要求公平重新競爭","不否定後輩，也不放棄靠表現搶回時間。","教練安排公開競爭，兩人都知道答案只看比賽。","你用公平競爭處理導師與對手的雙重關係。",{confidence:3,coachTrust:2,teammateTrust:3,bodyLoad:4}),
  careerStoryChoice("resent","停止分享並質疑球隊","短期保護自己，破壞此前建立的信任。","更衣室感受到轉變，教練開始把你視為不穩定因素。","你因失去時間而收回曾經給出的幫助。",{rep:-4,coachTrust:-8,teammateTrust:-12})
 ]),
 careerStoryNode("veteran_mentor_3","veteran_mentor",3,"veteran",["veteran"],"球團要你定義下一季的價值",`球隊年度會議把前兩季的帶人效果與輪替變化一起攤開。管理層要你選擇：仍以場上輸出為主、成為雙重角色，或只在需要時提供經驗。這是角色協商，不是年齡到了就退休。`,"frontOffice",[
  careerStoryChoice("dual","維持輪替並正式帶人","同時承擔上場與領導責任，體力管理更重要。","球隊給你明確雙重角色，年輕球員也知道何時能來找你。","你證明老將可以同時競爭與傳承。",{rep:6,iq:2,bodyLoad:3,teamTrust:8}),
  careerStoryChoice("player","只用表現爭取位置","拒絕被提前定義成導師，接受每季重新評估。","球隊尊重你的選擇，輪替不再附帶教學責任。","你要求生涯是否延續仍由能力與表現回答。",{confidence:4,rep:2,teammateTrust:-2}),
  careerStoryChoice("mentor","轉為更明確的板凳領袖","降低出場負荷，讓影響力轉向準備與溝通。","你的上場時間下降，球隊卻把關鍵更衣室責任交給你。","你主動把一部分舞台交給下一代。",{iq:3,rep:5,bodyLoad:-8,planStatMod:-3})
 ]),

 careerStoryNode("national_miss_1","national_miss",1,"national",["college","pro"],"代表隊把你列入觀察名單",`國家隊教練團來訊：目前只是觀察名單，還不是正式徵召。選訓人員會獨立檢查位置需求、健康與聯賽角色，母隊教練無法替你承諾席次。`,"nationalStaff",[
  careerStoryChoice("askReport","要求列出評估條件","可能聽到不舒服的評價，但能得到可執行方向。","你收到明確回饋，下一季的訓練目標不再只是猜測。","你把模糊的代表隊觀察轉成具體改進清單。",{iq:2,discipline:3,confidence:-1}),
  careerStoryChoice("publicGoal","公開說會爭取正式席次","把壓力放到自己身上，也讓代表隊持續注意。","宣言獲得支持，接下來每場表現都會被拿來檢驗。","你公開承擔爭取代表隊席次的目標。",{confidence:4,rep:3,fatigue:2}),
  careerStoryChoice("withdraw","本期不參與後續觀察","把體能留給球隊，也暫時放下國際賽機會。","你說明身體與球隊安排，休賽季計畫回到原有節奏。","你暫時把代表隊觀察放到生涯次要位置。",{health:3,fatigue:-5,rep:-2})
 ]),
 careerStoryNode("national_miss_2","national_miss",2,"national",["college","pro"],"觀察名單被重新檢查",`國家隊教練團再度確認你的球隊角色、健康與可出席時段。訊息依舊沒有報到日期，也沒有球衣號碼；在正式名單公布前，這仍只是一扇半開的門。`,"nationalStaff",[
  careerStoryChoice("camp","收到正式通知就完整參加","先表達可出席，也接受最後仍可能沒有名字。","教練團記下你的完整時段，提醒你繼續等待正式名單。","你讓代表隊知道自己準備好競爭，卻沒有先替結果慶祝。",{rep:2,fatigue:4,confidence:3}),
  careerStoryChoice("managed","正式通知時需要負荷協調","保留健康，也可能降低教練團安排彈性。","你提交可出席範圍，球隊與國家隊只在正式窗口協調。","你沒有放棄觀察，也沒有假裝已經報到。",{health:3,fatigue:2,rep:1}),
  careerStoryChoice("decline","本期不保留可出席時段","保持球隊與健康安排，代表隊不替你預留位置。","教練團記錄你的決定，下一次仍需重新接受評估。","你暫時結束這次觀察，不把它說成正式落選。",{health:4,rep:-2})
 ]),
 careerStoryNode("national_miss_3","national_miss",3,"national",["pro"],"是否繼續等待下一次觀察窗口",`幾個球季的比賽內容與真實徵召紀錄已經留下答案。國家隊教練團只確認你未來是否仍願意接受評估；任何正式席次、出賽與榮譽仍只由國家隊賽事產生。`,"nationalStaff",[
  careerStoryChoice("role","保持所有角色的評估意願","不預設自己已在名單，只要收到正式通知就公平競爭。","教練團保留你的評估紀錄，但沒有承諾下一次席次。","你願意繼續等真正的國家隊窗口。",{rep:3,discipline:3,confidence:2}),
  careerStoryChoice("compete","只在完整競爭條件下參加","保留自我要求，也接受可能一直沒有正式通知。","你的條件被清楚記錄，答案仍交給未來表現。","你寧願繼續等待，也不把觀察名單說成國手資歷。",{confidence:4,fatigue:2,rep:1}),
  careerStoryChoice("close","不再參與後續觀察","結束長期等待，把休賽季完整留給球隊與健康。","教練團關閉這次觀察資料，未來若重啟必須從新評估。","你替這段觀察寫下清楚句點。",{iq:2,health:3,rep:-1})
 ]),

 careerStoryNode("rebuild_core_1","rebuild_core",1,"team",["pro"],"球團邀你成為重建核心",`球團管理層在年度會議說明：年輕陣容需要你的穩定，但短期戰績與個人獎項都可能下降。球團只能承諾目前角色，不能保證重建何時成功。`,"frontOffice",[
  careerStoryChoice("commit","承諾留下兩季","接受輸球與市場曝光下降，換取明確核心責任。","球隊把你列入重建領導群，年輕球員開始圍繞你的節奏成長。","你選擇把生涯時間投進一支尚未成形的球隊。",{teamTrust:10,rep:3,planStatMod:-1}),
  careerStoryChoice("oneYear","只承諾觀察一季","保留離開權利，也讓球團不敢完全圍繞你規劃。","雙方同意一年檢查點，信任與彈性各保留一半。","你願意陪重建，但沒有交出全部選擇權。",{teamTrust:4,agentTrust:3,rep:1}),
  careerStoryChoice("exit","要求轉往競爭球隊","爭取更快的勝利窗口，承擔球迷與更衣室反應。","球團開始聆聽報價，你的領導承諾也被重新檢視。","你拒絕把巔峰等待在不確定的重建裡。",{rep:-3,teamTrust:-10,agentTrust:5})
 ]),
 careerStoryNode("rebuild_core_2","rebuild_core",2,"team",["pro"],"球團交出第一年重建報告",`球團管理層把戰績、年輕球員成長與你的角色一起攤開。第一年沒有立即成功，但現在可以具體檢查當初承諾是否有進展。`,"frontOffice",[
  careerStoryChoice("stayPlan","維持原計畫再走一年","繼續承擔輸球與培養責任，等待陣容真正成熟。","球團沒有大改方向，你仍是更衣室最穩定的標準。","你沒有因第一年失敗就離開重建。",{rep:4,teamTrust:8,discipline:2}),
  careerStoryChoice("demandHelp","要求球團補進即戰力","可能加速競爭，也可能犧牲年輕資產與信任。","管理層開始尋找交易，重建路線轉向更積極。","你要求球團不能只用你的時間等待。",{rep:2,teamTrust:-2,confidence:3}),
  careerStoryChoice("openMarket","通知經紀人準備離隊","保留職業窗口，讓先前承諾承受真正代價。","離隊消息傳出，年輕隊友第一次意識到核心也可能離開。","你把重建承諾交給市場重新評估。",{agentTrust:7,teamTrust:-8,rep:-2})
 ]),
 careerStoryNode("rebuild_core_3","rebuild_core",3,"team",["pro"],"重建進度需要最後一次決定",`第三季開始，球團管理層依照前兩年的戰績、角色與承諾提出新方案。你要決定繼續擔任核心、轉成其他角色，或結束這段合作。`,"frontOffice",[
  careerStoryChoice("finish","留下來完成這段重建","接受結果不保證，以共同成長作為留下理由。","球隊正式把你列為文化核心，續約與角色都圍繞長期價值。","你選擇看完自己參與建立的球隊。",{rep:7,teamTrust:12,confidence:3}),
  careerStoryChoice("supportRole","留下但讓出第一核心","降低個人數據，讓成熟的年輕球員接棒。","權力轉移沒有演成衝突，你成為穩定新核心的老將。","你讓重建完成，也接受主角不一定仍是自己。",{iq:3,rep:6,planStatMod:-3,teammateTrust:8}),
  careerStoryChoice("leave","坦白尋找最後的競爭窗口","不否定共同經歷，也不再延後自己的目標。","球團同意合作找去向，離開不再被包裝成背叛。","你替重建付出時間，也替自己保留下一段路。",{agentTrust:6,teamTrust:-3,rep:1})
 ]),

 careerStoryNode("final_chapter_1","final_chapter",1,"legacy",["veteran"],"球團第一次問你想怎麼安排生涯後段",`這不是退休通知。球團管理層只說未來合約會更短、角色會每年重評，並詢問你想優先追逐冠軍、留在熟悉城市或維持健康。`,"frontOffice",[
  careerStoryChoice("contend","優先尋找爭冠角色","接受上場縮減與搬遷，只保留最高競爭舞台。","經紀人開始把角色與冠軍機會排在薪資之前。","你把生涯後段定義成對冠軍的最後追逐。",{rep:4,agentTrust:5,planStatMod:-2}),
  careerStoryChoice("home","優先留在熟悉球隊與城市","縮小市場，讓關係與歸屬成為續戰條件。","球團知道你的底線，談判不再只看最高報價。","你希望最後幾季留在真正熟悉你的人身邊。",{familyHarmony:8,teamTrust:6,rep:2}),
  careerStoryChoice("health","只在身體允許時續戰","接受休息與短約，拒絕靠硬撐換下一年。","醫療與球隊評估被放進每次決定，健康成為明確門檻。","你讓續戰取決於身體與表現，而不是年齡數字。",{health:6,bodyLoad:-8,discipline:3})
 ]),
 careerStoryNode("final_chapter_2","final_chapter",2,"legacy",["veteran"],"合約真的進入逐年評估窗口",`目前合約已進入最後一年或市場重新評估期，短約與角色下降只是可能性，不是假定已收到的報價。你要先決定下一次正式條件出現時，願意接受到哪裡。`,"agent",[
  careerStoryChoice("accept","願意用一年約繼續競爭","不要求過去功勞換長期保障，等正式條件出現再做決定。","經紀人把一年證明約列入可談範圍，也提醒你每一季都得重新證明。","你接受逐年評估，但沒有被迫離開。",{confidence:3,discipline:2,agentTrust:4}),
  careerStoryChoice("wait","只等待有真實角色的報價","冒著市場關閉風險，不先答應只是湊名單的方向。","經紀人刪除沒有角色說明的可能性，真正報價仍待市場出現。","你不讓任何可能性自動等於續戰價值。",{confidence:2,agentTrust:3,rep:-1}),
  careerStoryChoice("reduce","願意用更小角色換取負荷管理","降低數據上限，以健康和出勤延長競爭窗口。","醫療與經紀團隊記下角色底線，正式合約仍需球隊提出。","你用角色轉折準備生涯後段。",{health:5,bodyLoad:-10,planStatMod:-3,rep:2})
 ]),
 careerStoryNode("final_chapter_3","final_chapter",3,"legacy",["veteran"],"下一季是否續戰，由完整狀態決定",`球季結束前，球團管理層重新檢查巔峰能力、近期表現、出勤、健康與市場需求。答案不只看年齡，也不會因單一能力下降就直接退休。`,"frontOffice",[
  careerStoryChoice("continue","確認仍要接受年度評估","只要能力與身體仍符合，就繼續和所有人競爭。","球隊同意季後重新評估，沒有預設退休日期。","你選擇讓續戰由表現與健康決定。",{confidence:4,discipline:3,bodyLoad:2}),
  careerStoryChoice("oneMoreRole","只接受有意義的最後角色","不為了延長年齡紀錄簽沒有上場可能的合約。","經紀人只保留能提供真實角色的球隊，市場範圍縮小。","你要的是有內容的最後一段，而不是空白名單席次。",{agentTrust:5,rep:3}),
  careerStoryChoice("prepare","開始準備告別，但不立即退休","把生活與身體安排好，仍保留下一季可能。","你完成初步規劃，球隊也知道這可能是最後一次談約。","你開始收束生涯，卻沒有讓單一年齡替你做決定。",{familyHarmony:6,health:3,confidence:1})
 ])
];

const standaloneStory=(id,theme,stages,title,desc,actor,choices,requirements={})=>careerStoryNode(id,"",0,theme,stages,title,desc,actor,choices,requirements);
const CAREER_STORY_STANDALONES=[
 standaloneStory("hbl_captain_vote","school",["hbl"],"隊長票沒有照年資走",`隊內投票前，教練詢問你是否願意承擔溝通責任。隊長不會直接增加能力，卻會讓輸球、練習與同學衝突都先找上你。`,"coach",[
  careerStoryChoice("accept","主動承擔","得到信任，也增加額外責任。","你接受成為隊內溝通窗口。","你在高中第一次承擔正式領導責任。",{rep:3,discipline:2,fatigue:2}),careerStoryChoice("support","支持更適合的隊友","放下頭銜，換取團隊穩定。","你公開支持另一名隊友。","你把隊長位置留給更適合的人。",{teammateTrust:7,iq:1}),careerStoryChoice("decline","專注比賽","減少場外負擔，也失去領導曝光。","你婉拒提名。","你決定先用訓練與比賽證明自己，不承擔隊長職務。",{confidence:1,rep:-1})
 ]),
 standaloneStory("hbl_exam_week","school",["hbl"],"期中考撞上客場週",`班導把請假單推回你面前：補考時段剛好卡到客場出發，提早離校又會缺掉最後一堂複習。校隊窗口在門外等答案，兩邊都不能只靠一句「有比賽」帶過。`,"schoolOffice",[
  careerStoryChoice("study","先完成考試","錯過球隊出發前的戰術會議，必須自行趕往客場。","你完成考試後才趕往客場。","你在學生身分與比賽之間選擇先完成學業。",{iq:2,fatigue:4,rep:-1}),careerStoryChoice("travel","跟隊出發","保住比賽準備，承擔補考與家人壓力。","你完整參與客場準備。","你把重要比賽放在考試之前。",{confidence:2,familyHarmony:-4}),careerStoryChoice("arrange","和老師協調時段","需要主動溝通，兩邊都不完全輕鬆。","老師同意調整考試時間。","你學會為學生球員的雙重責任協調。",{discipline:3,iq:1})
 ]),
 standaloneStory("hbl_bench_friend","friendship",["hbl"],"朋友第一次沒有替你鼓掌",`{friend} 認為你為了搶鏡頭忽略空檔隊友。這句話比教練批評更刺耳，因為他看過你還沒有任何名氣的時候。`,"friend",[
  careerStoryChoice("listen","請他說完","接受難聽但具體的提醒，並一起找出被忽略的傳球回合。","你回看影片並承認幾次錯誤。","你讓朋友可以指出場上的自己。",{iq:2,friendTrust:7,confidence:-1}),careerStoryChoice("defend","解釋戰術安排","保住立場，對話可能停在辯解。","你說明教練要求，氣氛仍有些僵。","你沒有完全接受朋友的批評。",{friendTrust:-2,confidence:2}),careerStoryChoice("angry","叫他別管球隊","切斷外界干擾，也傷到最早的關係。","你們不歡而散。","你因比賽批評推開了朋友。",{friendTrust:-10,rep:1})
 ]),
 standaloneStory("hbl_transfer_rumor","school",["hbl"],"轉學傳聞進到班上",`學校與校隊確認，有其他學校透過熟人探詢你是否願意轉隊，但目前沒有正式保證。留下代表繼續競爭，轉走則要承擔學業、資格與新環境。`,"schoolStaff",[
  careerStoryChoice("stay","明確留下","保住信任，不再測試其他環境。","你向教練說明會完成這段高中生涯。","你關閉轉學探詢，選擇在原校把剩下的競爭走完。",{coachTrust:8,rep:2}),careerStoryChoice("explore","請家人合法了解規則","先蒐集資訊，不做私下承諾。","你們只確認資格與學業影響。","你只透過正式規則比較轉學代價，沒有先答應任何球隊。",{iq:2,familyHarmony:3}),careerStoryChoice("secret","私下答應碰面","得到更多可能，也損害現隊信任。","消息最後仍傳回教練耳中。","你讓轉學探詢成為隊內裂痕。",{coachTrust:-10,confidence:2})
 ]),
 standaloneStory("hbl_social_clip","identity",["hbl"],"一段精華比整場比賽更紅",`社群帳號大量轉發你的高難度進球，但影片沒有放進前面幾次失誤。突然增加的關注可能變成自信，也可能改變你的出手選擇。`,"media",[
  careerStoryChoice("context","分享完整比賽","降低短期熱度，保留真實內容。","你把團隊與失誤也放進說明。","你不讓一段精華取代完整比賽。",{discipline:2,rep:1}),careerStoryChoice("enjoy","接受話題","提高聲量，也增加證明壓力。","追蹤與場邊關注快速增加。","你第一次享受精華帶來的名氣。",{confidence:4,rep:3,fatigue:2}),careerStoryChoice("ignore","完全不回應","維持專注，錯過建立形象的機會。","話題自然降溫。","你沒有追著流量解釋，讓下一場比賽成為唯一回應。",{iq:1})
 ]),
 standaloneStory("hbl_injury_notice","injury",["hbl"],"第一次填傷勢回報",`防護員發現腳踝不適已影響落地。你、家人與高中教練對「可以上場」的標準並不一致，最後必須交由醫療評估決定。`,"medicalTeam",[
  careerStoryChoice("report","完整回報","可能少打比賽，獲得正確處理。","防護員安排檢查與限時。","你第一次把傷勢如實交給醫療判斷。",{health:5,bodyLoad:-6,rep:-1}),careerStoryChoice("manage","要求限時","保留進入名單的機會，同時把上場分鐘與連續對抗設下限制。","教練同意縮短上場。","你在出賽與健康之間選擇折衷。",{health:2,bodyLoad:-2}),careerStoryChoice("hide","隱瞞不適","保住位置，惡化風險提高。","你照常練習，落地動作越來越僵。","你為了高中輪替藏起傷勢。",{rep:2,health:-5,bodyLoad:8})
 ]),

 standaloneStory("college_roommate","college",["college"],"室友把你的鬧鐘放到桌上",`連續第三次被清晨鬧鐘吵醒後，同住室友把它放到你桌上，說深夜影片分析和天亮前的重量訓練已經讓兩個人都睡不好。他不是來談籃球，只想知道這間房還能不能一起住。`,"roommate",[
  careerStoryChoice("schedule","重排共同作息","少一點自由，換取穩定生活。","你們寫下安靜時段。","你學會讓訓練不必犧牲共同生活。",{discipline:3,confidence:1}),careerStoryChoice("move","申請換宿舍","解決衝突，也讓關係自然疏遠。","學校同意調整房間。","你換到新的房間，用居住距離結束這次作息衝突。",{confidence:2,fatigue:1}),careerStoryChoice("insist","維持原安排","保住訓練節奏，摩擦繼續。","宿舍氣氛更緊張。","你把訓練優先放在室友關係之前。",{fatigue:-2,discipline:-3})
 ]),
 standaloneStory("college_major","college",["college"],"主修課程撞上球隊遠征",`系上教授不願讓整學期只靠補交作業，校隊則要求全隊完整參與客場。導師與校隊窗口要你提出真正可執行的安排。`,"schoolOffice",[
  careerStoryChoice("plan","提出提前完成方案","增加短期負擔，保住兩邊承諾。","教授接受具體時程。","你用規劃完成學生與球員責任。",{iq:2,discipline:3,fatigue:4}),careerStoryChoice("team","優先隨隊","維持角色，學業代價增加。","你錯過重要課程。","你把球隊遠征放在主修課之前。",{coachTrust:4,iq:-1}),careerStoryChoice("class","留校上課","保住學業，輪替可能受影響。","你沒有參加完整客場。","你為了課程承擔一次缺席。",{iq:3,coachTrust:-4})
 ]),
 standaloneStory("college_position_switch","coach",["college"],"教練要求你改打第二位置",`{coach} 認為新位置能增加上場時間，卻會讓你花時間重學閱讀與對位。拒絕則繼續在原位置排隊。`,"coach",[
  careerStoryChoice("switch","接受轉位","短期不穩，長期增加多功能性。","你開始學習新的戰術責任。","你在大學主動擴張場上位置。",{iq:2,coachTrust:7,confidence:-1}),careerStoryChoice("hybrid","只在特定陣容嘗試","保留原本主位置，只在指定組合學習新的對位與發動責任。","教練安排有限試驗。","你先用固定陣容測試第二位置，沒有立刻放棄原本定位。",{coachTrust:3,iq:1}),careerStoryChoice("refuse","留在原位置競爭","守住定位，輪替等待更久。","你拒絕改變主要位置。","你選擇在熟悉位置證明自己。",{confidence:3,coachTrust:-5})
 ]),
 standaloneStory("college_alumni","identity",["college"],"校友希望你成為招生招牌",`學校校友會邀請你參與招生影片，內容想把你的故事包裝成「唯一成功路線」。曝光有幫助，卻可能讓其他隊友被忽略。`,"alumniOffice",[
  careerStoryChoice("teamStory","要求加入隊友故事","分散個人曝光，保住團隊真實。","影片改成多人敘事。","你拒絕把大學生涯包裝成單人成功。",{rep:3,teammateTrust:7}),careerStoryChoice("lead","接受主角安排","個人聲量增加，之後的勝敗與校隊形象也會更直接落到你身上。","影片以你的選擇作為主線。","你成為學校招生的代表球員。",{rep:5,fatigue:3}),careerStoryChoice("decline","婉拒拍攝","避免讓校方替你定義成功，也失去一次校外曝光。","校友會改找其他人。","你不願讓學校簡化自己的故事。",{discipline:2,rep:-1})
 ]),
 standaloneStory("college_home_call","family",["college"],"家人要你說清楚籃球這條路",`電話那頭，家人問你為什麼拒絕較穩定的升學或工作方向，繼續追逐一條沒有保證的籃球路。光說「我想試試看」已經不夠，你得把風險與停損點一起說清楚。`,"family",[
  careerStoryChoice("explain","完整說明計畫與停損點","承認職業機會不確定，同時交代期限、備案與願意承擔的代價。","家人知道你不是毫無準備。","你第一次向家人具體解釋籃球生涯。",{familyHarmony:8,iq:2}),careerStoryChoice("promise","保證一定成功","短期安撫，未來壓力更大。","家人暫時放心。","你用無法保證的成功換取支持。",{confidence:2,familyHarmony:2,fatigue:3}),careerStoryChoice("avoid","不再談這件事","停止衝突，也讓距離增加。","通話很快結束。","你把生涯焦慮留在家人看不到的地方。",{familyHarmony:-8,confidence:-1})
 ]),
 standaloneStory("college_draft_feedback","contract",["college"],"球探給了不保證選秀的回饋",`職業球探肯定你的一項能力，卻明說目前沒有任何輪次或順位保證。這只是市場觀察，不是教練承諾；提前投入、留校成長或改走其他聯盟都有不同代價。`,"scout",[
  careerStoryChoice("develop","留校補足弱項","延後收入與舞台，增加準備。","你把回饋寫進下一季計畫。","你沒有把模糊關注當成選秀保證。",{iq:2,discipline:3}),careerStoryChoice("enter","接受風險投入","提早測試市場，可能落選。","你開始準備正式評估。","你接受沒有輪次承諾的現況，選擇立刻讓市場檢驗自己。",{confidence:4,rep:2}),careerStoryChoice("alternate","同步研究其他聯盟","降低單一路線風險，準備成本增加。","你建立多條職業入口。","你不讓選秀成為唯一答案。",{iq:3,fatigue:2})
 ]),

 standaloneStory("pro_rookie_vet","teammate",["pro"],"老將把你的置物櫃移了位置",`隊內老將說這是更衣室的不成文規矩，也是對新人界線的測試。處理方式會影響老將、教練與其他新人對你的第一印象。`,"veteranTeammate",[
  careerStoryChoice("ask","私下問清楚","避開全隊面前的對抗，同時確認這是玩笑、傳統還是刻意排擠。","對方說明這是新人傳統。","你用直接但不羞辱人的方式進入更衣室。",{discipline:2,teammateTrust:5}),careerStoryChoice("accept","照規矩重新整理","快速融入，可能讓界線繼續模糊。","你沒有讓事情擴大。","你先接受職業更衣室的傳統。",{teammateTrust:3,rep:1}),careerStoryChoice("public","當眾搬回去","守住尊嚴，也立刻製造對立。","全隊都注意到衝突。","你在新人年公開拒絕不成文規矩。",{confidence:3,teammateTrust:-8})
 ]),
 standaloneStory("pro_first_agent_meeting","contract",["pro"],"經紀人第一次把帳本攤開",`第一筆職業薪資還沒入帳，{agent} 已把稅務、訓練、保險與家人支援分成四欄。他提醒你，合約上的總額和真正能留下來的錢，從來不是同一個數字。`,"agent",[
  careerStoryChoice("budget","建立保守預算","降低短期享受，增加長期穩定。","你設定固定比例與緊急預備金。","你在第一份職業收入時先建立財務界線。",{discipline:4,agentTrust:6}),careerStoryChoice("invest","投入專業訓練團隊","增加成本，換取成長與恢復。","你把部分收入放回身體與技術。","你把第一份收入的一部分固定投入訓練與恢復資源。",{fatigue:-3,iq:1,financialLosses:60}),careerStoryChoice("spend","先享受第一份收入","提升心情，財務緩衝變少。","你替自己與家人安排慶祝。","你選擇先感受成為職業球員。",{confidence:4,financialLosses:100})
 ]),
 standaloneStory("pro_trade_arrival","team",["pro"],"交易後沒有人替你解釋角色",`新球隊只給了一本戰術手冊，{coach} 尚未承諾上場時間。你可以先融入、立刻談角色，或用訓練逼出答案。`,"coach",[
  careerStoryChoice("learn","先學完整體系","短期曝光低，減少適應錯誤。","你花一週理解所有輪替。","你先讀懂新球隊的輪替與戰術語言，再爭取更大的工作。",{iq:2,coachTrust:5}),careerStoryChoice("meeting","要求角色會議","得到清楚答案，也暴露急切。","教練說明目前只保證競爭。","你讓交易後的角色不再靠猜。",{confidence:2,coachTrust:2}),careerStoryChoice("force","訓練中大量持球","可能快速被看見，也可能破壞體系。","你搶下許多回合，教練反應保留。","你用訓練表現逼新球隊注意。",{rep:2,coachTrust:-4,fatigue:5})
 ]),
 standaloneStory("pro_sponsor_day","identity",["pro"],"商業拍攝排在背靠背之間",`經紀人 {agent} 說贊助商只剩這個檔期，球隊則提醒你身體負荷已偏高。收入、曝光與休息時間無法同時保留。`,"agent",[
  careerStoryChoice("full","完成整日拍攝","拿到完整合作收入，但背靠背之間幾乎沒有真正恢復時間。","活動順利完成。","你用休息時間換取商業曝光。",{careerSalary:120,fatigue:7,rep:2}),careerStoryChoice("short","縮短合作內容","收入下降，保留部分恢復。","品牌接受精簡方案。","你讓商業合作配合球季負荷。",{careerSalary:60,fatigue:2,agentTrust:2}),careerStoryChoice("cancel","取消拍攝","保住健康，承擔合作關係損失。","贊助商改找其他球員。","你取消背靠背之間的合作，把完整時段留給恢復。",{health:3,agentTrust:-4})
 ]),
 standaloneStory("pro_language_room","identity",["pro"],"旅外戰術會議聽漏了一句",`翻譯沒有跟上教練臨時修改，你在場上站錯位置。問題不是能力，而是是否願意承認自己仍需要語言與文化支援。`,"coach",[
  careerStoryChoice("study","安排固定語言課","增加日程，降低長期誤解。","你開始學習戰術常用語。","你為旅外適應投入額外時間。",{iq:2,fatigue:2,coachTrust:4}),careerStoryChoice("teammate","請隊友場上提醒","需要信任隊友即時糾正站位，換取比翻譯更快的比賽溝通。","隊友同意建立暗號。","你讓旅外適應成為團隊合作。",{teammateTrust:6,coachTrust:2}),careerStoryChoice("hide","假裝聽懂","保住面子，錯誤可能重演。","你沒有提出問題。","你因不願承認語言困難留下風險。",{confidence:1,coachTrust:-5})
 ]),
 standaloneStory("pro_union_vote","team",["pro"],"球員代表會議討論賽程負荷",`球員代表通知全隊表決是否共同要求調整密集賽程。不同聯盟的正式組織方式不一樣，但這次討論只針對球員安全與休息安排。`,"playersUnion",[
  careerStoryChoice("support","支持公開訴求","增加集體影響，也承擔球團壓力。","你在會議中投下支持票。","你為球員健康參與集體行動。",{discipline:3,teammateTrust:7,rep:-1}),careerStoryChoice("private","只向球隊內部反映","保留關係，影響範圍較小。","教練團同意調整部分訓練。","你用內部協調處理賽程負荷。",{coachTrust:3,health:2}),careerStoryChoice("abstain","不參與表決","避開和球團正面衝突，也把這次賽程安排的影響力交給其他球員。","你的名字沒有出現在任何一方。","你選擇不介入球員集體議題。",{teammateTrust:-3})
 ]),

 standaloneStory("late_role_offer","veteran",["veteran"],"經紀人問你是否開放賽季後段短期角色",`目前沒有正式報價。{agent} 只是確認：若市場之後真的出現半季傷病替補或輪替保險角色，你願意接受沒有上場保證的競爭，還是只考慮清楚輪替與留隊。`,"agent",[
  careerStoryChoice("accept","開放半季競爭角色","讓經紀人可以接觸短期窗口，但不代表已換隊。","你的市場條件新增短期競爭選項，真正去向仍等正式報價。","你願意承擔老將市場的不確定席次。",{rep:2,agentTrust:4}),careerStoryChoice("terms","只接受有最低角色說明的方向","縮小可能性，保住角色意義。","經紀人記下底線，不替任何球隊保證上場。","你不願只為名單身分換隊。",{agentTrust:3,confidence:2}),careerStoryChoice("decline","不開放短期轉隊窗口","維持目前球隊與生活，不把想像中的機會當成報價。","經紀人關閉短期搜尋，你繼續履行目前安排。","你把穩定放在尚未出現的季後賽可能之前。",{teamTrust:5,rep:-1})
 ]),
 standaloneStory("late_body_warning","injury",["veteran"],"恢復速度第一次明顯慢了一週",`同樣的痠痛過去三天就消失，這次卻拖到第二週。球隊醫療團隊提醒你，老化不是單一能力突然崩落，而是恢復、負荷與出勤一起改變。`,"medicalTeam",[
  careerStoryChoice("adjust","調整年度負荷","降低數據上限，保住健康。","訓練量與連續出賽被重新安排。","你接受恢復速度已經改變。",{health:6,bodyLoad:-10,planStatMod:-2}),careerStoryChoice("specialize","刪去高負荷訓練","保留核心技術，放棄部分全面性。","課表只留下最重要內容。","你用專項維持老將競爭力。",{iq:2,bodyLoad:-6}),careerStoryChoice("ignore","照舊完成課表","維持和年輕球員相同的訓練量，讓尚未消退的痠痛繼續累積。","你沒有更動訓練。","你拒絕因恢復變慢調整節奏。",{confidence:2,bodyLoad:10,health:-4})
 ]),
 standaloneStory("late_family_calendar","family",["veteran"],"家人第一次討論退役後的生活",`家人不是催你退休，只是開始討論未來城市與生活。你仍可能續戰，但必須讓家人知道這份不確定會持續多久。`,"family",[
  careerStoryChoice("plan","一起做兩套計畫","同時保留續戰與離場可能。","你們寫下不同情境的安排。","你讓家人參與生涯後段的不確定。",{familyHarmony:10,iq:2}),careerStoryChoice("wait","等合約結果再談","減少當下焦慮，所有安排延後。","討論暫時停止。","你把生活決定留給市場先回答。",{familyHarmony:-3,confidence:1}),careerStoryChoice("promiseYear","保證只再打一季","給家人答案，也可能和市場、身體狀況衝突。","家人開始依照最後一年準備。","你提前替生涯設定一個承諾。",{familyHarmony:6,confidence:2})
 ]),
 standaloneStory("late_fan_chant","legacy",["veteran"],"客場球迷也喊了你的名字",`比賽最後幾分鐘，對手主場先有人喊出你的名字，接著整片看台站了起來。你仍穿著球衣、下一個回合仍要防守，但這份來自客場的尊重很可能只出現一次。`,"fans",[
  careerStoryChoice("acknowledge","向全場致意","接受這個瞬間，不宣告結束。","你舉手回應掌聲。","你接受球迷對長年生涯的尊重。",{rep:5,confidence:3}),careerStoryChoice("compete","下一回合全力回應","不把掌聲當成告別，立刻用防守與跑動證明自己仍在比賽裡。","你立刻投入下一次攻防。","你提醒所有人自己仍在競爭。",{confidence:4,bodyLoad:3}),careerStoryChoice("ignore","不回應鏡頭","避免話題，可能顯得冷淡。","比賽照常結束。","你拒絕讓掌聲替自己宣布終點。",{discipline:2,rep:-1})
 ]),
 standaloneStory("late_youth_camp","veteran",["veteran"],"母校邀你回去帶一天訓練",`母校校隊邀你在休賽季帶一天訓練。學生準備了一堆冠軍問題，你卻在白板上先寫下三個題目：受傷、坐板凳，以及下一份合約沒有來時怎麼繼續。`,"almaMater",[
  careerStoryChoice("honest","分享完整失敗與復原","降低英雄包裝，留下真實經驗。","學生問的問題比預期更深入。","你把不華麗的生涯經驗帶回起點。",{rep:5,iq:2,fatigue:2}),careerStoryChoice("skills","只帶技術課","內容實用，避開私人故事。","訓練營專注基本動作。","你用技術而非故事回饋母校。",{rep:3,discipline:2}),careerStoryChoice("decline","保留休息時間","保護身體，錯過一次傳承。","活動改邀其他球員。","你在老將休賽季仍先照顧恢復。",{health:4,rep:-1})
 ]),
 standaloneStory("late_contract_physical","contract",["veteran"],"續約前的體檢比談薪更久",`球隊逐項檢查舊傷、恢復速度與出勤預測。高評價與過去獎項仍有價值，但不能單獨跳過健康與近期表現。`,"agent",[
  careerStoryChoice("share","提供完整醫療資料","提高透明度，也讓球隊看見所有風險。","體檢報告完整進入談判。","你讓續約建立在真實健康資訊上。",{agentTrust:6,discipline:3,rep:1}),careerStoryChoice("second","尋求第二醫療意見","增加成本，可能修正過度保守判斷。","另一組醫師提出負荷方案。","你用第二意見爭取合理續戰條件。",{health:2,financialLosses:40,agentTrust:3}),careerStoryChoice("hide","淡化舊傷","可能保住報價，若被發現會失去信任。","球隊要求追加檢查。","你試圖用過去表現蓋過健康疑問。",{agentTrust:-7,confidence:2})
 ]),

 // HBL：補足板凳、家庭、校務、隊友與傷後回歸，避免學生階段只剩球探與考試。
 standaloneStory("hbl_bench_role","coach",["hbl"],"連續幾場坐在板凳末端",`最近幾場你都在比賽早早失去輪替。{coach} 沒有用「再等等」敷衍，而是列出防守溝通、失誤控制與訓練態度三個重新上場的條件。`,"coach",[
  careerStoryChoice("criteria","要求每週檢查一次條件","進度更透明，也必須接受每項缺點被攤開。","教練把三項標準寫進訓練紀錄。","你讓板凳期變成可追蹤的競爭。",{coachTrust:5,discipline:3}),careerStoryChoice("specialize","先搶一項明確任務","縮小角色，較容易重新進入輪替。","你開始專練防守與無球跑位。","你用一項可靠工作重新敲門。",{defense:1,coachTrust:4}),careerStoryChoice("complain","認為自己根本沒得到機會","替自己發聲，也可能讓教練覺得你逃避問題。","談話在彼此不服氣的情況下結束。","你把板凳問題變成一次正面衝突。",{confidence:2,coachTrust:-7})
 ],{minGames:3,maxMins:14}),
 standaloneStory("hbl_family_away_cost","family",["hbl"],"家人算起每一趟客場的費用",`交通、住宿與請假累積成一筆不小的支出。家人仍支持你打球，但希望知道哪些比賽真的需要全家到場，哪些可以改用其他方式陪伴。`,"family",[
  careerStoryChoice("plan","一起排出重要比賽","減少臨時支出，也讓家人知道何時最需要出現。","你們把整季行程分成現場與遠端支持。","你第一次把家人的付出納入球季計畫。",{familyHarmony:8,discipline:2}),careerStoryChoice("earn","自己負擔部分費用","增加生活壓力，減少家人的經濟負擔。","你開始管理零用與交通支出。","你決定替自己的籃球路承擔一部分成本。",{discipline:3,fatigue:2}),careerStoryChoice("insist","要求每場都到","得到熟悉的看台支持，也放大家庭負擔。","家人答應繼續到場，談話卻沒有真正結束。","你把當下的安心放在家庭壓力之前。",{confidence:3,familyHarmony:-6})
 ],{minCareerSeason:1}),
 standaloneStory("hbl_team_duty","school",["hbl"],"校隊把器材整理交給你",`學校與校隊發現練習後的球衣、球具與紀錄總是沒有人收尾。這不是明星工作，卻能看出誰願意照顧一支球隊的日常。`,"schoolStaff",[
  careerStoryChoice("organize","建立輪值表","多花時間協調，讓責任不再落在固定幾個人身上。","全隊開始照表完成收尾。","你用不起眼的工作改善校隊日常。",{discipline:4,teamTrust:5}),careerStoryChoice("finish","這次自己全部做完","立刻解決問題，但沒有改變長期習慣。","器材室恢復整齊，下一次仍可能重演。","你先替球隊收下這次混亂。",{discipline:2,fatigue:2}),careerStoryChoice("refuse","認為這不該由球員處理","守住訓練時間，也讓隊友覺得你只願意做看得見的事。","校隊改找其他人處理。","你把器材整理留給其他人，也失去一次建立隊內信任的機會。",{teamTrust:-6,confidence:1})
 ],{minCareerSeason:1}),
standaloneStory("hbl_younger_teammate","teammate",["hbl"],"學弟在練習後等你留下",`一名校隊學弟問你怎麼面對第一次被教練當眾責備。他不是要你替他說話，只想知道自己明天還該不該第一個走進球館。`,"youngerTeammate",[
  careerStoryChoice("practice","陪他把問題練一次","犧牲休息，讓建議回到具體動作。","你們把被責備的回合重新走完。","你用一次陪練告訴學弟怎麼留下來。",{teammateTrust:8,fatigue:3}),careerStoryChoice("story","告訴他自己也曾經歷過","不替他解決問題，讓他知道挫折不是只有自己。","他聽完後決定隔天照常提早報到。","你把自己的失敗變成學弟的參考。",{teammateTrust:6,rep:2}),careerStoryChoice("coach","叫他直接去問教練","答案最直接，也可能讓他覺得你不願意幫忙。","他獨自走向教練辦公室。","你把問題交回真正能決定輪替的人。",{discipline:2,teammateTrust:-2})
 ],{minGrade:2}),
 standaloneStory("hbl_local_interview","identity",["hbl"],"地方媒體想拍你的一天",`一段好表現讓地方媒體提出跟拍邀請，內容會從上課、訓練一路拍到回家。曝光可能讓更多人認識你，也會把同學與家人的生活一起放進鏡頭。`,"media",[
  careerStoryChoice("team","只拍校隊訓練","降低個人篇幅，保留同學與家人隱私。","報導改以球隊準備為主。","你讓第一次專訪先從團隊開始。",{rep:3,teamTrust:4}),careerStoryChoice("full","接受完整跟拍","提高知名度，也讓私人生活受到檢視。","影片播出後，更多人開始認得你。","你第一次把完整日常交給鏡頭。",{rep:5,fatigue:3}),careerStoryChoice("decline","婉拒這次拍攝","保住生活界線，錯過一次被看見的機會。","媒體改做一般賽事報導。","你沒有讓一次好表現立刻改變生活。",{discipline:2,rep:-1})
 ],{minRep:3}),
 standaloneStory("hbl_return_practice","injury",["hbl"],"傷後第一次回到全隊對抗",`醫療團隊允許你恢復部分對抗，但落地、變向與連續回合仍有限制。隊友已經習慣新的輪替，你不能只靠一句「我好了」拿回原位置。`,"medicalTeam",[
  careerStoryChoice("stages","照恢復階段增加對抗","回歸較慢，降低再次離場風險。","你完成限時對抗，身體反應穩定。","你讓回歸速度服從真正的恢復。",{health:5,bodyLoad:-5}),careerStoryChoice("role","先接受替補角色","保留出賽感，也承認輪替已經改變。","你從短時間上場重新累積信任。","你沒有把傷前位置當成理所當然。",{coachTrust:5,confidence:1}),careerStoryChoice("full","要求立刻完整對抗","有機會快速搶回位置，也可能讓不適重新出現。","你撐完整堂訓練，結束後腳步明顯沉重。","你選擇用一次高風險訓練證明自己。",{confidence:4,bodyLoad:9,health:-3})
 ],{medicalConcern:true}),
 standaloneStory("hbl_private_training","coach",["hbl"],"私人訓練內容和校隊要求衝突",`休賽日教練發現你在外部訓練反覆練習高難度持球，但校隊正要求你加強無球與防守。兩套課表都可能有用，問題是身體與時間無法同時承受。`,"coach",[
  careerStoryChoice("combine","請雙方共同調整課表","需要公開自己的弱點，換取一致方向。","校隊與外部訓練留下彼此不衝突的內容。","你讓兩套訓練第一次指向同一個目標。",{iq:2,coachTrust:6,bodyLoad:-3}),careerStoryChoice("school","暫停外部訓練","守住校隊角色，放慢個人招牌技術。","你把休賽日改成交代的團隊課表。","你把目前球隊需要放在個人想像之前。",{coachTrust:7,teamTrust:3}),careerStoryChoice("private","維持原本私人課表","保留個人方向，也增加負荷與教練疑慮。","你繼續兩邊訓練，身體恢復時間被壓縮。","你選擇自己決定成長方向。",{confidence:3,coachTrust:-5,bodyLoad:7})
 ],{minCareerSeason:1}),
 standaloneStory("hbl_graduation_plan","school",["hbl"],"畢業前，學校要你提出下一步",`導師與校隊窗口把升學、留在台灣和旅外準備分開列出。現在沒有任何職業保證，這次會議只要求你把申請期限、課業資格與備案說清楚。`,"schoolOffice",[
  careerStoryChoice("multiple","同時準備兩條路線","工作增加，避免把未定邀請當成唯一出口。","你完成主要申請，也保留一條備案。","你沒有讓一次球探關注決定全部未來。",{iq:3,discipline:3,fatigue:3}),careerStoryChoice("basketball","集中準備最高籃球舞台","資源更集中，落空時選擇也更少。","你把訓練與資料全投向首選方向。","你願意承擔單一路線的風險。",{confidence:4,rep:2}),careerStoryChoice("study","先確保一般升學資格","降低籃球準備量，保住學業出口。","導師協助完成申請與考試安排。","你替籃球之外保留可走的路。",{iq:4,coachTrust:-2})
 ],{minGrade:3}),
 standaloneStory("hbl_teammate_starter","teammate",["hbl"],"同位置隊友先拿到先發",`{teammate} 在最近幾場比賽比你穩定，教練因此先把名字寫進先發。你們仍每天一起練球，競爭已經從想像變成清楚的順位。`,"teammate",[
  careerStoryChoice("study","請他一起看兩人的比賽影片","可能學到對方優勢，也必須放下面子。","你們把彼此回合逐一比較。","你用合作理解自己為何落後。",{iq:2,teammateTrust:7}),careerStoryChoice("compete","訓練中正面挑戰位置","提高競爭強度，也可能傷害配合。","每次分組對抗都變得更激烈。","你決定直接用訓練搶回先發。",{confidence:4,fatigue:4,teammateTrust:-3}),careerStoryChoice("role","改搶第二陣容主導權","暫時放下先發，建立另一種上場價值。","教練開始讓你帶替補陣容。","你沒有讓先發兩字限制自己的角色。",{coachTrust:5,teamTrust:3})
 ],{minGames:4,maxMins:22}),

 // 大學：加入資源、生活、轉校、學業與最後一年，讓升學階段不只反覆談選秀。
 standaloneStory("college_support_review","college",["college"],"球隊資源要重新分配",`校方檢查住宿、訓練與學業支援，要求每名球員說明自己真正需要的項目。資源有限，拿走更多也代表另一名隊友得到更少。`,"schoolOffice",[
  careerStoryChoice("medical","優先爭取恢復資源","保住身體，減少其他個人支援。","學校替你安排較完整的恢復時段。","你把有限資源先放在維持出勤。",{health:4,bodyLoad:-5}),careerStoryChoice("academic","優先保留課業協助","降低資格風險，壓縮額外訓練。","導師替你排出固定輔導時間。","你先守住學生球員的資格。",{iq:3,fatigue:2}),careerStoryChoice("share","提議按需求輪替使用","自己不一定永遠優先，整隊更容易接受。","支援改成可申請的輪值方式。","你沒有把球隊資源當成個人待遇。",{teamTrust:6,discipline:2})
 ],{minCareerSeason:3}),
 standaloneStory("college_work_shift","family",["college"],"生活費和夜間工作撞上訓練",`本學期的生活支出增加，你找到一份晚間工作，但下班時間會壓縮睡眠與恢復。家人能提供一部分協助，卻無法替你承擔整個學期。`,"family",[
  careerStoryChoice("hours","只接固定少量班次","收入有限，至少保住主要訓練。","你把工作排在沒有比賽的晚上。","你用明確上限兼顧生活與球季。",{discipline:3,fatigue:3}),careerStoryChoice("support","接受家人短期支援","降低工作負荷，也增加對家庭的依賴。","家人協助度過這個學期。","你願意在需要時接受家人的幫助。",{familyHarmony:7,health:2}),careerStoryChoice("full","照原計畫增加工時","減輕經濟壓力，睡眠與訓練品質下降。","你完成更多班次，練習時開始明顯疲累。","你用恢復時間換取生活費。",{fatigue:8,bodyLoad:4,discipline:1})
 ],{minCareerSeason:3}),
 standaloneStory("college_transfer_contact","school",["college"],"另一所學校正式詢問轉校意願",`校隊窗口收到符合規定的轉校詢問，對方只承諾競爭機會，沒有保證先發。留下有熟悉體系，離開則要重新確認學分、資格與角色。`,"schoolOffice",[
  careerStoryChoice("information","先取得完整書面資訊","不急著表態，把資格與角色問清楚。","學校協助整理學分與參賽規定。","你沒有把一句有興趣當成承諾。",{iq:3,discipline:2}),careerStoryChoice("stay","直接表態留校","關閉轉校可能，鞏固目前信任。","教練知道你會完成下一季。","你選擇在熟悉環境繼續競爭。",{coachTrust:7,teamTrust:4}),careerStoryChoice("visit","依規定安排參訪","保留新機會，也讓現隊知道你正在評估離開。","你完成參訪，兩邊角色差異變得清楚。","你讓轉校從傳聞變成一次正式比較。",{confidence:3,coachTrust:-4})
 ],{minCareerSeason:4}),
 standaloneStory("college_teammate_exit","teammate",["college"],"隊友決定不再繼續校隊生涯",`{teammate} 說自己要把時間留給課業與生活。他不是受傷，也不是被迫離隊；只是第一次承認，籃球不再是他願意支付全部代價的選擇。`,"teammate",[
  careerStoryChoice("listen","陪他把原因說完","不勸留，也不急著替他的決定下結論。","你們談到深夜，最後沒有爭論誰比較勇敢。","你學會尊重同行者選擇不同終點。",{teammateTrust:9,iq:2}),careerStoryChoice("askStay","請他再給球隊一季","可能留住熟悉隊友，也可能讓他更難離開。","他答應再和教練談一次。","你試著替這段隊友關係爭取更多時間。",{teammateTrust:4,teamTrust:3}),careerStoryChoice("distance","把注意力放回剩下的人","快速處理輪替，不介入他的生活選擇。","球隊開始重新分配位置。","你用職業式界線面對隊友離開。",{discipline:3,teammateTrust:-4})
 ],{minCareerSeason:4}),
 standaloneStory("college_rehab_class","injury",["college"],"復健時段撞上必修課",`醫療團隊安排的治療只有一個空檔，剛好與不能再缺席的必修課重疊。延後治療會影響回歸，繼續缺課則可能失去學分。`,"medicalTeam",[
  careerStoryChoice("coordinate","要求學校與醫療共同協調","花時間說明，避免兩邊互相推責。","導師同意讓你補課，治療照常進行。","你讓傷後回歸與課業第一次共用同一份計畫。",{health:4,iq:2,discipline:2}),careerStoryChoice("rehab","優先完成治療","保住恢復進度，承擔課業後果。","你完成治療，也收到缺課警告。","你把身體放在這次必修課之前。",{health:5,iq:-1}),careerStoryChoice("class","先去上課","守住學分，恢復時間向後延。","治療改排到更晚的日期。","你為學生身分延後一次復健。",{iq:3,bodyLoad:4})
 ],{medicalConcern:true}),
 standaloneStory("college_campus_attention","identity",["college"],"校園裡開始有人認得你",`連續幾場好表現後，你在餐廳與教室都被要求合照。關注還不到明星程度，卻已經足以改變你和同學相處的方式。`,"media",[
  careerStoryChoice("normal","照常和同學生活","保留原本關係，也必須學會拒絕部分打擾。","你仍坐回原本的位置，只訂出簡單界線。","你沒有讓一段好表現改變所有日常。",{confidence:3,rep:2}),careerStoryChoice("public","主動經營校園曝光","增加人氣與責任，私人時間減少。","更多活動開始邀請你出席。","你把校園關注轉成自己的公開身分。",{rep:5,fatigue:3}),careerStoryChoice("hide","刻意避開公共場所","降低打擾，也讓同學覺得你突然疏遠。","你的行程變得更封閉。","你用距離保護專注與隱私。",{discipline:2,rep:-1})
 ],{minRep:5}),
 standaloneStory("college_summer_roster","coach",["college"],"暑期代表隊只剩最後一個名額",`{coach} 說暑期賽事不會決定正式球季先發，但能讓你測試新角色。參加會壓縮休息，退出則把機會留給其他隊友。`,"coach",[
  careerStoryChoice("join","參加並接受新位置","增加比賽經驗，也提高全年負荷。","你在暑期陣容嘗試第二位置。","你用休賽季測試新的場上可能。",{iq:2,coachTrust:5,bodyLoad:6}),careerStoryChoice("limited","只參加前段集訓","保留部分測試，也保住後段休息。","教練同意設定出賽上限。","你沒有把暑期機會變成另一個完整球季。",{coachTrust:3,health:2}),careerStoryChoice("rest","退出名單完整休養","保護身體，失去一次角色實驗。","最後名額交給另一名隊友。","你把恢復放在額外曝光之前。",{health:5,bodyLoad:-6,rep:-1})
 ],{minHealth:75}),
 standaloneStory("college_final_year_plan","college",["college"],"最後一學年不能只等球季回答",`導師提醒你，畢業、職業測試與可能的返校都各有期限。球探回饋仍不是合約，你必須在球季結束前準備至少一條可執行的下一步。`,"schoolOffice",[
  careerStoryChoice("pro","集中準備職業測試","提高市場準備，壓縮其他安排。","你完成影片、體測與聯絡資料。","你把最後一年押在職業入口。",{confidence:4,rep:2,fatigue:3}),careerStoryChoice("dual","同時準備職業與畢業方案","工作最多，但不讓一次落選清空方向。","兩套資料都在期限前完成。","你替最後一年保留兩個出口。",{iq:4,discipline:3,fatigue:4}),careerStoryChoice("degree","先完成畢業與資格","降低市場投入，確保學位。","你把最後一學期課程排到最優先。","你沒有讓籃球不確定性拖走畢業。",{iq:5,rep:-1})
 ],{minGrade:4}),
 standaloneStory("college_rotation_data","coach",["college"],"教練把你的上場回合拆成四類",`{coach} 沒有只看場均數據，而是把主控、無球、防守與收官回合分開比較。結果顯示你在一種角色明顯更有效，卻不一定是最想打的位置。`,"coach",[
  careerStoryChoice("efficient","接受最有效率的角色","短期更容易上場，個人定位變得集中。","教練增加你在該組合的時間。","你讓實際回合決定本季角色。",{coachTrust:7,discipline:2}),careerStoryChoice("trial","要求一個月測試另一角色","得到證明空間，也必須接受明確檢查點。","教練安排有限回合讓你測試。","你用可驗證的期限爭取理想位置。",{confidence:3,coachTrust:3}),careerStoryChoice("reject","認為數據忽略自己的上限","保留自我判斷，教練對配合度產生疑問。","會議沒有形成新的輪替方案。","你拒絕讓目前效率定義全部能力。",{confidence:3,coachTrust:-6})
 ],{minGames:6}),

 // 職業：補足輪替、球團、球迷、交易傳聞、旅外生活與國家隊身分衝突。
 standaloneStory("pro_rotation_cut","coach",["pro"],"輪替縮減後，教練給出兩週期限",`最近的上場時間已經跌出主要輪替。{coach} 說兩週內會重新檢查防守執行、失誤和訓練狀態，沒有承諾你一定能回來。`,"coach",[
  careerStoryChoice("details","逐項確認評估標準","壓力更明確，也避免最後只得到模糊答案。","教練把三項指標寫進兩週計畫。","你讓輪替競爭有了可驗證的期限。",{coachTrust:5,iq:2}),careerStoryChoice("specialist","只搶一個穩定任務","降低全面表現要求，爭取固定席次。","你開始專注對位與第二陣容工作。","你先以防守與第二陣容工作爭回一個可被檢查的輪替位置。",{defense:1,teamTrust:4}),careerStoryChoice("market","請經紀人留意外部機會","保留出口，也可能讓球隊更快轉向其他人。","經紀人開始了解市場，但沒有宣稱已有報價。","你在角色下降時先保留選擇。",{agentTrust:5,coachTrust:-4})
 ],{minGames:8,maxMins:18}),
 standaloneStory("pro_new_star_arrival","team",["pro"],"球團簽下和你位置重疊的新核心",`球團管理層說補強是為了提高上限，但新球員需要的球權與收官位置正是你原本的工作。沒有人宣布你降級，角色競爭卻已經開始。`,"frontOffice",[
  careerStoryChoice("fit","主動提出共存方案","降低個人球權，爭取同場價值。","教練開始測試你們共同上場。","你先尋找兩名核心能否一起贏球。",{iq:2,teamTrust:6,rep:1}),careerStoryChoice("compete","要求角色照表現決定","保留主導權，球隊內部比較會被放大。","訓練與每場數據都成為角色證據。","你拒絕在競爭開始前退讓。",{confidence:4,teamTrust:-2,fatigue:3}),careerStoryChoice("clarify","要求球團說清長期規劃","得到方向，也可能聽到不理想答案。","管理層承認下季會依兩人的適配重新談角色。","你不讓重大補強只留下公關說法。",{agentTrust:3,teamTrust:2})
 ],{roles:["core","starter"]}),
 standaloneStory("pro_community_day","identity",["pro"],"社區活動裡有人問的不是比分",`球隊社區部安排你探訪一所學校。學生沒有問冠軍，而是問坐板凳、被交易與受傷時怎麼面對。這場活動不會增加場均數據，卻會留下另一種球員形象。`,"communityOffice",[
  careerStoryChoice("honest","分享一次真正的低潮","降低英雄包裝，讓活動更接近真實生涯。","學生開始問恢復與選擇，而不是只問勝負。","你讓公開活動容得下失敗。",{rep:5,iq:2}),careerStoryChoice("skills","把時間留給籃球教學","內容直接實用，避開私人經歷。","活動變成完整的基礎訓練課。","你用技術完成這次社區責任。",{rep:3,discipline:2}),careerStoryChoice("shorten","縮短活動回去恢復","保住身體，球隊社區部必須臨時改流程。","你提早離開並完成恢復課表。","你在密集球季把身體放在活動之前。",{health:3,teamTrust:-2})
 ],{minRep:6}),
standaloneStory("pro_old_fan_letter","identity",["pro"],"一封球迷來信只寫了你坐板凳的那年",`一名長期球迷沒有提你的代表作，只寫下你失去輪替時仍最早進場熱身的那段日子。他想要一個簽名，但沒有要求公開見面或宣傳。`,"fans",[
  careerStoryChoice("reply","親手回信說明那段低潮","花時間回看不光鮮的經歷，也讓支持不只停在數據。","球迷收到一封沒有公關語氣的回覆。","你承認坐板凳的那年也是生涯的一部分。",{rep:5,confidence:2}),careerStoryChoice("invite","請球隊安排一場主場見面","把私人支持帶進正式流程，也避免擅自承諾。","球隊確認場次後安排簡短見面。","你透過球隊回應一名長期支持者。",{rep:4,teamTrust:2,fatigue:1}),careerStoryChoice("keep","把信收進置物櫃","不讓故事變成宣傳，提醒自己有人記得低潮期。","那封信留在你每天準備比賽的位置。","你選擇把這份支持留在私人空間。",{confidence:4,discipline:1})
],{minCareerSeason:5,minRep:4}),
 standaloneStory("pro_trade_rumor","contract",["pro"],"交易截止日前只有詢問，沒有正式報價",`{agent} 確認其他球隊曾詢問你的狀況，但母隊沒有接受條件，也沒有告知你會被交易。現在能決定的只有是否要求說明、保持沉默或主動表態。`,"agent",[
  careerStoryChoice("meeting","要求球團說明目前立場","得到可用資訊，也讓管理層知道你在意去向。","球團承認曾聽取詢問，但尚未決定交易。","你把傳聞帶回真正能回答的人。",{agentTrust:4,teamTrust:1}),careerStoryChoice("quiet","不回應任何傳聞","維持球隊節奏，去向仍不透明。","截止日前你照常訓練與出賽。","你沒有把尚未成立的交易當成事實。",{discipline:3,teamTrust:3}),careerStoryChoice("public","公開表示希望留下或離開","迫使市場回應，也縮小球團轉圜空間。","你的發言成為截止日前的主要新聞。","你用公開立場改變交易談判。",{rep:2,teamTrust:-6,confidence:2})
 ],{contractMinRemaining:1,contractMaxRemaining:2}),
 standaloneStory("pro_recovery_lab","injury",["pro"],"球隊提出新的恢復監測方案",`醫療團隊希望用睡眠、落地負荷與連續出賽資料調整課表。方案能提早看見風險，也代表你的休息與訓練會被更精密地管理。`,"medicalTeam",[
  careerStoryChoice("full","接受完整監測","失去部分自由，獲得最完整的負荷調整。","醫療團隊開始依每日資料修改課表。","你用更多身體資訊換取較低風險。",{health:5,bodyLoad:-8,discipline:2}),careerStoryChoice("limits","只提供訓練與比賽資料","保留私人界線，風險判斷較有限。","球隊接受縮小版方案。","你在醫療管理與生活隱私間畫出界線。",{health:3,teamTrust:2}),careerStoryChoice("decline","維持原本恢復方式","保住自主，球隊無法替累積負荷提早預警。","你繼續依身體感覺安排恢復。","你拒絕讓監測資料決定每天狀態。",{confidence:2,bodyLoad:5})
 ],{medicalConcern:true}),
 standaloneStory("pro_overseas_family_visit","family",["pro"],"家人第一次來看你的旅外日常",`家人排出短暫假期來到你目前的城市，卻碰上連續客場。你可以調整私人行程、請他們跟著客場移動，或承認這趟見面大多只能在飯店與機場完成。`,"family",[
  careerStoryChoice("restDay","保留唯一休息日陪家人","關係得到真正時間，恢復課表必須縮短。","你們在沒有比賽的一天重新熟悉彼此生活。","你替旅外關係保留一個完整日子。",{familyHarmony:10,fatigue:3}),careerStoryChoice("road","安排一段客場同行","讓家人看見真實賽程，也增加交通與費用。","他們跟著完成一段客場移動。","你沒有把旅外生活只講成主場比賽。",{familyHarmony:7,financialLosses:50,fatigue:2}),careerStoryChoice("schedule","照原賽程，改用短暫見面","保住工作與恢復，這趟相聚仍很零碎。","你們只在出發前和返隊後見到幾小時。","你讓職業賽程決定這次家庭相聚的形狀。",{discipline:3,familyHarmony:-2})
 ],{overseas:true,minCareerSeason:5}),
 standaloneStory("pro_opponent_scheme","coach",["pro"],"對手連續兩場用同一招限制你",`球隊影片顯示，對手開始固定放掉一個區域並封鎖你的主要路線。{coach} 要你決定：立刻改變出手、用傳球破解，還是相信招牌打法仍能打穿。`,"coach",[
  careerStoryChoice("counter","重新設計進攻起點","增加閱讀負擔，讓對手難以照舊預判。","教練把你移到不同位置發動。","你用戰術變化回應聯盟的針對。",{iq:2,coachTrust:5}),careerStoryChoice("pass","優先找到被放空的隊友","犧牲個人出手，逼對手停止包夾。","隊友開始從你的傳球得到空檔。","你讓對手為過度針對付出代價。",{pass:1,teamTrust:5}),careerStoryChoice("attack","繼續用原本強項硬打","成功能守住招牌，失敗會讓限制方式更加確立。","你在下一場大量挑戰同一種防守。","你決定用最熟悉的打法正面破局。",{confidence:4,fatigue:4,coachTrust:-2})
 ],{minGames:8,minMins:18}),
 standaloneStory("pro_national_return","national",["pro"],"回到母隊後，國家隊角色沒有一起回來",`你已經有成人代表隊紀錄，但回到俱樂部後，球權與戰術責任仍由母隊決定。國家隊教練團提醒你，兩套角色不同，不能拿一次徵召要求球隊照搬。`,"nationalStaff",[
  careerStoryChoice("separate","分開準備兩套角色","增加學習量，避免彼此互相干擾。","你為國家隊與母隊各自整理比賽任務。","你接受代表隊身分不會自動改寫俱樂部順位。",{iq:3,discipline:2}),careerStoryChoice("share","把國家隊影片帶回球隊討論","可能找到可用內容，也可能被認為拿外部經歷施壓。","教練同意試用其中一套配合。","你讓兩段比賽經驗有機會互相幫助。",{coachTrust:3,rep:2}),careerStoryChoice("status","要求符合國手身分的角色","提高談判壓力，球隊仍只看目前適配。","教練拒絕以徵召直接決定輪替。","你試圖把國家隊認可帶進母隊角色談判。",{confidence:3,coachTrust:-6})
 ],{hasNationalCaps:true}),

 // 老將：讓生涯後段仍有競爭、關係與生活事件，不把每一題都寫成退休通知。
 standaloneStory("late_practice_schedule","veteran",["veteran"],"教練讓你自己選擇本週訓練量",`{coach} 提供完整對抗、部分參與與個別恢復三種安排。這不是特殊待遇，而是要你用比賽角色、身體反應與下一場需求負責任地選擇。`,"coach",[
  careerStoryChoice("full","參加完整對抗","維持競爭節奏，也承擔較高恢復成本。","你完成全隊訓練，狀態仍能跟上。","你用完整課表證明自己仍在競爭。",{confidence:3,bodyLoad:6,coachTrust:2}),careerStoryChoice("partial","只參與戰術與限時對抗","保留球場感，減少不必要碰撞。","你完成主要戰術內容後離場恢復。","你用選擇性訓練維持角色。",{health:3,bodyLoad:-3,discipline:2}),careerStoryChoice("recovery","改做個別恢復","最大化身體準備，短期離開團隊節奏。","醫療團隊接手整天課表。","你把下一場可用性放在本週訓練曝光之前。",{health:5,bodyLoad:-7,coachTrust:-2})
 ]),
 standaloneStory("late_record_chase","legacy",["veteran"],"一項生涯紀錄只剩幾場距離",`媒體開始每天更新你距離紀錄還差多少，但球隊近期更需要控制負荷。紀錄是真實累積，是否追趕仍要和健康、角色與球隊目標一起決定。`,"media",[
  careerStoryChoice("normal","維持原本輪替","不為紀錄改變打法，達成時間交給賽程。","數字繼續穩定靠近，球隊計畫沒有改變。","你讓紀錄留在正常比賽裡完成。",{discipline:3,rep:2}),careerStoryChoice("push","要求增加上場與出手","加快紀錄進度，也提高負荷與隊內壓力。","球隊同意短期增加部分回合。","你決定主動追趕生涯里程碑。",{rep:4,bodyLoad:8,teamTrust:-2}),careerStoryChoice("rest","完全忽略紀錄安排休息","保護後續賽程，可能錯過這次窗口。","你照計畫輪休，數字暫時停下。","你沒有讓里程碑凌駕身體狀態。",{health:4,bodyLoad:-6,rep:-1})
 ],{minCareerGames:300,minRecognition:1}),
 standaloneStory("late_rotation_review","veteran",["veteran"],"球團把老將角色拆成三種方案",`球團管理層提出固定替補、對戰型輪替與不保證上場三種方向。這不是逼你退休，而是要求下一季角色與薪資能互相對得上。`,"frontOffice",[
  careerStoryChoice("fixed","接受固定替補責任","上場較穩定，個人上限與薪資空間下降。","球團把第二陣容責任寫進計畫。","你用清楚角色換取穩定輪替。",{teamTrust:7,rep:1}),careerStoryChoice("matchup","接受依對戰使用","部分比賽可能不上場，適合的夜晚仍有重要工作。","教練開始依對手安排你的分鐘。","你接受價值不必每晚用同一種方式出現。",{iq:2,coachTrust:5}),careerStoryChoice("compete","拒絕預設降級，重新競爭","保留更大角色可能，也承擔落出輪替的風險。","球團同意不先承諾任何席次。","你選擇把位置重新交給訓練與比賽。",{confidence:4,teamTrust:-4})
],{minGames:8,maxMins:18,contractMinRemaining:1,contractMaxRemaining:1}),
 standaloneStory("late_option_window","contract",["veteran"],"合約選項的期限早於自由市場",`{agent} 提醒你，目前合約的決定期限先到，外部市場尚未正式開放。接受能保住確定性，等待可能得到更適合角色，也可能什麼都沒有。`,"agent",[
  careerStoryChoice("security","優先保留確定合約","放棄部分市場空間，確保下一季位置。","經紀人依現有條件完成回覆。","你在老將市場先選擇確定性。",{agentTrust:5,confidence:2}),careerStoryChoice("role","要求補充角色說明再決定","可能錯過期限，也避免只看薪資簽約。","球團提出更具體的輪替範圍。","你讓合約選項同時回答角色問題。",{agentTrust:4,teamTrust:2}),careerStoryChoice("market","放棄選項等待市場","保留新去向可能，也承擔報價不足。","經紀人準備進入正式市場。","你用確定合約交換更多選擇。",{confidence:3,teamTrust:-3})
],{contractMinRemaining:1,contractMaxRemaining:1,contractOptionPending:true}),
 standaloneStory("late_former_teammate","friendship",["veteran"],"昔日隊友傳來他的退休消息",`一名曾和你共用更衣室的前隊友正式退休。他沒有勸你跟著離開，只問你是否還能從每天訓練與比賽裡得到想要的東西。`,"formerTeammate",[
  careerStoryChoice("call","打電話聊完整段生涯","回看彼此走過的路，不急著替自己下決定。","你們談起勝負以外仍記得的細節。","別人的退休讓你重新檢查自己的理由。",{confidence:3,iq:2}),careerStoryChoice("visit","休賽日參加他的告別聚會","犧牲部分恢復，留下真正的道別。","幾名舊隊友重新坐在同一張桌旁。","你替一段共同生涯留下正式句點。",{rep:3,fatigue:2}),careerStoryChoice("message","只傳訊息祝福","保留目前節奏，也維持彼此的職業距離。","他回覆一句『照自己的時間走』。","你沒有讓別人的終點替自己決定。",{discipline:2})
 ],{minCareerSeason:12}),
 standaloneStory("late_future_role","legacy",["veteran"],"球團詢問你是否願意旁聽一次球探會議",`球團管理層說這只是認識退役後工作的機會，不代表你要停止打球。會議時間會占用恢復日，也可能讓隊友誤以為你已經準備離開。`,"frontOffice",[
  careerStoryChoice("attend","旁聽但不承諾未來職位","了解另一種工作，不改變目前球員身分。","你第一次坐在球員評估桌的另一側。","你在仍然出賽時先看見場外可能。",{iq:3,rep:2,fatigue:2}),careerStoryChoice("later","等球季結束再談","保住現在專注，機會仍可能保留。","球團同意休賽季再安排。","你讓球員身分先完成本季工作。",{discipline:3,teamTrust:2}),careerStoryChoice("decline","明確表示只想繼續打球","消除退役猜測，也關閉一次學習入口。","球團不再安排旁聽。","你拒絕讓未來工作提前定義現在。",{confidence:4,rep:-1})
 ],{minRep:8,minRecognition:1}),
 standaloneStory("late_family_road","family",["veteran"],"家人不想再用臨時通知安排客場",`短約與輪替變動讓每次客場、搬遷和返家時間都到最後一刻才確定。家人沒有要求你退休，只希望接下來的球季不要再完全靠臨時訊息生活。`,"family",[
  careerStoryChoice("calendar","建立不能取消的家庭日期","減少部分商業與加練時間，提供可預期生活。","你把幾個日期先從球季行程裡保留下來。","你替家庭留下不被臨時更動拿走的時間。",{familyHarmony:10,discipline:2}),careerStoryChoice("updates","每週固定更新安排","仍會改變，但不再讓家人最後才知道。","你們建立固定的行程確認時間。","你用持續溝通處理老將球季的不確定。",{familyHarmony:7,fatigue:1}),careerStoryChoice("wait","等合約穩定後再規劃","維持全部彈性，家庭壓力繼續累積。","討論再次延後到下一個市場結果。","你讓職業市場繼續決定家庭時間。",{familyHarmony:-6,confidence:1})
 ],{hasPartner:true}),
 standaloneStory("late_rehab_return","injury",["veteran"],"復出後第一場背靠背就在眼前",`醫療團隊確認單場出賽沒有問題，但連續兩天比賽仍缺少實際資料。球隊需要你決定打兩場、只打一場，或再延後完整復出。`,"medicalTeam",[
  careerStoryChoice("one","只打一場","犧牲完整出勤，取得較安全的身體反應資料。","你完成第一場後按計畫休息。","你用一場比賽測試復出，而不是一次賭完。",{health:4,bodyLoad:-3,discipline:2}),careerStoryChoice("both","兩場都上","保住輪替與競爭感，復發風險提高。","你完成背靠背，第二場動作明顯變慢。","你選擇立刻承擔完整賽程。",{confidence:4,bodyLoad:10,health:-3}),careerStoryChoice("delay","再延後一週","最大化恢復，球隊必須繼續調整輪替。","醫療團隊增加一週對抗與檢查。","你拒絕讓賽程替身體決定復出日。",{health:6,bodyLoad:-7,teamTrust:-2})
 ],{medicalConcern:true}),
 standaloneStory("late_rival_reunion","rivalry",["veteran"],"宿敵第一次以替補身分和你同場",`{rival} 已不再是早年那個每晚主導比賽的人，你的角色也和巔峰不同。多年比較仍被重新拿出來，但這次兩人都必須用現在的分鐘完成比賽。`,"rival",[
  careerStoryChoice("respect","賽前主動致意","承認彼此都已改變，不取消場上競爭。","你們短暫交談後各自回到球隊。","你讓長年競爭容得下角色變化。",{rivalRespect:10,rep:3}),careerStoryChoice("compete","把有限分鐘當成最後一次對決","提高對抗與話題，也增加身體負荷。","兩人在替補時段正面交手。","你拒絕讓角色下降帶走競爭感。",{confidence:4,bodyLoad:5,rivalRespect:3}),careerStoryChoice("present","只準備現在的球隊任務","不回應舊比較，把注意力留給當前比賽。","媒體沒有得到期待中的宿敵宣言。","你不再讓早年對手決定每次上場意義。",{discipline:3,rivalRespect:-1})
],{minCareerSeason:12,roles:["worker","benchLeader","garbage"]})
];

const CAREER_STORY_EVENTS=[...CAREER_STORY_LINES,...CAREER_STORY_STANDALONES];
