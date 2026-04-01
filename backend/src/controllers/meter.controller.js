// controllers/meter.controller.js
import axios from "axios";
import MeterReading from "../models/MeterReading.js";

export const storeMeterData = async (req, res) => {
  try {
    const response = await axios.get("YOUR_API_URL");
    const apiData = response.data;

    const formattedData = {
      flowRate: parseFloat(apiData.flow_rate),
      serialNumber: apiData.serial_number,
      meterReading: parseFloat(apiData.meter_reading),
      readingDatetime: new Date(apiData.reading_datetime),
      lastActive: new Date(apiData.last_active),
      rssi: parseInt(apiData.rssi)
    };

    // Duplicate check
    const exists = await MeterReading.findOne({
      serialNumber: formattedData.serialNumber,
      readingDatetime: formattedData.readingDatetime
    });

    if (exists) {
      return res.status(200).json({
        success: true,
        message: "Duplicate skipped",
        data: exists
      });
    }

    const saved = await MeterReading.create(formattedData);

    return res.status(201).json({
      success: true,
      message: "Stored successfully",
      data: saved
    });

  } catch (error) {
    console.error("Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to store data",
      error: error.message
    });
  }
};