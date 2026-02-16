// Import dependencies using ES module syntax
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js'
import secretaryRoutes from "./routes/secretary.routes.js";

const app = express();


// ✅ Allow both frontend URLs
const allowedOrigins = [
  "http://localhost:8080",
  "https://sensor-flow-kappa.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// ✅ Handle preflight explicitly
app.options("*", cors());
app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/secretaries", secretaryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

export default app;
