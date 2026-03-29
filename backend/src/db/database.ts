import sqlite3 from "sqlite3";
import { schemaSql } from "./schema";

let db: sqlite3.Database | null = null;

export function initDatabase(dbPath = process.env.DB_PATH || "./sentinel.db") {
  if (db) {
    return db;
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      throw err;
    }
  });

  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA synchronous = NORMAL");

  db.exec(schemaSql, (err) => {
    if (err) {
      console.error("Error creating schema:", err.message);
      throw err;
    }
  });

  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database is not initialized; call initDatabase first");
  }

  return db;
}

export function runInTransaction<T>(fn: (txDb: sqlite3.Database) => T): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database is not initialized; call initDatabase first"));
      return;
    }

    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const result = fn(db!);
        db!.run("COMMIT", (commitErr) => {
          if (commitErr) {
            reject(commitErr);
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        db!.run("ROLLBACK", (rollbackErr) => {
          reject(error);
        });
      }
    });
  });
}

// Helper functions for common operations
export function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function runQuerySingle(sql: string, params: any[] = []): Promise<any | undefined> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function runQueryExec(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
