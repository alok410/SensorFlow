// src/models/Location.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Location = mongoose.model("Location", locationSchema);

export default Location; // ✅ ES Module default export
