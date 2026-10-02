import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {serviceClosureResponse} from "../functions/service-closure.js";
import {onRequest} from "../functions/_middleware.js";

const cutoff=Date.parse("2026-10-11T04:00:00Z");

test("service remains available until the exact Taiwan noon cutoff",()=>{
  for(const route of ["/","/index.html","/api/health","/js/state.js"]){
    assert.equal(serviceClosureResponse(new Request(`https://basketballlife.pages.dev${route}`),cutoff-1),null);
  }
});

test("the cutoff blocks pages, assets, API reads and API writes with no-store 410",async()=>{
  for(const [route,method] of [["/","GET"],["/index.html","GET"],["/js/state.js","GET"],["/api/health","GET"],["/api/careers","POST"],["/api/careers","DELETE"],["/","HEAD"]]){
    const response=serviceClosureResponse(new Request(`https://basketballlife.pages.dev${route}`,{method}),cutoff);
    assert.equal(response.status,410);
    assert.equal(response.headers.get("cache-control"),"no-store");
    if(method==="HEAD")assert.equal(await response.text(),"");
    else if(route.startsWith("/api/"))assert.equal((await response.json()).code,"SERVICE_CLOSED");
    else assert.match(await response.text(),/已停止運營/);
  }
});

test("expired requests never reach the game, API or database handler",async(t)=>{
  t.mock.method(Date,"now",()=>cutoff);
  let called=false;
  const response=await onRequest({request:new Request("https://basketballlife.pages.dev/api/careers",{method:"POST"}),next(){called=true;throw new Error("must not reach backend")}});
  assert.equal(response.status,410);
  assert.equal(called,false);
});

test("all production routes pass through the shutdown middleware",()=>{
  const routes=JSON.parse(fs.readFileSync(new URL("../_routes.json",import.meta.url),"utf8"));
  assert.deepEqual(routes.include,["/*"]);
  assert.deepEqual(routes.exclude,[]);
});
