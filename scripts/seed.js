'use strict';
// Adds a few sample students so the database is not empty during the demo.
const { createDatabase } = require('../src/db');
const db = createDatabase();

const samples = [
  ['Ali Ahmed', 'K22SW001', 'Software Engineering', 6],
  ['Sara Khan', 'K22SW002', 'Software Engineering', 6],
  ['Usman Raza', 'K22SW003', 'Software Engineering', 6],
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO students (name, roll_no, department, semester) VALUES (?, ?, ?, ?)'
);
let added = 0;
for (const s of samples) added += Number(insert.run(...s).changes);
console.log(`Seed complete: ${added} new record(s) added.`);
db.close();
