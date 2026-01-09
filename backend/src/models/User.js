// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "secretary", "consumer"],
      required: true,
    },

    phone: String,

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },

meterId: {
  type: String,
  unique: true,
  sparse: true, // ⭐ THIS IS THE KEY
  required: function () {
    return this.role === "consumer";
  },
},


    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User; // ✅ ES Module default export
