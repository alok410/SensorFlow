// Import dependencies using ES module syntax
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js'
import secretaryRoutes from "./routes/secretary.routes.js";

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:8080", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/sec', authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/secretaries", secretaryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

export default app;
