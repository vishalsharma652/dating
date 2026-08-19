const env = require('../config/env');

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'MulterError') {
    statusCode = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = `File too large. Maximum allowed size is ${env.maxFileSizeMb}MB.`;
    } else {
      message = error.message;
    }
  } else if (error.message === 'Only image uploads are allowed') {
    statusCode = 400;
  }

  if (statusCode >= 500) {
    console.error(`[ServerError] ${req.method} ${req.originalUrl}:`, error);
  }

  const payload = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message
  };

  if (error.details) payload.errors = error.details;
  if (env.nodeEnv !== 'production') payload.stack = error.stack;

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
