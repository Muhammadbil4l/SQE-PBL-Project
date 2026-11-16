'use strict';
const { createDatabase } = require('./src/db');
const { createApp } = require('./src/app');

const PORT = process.env.PORT || 3000;
const db = createDatabase();
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log(`Student API running at http://localhost:${PORT}`);
  console.log(`Try: GET http://localhost:${PORT}/api/students`);
});

// Graceful shutdown (closes the DB properly on Ctrl+C)
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
