import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("weekly leaderboard keeps the release-week V8.1 board active until V9 starts",async()=>{
  const source=await readFile(new URL("../js/ui/home-view.js",import.meta.url),"utf8");
  const start=source.indexOf("const WEEKLY_SEED_OVERRIDES=");
  const end=source.indexOf("function renderWeeklyChallenge()",start);
  const profiles=new Function("hash","POSITIONS","bodyRangeFor",`${source.slice(start,end)};return {weeklyChallengeProfile,weeklyLeaderboardProfile};`)(() => 1,["PG"],() => ({defaultHeight:188,defaultReach:8}));

  const releaseWeek=profiles.weeklyLeaderboardProfile(new Date("2026-08-25T09:00:00+08:00"));
  const firstV9Week=profiles.weeklyLeaderboardProfile(new Date("2026-08-31T09:00:00+08:00"));

  assert.equal(releaseWeek.periodId,"2026W35");
  assert.equal(releaseWeek.id,"2026W35");
  assert.equal(releaseWeek.legacy,true);
  assert.equal(firstV9Week.periodId,"2026W36");
  assert.equal(firstV9Week.id,"V9-2026W36");
  assert.equal(firstV9Week.legacy,false);
});
