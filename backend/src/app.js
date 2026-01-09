// Import dependencies using ES module syntax
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

export default app;
