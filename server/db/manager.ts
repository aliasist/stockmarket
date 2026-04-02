/**
 * DatabaseManager — unified interface for all four databases:
 *   - sqlite    : local SQLite file via better-sqlite3
 *   - d1        : Cloudflare D1 primary (market-pulse) via REST API
 *   - d1Analytics: Cloudflare D1 secondary (aliasist-analytics) via REST API
 *   - neon      : NeonDB (PostgreSQL-compatible) via @neondatabase/serverless
 *
 * Usage:
 *   const rows = await dbManager.executeQuery('sqlite', 'SELECT * FROM watchlist')
 *   const rows = await dbManager.executeQuery('d1', 'SELECT * FROM scrub_runs')
 *   const rows = await dbManager.executeQuery('neon', 'SELECT * FROM users')
 */

import BetterSqlite3 from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import axios from "axios";
import path from "path";
import fs from "fs";

export type DatabaseName = "sqlite" | "d1" | "d1Analytics" | "neon";

export interface TableInfo {
  database: DatabaseName;
  tables: string[];
}

export class DatabaseManager {
  private _sqlite: BetterSqlite3.Database | null = null;
  private _neon: NeonQueryFunction<false, false> | null = null;

  private readonly sqlitePath: string;
  private readonly cfAccountId: string;
  private readonly cfApiToken: string;
  private readonly cfD1DbId: string;
  private readonly cfD1AnalyticsDbId: string;
  private readonly neonDatabaseUrl: string;

  constructor(env?: {
    DATABASE_PATH?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_API_TOKEN?: string;
    CLOUDFLARE_D1_DB_ID?: string;
    CLOUDFLARE_D1_ANALYTICS_DB_ID?: string;
    NEON_DATABASE_URL?: string;
  }) {
    const e = env ?? process.env as Record<string, string | undefined>;
    this.sqlitePath = e.DATABASE_PATH
      ? path.resolve(e.DATABASE_PATH)
      : path.join(process.cwd(), "market_pulse.db");
    this.cfAccountId = e.CLOUDFLARE_ACCOUNT_ID ?? "";
    this.cfApiToken = e.CLOUDFLARE_API_TOKEN ?? "";
    this.cfD1DbId = e.CLOUDFLARE_D1_DB_ID ?? "";
    this.cfD1AnalyticsDbId = e.CLOUDFLARE_D1_ANALYTICS_DB_ID ?? "";
    this.neonDatabaseUrl = e.NEON_DATABASE_URL ?? "";
  }

  // ── Availability checks ───────────────────────────────────────────────────

  isSqliteAvailable(): boolean {
    return true; // always available — file is created on first access
  }

  isD1Available(): boolean {
    return !!(this.cfAccountId && this.cfApiToken && this.cfD1DbId);
  }

  isD1AnalyticsAvailable(): boolean {
    return !!(this.cfAccountId && this.cfApiToken && this.cfD1AnalyticsDbId);
  }

  isNeonAvailable(): boolean {
    return !!this.neonDatabaseUrl;
  }

  // ── Connection accessors ──────────────────────────────────────────────────

  getSqlite(): BetterSqlite3.Database {
    if (!this._sqlite) {
      const dir = path.dirname(this.sqlitePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this._sqlite = new BetterSqlite3(this.sqlitePath);
      this._sqlite.pragma("journal_mode = WAL");
      this._sqlite.pragma("foreign_keys = ON");
    }
    return this._sqlite;
  }

  getNeon(): NeonQueryFunction<false, false> {
    if (!this.neonDatabaseUrl) {
      throw new Error("NEON_DATABASE_URL is not configured");
    }
    if (!this._neon) {
      this._neon = neon(this.neonDatabaseUrl);
    }
    return this._neon;
  }

  // ── Unified query execution ───────────────────────────────────────────────

  async executeQuery(
    database: DatabaseName,
    sql: string,
    params: unknown[] = []
  ): Promise<Record<string, unknown>[]> {
    switch (database) {
      case "sqlite":
        return this._querySqlite(sql, params);
      case "d1":
        return this._queryD1(sql, params);
      case "d1Analytics":
        return this._queryD1Analytics(sql, params);
      case "neon":
        return this._queryNeon(sql, params);
      default:
        throw new Error(`Unknown database: ${database as string}`);
    }
  }

  // ── SQLite ────────────────────────────────────────────────────────────────

  private _querySqlite(
    sql: string,
    params: unknown[]
  ): Record<string, unknown>[] {
    const stmt = this.getSqlite().prepare(sql);
    const trimmed = sql.trimStart().toUpperCase();
    if (trimmed.startsWith("SELECT") || trimmed.startsWith("WITH")) {
      return stmt.all(...params) as Record<string, unknown>[];
    }
    const info = stmt.run(...params);
    return [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }];
  }

  // ── Cloudflare D1 (primary) ───────────────────────────────────────────────

  private async _queryD1(
    sql: string,
    params: unknown[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.isD1Available()) {
      throw new Error(
        "D1 primary database is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / CLOUDFLARE_D1_DB_ID)"
      );
    }
    return this._cfD1Query(this.cfD1DbId, sql, params);
  }

  // ── Cloudflare D1 (analytics) ─────────────────────────────────────────────

  private async _queryD1Analytics(
    sql: string,
    params: unknown[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.isD1AnalyticsAvailable()) {
      throw new Error(
        "D1 analytics database is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / CLOUDFLARE_D1_ANALYTICS_DB_ID)"
      );
    }
    return this._cfD1Query(this.cfD1AnalyticsDbId, sql, params);
  }

  // ── Shared Cloudflare D1 REST helper ─────────────────────────────────────

  private async _cfD1Query(
    dbId: string,
    sql: string,
    params: unknown[]
  ): Promise<Record<string, unknown>[]> {
    const resp = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/d1/database/${dbId}/query`,
      { sql, params },
      {
        headers: {
          Authorization: `Bearer ${this.cfApiToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return (resp.data?.result?.[0]?.results ?? []) as Record<string, unknown>[];
  }

  // ── NeonDB ────────────────────────────────────────────────────────────────

  private async _queryNeon(
    sql: string,
    params: unknown[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.isNeonAvailable()) {
      throw new Error("NeonDB is not configured (NEON_DATABASE_URL)");
    }
    const queryFn = this.getNeon();
    const rows = await queryFn.query(sql, params);
    return rows as Record<string, unknown>[];
  }

  // ── Schema inspection ─────────────────────────────────────────────────────

  async getTableInfo(database: DatabaseName): Promise<TableInfo> {
    let tables: string[] = [];
    switch (database) {
      case "sqlite": {
        const rows = this._querySqlite(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
          []
        );
        tables = rows.map((r) => r["name"] as string);
        break;
      }
      case "d1":
      case "d1Analytics": {
        const rows = await this.executeQuery(
          database,
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
          []
        );
        tables = rows.map((r) => r["name"] as string);
        break;
      }
      case "neon": {
        const rows = await this._queryNeon(
          "SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
          []
        );
        tables = rows.map((r) => r["name"] as string);
        break;
      }
    }
    return { database, tables };
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  close(): void {
    if (this._sqlite) {
      this._sqlite.close();
      this._sqlite = null;
    }
    // neon HTTP connections are stateless — nothing to close
  }
}

/** Singleton instance pre-configured from process.env */
export const dbManager = new DatabaseManager();
