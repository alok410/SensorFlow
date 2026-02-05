/* =======================
   ENUM-LIKE TYPES
======================= */

export type UserRole = "admin" | "secretary" | "consumer";
export type AccountType = "prepaid" | "postpaid";
export type InvoiceStatus = "pending" | "approved" | "paid" | "overdue";
export type PaymentMethod = "online" | "manual" | "prepaid_recharge";

/* =======================
   LOCATION
======================= */

export interface Location {
  _id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/* =======================
   USER BASE
======================= */

export interface UserBase {
  _id: string;              // ✅ Mongo-safe
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt: string;
  isActive: boolean;
  locationId?: string;      // reference
  location?: Location;      // populated object
}

/* =======================
   USERS
======================= */

export interface Consumer extends UserBase {
  role: "consumer";
  meterId: string;
  accountType: AccountType;
  assignedSecretaryId?: string;
  connectionDate: string;
  locationId: string;       // required
}

export interface Secretary extends UserBase {
  role: "secretary";
  assignedConsumerIds: string[];
  locationId: string;
}

export interface Admin extends UserBase {
  role: "admin";
}

/* =======================
   WATER RATE
======================= */

export interface WaterRate {
  _id: string;
  ratePerLiter: number;
  freeTierLiters: number;
  effectiveFrom: string;
  updatedAt: string;
  updatedBy?: string;
}

/* =======================
   METER READING
======================= */

export interface MeterReading {
  _id: string;
  consumerId: string;
  meterId: string;
  reading: number;
  previousReading: number;
  consumption: number;
  readingDate: string;
  source: "smart_meter" | "manual";
}

/* =======================
   INVOICE
======================= */

export interface Invoice {
  _id: string;
  consumerId: string;
  meterReadingId: string;
  billPeriodStart: string;
  billPeriodEnd: string;
  consumption: number;
  freeConsumption: number;
  chargeableConsumption: number;
  rateApplied: number;
  amount: number;
  lateFee: number;
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
}

/* =======================
   PAYMENT
======================= */

export interface Payment {
  _id: string;
  consumerId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  recordedBy?: string;
}

/* =======================
   PREPAID BALANCE
======================= */

export interface PrepaidBalance {
  consumerId: string;
  balance: number;
  lastRechargeAmount?: number;
  lastRechargeDate?: string;
  updatedAt: string;
}

/* =======================
   DASHBOARD STATS
======================= */

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

/* =======================
   CONSTANTS
======================= */

export const FREE_TIER_LITERS = 13000;
