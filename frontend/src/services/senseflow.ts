import { MeterReading } from '@/types';

interface SenseflowReading {
  opening_reading: string;
  closing_reading: string;
  reading_date: string;
  consumption: string;
}

interface SenseflowResponse {
  serial_number: string;
  last_active: string;
  data: SenseflowReading[];
}
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};
type FlowmeterStatus = {
  last_active: string;
  meter_reading: string;
};

export const fetchLatestFlowmeterStatus = async (
  deviceId: string
): Promise<FlowmeterStatus> => {
  const token = 'TtiW3L8vWbrhNXIACx5dYDCHUdFHnNrGQzjbROMFai42C1Tx7hD7bra8RjWWytFa';

  const url = `https://apps.samasth.io:8090/api/Senseflow/Flowmeter/latest?device=${deviceId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Senseflow API failed with status ${response.status}`);
  }

  const json: {
    flow_rate: string;
    serial_number: string;
    meter_reading: string;
    reading_datetime: string;
    last_active: string;
    rssi: string;
  } = await response.json();

  return {
    last_active: json.last_active,
    meter_reading: json.meter_reading,
  };
};


export const fetchMeterReadingsFromSenseflow = async (
  deviceId: string,
  consumerId: string,
  startDate: string = getTodayDate(), // default to today
  endDate: string = getTodayDate()  
): Promise<MeterReading[]> => {
  const token = 'TtiW3L8vWbrhNXIACx5dYDCHUdFHnNrGQzjbROMFai42C1Tx7hD7bra8RjWWytFa'; // <-- put your token here

  const url = `https://apps.samasth.io:8090/api/Senseflow/Flowmeter/history?device=${deviceId}&start=${startDate}&end=${endDate}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`, // send Bearer token
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Senseflow API failed with status ${response.status}`);
  }

  const json: SenseflowResponse = await response.json();

  return json.data.map((item, index) => ({
    _id: `sf-${consumerId}-${item.reading_date}-${index}`,
    consumerId,
    meterId: json.serial_number,
    previousReading: Number(item.opening_reading),
    reading: Number(item.closing_reading) ,
    consumption: Number(item.consumption) ,
    readingDate: new Date(item.reading_date).toISOString(),
    source: 'smart_meter',
  }));
};


