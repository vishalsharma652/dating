const { verifyToken } = require('../utils/token');
const userModel = require('../models/userModel');
const { AppError } = require('../utils/errors');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(new AppError('Authentication token is required', 401));

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return next(new AppError('Invalid authentication token', 401));
    }

    const user = await userModel.findById(payload.id);
    if (!user) return next(new AppError('Account not found', 401));
    if (user.status && user.status !== 'active') {
      return next(new AppError('Your account is inactive. Please contact the administrator.', 403));
    }

    await userModel.markOnline(user.id);
    delete user.password_hash;
    req.user = { ...user, online_status: 1, last_seen_at: new Date() };
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError('Invalid authentication token', 401));
  }
}


function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
