// Import dependencies
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import secretaryRoutes from './routes/secretary.routes.js';

const app = express();

/* =======================
   CORS FIX (CRITICAL)
======================= */

const allowedOrigins = [
  'https://sensor-flow-kappa.vercel.app',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

/* =======================
   ROUTES
======================= */

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/secretaries', secretaryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

export default app;
