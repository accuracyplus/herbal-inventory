/**
 * A D1-compatible database over node:sqlite, for tests.
 *
 * The point is to exercise the REAL service code — `recordCustodyEvent`, `recordTemperature`,
 * `raiseException` — against a real SQL engine, including the append-only triggers. A mock
 * that reimplements what those functions do would pass whatever they happen to say and prove
 * nothing; this runs the actual statements and the actual constraints.
 *
 * D1's surface is small, so the shim is small:
 *   prepare(sql) → { bind(...), first(), all(), run() }
 *   batch(statements)     — one implicit transaction, as D1 does
 *
 * Two behaviours are copied deliberately because the code under test depends on them:
 *   - `run()` returns `{ meta: { changes } }`, which the optimistic status guard reads.
 *   - `batch()` is atomic: if any statement throws, none of them stick.
 */

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

class Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    // D1 accepts booleans and undefined; SQLite does not.
    this.args = args.map((a) => (typeof a === 'boolean' ? (a ? 1 : 0) : a === undefined ? null : a));
    return this;
  }

  #stmt() {
    return this.db.prepare(this.sql);
  }

  async first() {
    const row = this.#stmt().get(...this.args);
    return row ?? null;
  }

  async all() {
    return { results: this.#stmt().all(...this.args) };
  }

  async run() {
    const r = this.#stmt().run(...this.args);
    return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

export class TestD1 {
  constructor(schemaPath) {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(readFileSync(schemaPath, 'utf8'));
  }

  prepare(sql) {
    return new Statement(this.db, sql);
  }

  async batch(statements) {
    this.db.exec('BEGIN');
    try {
      const out = [];
      for (const s of statements) out.push(await s.run());
      this.db.exec('COMMIT');
      return out;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  /** Convenience for arranging test data without going through the service layer. */
  exec(sql) {
    this.db.exec(sql);
  }

  query(sql, ...args) {
    return this.db.prepare(sql).all(...args);
  }
}

/** A minimal `env`, with the bindings the domain code actually reads. */
export function testEnv(schemaPath) {
  return {
    DB: new TestD1(schemaPath),
    // No NOTIFY binding: the code calls it with optional chaining and must not depend on it.
  };
}
