import axios from "axios";

const BASE_URL = "https://apps.samasth.io:8090/api/Senseflow/Flowmeter";
  const token = 'TtiW3L8vWbrhNXIACx5dYDCHUdFHnNrGQzjbROMFai42C1Tx7hD7bra8RjWWytFa';

const getAuthHeader = () => ({
   headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
});

// 🔹 Latest Telemetry
export const getLiveMeterData = async (deviceId: string) => {
  const res = await axios.get(
    `${BASE_URL}/latest?device=${deviceId}`,
    getAuthHeader()
  );
  return res.data;
};

// 🔹 Daily Aggregated History
export const getDailyConsumption = async (
  deviceId: string,
  start: string,
  end: string
) => {
  const res = await axios.get(
    `${BASE_URL}/history?device=${deviceId}&start=${start}&end=${end}`,
    getAuthHeader()
  );
  return res.data;
};

export const getHistoricalReadings = async (
  deviceId: string,
  start: string,
  end: string
) => {
  const res = await axios.get(
    `${BASE_URL}/history/all?device=${deviceId}&start=${start}&end=${end}`,
    getAuthHeader()
  );
  return res.data;
};
