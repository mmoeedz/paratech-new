import "server-only";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

type Param = SQLInputValue;
type Row = Record<string, unknown>;

const globalForDb = globalThis as unknown as { __crmDb?: DatabaseSync };

function open(): DatabaseSync {
  const file = process.env.CRM_DB_PATH || "./data/crm.db";
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(/* turbopackIgnore: true */ file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  return db;
}

export function db(): DatabaseSync {
  if (!globalForDb.__crmDb) globalForDb.__crmDb = open();
  return globalForDb.__crmDb;
}

/** Test helper: drop the singleton so the next call opens a fresh database. */
export function resetDbForTests() {
  globalForDb.__crmDb?.close();
  globalForDb.__crmDb = undefined;
}

export function all<T = Row>(sql: string, ...params: Param[]): T[] {
  return db().prepare(sql).all(...params) as T[];
}

export function get<T = Row>(sql: string, ...params: Param[]): T | undefined {
  return db().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: Param[]) {
  const r = db().prepare(sql).run(...params);
  return { changes: Number(r.changes), id: Number(r.lastInsertRowid) };
}

export function insert(sql: string, ...params: Param[]): number {
  return run(sql, ...params).id;
}

let txDepth = 0;

/** Run `fn` inside a transaction (nestable via savepoints); rolls back if it throws. */
export function tx<T>(fn: () => T): T {
  const d = db();
  const outer = txDepth === 0;
  const sp = `sp_${txDepth}`;
  d.exec(outer ? "BEGIN IMMEDIATE" : `SAVEPOINT ${sp}`);
  txDepth++;
  try {
    const result = fn();
    txDepth--;
    d.exec(outer ? "COMMIT" : `RELEASE ${sp}`);
    return result;
  } catch (e) {
    txDepth--;
    d.exec(outer ? "ROLLBACK" : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
    throw e;
  }
}

export const now = () => new Date().toISOString();
