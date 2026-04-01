// models/MeterReading.js
import mongoose from "mongoose";

const meterReadingSchema = new mongoose.Schema({
  flowRate: {
    type: Number,
    required: true
  },

  serialNumber: {
    type: String,
    default: null
  },

  meterReading: {
    type: Number,
    required: true
  },

  readingDatetime: {
    type: Date,
    required: true
  },

  lastActive: {
    type: Date
  },

  rssi: {
    type: Number
  }

}, {
  timestamps: true // adds createdAt, updatedAt
});


// 🔥 Index (important for fast queries & sorting)
meterReadingSchema.index({ readingDatetime: -1 });

// 🔥 Optional: Prevent duplicate same timestamp entry
meterReadingSchema.index(
  { serialNumber: 1, readingDatetime: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("MeterReading", meterReadingSchema);