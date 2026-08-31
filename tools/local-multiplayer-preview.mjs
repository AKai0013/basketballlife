import { webcrypto } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { onRequest } from "../functions/api/[[path]].js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ports = String(process.env.BL_QA_PORTS || process.env.BL_QA_PORT || 8791)
  .split(",")
  .map(value => Number(value.trim()))
  .filter(value => Number.isInteger(value) && value > 0);
const databasePath = path.resolve(
  process.env.BL_QA_DB || path.join(os.tmpdir(), "basketballlife-multiplayer-qa.sqlite")
);
const migrationNames = [
  "0001_basketballlife_d1.sql",
  "0002_leaderboard_read_optimization.sql",
  "0003_v81_leaderboard_era.sql",
  "0004_v9_leaderboard_era.sql",
  "0005_online_key_battle.sql",
  "0008_online_shared_world.sql"
];

class Statement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first(column) {
    const row = this.database.prepare(this.sql).get(...this.args) || null;
    return column && row ? row[column] : row;
  }

  async all() {
    return { results: this.database.prepare(this.sql).all(...this.args) };
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(result.changes || 0) } };
  }
}

class LocalD1 {
  constructor(database) {
    this.database = database;
  }

  prepare(sql) {
    return new Statement(this.database, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map(statement => statement.run()));
  }
}

const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys=ON");
for (const migrationName of migrationNames) {
  database.exec(fs.readFileSync(path.join(root, "migrations", migrationName), "utf8"));
}
const DB = new LocalD1(database);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"]
]);

function sendStatic(request, response, pathname) {
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${root}${path.sep}`) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": mimeTypes.get(path.extname(target).toLowerCase()) || "application/octet-stream"
  });
  if (request.method === "HEAD") response.end();
  else fs.createReadStream(target).pipe(response);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function handleRequest(request, response) {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `localhost:${ports[0]}`}`);
    if (!url.pathname.startsWith("/api/")) {
      sendStatic(request, response, url.pathname);
      return;
    }

    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request);
    const workerRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body
    });
    const workerResponse = await onRequest({
      request: workerRequest,
      env: { DB },
      params: { path: url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean) }
    });
    response.writeHead(workerResponse.status, Object.fromEntries(workerResponse.headers.entries()));
    response.end(Buffer.from(await workerResponse.arrayBuffer()));
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Local preview failed" }));
  }
}

const servers = ports.map(port => {
  const server = http.createServer(handleRequest);
  server.listen(port, "127.0.0.1", () => {
    console.log(`LOCAL_PREVIEW_READY http://127.0.0.1:${port} DB=${databasePath}`);
  });
  return server;
});

function shutdown() {
  let remaining = servers.length;
  for (const server of servers) {
    server.close(() => {
      remaining -= 1;
      if (remaining === 0) {
        database.close();
        process.exit(0);
      }
    });
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
