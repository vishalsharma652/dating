const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const brandRoutes = require('./routes/brandRoutes');
const { authenticate } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { ok } = require('./utils/apiResponse');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"]
    }
  }
}));
const allowedOrigins = env.nodeEnv === 'production'
  ? [env.appUrl]
  : (origin, cb) => cb(null, true); // allow all origins in development
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
// General rate limiter — generous to support polling (messages every 3s + wallet every 5s)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 2000,              // 2000 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  },
}));
app.use('/uploads', express.static(path.join(__dirname, '../', env.uploadDir)));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

app.get('/health', (req, res) => ok(res, { status: 'healthy' }, 'API is running'));
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});
// Auth-specific limiter — stricter to prevent brute-force login/register attempts
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many attempts. Please wait 15 minutes before trying again.' });
  },
});
app.use('/api/brand', brandRoutes);
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/user', authenticate, userRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
