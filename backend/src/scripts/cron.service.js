// services/cron.service.js
import cron from "node-cron";
import axios from "axios";
import MeterReading from "../models/MeterReading.js";

const token = process.env.SENSEFLOW_TOKEN;

const job = async () => {
  try {
    console.log("⏳ Running meter cron job...");

    const response = await axios.get(
      "https://apps.samasth.io:8090/api/Senseflow/Flowmeter/latest?device=USFL_FL7053",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const apiData = response.data;

    const formattedData = {
      flowRate: parseFloat(apiData.flow_rate) || 0,
      serialNumber: apiData.serial_number || "UNKNOWN",
      meterReading: parseFloat(apiData.meter_reading) || 0,
      readingDatetime: apiData.reading_datetime
        ? new Date(apiData.reading_datetime)
        : new Date(),
      lastActive: apiData.last_active
        ? new Date(apiData.last_active)
        : new Date(),
      rssi: parseInt(apiData.rssi) || 0,
      meterId: "USFL_FL7053"
    };

    const exists = await MeterReading.findOne({
      serialNumber: formattedData.serialNumber,
      readingDatetime: formattedData.readingDatetime
    });

    if (!exists) {
      await MeterReading.create(formattedData);
      console.log("✅ Data stored");
    } else {
      console.log("⚠️ Duplicate skipped");
    }

  } catch (error) {
    console.error("❌ Cron Error:", error.response?.data || error.message);
  }
};

// 🔥 2:45 → 2:55 PM
cron.schedule("45-59/5 14 * * *", job, {
  timezone: "Asia/Kolkata"
});

// 🔥 3:00 → 3:10 PM
cron.schedule("0-10/5 15 * * *", job, {
  timezone: "Asia/Kolkata"
});