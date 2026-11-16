'use strict';
const express = require('express');
const cors = require('cors');
const studentRoutes = require('./routes/students');
const { notFound, errorHandler } = require('./middleware/errorHandler');

/** Builds the Express app. The database is injected so tests can use an in-memory DB. */
function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (req, res) => {
    res.json({
      name: 'Student CRUD API',
      course: 'SW426 - Software Quality Engineering',
      endpoints: '/api/students',
    });
  });

  app.use('/api/students', studentRoutes(db));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
