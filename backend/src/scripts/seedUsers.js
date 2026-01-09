import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Location from "../models/Location.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

// ❌ Remove old data (keep admin)
await User.deleteMany({ role: { $ne: "admin" } });
await Location.deleteMany();

// 📍 LOCATIONS
const ahmedabad = await Location.create({
  name: "Ahmedabad",
  code: "AMD",
});

const dediyasan = await Location.create({
  name: "Dediyasan",
  code: "DDN",
});

// 🔐 Common password for all
const password = await bcrypt.hash("123456", 10);

// 🧑‍💼 SECRETARIES (2)
const secretaries = [
  {
    name: "Ahmedabad Secretary",
    email: "ahd.sec@demo.com",
    role: "secretary",
    location: ahmedabad._id,
    password,
  },
  {
    name: "Dediyasan Secretary",
    email: "ddn.sec@demo.com",
    role: "secretary",
    location: dediyasan._id,
    password,
  },
];

// 👤 CONSUMERS (10) with meterId
const consumers = [
  // Ahmedabad (5)
  "ahd.c1@demo.com",
  "ahd.c2@demo.com",
  "ahd.c3@demo.com",
  "ahd.c4@demo.com",
  "ahd.c5@demo.com",

  // Dediyasan (5)
  "ddn.c1@demo.com",
  "ddn.c2@demo.com",
  "ddn.c3@demo.com",
  "ddn.c4@demo.com",
  "ddn.c5@demo.com",
].map((email, index) => ({
  name: `Consumer ${index + 1}`,
  email,
  role: "consumer",
  meterId: `USFL_WM${String(index + 2).padStart(4, "0")}`,
  location: index < 5 ? ahmedabad._id : dediyasan._id,
  password,
}));


await User.insertMany([...secretaries, ...consumers]);

console.log("✅ Seed completed: 2 locations, 2 secretaries, 10 consumers");
process.exit();
