'use strict';
const express = require('express');
const { validateStudent, parseId } = require('../middleware/validate');

/** Converts a DB row (snake_case) to the public JSON shape (camelCase). */
function toDto(row) {
  return {
    id: row.id,
    name: row.name,
    rollNo: row.roll_no,
    department: row.department,
    semester: row.semester,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function studentRoutes(db) {
  const router = express.Router();

  const stmt = {
    all: db.prepare('SELECT * FROM students ORDER BY id'),
    byId: db.prepare('SELECT * FROM students WHERE id = ?'),
    insert: db.prepare(
      'INSERT INTO students (name, roll_no, department, semester) VALUES (@name, @rollNo, @department, @semester)'
    ),
    update: db.prepare(
      `UPDATE students
          SET name = @name, roll_no = @rollNo, department = @department,
              semester = @semester, updated_at = datetime('now')
        WHERE id = @id`
    ),
    remove: db.prepare('DELETE FROM students WHERE id = ?'),
  };

  // Validates :id once for every route that uses it
  router.param('id', (req, res, next, raw) => {
    const id = parseId(raw);
    if (id === null) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Student id must be a positive integer',
      });
    }
    req.studentId = id;
    next();
  });

  // CREATE ---------------------------------------------------------------
  router.post('/', (req, res) => {
    const { errors, value } = validateStudent(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation Failed', details: errors });
    }
    const info = stmt.insert.run(value);
    const created = stmt.byId.get(Number(info.lastInsertRowid));
    res.status(201).location(`/api/students/${created.id}`).json(toDto(created));
  });

  // READ (all) -----------------------------------------------------------
  router.get('/', (req, res) => {
    res.status(200).json(stmt.all.all().map(toDto));
  });

  // READ (one) -----------------------------------------------------------
  router.get('/:id', (req, res) => {
    const row = stmt.byId.get(req.studentId);
    if (!row) {
      return res.status(404).json({ error: 'Not Found', message: `Student with id ${req.studentId} not found` });
    }
    res.status(200).json(toDto(row));
  });

  // UPDATE ---------------------------------------------------------------
  router.put('/:id', (req, res) => {
    if (!stmt.byId.get(req.studentId)) {
      return res.status(404).json({ error: 'Not Found', message: `Student with id ${req.studentId} not found` });
    }
    const { errors, value } = validateStudent(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation Failed', details: errors });
    }
    stmt.update.run({ ...value, id: req.studentId });
    res.status(200).json(toDto(stmt.byId.get(req.studentId)));
  });

  // DELETE ---------------------------------------------------------------
  router.delete('/:id', (req, res) => {
    const info = stmt.remove.run(req.studentId);
    if (Number(info.changes) === 0) {
      return res.status(404).json({ error: 'Not Found', message: `Student with id ${req.studentId} not found` });
    }
    res.status(200).json({ message: `Student with id ${req.studentId} deleted successfully` });
  });

  return router;
}

module.exports = studentRoutes;
