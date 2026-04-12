import WaterRate from "../models/WaterRate.js";

// GET latest rate
export const getWaterRate = async (req, res) => {
  try {
    const rate = await WaterRate.findOne().sort({ updatedAt: -1 });
    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SAVE / UPDATE rate (with LIVE EMIT)
export const setWaterRate = async (req, res) => {
  try {
    const { ratePerLiter, freeTierLiters } = req.body;

    const newRate = new WaterRate({
      ratePerLiter,
      freeTierLiters,
      updatedAt: new Date(),
    });

    await newRate.save();

    // ✅ GET SOCKET INSTANCE
    const io = req.app.get("io");

    // ✅ EMIT LIVE UPDATE
    io.emit("rateUpdated", {
      ratePerLiter: newRate.ratePerLiter,
      freeTierLiters: newRate.freeTierLiters,
    });

    console.log("🔥 Rate emitted to all clients");

    res.json({
      message: "Saved successfully",
      data: newRate,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};