// controllers/meter.controller.js
import axios from "axios";
import MeterReading from "../models/MeterReading.js";

export const storeMeterData = async (req, res) => {
  try {
    const token = "TtiW3L8vWbrhNXIACx5dYDCHUdFHnNrGQzjbROMFai42C1Tx7hD7bra8RjWWytFa";

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
      rssi: parseInt(apiData.rssi) || 0
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
    console.error("Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to store data",
      error: error.response?.data || error.message
    });
  }
};