'use strict';
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite'); // built into Node.js 22.13+ (no install needed)

/**
 * Opens (and creates, if needed) the SQLite database and makes sure
 * the `students` table exists.
 * @param {string} file - path to the .db file, or ':memory:' for tests
 */
function createDatabase(file = process.env.DB_FILE || './data/students.db') {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      roll_no     TEXT    NOT NULL UNIQUE,
      department  TEXT    NOT NULL,
      semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

module.exports = { createDatabase };
