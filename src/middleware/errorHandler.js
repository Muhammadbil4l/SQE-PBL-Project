'use strict';

/** 404 for any route that does not exist. */
function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
}

/** Central error handler: always answers with JSON. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Request body contains invalid JSON',
    });
  }
  // Body too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload Too Large', message: 'Request body is too large' });
  }
  // SQLite UNIQUE constraint (duplicate roll number)
  if (err.errcode === 2067 || /UNIQUE constraint failed/.test(err.message || '')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A student with this rollNo already exists',
    });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
