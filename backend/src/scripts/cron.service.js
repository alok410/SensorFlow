// services/cron.service.js
import cron from "node-cron";
import axios from "axios";
import MeterReading from "../models/MeterReading.js";

const token = process.env.SENSEFLOW_TOKEN;

// 🇮🇳 IST-based schedule
// Every 5 min between 23:30–23:59 IST
cron.schedule(
 "40-59/5 14 * * *",
  async () => {
    try {
      console.log("⏳ Running night meter job...");

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

      // 🔁 Duplicate check
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
  },
  {
    timezone: "Asia/Kolkata" // ✅ IMPORTANT for IST
  }
);