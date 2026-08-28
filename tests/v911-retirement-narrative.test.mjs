import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"js/ui/retirement-view.js"),"utf8");
const start=source.indexOf("function retirementExitClass()");
const end=source.indexOf("function uniqueHonorYears",start);
const narrativeSource=source.slice(start,end);

function render(player){
 const context={
  p:player,
  isProfessionalPathValue:path=>!["HBL","UBA","UBA 強權","NCAA D2","NCAA D1","日本大學"].includes(path),
  leagueDisplay:path=>path||"未登錄聯盟",
  escapeFeedText:value=>String(value??"").replace(/[<>&]/g,char=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[char])),
  retirementRoleTimeline:()=>player.testRoles||[],
  retirementRoleIdentity:()=>"替補球員",
  retirementChoiceEntries:()=>player.testChoices||[],
  retirementEraPeople:()=>player.testPeople||[]
 };
 vm.runInNewContext(narrativeSource,context);
 return context.retirementDayNarrative();
}

const base={name:"測試球員",year:2050,age:40,path:"台灣職業",team:"海港隊",careerRating:18000,hallOfFame:[],jerseyRetired:[],seasonHistory:[{year:2049,age:39,path:"台灣職業",team:"海港隊",mins:14}],championships:0,nationalCaps:0,internationalHistory:[],championshipHistory:[],medicalHistory:[],injuryHistory:[],testRoles:[{identity:"板凳領袖"}]};

test("retirement narrative does not invent senior national-team history",()=>{
 const html=render({...base,retirementReason:"主動宣布引退",internationalHistory:[{year:2040,level:"U18",event:"青年賽",finish:"冠軍"}]});
 assert.doesNotMatch(html,/成人代表隊|青年賽|國家隊/);
 assert.match(html,/海港隊/);
 assert.match(html,/板凳領袖/);
});

test("retirement narrative cites an actual senior national-team result",()=>{
 const html=render({...base,retirementReason:"主動宣布引退",nationalCaps:4,internationalHistory:[{year:2042,level:"SENIOR",event:"亞洲盃",finish:"八強"}]});
 assert.match(html,/2042 年的亞洲盃/);
 assert.match(html,/八強/);
});

test("injury retirement uses the recorded injury and a different final action",()=>{
 const html=render({...base,retirementReason:"膝傷無法繼續職業生涯",medicalHistory:[{year:2048,name:"前十字韌帶撕裂",area:"左膝",tier:"重傷",missedGames:28}]});
 assert.match(html,/2048 年留下的前十字韌帶撕裂/);
 assert.match(html,/左膝/);
 assert.match(html,/護具留在治療床上/);
});

test("no-offer and homecoming retirements keep distinct factual endings",()=>{
 const noOffer=render({...base,retirementReason:"公開測試後仍沒有球隊提供合約",careerRating:9000});
 assert.match(noOffer,/市場沒有再開門/);
 assert.match(noOffer,/手機反扣在桌上/);
 const homecoming=render({...base,lastDanceUsed:true,retirementReason:"完成家鄉最後一舞"});
 assert.match(homecoming,/母隊最後一舞/);
 assert.match(homecoming,/門禁卡/);
});

test("championship and relationship paragraphs require saved facts",()=>{
 const html=render({...base,retirementReason:"主動宣布引退",championships:1,championshipHistory:[{year:2044,path:"台灣職業",team:"海港隊"}],testPeople:[{type:"生涯宿敵",name:"周啟文",story:"從學生時代一路競爭到職業"}]});
 assert.match(html,/2044 年/);
 assert.match(html,/海港隊真正走到冠軍終點/);
 assert.match(html,/生涯宿敵周啟文/);
 assert.match(html,/從學生時代一路競爭到職業/);
});
