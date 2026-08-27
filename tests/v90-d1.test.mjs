import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {DatabaseSync} from "node:sqlite";
import {fileURLToPath} from "node:url";
import {onRequest} from "../functions/api/[[path]].js";
import {optimizedLeaderboard} from "../functions/api/_middleware.js";

if(!globalThis.crypto)globalThis.crypto=webcrypto;

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const migration=name=>fs.readFileSync(path.join(root,"migrations",name),"utf8");
const migrations=[
  "0001_basketballlife_d1.sql",
  "0002_leaderboard_read_optimization.sql",
  "0003_v81_leaderboard_era.sql",
  "0004_v9_leaderboard_era.sql",
  "0005_online_key_battle.sql",
  "0008_online_shared_world.sql"
];
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");

class LocalD1Statement{
  constructor(database,sql){this.database=database;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return this.database.prepare(this.sql).get(...this.args)||null}
  async all(){return {results:this.database.prepare(this.sql).all(...this.args)}}
  async run(){const result=this.database.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(result.changes||0)}}}
}
class LocalD1{
  constructor(database){this.database=database}
  prepare(sql){return new LocalD1Statement(this.database,sql)}
  async batch(statements){return Promise.all(statements.map(statement=>statement.run()))}
}
const openDatabase=()=>{
  const database=new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  return database;
};
const applyMigrations=(database,names=migrations)=>names.forEach(name=>database.exec(migration(name)));
const request=(url,options={})=>onRequest({request:new Request(url,options),env:{DB:options.DB},params:{path:new URL(url).pathname.replace(/^\/api\//,"").split("/")}});
const uuid=index=>`${index.toString(16).padStart(8,"0")}-0000-4000-8000-${index.toString(16).padStart(12,"0")}`;
const insertProfile=(database,{id,nickname,tokenHash="test-hash"})=>database.prepare("INSERT INTO profiles(user_id,token_hash,nickname) VALUES(?,?,?)").run(id,tokenHash,nickname);
const insertCareer=(database,{id,userId,nickname="QA",rating=0,era="v9",weekly=0,weeklyId="",publisher="9.0.0",peak=70})=>database.prepare(`
  INSERT INTO career_records(
    id,user_id,nickname,player_name,position,seed,seed_tier,retired_age,final_year,peak_overall,
    career_rating,career_games,career_salary,ranking_era,publisher_version,weekly_active,weekly_id,is_public
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
`).run(id,userId,nickname,`球員${id.slice(0,4)}`,"PG","V9D1TEST","A",25,2035,peak,rating,10,0,era,publisher,weekly,weeklyId);

test("Pages keeps Preview and production D1 bindings isolated",()=>{
  const config=fs.readFileSync(path.join(root,"wrangler.toml"),"utf8");
  const section=name=>config.match(new RegExp(`\\[\\[env\\.${name}\\.d1_databases\\]\\]([\\s\\S]*?)(?=\\n\\[\\[|$)`))?.[1]||"";
  const preview=section("preview"),production=section("production");
  assert.match(preview,/binding = "DB"/);assert.match(production,/binding = "DB"/);
  assert.match(preview,/database_name = "basketballlife-preview"/);
  assert.notEqual(preview.match(/database_id = "([^"]+)"/)?.[1],production.match(/database_id = "([^"]+)"/)?.[1]);
});

test("optimized leaderboard gives each player one ranked seat and keeps complete rank metadata",async()=>{
  const database=openDatabase();applyMigrations(database);
  const first=uuid(7000),second=uuid(7001);
  insertProfile(database,{id:first,nickname:"重複生涯玩家"});insertProfile(database,{id:second,nickname:"單一生涯玩家"});
  insertCareer(database,{id:uuid(7100),userId:first,nickname:"重複生涯玩家",rating:20000,peak:91});
  insertCareer(database,{id:uuid(7101),userId:first,nickname:"重複生涯玩家",rating:15000,peak:85});
  insertCareer(database,{id:uuid(7102),userId:second,nickname:"單一生涯玩家",rating:18000,peak:89});
  database.prepare("UPDATE leaderboard_stats SET players=2,careers=3,top_power=20000,top_peak=91 WHERE board_key='v9'").run();
  const board=await optimizedLeaderboard(new Request("https://preview.test/api/careers?era=v9&metric=power"),{DB:new LocalD1(database)});
  assert.equal(board.rows.length,2);assert.deepEqual(board.rows.map(row=>row.user_id),[first,second]);
  assert.deepEqual(board.rows.map(row=>row.global_rank),[1,2]);assert.ok(board.rows.every(row=>row.ranking_total===2&&row.player_career_rank===1));
  assert.equal(board.rows[0].public_career_count,2);
  database.close();
});

test("V9 D1 migration is additive and preserves the existing leaderboard eras",()=>{
  const database=openDatabase();
  database.exec(migration(migrations[0]));
  const userId=uuid(1);insertProfile(database,{id:userId,nickname:"舊榜玩家"});
  insertCareer(database,{id:uuid(2),userId,nickname:"舊榜玩家",rating:7500,era:"v750",publisher:"7.50.9"});
  insertCareer(database,{id:uuid(3),userId,nickname:"舊榜玩家",rating:8100,era:"v8",publisher:"8.0.0"});
  const before=database.prepare("SELECT id,ranking_era,career_rating FROM career_records ORDER BY id").all();
  applyMigrations(database,migrations.slice(1));
  const after=database.prepare("SELECT id,ranking_era,career_rating FROM career_records ORDER BY id").all();
  assert.deepEqual(after,before);
  const boardKeys=database.prepare("SELECT board_key FROM leaderboard_stats ORDER BY board_key").all().map(row=>row.board_key);
  assert.deepEqual(boardKeys,["v750","v8","v81","v9"]);
  assert.equal(database.prepare("SELECT careers FROM leaderboard_stats WHERE board_key='v750'").get().careers,1);
  assert.equal(database.prepare("SELECT careers FROM leaderboard_stats WHERE board_key='v8'").get().careers,1);
  database.close();
});

test("V9 D1 API writes, isolates eras, limits top 50 and returns the complete global rank",async()=>{
  const database=openDatabase();applyMigrations(database);
  const DB=new LocalD1(database),leaderId=uuid(10),lowId=uuid(11),weeklyOtherId=uuid(12);
  const token="v9-local-d1-token-which-is-longer-than-thirty-two",leaderToken="v9-leader-token-which-is-longer-than-thirty-two";
  insertProfile(database,{id:leaderId,nickname:"多生涯玩家",tokenHash:await digest(leaderToken)});
  insertProfile(database,{id:lowId,nickname:"榜外玩家",tokenHash:await digest(token)});
  insertProfile(database,{id:weeklyOtherId,nickname:"週榜玩家"});
  for(let index=0;index<9;index++)insertCareer(database,{id:uuid(100+index),userId:leaderId,nickname:"多生涯玩家",rating:100000-index,peak:index===1?99:90-index%5});
  for(let index=0;index<55;index++){
    const userId=uuid(1000+index);
    insertProfile(database,{id:userId,nickname:`玩家${index.toString().padStart(2,"0")}`});
    insertCareer(database,{id:uuid(2000+index),userId,nickname:`玩家${index.toString().padStart(2,"0")}`,rating:90000-index,peak:80-index%4});
  }
  insertCareer(database,{id:uuid(3000),userId:lowId,nickname:"榜外玩家",rating:1000,peak:60});
  insertCareer(database,{id:uuid(4001),userId:leaderId,nickname:"多生涯玩家",rating:999999,era:"v81",publisher:"8.1.1",peak:99});
  insertCareer(database,{id:uuid(4002),userId:leaderId,nickname:"多生涯玩家",rating:888888,era:"v8",publisher:"8.0.0",peak:98});
  insertCareer(database,{id:uuid(5001),userId:leaderId,nickname:"多生涯玩家",rating:777777,era:"v9",weekly:1,weeklyId:"V9-2026W35",peak:97});
  insertCareer(database,{id:uuid(5002),userId:leaderId,nickname:"多生涯玩家",rating:700000,era:"v9",weekly:1,weeklyId:"V9-2026W35",peak:96});
  insertCareer(database,{id:uuid(5003),userId:weeklyOtherId,nickname:"週榜玩家",rating:600000,era:"v9",weekly:1,weeklyId:"V9-2026W35",peak:95});
  insertCareer(database,{id:uuid(5004),userId:leaderId,nickname:"多生涯玩家",rating:666666,era:"v81",weekly:1,weeklyId:"2026W35",publisher:"8.1.1",peak:96});
  insertCareer(database,{id:uuid(5005),userId:weeklyOtherId,nickname:"週榜玩家",rating:555555,era:"v81",weekly:1,weeklyId:"2026W34",publisher:"8.1.1",peak:94});

  const topResponse=await request("https://local.test/api/careers?metric=power",{DB}),top=await topResponse.json();
  assert.equal(topResponse.status,200);assert.equal(top.rows.length,50);
  assert.equal(top.stats.careers,65);assert.equal(top.stats.players,57);
  assert.ok(top.rows.every(row=>row.ranking_era==="v9"&&!row.weekly_active));
  assert.equal(new Set(top.rows.map(row=>row.user_id)).size,50);
  assert.equal(top.rows.filter(row=>row.user_id===leaderId).length,1);
  assert.equal(top.rows[0].id,uuid(100));
  assert.equal(top.rows[0].public_career_count,9);
  assert.equal(top.rows[0].player_career_rank,1);
  assert.equal(top.rows[0].global_rank,1);
  assert.equal(top.rows[0].ranking_total,57);
  assert.equal(top.rows.some(row=>row.id===uuid(3000)),false);

  const peakResponse=await request("https://local.test/api/careers?metric=peak",{DB}),peakBoard=await peakResponse.json();
  assert.equal(peakBoard.rows[0].id,uuid(101));
  assert.equal(peakBoard.rows[0].public_career_count,9);

  const mineResponse=await request("https://local.test/api/careers?mine=1&metric=power",{DB,headers:{"x-bl-client-id":lowId,"x-bl-client-token":token}}),mine=await mineResponse.json();
  assert.equal(mineResponse.status,200);assert.equal(mine.rows.length,1);
  assert.equal(mine.rows[0].global_rank,57);assert.equal(mine.rows[0].ranking_total,57);

  const leaderMineResponse=await request("https://local.test/api/careers?mine=1&metric=power",{DB,headers:{"x-bl-client-id":leaderId,"x-bl-client-token":leaderToken}}),leaderMine=await leaderMineResponse.json();
  assert.equal(leaderMine.rows.length,9);
  assert.equal(leaderMine.rows.filter(row=>row.global_rank!=null).length,1);
  assert.equal(leaderMine.rows[0].id,uuid(100));
  assert.equal(leaderMine.rows[0].global_rank,1);
  assert.ok(leaderMine.rows.every(row=>row.public_career_count===9&&row.ranking_total===57));
  assert.ok(leaderMine.rows.slice(1).every(row=>row.player_career_rank>1&&row.global_rank==null));

  const oldResponse=await request("https://local.test/api/careers?era=v81&metric=power",{DB}),oldBoard=await oldResponse.json();
  assert.deepEqual(oldBoard.rows.map(row=>row.id),[uuid(4001)]);
  const v9WeeklyResponse=await request("https://local.test/api/careers?era=weekly&metric=power&weekly_id=V9-2026W35",{DB}),v9Weekly=await v9WeeklyResponse.json();
  assert.deepEqual(v9Weekly.rows.map(row=>row.id),[uuid(5001),uuid(5003)]);
  assert.equal(new Set(v9Weekly.rows.map(row=>row.user_id)).size,2);
  assert.equal(v9Weekly.rows[0].public_career_count,2);
  const oldWeeklyResponse=await request("https://local.test/api/careers?era=weekly&metric=power&weekly_id=2026W35",{DB}),oldWeekly=await oldWeeklyResponse.json();
  assert.deepEqual(oldWeekly.rows.map(row=>row.id),[uuid(5004)]);
  const transitionArchiveResponse=await request("https://local.test/api/careers?era=weekly&metric=power&weekly_id=2026W35&archive=1",{DB}),transitionArchive=await transitionArchiveResponse.json();
  assert.deepEqual(transitionArchive.rows.map(row=>row.id),[uuid(5005)]);

  const careerId=uuid(6000),body={
    id:careerId,player_name:"V9 D1 測試",position:"SF",seed:"V9QA4VXX",seed_tier:"SSS+",retired_age:25,final_year:2035,
    peak_overall:82,career_rating:12345,career_games:10,career_salary:100,championships:0,national_caps:0,
    hall_of_fame:[],jersey_retired:[],awards:[],titles:[],league_summary:{NBA:0},season_history:[{year:2034,age:24,path:"台灣職業",games:10}],
    career_data:{ranking_era:"v9",publisher_version:"9.0.0",seed_tier_map_version:2,integrity:{schema:"v9-core-1",verdict:"passed",career_games:10,season_count:1}}
  };
  const postResponse=await request("https://local.test/api/careers",{DB,method:"POST",headers:{"content-type":"application/json","x-bl-client-id":lowId,"x-bl-client-token":token},body:JSON.stringify(body)}),posted=await postResponse.json();
  assert.equal(postResponse.status,200);assert.equal(posted.id,careerId);
  assert.equal(posted.career_data.integrity.server_verified,"passed");
  assert.equal(database.prepare("SELECT ranking_era FROM career_records WHERE id=?").get(careerId).ranking_era,"v9");

  const invalidMapResponse=await request("https://local.test/api/careers",{DB,method:"POST",headers:{"content-type":"application/json","x-bl-client-id":lowId,"x-bl-client-token":token},body:JSON.stringify({...body,id:uuid(6001),career_data:{...body.career_data,seed_tier_map_version:3}})});
  assert.equal(invalidMapResponse.status,422);

  const detailResponse=await request(`https://local.test/api/careers/${careerId}`,{DB}),detail=await detailResponse.json();
  assert.equal(detailResponse.status,200);assert.equal(detail.id,careerId);
  const championsResponse=await request("https://local.test/api/careers?champions=1&era=v81",{DB}),champions=await championsResponse.json();
  assert.ok(champions.champions.length>0);
  assert.ok(champions.champions.every(item=>item.record.ranking_era==="v81"));
  database.close();
});
