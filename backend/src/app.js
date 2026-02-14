// Import dependencies using ES module syntax
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js'

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/locations", locationRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK2', message: 'SensorFlow API running' });
});

export default app;
