const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  throw new AppError('Validation failed', 422, result.array().map((item) => ({
    field: item.path,
    message: item.msg
  })));
};
