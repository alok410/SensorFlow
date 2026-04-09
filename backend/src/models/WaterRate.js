import mongoose from "mongoose";

const waterRateSchema = new mongoose.Schema({
  ratePerLiter: {
    type: Number,
    required: true,
  },
  freeTierLiters: {
    type: Number,
    required: true,
  },
  effectiveFrom: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("WaterRate", waterRateSchema);