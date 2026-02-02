import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

// ✅ Connect DB once (cached)
await connectDB();

// ❌ NO app.listen()
// ✅ Export app for Vercel
export default app;
