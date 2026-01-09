import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js"
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

(async () => {
  const passwordHash = await bcrypt.hash('123456', 10);

  await User.create({
    email: 'admin@demo.com',
    password: passwordHash,
    name: 'System Administrator',
    role: 'admin',
    isActive: true
  });

  console.log('✅ Admin user created');
  process.exit();
})();
