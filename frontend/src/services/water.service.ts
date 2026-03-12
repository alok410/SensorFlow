import axios from "axios";

const BASE_URL = "https://apps.samasth.io:8090/api/Senseflow/Flowmeter";
const token = "TtiW3L8vWbrhNXIACx5dYDCHUdFHnNrGQzjbROMFai42C1Tx7hD7bra8RjWWytFa";

// ✅ Create ONE axios instance (better performance)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  timeout: 10000, // prevent long waiting
});

// 🔹 Latest Telemetry
export const getLiveMeterData = async (deviceId: string) => {
  const { data } = await api.get(`/latest`, {
    params: { device: deviceId },
  });
  return data;
};

// 🔹 Daily Aggregated History
export const getDailyConsumption = async (
  deviceId: string,
  start: string,
  end: string
) => {
  const { data } = await api.get(`/history`, {
    params: { device: deviceId, start, end },
  });

  const { serial_number, last_active } = data;

  // ⚡ Faster mapping (avoid heavy spread operator)
  const updatedData = new Array(data.data.length);

  for (let i = 0; i < data.data.length; i++) {
    const item = data.data[i];
    updatedData[i] = {
      opening_reading: item.opening_reading,
      closing_reading: item.closing_reading,
      reading_date: item.reading_date,
      consumption: +item.consumption * 1000, // faster than Number()
    };
  }

  return {
    serial_number,
    last_active,
    data: updatedData,
  };
};

// 🔹 Full Historical Data
export const getHistoricalReadings = async (
  deviceId: string,
  start: string,
  end: string
) => {
  const { data } = await api.get(`/history/all`, {
    params: { device: deviceId, start, end },
  });
  
  return data;
};