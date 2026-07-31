const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
      scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'", "'unsafe-eval'"],
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

app.use('/uploads', express.static(path.join(__dirname, '../', env.uploadDir)));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

app.get('/health', (req, res) => ok(res, { status: 'healthy' }, 'API is running'));
app.get('/admin', (req, res) => {
  if (!req.originalUrl.endsWith('/')) {
    return res.redirect('/admin/');
  }
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// All API routes — NO rate limiters attached
app.use('/api/brand', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticate, userRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
