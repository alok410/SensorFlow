import { User, Consumer, Secretary, WaterRate, MeterReading, Invoice, Payment, PrepaidBalance } from '@/types';

const STORAGE_KEYS = {
  USERS: 'water_meter_users',
  CONSUMERS: 'water_meter_consumers',
  SECRETARIES: 'water_meter_secretaries',
  WATER_RATES: 'water_meter_rates',
  METER_READINGS: 'water_meter_readings',
  INVOICES: 'water_meter_invoices',
  PAYMENTS: 'water_meter_payments',
  PREPAID_BALANCES: 'water_meter_prepaid',
  CURRENT_USER: 'water_meter_current_user',
};

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Users
export const getUsers = (): User[] => getItem(STORAGE_KEYS.USERS, []);
export const setUsers = (users: User[]): void => setItem(STORAGE_KEYS.USERS, users);

// Consumers
export const getConsumers = (): Consumer[] => getItem(STORAGE_KEYS.CONSUMERS, []);
export const setConsumers = (consumers: Consumer[]): void => setItem(STORAGE_KEYS.CONSUMERS, consumers);

// Secretaries
export const getSecretaries = (): Secretary[] => getItem(STORAGE_KEYS.SECRETARIES, []);
export const setSecretaries = (secretaries: Secretary[]): void => setItem(STORAGE_KEYS.SECRETARIES, secretaries);

// Water Rates
export const getWaterRates = (): WaterRate[] => getItem(STORAGE_KEYS.WATER_RATES, []);
export const setWaterRates = (rates: WaterRate[]): void => setItem(STORAGE_KEYS.WATER_RATES, rates);

// Meter Readings
export const getMeterReadings = (): MeterReading[] => getItem(STORAGE_KEYS.METER_READINGS, []);
export const setMeterReadings = (readings: MeterReading[]): void => setItem(STORAGE_KEYS.METER_READINGS, readings);

// Invoices
export const getInvoices = (): Invoice[] => getItem(STORAGE_KEYS.INVOICES, []);
export const setInvoices = (invoices: Invoice[]): void => setItem(STORAGE_KEYS.INVOICES, invoices);

// Payments
export const getPayments = (): Payment[] => getItem(STORAGE_KEYS.PAYMENTS, []);
export const setPayments = (payments: Payment[]): void => setItem(STORAGE_KEYS.PAYMENTS, payments);

// Prepaid Balances
export const getPrepaidBalances = (): PrepaidBalance[] => getItem(STORAGE_KEYS.PREPAID_BALANCES, []);
export const setPrepaidBalances = (balances: PrepaidBalance[]): void => setItem(STORAGE_KEYS.PREPAID_BALANCES, balances);

// Current User
export const getCurrentUser = (): User | null => getItem(STORAGE_KEYS.CURRENT_USER, null);
export const setCurrentUser = (user: User | null): void => setItem(STORAGE_KEYS.CURRENT_USER, user);

// Helper to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to generate meter ID
export const generateMeterId = (): string => {
  return `MTR-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
};