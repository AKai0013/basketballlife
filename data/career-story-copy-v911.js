/* Expands only underspecified legacy story outcomes. Rich authored scenes remain untouched. */
const CAREER_STORY_RESULT_CLOSURES={
 rivalry:["對手沒有立刻回話，只把這個答案留到下一次真正對位。","兩邊球員散開後，對方仍回頭看了你一眼，這次選擇已經成為你們共同知道的事。"],
 friendship:["朋友把話聽完才收起手機；你們的關係沒有被一句道歉或一次沉默輕易帶過。","離開前，他沒有替你下結論，只用一個動作表明這次選擇確實改變了距離。"],
 coach:["教練把決定寫進下一場工作表，往後的信任將以這次實際執行為準。","會議結束時，戰術板上的責任被重新畫過，你們都不能再假裝沒談清楚。"],
 injury:["防護員把決定和當天檢查一起寫入紀錄，身體代價不會被一句能打掩蓋。","醫療室的門關上前，處理方式與限制已被正式留下，下一次評估會回到這份紀錄。"],
 teammate:["隊友沒有立刻忘記這件事；下一次共同上場時，他先看的是你有沒有照剛才說的做。","回到更衣室後，你們沒有再補漂亮話，只把這次選擇留在下一次配合裡驗證。"],
 family:["通話結束後，家人終於知道你真正選了什麼，而不是只聽見球隊對外公布的版本。","家裡沒有因此停止擔心，但這次決定讓彼此第一次能對著同一件事說話。"],
 contract:["經紀人把條件與你的回答一起存檔，市場之後如何反應都不能改寫今天的選擇。","文件被重新放回桌上；報價仍是報價，但你的底線已經不再由別人代填。"],
 identity:["鏡頭關掉後，那個標籤沒有立即消失；至少這次由你決定要怎麼面對它。","外界仍可能用一句話概括你，但今天留下的行動比那句標題更完整。"],
 veteran:["年輕隊友把這一幕記了下來；你的角色不再只由上場時間決定。","訓練結束後，老將位置沒有恢復巔峰數字，卻留下了別人願意接住的工作。"],
 national:["代表隊紀錄只寫下真正發生的結果，這次選擇也和那一年一起被保存。","離開集訓場前，球衣仍要交回管理員；你帶走的是這次已經完成的決定。"],
 team:["下一次集合時，隊友依照這個決定重新分配責任，結果不再只算在你一個人身上。","會議散場後，球隊真的照這個答案調整了下一步，而不是只留下數值變化。"],
 legacy:["物件被留在原位，成為日後回看這段生涯時能指出來的具體記號。","你沒有替這件事加上傳奇說法，只留下確實發生過的一句話與一個動作。"],
 school:["鐘聲響起後，學生與球員的兩份責任仍都在；這次你讓其中一邊先得到明確答案。","教室和球館沒有替彼此讓路，但老師、教練與隊友都看見你如何處理這次衝突。"],
 college:["課表、客場與球隊角色沒有同時消失；你親自承擔了這次排序留下的結果。","回到校園後，這個選擇被寫進真實行程與關係裡，不再只是一次三選一。"]
};
const CAREER_STORY_MEMORY_CLOSURES={
 rivalry:"，也改變了你和同一名對手下一次碰面時的態度。",friendship:"，並留在你和這名朋友之後能回訪的共同記憶裡。",coach:"，這項責任與同一名教練的信任紀錄一起被保留。",injury:"，當時的身體狀況、處理方式與限制都被如實記下。",teammate:"，同一名隊友往後如何回應會延續這次已發生的結果。",family:"，家人對這條生涯路線的理解因此留下明確變化。",contract:"，報價、球隊與你當時的底線都成為正式市場紀錄。",identity:"，外界標籤與你親自作出的回答從此不再是同一件事。",veteran:"，你的老將角色因此多了一項能交給下一個人的責任。",national:"，只有這次正式發生的代表隊經歷會進入生涯紀錄。",team:"，球隊之後的分工會記得這次已經產生的改變。",legacy:"，那句話或那個動作成為日後回看時能辨認的記號。",school:"，學生身分與球隊責任的取捨被完整留在這一季。",college:"，大學階段的課業、生活與籃球選擇因此有了可追溯結果。"};
function careerStoryCopyIndex(value){return [...String(value)].reduce((sum,char)=>(sum+char.charCodeAt(0))>>>0,0)}
for(const event of CAREER_STORY_EVENTS){
 const closures=CAREER_STORY_RESULT_CLOSURES[event.theme]||CAREER_STORY_RESULT_CLOSURES.team;
 const memoryClosure=CAREER_STORY_MEMORY_CLOSURES[event.theme]||CAREER_STORY_MEMORY_CLOSURES.team;
 for(const choice of event.choices){
  if(String(choice.result||"").trim().length<18)choice.result=`${String(choice.result||"").trim()}${closures[careerStoryCopyIndex(`${event.id}:${choice.id}`)%closures.length]}`;
  if(String(choice.memory||"").trim().length<18)choice.memory=`${String(choice.memory||"").trim().replace(/[。！]$/u,"")}${memoryClosure}`;
 }
}
