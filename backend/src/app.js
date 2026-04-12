// Import dependencies using ES module syntax
import express from 'express';
import cors from 'cors';
import http from 'http'; // ✅ NEW
import { Server } from 'socket.io'; // ✅ NEW

import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js'
import secretaryRoutes from "./routes/secretary.routes.js";
import consumerRoutes from "./routes/consumer.routes.js";
import meterRoutes from "./routes/meter.routes.js";
import waterRateRoutes from "./routes/waterRate.routes.js";

const app = express();

// ✅ CREATE HTTP SERVER (important for socket)
const server = http.createServer(app);

// ✅ INIT SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*", // change in production
  },
});

// ✅ MAKE IO GLOBAL (so controller can use it)
app.set("io", io);

// Optional: connection log
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/secretaries", secretaryRoutes);
app.use("/api/consumers", consumerRoutes);
app.use("/api/meter", meterRoutes);
app.use("/api/water-rate", waterRateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SensorFlow API running' });
});

// ❌ REMOVE export default app
// ✅ EXPORT SERVER INSTEAD
export { server };