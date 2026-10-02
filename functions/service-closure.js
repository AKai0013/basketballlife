const SERVICE_END=Date.parse("2026-10-11T12:00:00+08:00");

export function serviceClosureResponse(request,now=Date.now()) {
  if(now<SERVICE_END)return null;
  const headers={"cache-control":"no-store"};
  const api=new URL(request.url).pathname.startsWith("/api/");
  headers["content-type"]=api?"application/json; charset=utf-8":"text/html; charset=utf-8";
  const body=api?JSON.stringify({error:"BasketballLife 已於 2026 年 10 月 11 日中午 12:00（台灣時間）停止運營。",code:"SERVICE_CLOSED"}):`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BasketballLife 已停止運營</title>
<style>body{margin:0;padding:32px 20px;background:#080f15;color:#f7efe5;font:16px/1.8 system-ui,sans-serif}main{max-width:640px;margin:12vh auto;padding:24px;border:1px solid #805334;border-radius:16px;background:#1c140e}h1{color:#ffc89f;font-size:28px;line-height:1.4}</style></head>
<body><main><h1>BasketballLife 已停止運營</h1><p>本遊戲已於 2026 年 10 月 11 日中午 12:00（台灣時間）停止運營。</p><p>遊戲網站、伺服器資料及相關專案內容將進行刪除清理。感謝每一位玩家的陪伴。</p></main></body></html>`;
  return new Response(request.method==="HEAD"?null:body,{status:410,headers});
}
