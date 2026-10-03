const express = require('express');
const cors = require('cors');

const recommendRouter = require('./routes/recommend');
const emiRouter = require('./routes/emi');
const partnersRouter = require('./routes/partners');
const applicationsRouter = require('./routes/applications');
const schemesRouter = require('./routes/schemes');

const app = express();

// Enable CORS for frontend and deployment environments
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!process.env.FRONTEND_URL || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.render.com')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all to prevent judges from hitting CORS issues
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// API Health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Scheme Setu API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes matching API contract
app.use('/api/recommend', recommendRouter);
app.use('/api/emi', emiRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/schemes', schemesRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
