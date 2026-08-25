/* V8.1.1 derived player abilities — keeps the eight saved abilities authoritative. */
function v811PlayerSource(player){
 if(player&&typeof player==="object")return player;
 return typeof p!=="undefined"&&p&&typeof p==="object"?p:{};
}
function v811Clamp(value,min=0,max=99){return Math.max(min,Math.min(max,Number(value)||0));}
function v811Round(value){return Math.round(v811Clamp(value));}
function v811Stat(player,key,fallback=50){
 const source=v811PlayerSource(player),value=Number(source.stats?.[key]);
 return Number.isFinite(value)?v811Clamp(value):fallback;
}
function v811SeasonPercent(value,fallback=50){
 const n=Number(value);
 return Number.isFinite(n)&&n>0?v811Clamp(50+(n-fallback)*1.7,20,99):50;
}
function v811SizeScore(player){
 const source=v811PlayerSource(player),position=String(source.pos||source.position||"");
 return position==="C"?92:position==="PF"?78:position==="SF"?63:position==="SG"?48:35;
}
function v811RoleProfile(player){
 const source=v811PlayerSource(player),position=String(source.pos||source.position||""),hasPos=values=>values.includes(position),v=key=>v811Stat(source,key);
 const candidates=[
  {id:"rebounding_guard",label:"籃板後衛",strengths:"籃板、體能與攻守轉換",score:(hasPos(["PG","SG"])?8:0)+(v("rebound")-50)*.30+(v("ath")-50)*.22+(v("defense")-50)*.16},
  {id:"lead_guard",label:"組織核心",strengths:"控球、傳球與球商",score:(hasPos(["PG","SG"])?8:0)+(v("handle")-50)*.25+(v("pass")-50)*.30+(v("iq")-50)*.25},
  {id:"two_way_wing",label:"攻守側翼",strengths:"投射、防守與體能",score:(hasPos(["SG","SF","PF"])?8:0)+(v("shoot")-50)*.22+(v("defense")-50)*.24+(v("ath")-50)*.22},
  {id:"wing_creator",label:"持球側翼",strengths:"持球、投射與終結",score:(hasPos(["SG","SF","PF"])?7:0)+(v("handle")-50)*.24+(v("shoot")-50)*.20+(v("finish")-50)*.22+(v("ath")-50)*.12},
  {id:"point_center",label:"組織中鋒",strengths:"傳球、球商與內線牽制",score:(hasPos(["PF","C"])?8:0)+(v("pass")-50)*.30+(v("iq")-50)*.28+(v("handle")-50)*.12+(v("rebound")-50)*.12},
  {id:"rim_anchor",label:"護框核心",strengths:"防守、籃板與體能",score:(hasPos(["PF","C"])?8:0)+(v("defense")-50)*.28+(v("rebound")-50)*.28+(v("ath")-50)*.18},
  {id:"stretch_big",label:"外線型長人",strengths:"投射、傳球與球商",score:(hasPos(["PF","C"])?7:0)+(v("shoot")-50)*.30+(v("pass")-50)*.18+(v("iq")-50)*.16},
  {id:"post_finisher",label:"低位終結者",strengths:"終結、籃板與對抗",score:(hasPos(["PF","C"])?7:0)+(v("finish")-50)*.28+(v("rebound")-50)*.22+(v("ath")-50)*.18}
 ];
 const best=candidates.sort((a,b)=>b.score-a.score)[0]||{id:"balanced",label:"攻守平衡",strengths:"多面向能力",score:0};
 if(best.score<10)return {id:"balanced",label:"攻守平衡",strengths:"多面向能力",score:Math.max(0,Math.round(best.score))};
 return {...best,score:Math.round(best.score)};
}
function v811PlayerRoleProfile(player=v811PlayerSource()){return v811RoleProfile(player)}
function playerRoleProfile(player=v811PlayerSource()){return v811RoleProfile(player)}
function v811AbilityProfile(player=v811PlayerSource()){
 const source=v811PlayerSource(player),season=source.seasonStats||{},shoot=v811Stat(source,"shoot"),finish=v811Stat(source,"finish"),handle=v811Stat(source,"handle"),pass=v811Stat(source,"pass"),defense=v811Stat(source,"defense"),rebound=v811Stat(source,"rebound"),ath=v811Stat(source,"ath"),iq=v811Stat(source,"iq"),durability=v811Clamp(source.durability,20,99)||60,size=v811SizeScore(source);
 const threeSeason=v811SeasonPercent(season.three,35),fgSeason=v811SeasonPercent(season.fg,47);
 const shooting={
  threePoint:v811Round(shoot*.70+iq*.12+threeSeason*.18),
  catchShoot:v811Round(shoot*.62+pass*.14+iq*.14+fgSeason*.10),
  pullUp:v811Round(shoot*.48+handle*.25+iq*.17+ath*.10),
  midrange:v811Round(shoot*.52+handle*.12+finish*.12+iq*.24)
 };
 const finishing={
  drive:v811Round(finish*.54+handle*.20+ath*.16+iq*.10),
  contact:v811Round(finish*.54+ath*.24+durability*.10+iq*.12),
  post:v811Round(finish*.50+rebound*.18+pass*.10+iq*.12+size*.10),
  touch:v811Round(finish*.56+shoot*.14+handle*.10+iq*.20)
 };
 const defenseProfile={
  perimeter:v811Round(defense*.50+ath*.20+iq*.20+handle*.10),
  interior:v811Round(defense*.50+rebound*.18+ath*.17+iq*.10+size*.05),
  help:v811Round(defense*.46+iq*.30+ath*.10+rebound*.14),
  rim:v811Round(defense*.45+rebound*.25+ath*.20+size*.10)
 };
 const traits=[
  {id:"three_point_spacer",label:"三分空間點",description:"能以外線投射拉開防守",score:v811Round((shooting.threePoint+shooting.catchShoot)/2),min:78},
  {id:"shot_creator",label:"持球創造者",description:"能在持球後創造中距離或突破",score:v811Round((shooting.pullUp+finishing.drive+handle)/3),min:78},
  {id:"midrange_specialist",label:"中距離專精",description:"在非空位出手中仍保有穩定手感",score:shooting.midrange,min:82},
  {id:"downhill_driver",label:"衝框終結者",description:"以第一步、對抗與籃下完成進攻",score:v811Round((finishing.drive+finishing.contact)/2),min:78},
  {id:"post_finisher",label:"低位終結者",description:"在合適對位中用低位與籃下手感取分",score:v811Round((finishing.post+finishing.touch)/2),min:78},
  {id:"perimeter_stop",label:"外圍防守者",description:"能承擔外線對位與協防輪轉",score:v811Round((defenseProfile.perimeter+defenseProfile.help)/2),min:78},
  {id:"rim_protector",label:"護框保護者",description:"能在禁區對抗、協防與護框",score:v811Round((defenseProfile.interior+defenseProfile.rim)/2),min:78},
  {id:"connector",label:"傳導樞紐",description:"以傳球與球商讓整體進攻運轉",score:v811Round((pass+iq+handle)/3),min:78}
 ].filter(item=>item.score>=item.min).sort((a,b)=>b.score-a.score);
 const caps=source.caps||{},room=key=>Math.max(0,(Number(caps[key])||v811Stat(source,key))-v811Stat(source,key));
 const directions=[
  {id:"spacing",label:"外線空間與無球投射",description:"提高三分、接球投籃與中距離的穩定性",score:(shooting.threePoint+shooting.catchShoot)*.5+room("shoot")*.35+room("iq")*.15},
  {id:"creation",label:"持球創造與突破",description:"提高持球投籃、切入與對抗終結",score:(shooting.pullUp+finishing.drive)*.5+room("handle")*.28+room("finish")*.22},
  {id:"inside",label:"低位與禁區終結",description:"提高低位背打、籃下手感與籃板對抗",score:(finishing.post+finishing.touch)*.5+room("finish")*.30+room("rebound")*.20},
  {id:"defense",label:"外圍防守與協防輪轉",description:"提高外圍對位、協防、內線對抗與護框",score:(defenseProfile.perimeter+defenseProfile.help+defenseProfile.rim)/3+room("defense")*.30+room("iq")*.20},
  {id:"orchestration",label:"組織與全場閱讀",description:"提高傳球、控球與球商帶來的隊友價值",score:(pass+handle+iq)/3+room("pass")*.28+room("iq")*.22}
 ].sort((a,b)=>b.score-a.score);
 const role=v811RoleProfile(source),growthDirection=directions[0]||{id:"balanced",label:"攻守平衡",description:"維持多面向能力的穩定成長"};
 const roleBonus=Math.max(0,Math.min(3.2,(role.score-10)*.10)),traitBonus=Math.min(1.8,traits.length*.6);
 return {role,shooting,finishing,defense:defenseProfile,traits,growthDirection,marketFit:Math.round((roleBonus+traitBonus)*100)/100,seasonThree:threeSeason,seasonFg:fgSeason};
}
function v811SeasonContext(player=v811PlayerSource(),profile=v811AbilityProfile(player)){
 const role=profile.role.id,shooting=profile.shooting,finishing=profile.finishing,defense=profile.defense;
 const primary=role==="post_finisher"||role==="point_center"?((finishing.post+finishing.touch)/2):role==="rim_anchor"?finishing.contact:role==="stretch_big"||role==="two_way_wing"?((shooting.threePoint+shooting.catchShoot)/2):((shooting.pullUp+finishing.drive)/2);
 const postUse=["post_finisher","point_center","rim_anchor"].includes(role);
 const pullUpUse=["lead_guard","wing_creator","two_way_wing"].includes(role);
 return {
  scoringLift:Math.max(-2.2,Math.min(2.2,(primary-50)*.055+(postUse?Math.max(0,finishing.post-72)*.018:pullUpUse?Math.max(0,shooting.pullUp-72)*.018:0))),
  fgLift:Math.max(-1.6,Math.min(1.6,((finishing.touch+finishing.contact)/2-50)*.035)),
  threeLift:Math.max(-1.5,Math.min(1.5,((shooting.threePoint+shooting.catchShoot)/2-50)*.03)),
  reboundLift:Math.max(-.6,Math.min(.6,(defense.interior-50)*.012)),
  assistLift:Math.max(-.5,Math.min(.5,(profile.role.id==="lead_guard"||profile.role.id==="point_center"?profile.role.score-10:0)*.018)),
  stealLift:Math.max(-.35,Math.min(.35,(defense.perimeter-50)*.008)),
  blockLift:Math.max(-.30,Math.min(.30,(defense.rim-50)*.006)),
  situation:postUse&&finishing.post>=78?"對上小陣容時，低位、籃下與內線錯位能放大價值":profile.traits.some(item=>item.id==="midrange_specialist")?"高壓對位時，持球中距離可作為破解防守的情境解法":pullUpUse?"適合持球投籃、切入與外圍創造":"依對位選擇空間、傳導與防守支援"
 };
}
function v811TeamNeedProfile(player=v811PlayerSource(),direction="playoff",league=""){
 const source=v811PlayerSource(player),profile=v811AbilityProfile(source),age=Number(source.age)||16,healthy=!source.injury&&Number(source.health||100)>=75;
 let label="依球隊輪替與對位評估",bonus=0;
 if(direction==="contend"){
  label=profile.traits.length?"爭冠即戰力：需要明確特長":"爭冠輪替：需要穩定攻守執行";
  bonus=(profile.traits.length?1.4:.4)+(profile.role.id==="two_way_wing"||profile.role.id==="rim_anchor"?0.5:0);
 }else if(direction==="rebuild"){
  label=age<=28?"重建養成：需要成長空間與可塑性":"重建輪替：老將時間會讓給年輕球員";
  bonus=age<=28?1.2:healthy?-.2:-.8;
 }else if(direction==="finance"){
  label=healthy?"財務控管：需要低風險輪替":"財務控管：傷病風險提高保障要求";
  bonus=healthy?.8:-.8;
 }else if(direction==="turmoil"){
  label="球隊動盪：需要多位置與可調整角色";
  bonus=profile.role.id==="balanced"?.2:.7;
 }
 return {label,bonus:Math.max(-1,Math.min(2.2,bonus)),league};
}
function v811AbilitySnapshot(profile){
 if(!profile)return null;
 return {role:profile.role.id,traits:profile.traits.slice(0,3).map(item=>item.id),growth:profile.growthDirection.id,shooting:{threePoint:profile.shooting.threePoint,catchShoot:profile.shooting.catchShoot,pullUp:profile.shooting.pullUp,midrange:profile.shooting.midrange},finishing:{drive:profile.finishing.drive,contact:profile.finishing.contact,post:profile.finishing.post,touch:profile.finishing.touch},defense:{perimeter:profile.defense.perimeter,interior:profile.defense.interior,help:profile.defense.help,rim:profile.defense.rim}};
}
function v811AbilityPanelHTML(profile){
 if(!profile)return "";
 const row=(label,items)=>`<div class="derivedAbilityGroup"><small>${label}</small><div>${items.map(item=>`<span><b>${item.label}</b>${item.value}</span>`).join("")}</div></div>`;
 const traits=profile.traits.length?`<span>目前特性：${profile.traits.slice(0,2).map(item=>item.label).join("、")}</span>`:"";
 return `<details class="derivedAbilityPanel"><summary><span><b>場上特性</b><small>查看投射、終結與防守細節</small></span><strong>${profile.role.label}</strong></summary><div class="derivedAbilityBody">${row("投射",[{label:"三分",value:profile.shooting.threePoint},{label:"接球投籃",value:profile.shooting.catchShoot},{label:"持球投籃",value:profile.shooting.pullUp},{label:"中距離",value:profile.shooting.midrange}])}${row("終結",[{label:"切入",value:profile.finishing.drive},{label:"對抗",value:profile.finishing.contact},{label:"低位",value:profile.finishing.post},{label:"籃下手感",value:profile.finishing.touch}])}${row("防守",[{label:"外圍",value:profile.defense.perimeter},{label:"內線",value:profile.defense.interior},{label:"協防",value:profile.defense.help},{label:"護框",value:profile.defense.rim}])}<div class="derivedAbilityNotes">${traits}<span>成長方向：${profile.growthDirection.label}</span></div></div></details>`;
}
