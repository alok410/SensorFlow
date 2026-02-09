// Import dependencies using ES module syntax
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';

const app = express();

// 🔥 CORS CONFIG (MUST BE FIRST)
app.use(cors({
  origin: [
    "http://localhost:8080",
    "https://sensor-flow-nbgt.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// 🔥 REQUIRED FOR PREFLIGHT
app.options("*", cors());

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/locations", locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

export default app;
