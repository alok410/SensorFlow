import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import secretaryRoutes from "./routes/secretary.routes.js";

const app = express();

// ✅ Allowed frontend domains
const allowedOrigins = [
  "http://localhost:8080",
  "https://sensor-flow-kappa.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// ✅ USE SAME OPTIONS FOR EVERYTHING
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/secretaries", secretaryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

export default app;
