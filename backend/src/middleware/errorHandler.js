const env = require('../config/env');

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message
  };

  if (error.details) payload.errors = error.details;
  if (env.nodeEnv !== 'production') payload.stack = error.stack;

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
