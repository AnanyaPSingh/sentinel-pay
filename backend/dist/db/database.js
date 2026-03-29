"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
exports.runInTransaction = runInTransaction;
exports.runQuery = runQuery;
exports.runQuerySingle = runQuerySingle;
exports.runQueryExec = runQueryExec;
const sqlite3_1 = __importDefault(require("sqlite3"));
const schema_1 = require("./schema");
let db = null;
function initDatabase(dbPath = process.env.DB_PATH || "./sentinel.db") {
    if (db) {
        return db;
    }
    db = new sqlite3_1.default.Database(dbPath, (err) => {
        if (err) {
            console.error("Error opening database:", err.message);
            throw err;
        }
    });
    db.run("PRAGMA journal_mode = WAL");
    db.run("PRAGMA foreign_keys = ON");
    db.run("PRAGMA synchronous = NORMAL");
    db.exec(schema_1.schemaSql, (err) => {
        if (err) {
            console.error("Error creating schema:", err.message);
            throw err;
        }
    });
    return db;
}
function getDatabase() {
    if (!db) {
        throw new Error("Database is not initialized; call initDatabase first");
    }
    return db;
}
function runInTransaction(fn) {
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
                const result = fn(db);
                db.run("COMMIT", (commitErr) => {
                    if (commitErr) {
                        reject(commitErr);
                    }
                    else {
                        resolve(result);
                    }
                });
            }
            catch (error) {
                db.run("ROLLBACK", (rollbackErr) => {
                    reject(error);
                });
            }
        });
    });
}
// Helper functions for common operations
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}
function runQuerySingle(sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(row);
            }
        });
    });
}
function runQueryExec(sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
//# sourceMappingURL=database.js.map