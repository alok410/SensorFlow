export type UserRole = 'admin' | 'secretary' | 'consumer';
export type AccountType = 'prepaid' | 'postpaid';
export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'overdue';
export type PaymentMethod = 'online' | 'manual' | 'prepaid_recharge';
export type Location = 'ahmedabad' | 'gandhinagar' | 'rajkot';

export const LOCATIONS: { value: Location; label: string }[] = [
  { value: 'ahmedabad', label: 'Ahmedabad' },
  { value: 'gandhinagar', label: 'Gandhinagar' },
  { value: 'rajkot', label: 'Rajkot' },
];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt: string;
  isActive: boolean;
  location?: Location;
}

export interface Consumer extends User {
  role: 'consumer';
  meterId: string;
  accountType: AccountType;
  assignedSecretaryId?: string;
  connectionDate: string;
  location: Location;
}

export interface Secretary extends User {
  role: 'secretary';
  assignedConsumerIds: string[];
  location: Location;
}

export interface Admin extends User {
  role: 'admin';
}

// Simplified water rate - single rate per liter above free tier
export interface WaterRate {
  id: string;
  ratePerLiter: number; // Rate per liter after free tier
  freeTierLiters: number; // Free liters (default 13000)
  effectiveFrom: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface MeterReading {
  id: string;
  consumerId: string;
  meterId: string;
  reading: number;
  previousReading: number;
  consumption: number; // in liters
  readingDate: string;
  source: 'smart_meter' | 'manual';
}

export interface Invoice {
  id: string;
  consumerId: string;
  meterReadingId: string;
  billPeriodStart: string;
  billPeriodEnd: string;
  consumption: number; // total liters
  freeConsumption: number; // liters within free tier
  chargeableConsumption: number; // liters above free tier
  rateApplied: number; // rate per liter
  amount: number;
  lateFee: number;
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  consumerId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  recordedBy?: string;
}

export interface PrepaidBalance {
  consumerId: string;
  balance: number;
  lastRechargeAmount?: number;
  lastRechargeDate?: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalConsumers: number;
  totalSecretaries: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalConsumption: number;
  collectionRate: number;
}

export interface ConsumerStats {
  currentBalance: number;
  lastReading: number;
  lastBillAmount: number;
  totalPaid: number;
  pendingAmount: number;
}

// Constants
export const FREE_TIER_LITERS = 13000;
