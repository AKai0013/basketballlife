import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const context={p:{year:2036,age:26,path:"台灣職業",careerSeason:10,team:"稽核球隊",retired:false,careerStoryHistory:[],careerStoryPending:[],careerStorySeen:[],careerStoryThemeYears:{},careerIntroductions:{},internationalHistory:[],careerCast:{friend:{name:"稽核朋友",trait:"最早的球友"},rival:{name:"稽核宿敵",trait:"長期對手"},coach:{name:"稽核教練",trait:"目前總教練"},agent:{name:"稽核經紀人",trait:"處理合約"},teammate:{name:"稽核隊友",trait:"同隊球員"}}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,"data/career-story-events.js"),"utf8"),context);
vm.runInContext(fs.readFileSync(path.join(root,"js/events/career-story-engine.js"),"utf8"),context);
const report=vm.runInContext(`(()=>{
 const events=CAREER_STORY_EVENTS;
 const stages={};const themes={};const actors={};
 const allowedRequirementKeys=new Set(["paths","excludePaths","minAge","maxAge","minGrade","minCareerSeason","minGames","minMins","maxMins","minPts","minRep","minHealth","maxHealth","minBodyLoad","minCareerGames","minRecognition","contractMinRemaining","contractMaxRemaining","contractOptionPending","overseas","hasPartner","hasNationalCaps","medicalConcern","roles"]);
 events.forEach(event=>{
   event.stages.forEach(stage=>stages[stage]=(stages[stage]||0)+1);
   themes[event.theme]=(themes[event.theme]||0)+1;
   actors[event.actor]=(actors[event.actor]||0)+1;
 });
 const roleCritical={college_home_call:"family",college_roommate:"roommate",college_draft_feedback:"scout",hbl_exam_week:"schoolOffice",hbl_social_clip:"media",hbl_injury_notice:"medicalTeam",national_miss_1:"nationalStaff",national_miss_2:"nationalStaff",national_miss_3:"nationalStaff",rebuild_core_1:"frontOffice",rebuild_core_2:"frontOffice",rebuild_core_3:"frontOffice",pro_union_vote:"playersUnion",late_family_calendar:"family",late_fan_chant:"fans",late_youth_camp:"almaMater"};
 const roleMismatches=Object.entries(roleCritical).filter(([id,actor])=>events.find(event=>event.id===id)?.actor!==actor).map(([id,actor])=>({id,expected:actor,actual:events.find(event=>event.id===id)?.actor||"missing"}));
  const lineShapes=[...new Set(CAREER_STORY_LINES.map(event=>event.line))].map(line=>({line,nodes:CAREER_STORY_LINES.filter(event=>event.line===line).map(event=>event.node).sort()})).filter(row=>row.nodes.join(",")!=="1,2,3");
  const copyFor=event=>[event.title,event.desc,...event.choices.flatMap(choice=>[choice.label,choice.detail,choice.result,choice.memory])].join(" ");
  const technicalCopy=events.filter(event=>/事件系統|合約畫面|新生成|虛構|硬套|這條事件|不會被當成/.test(copyFor(event))).map(event=>event.id);
  const fixedYearCallbacks=CAREER_STORY_LINES.filter(event=>Number(event.node)>1&&/(?:一年|兩年|三年)後/.test(copyFor(event))).map(event=>event.id);
  const unknownRequirementKeys=events.flatMap(event=>Object.keys(event.requirements||{}).filter(key=>!allowedRequirementKeys.has(key)).map(key=>event.id+":"+key));
  const duplicateChoiceIds=events.filter(event=>new Set(event.choices.map(choice=>choice.id)).size!==event.choices.length).map(event=>event.id);
  const choicePlaceholders=events.flatMap(event=>event.choices.flatMap(choice=>[choice.label,choice.detail,choice.result,choice.memory].filter(value=>/\{[a-z]+\}/i.test(String(value||""))).map(value=>event.id+":"+value)));
 return {
   totalEvents:events.length,
  longStoryLines:new Set(CAREER_STORY_LINES.map(event=>event.line)).size,
  linkedNodes:CAREER_STORY_LINES.length,
  standaloneEvents:CAREER_STORY_STANDALONES.length,
  choices:events.reduce((sum,event)=>sum+event.choices.length,0),
  uniqueIds:new Set(events.map(event=>event.id)).size,
   stages,themes,actors,
   missingActorPresentation:events.filter(event=>!careerStoryActorPresentation(event,p)?.name).map(event=>event.id),
   roleMismatches,lineShapes,
   studentProfessionalActors:events.filter(event=>event.stages.includes("hbl")&&["agent","frontOffice","playersUnion","nationalStaff"].includes(event.actor)).map(event=>event.id),
    nationalClubCoachLeaks:events.filter(event=>event.theme==="national"&&event.actor==="coach").map(event=>event.id),
    technicalCopy,fixedYearCallbacks,unknownRequirementKeys,duplicateChoiceIds,choicePlaceholders
 };
})()`,context);

console.log(JSON.stringify(report,null,2));
const failures=[report.missingActorPresentation,report.roleMismatches,report.lineShapes,report.studentProfessionalActors,report.nationalClubCoachLeaks,report.technicalCopy,report.fixedYearCallbacks,report.unknownRequirementKeys,report.duplicateChoiceIds,report.choicePlaceholders].flat();
if(failures.length)process.exitCode=1;
