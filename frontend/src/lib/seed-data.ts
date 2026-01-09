import {
  User,
  Consumer,
  Secretary,
  WaterRate,
  MeterReading,
  Invoice,
  Payment,
  PrepaidBalance,
  FREE_TIER_LITERS,
  Location,
} from '@/types';

import {
  setUsers,
  setConsumers,
  setSecretaries,
  setWaterRates,
  setMeterReadings,
  setInvoices,
  setPayments,
  setPrepaidBalances,
  getUsers,
} from './storage';

const iso = (date: string) => new Date(date).toISOString();

export const seedData = () => {
  const existingUsers = getUsers();
  if (existingUsers.length > 0) return;

  localStorage.clear();

  /* ---------------- ADMIN ---------------- */
  const admin: User = {
    id: 'admin-1',
    email: 'admin@demo.com',
    name: 'System Administrator',
    role: 'admin',
    phone: '9999999999',
    createdAt: iso('2024-01-01'),
    isActive: true,
  };

  /* ---------------- SECRETARY ---------------- */
  const secretary: Secretary = {
    id: 'sec-ahmedabad',
    email: 'secretary.ahmedabad@demo.com',
    name: 'Rajesh Patel',
    role: 'secretary',
    phone: '8888888888',
    createdAt: iso('2024-02-01'),
    isActive: true,
    location: 'ahmedabad',
    assignedConsumerIds: [
      'con-1',
      'con-2',
      'con-3',
    ],
  };

  /* ---------------- CONSUMERS (MANUAL) ---------------- */
  const consumers: Consumer[] = [
    {
      id: 'con-1',
      name: 'Alok Patel',
      email: 'alok.patel@demo.com',
      role: 'consumer',
      phone: '7000000001',
      address: '101, Maninagar, Ahmedabad',
      createdAt: iso('2024-03-01'),
      isActive: true,
      meterId: 'USFL_WM0002',
      accountType: 'prepaid',
      assignedSecretaryId: secretary.id,
      connectionDate: iso('2024-03-01'),
      location: 'ahmedabad',
    },
    {
      id: 'con-2',
      name: 'Priya Shah',
      email: 'priya.shah@demo.com',
      role: 'consumer',
      phone: '7000000002',
      address: '202, Navrangpura, Ahmedabad',
      createdAt: iso('2024-03-05'),
      isActive: true,
      meterId: 'USFL_WM0002',
      accountType: 'postpaid',
      assignedSecretaryId: secretary.id,
      connectionDate: iso('2024-03-05'),
      location: 'ahmedabad',
    },
    {
      id: 'con-3',
      name: 'Amit Kumar',
      email: 'amit.kumar@demo.com',
      role: 'consumer',
      phone: '7000000003',
      address: '303, Bopal, Ahmedabad',
      createdAt: iso('2024-03-10'),
      isActive: true,
      meterId: 'USFL_WM0002',
      accountType: 'prepaid',
      assignedSecretaryId: secretary.id,
      connectionDate: iso('2024-03-10'),
      location: 'ahmedabad',
    },
  ];

  /* ---------------- WATER RATE ---------------- */
  const waterRate: WaterRate = {
    id: 'rate-1',
    ratePerLiter: 0.002,
    freeTierLiters: FREE_TIER_LITERS,
    effectiveFrom: iso('2024-01-01'),
    updatedAt: iso('2025-01-01'),
  };

  /* ---------------- METER READINGS ---------------- */
  

  /* ---------------- PREPAID BALANCES ---------------- */
  const prepaidBalances: PrepaidBalance[] = [
    {
      consumerId: 'con-1',
      balance: 120,
      lastRechargeAmount: 200,
      lastRechargeDate: iso('2024-12-20'),
      updatedAt: iso('2025-01-01'),
    },
    {
      consumerId: 'con-3',
      balance: 80,
      lastRechargeAmount: 150,
      lastRechargeDate: iso('2024-12-22'),
      updatedAt: iso('2025-01-01'),
    },
  ];

  /* ---------------- SAVE ---------------- */
  setUsers([admin, secretary, ...consumers]);
  setSecretaries([secretary]);
  setConsumers(consumers);
  setWaterRates([waterRate]);

  setPrepaidBalances(prepaidBalances);

  console.log('✅ Manual seed initialized with 1 secretary & 3 consumers');
};
