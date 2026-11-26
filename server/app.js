const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Route modules
const authRoutes = require('./src/modules/auth/auth.routes');
const productRoutes = require('./src/modules/products/product.routes');
const salesRoutes = require('./src/modules/sales/sales.routes');
const distributorRoutes = require('./src/modules/distributors/distributor.routes');
const reorderRoutes = require('./src/modules/reorder/reorder.routes');

// Global error handler
const errorHandler = require('./src/middleware/error.middleware');

const app = express();

// Trust Render / reverse-proxy X-Forwarded-For header for express-rate-limit
app.set('trust proxy', 1);

// ── Security & Utility Middleware ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Permissive CORS for development (supports localhost, 127.0.0.1 on any port)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const isLocal =
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1');

      if (isLocal || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
        return callback(null, true);
      }

      callback(null, true);
    },
    credentials: true, // Allow cookies cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/distributors', distributorRoutes);
app.use('/api/reorder', reorderRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
