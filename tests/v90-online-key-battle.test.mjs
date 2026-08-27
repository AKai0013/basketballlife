import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {DatabaseSync} from "node:sqlite";
import {fileURLToPath} from "node:url";
import {onRequest} from "../functions/api/[[path]].js";

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=name=>fs.readFileSync(path.join(root,name),"utf8");
const frontend=source("js/online/key-battle.js"),storage=source("js/storage.js"),career=source("js/ui/career-view.js"),season=source("js/career/season-engine.js");
class Statement{constructor(database,sql){this.database=database;this.sql=sql;this.args=[]}bind(...args){this.args=args;return this}async first(){return this.database.prepare(this.sql).get(...this.args)||null}async all(){return {results:this.database.prepare(this.sql).all(...this.args)}}async run(){const result=this.database.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(result.changes||0)}}}}
class D1{constructor(database){this.database=database}prepare(sql){return new Statement(this.database,sql)}async batch(rows){return Promise.all(rows.map(row=>row.run()))}}
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(byte=>byte.toString(16).padStart(2,"0")).join("");
const users=[1,2,3].map(index=>({id:`0000000${index}-0000-4000-8000-00000000000${index}`,token:`token-${index}-`.padEnd(40,String(index)),nickname:`玩家${index}`}));
async function call(DB,user,route,method="GET",body){const request=new Request(`https://preview.test/api/online/key-battle/${route}`,{method,headers:{"content-type":"application/json","x-bl-client-id":user.id,"x-bl-client-token":user.token},body:body===undefined?undefined:JSON.stringify(body)}),response=await onRequest({request,env:{DB},params:{path:["online","key-battle",...route.split("/")]}});return {status:response.status,body:await response.json()}}
async function setup(){const database=new DatabaseSync(":memory:");database.exec("PRAGMA foreign_keys=ON");for(const name of ["0001_basketballlife_d1.sql","0002_leaderboard_read_optimization.sql","0003_v81_leaderboard_era.sql","0004_v9_leaderboard_era.sql","0005_online_key_battle.sql","0008_online_shared_world.sql"])database.exec(source(`migrations/${name}`));for(const user of users)database.prepare("INSERT INTO profiles(user_id,token_hash,nickname) VALUES(?,?,?)").run(user.id,await digest(user.token),user.nickname);return {database,DB:new D1(database)}}
async function createWorld(DB,mode="complete"){const created=await call(DB,users[0],"rooms","POST",{role:"guard"}),code=created.body.room.code;await call(DB,users[1],`rooms/${code}/join`,"POST",{role:"wing"});return {code,started:await call(DB,users[0],`rooms/${code}/start`,"POST",{mode})}}
const snapshot=(ready,year=2026)=>({year,age:16,path:"HBL",team:"測試高中",overall:58,health:91,reputation:30,stage:"points",mode:"complete",ready});

test("shared career launches the real solo engine instead of server-authored event options",()=>{assert.match(frontend,/startCareer\(context\)/);assert.match(frontend,/resumeShared\(context\.code\)/);assert.doesNotMatch(frontend,/event\.options/);assert.match(season,/BasketballLifeKeyBattle\?\.finishSeason/);assert.match(career,/function startCareer\(sharedContext=null\)/)});

test("each player keeps the complete solo character setup",()=>{for(const field of ["pos","height","wingspan","birthplace","handedness","jerseyNumber","seed","mode"])assert.match(frontend,new RegExp(`${field}:`));assert.match(frontend,/setupSeedValue\(\)/);assert.match(career,/sharedContext\?\.handedness/)});

test("shared saves are isolated from the normal single-player save",()=>{assert.match(storage,/\.shared\.\$\{String\(code/);assert.match(storage,/activeCareerSaveKey/);assert.match(storage,/if\(saveKey===CAREER_SAVE_KEY\)updateContinueCareerPanel/)});

test("room owner chooses complete or highlight and the server returns the solo engine contract",async()=>{const {database,DB}=await setup(),{started}=await createWorld(DB,"highlight");assert.equal(started.status,200);assert.equal(started.body.world.engine,"solo-v9");assert.equal(started.body.world.mode,"highlight");assert.match(started.body.world.seed,/^[A-Z2-9]{6}SW$/);assert.equal(started.body.careers.length,2);database.close()});

test("season boundary waits for every human before advancing",async()=>{const {database,DB}=await setup(),{code}=await createWorld(DB);let state=await call(DB,users[0],`rooms/${code}/sync`,"POST",snapshot(true));assert.equal(state.status,200);assert.equal(state.body.advance,false);assert.equal(state.body.players.filter(row=>row.ready).length,1);state=await call(DB,users[1],`rooms/${code}/sync`,"POST",snapshot(true));assert.equal(state.body.advance,true);assert.ok(state.body.players.every(row=>row.ready));database.close()});
