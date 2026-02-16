import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import secretaryRoutes from "./routes/secretary.routes.js";

const app = express();

console.log("🔥 NEW DEPLOYMENT ACTIVE - CORS FIX APPLIED");

// ✅ Allowed frontend domains
const allowedOrigins = [
  "http://localhost:8080",
  "https://sensor-flow-kappa.vercel.app"
];

// ✅ Manual CORS handler (Vercel-safe)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // ✅ Handle preflight request directly
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/secretaries", secretaryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running - Updated' });
});

export default app;
