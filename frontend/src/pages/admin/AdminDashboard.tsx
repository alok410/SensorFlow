import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Droplets, Activity } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

import { getConsumers } from "@/services/consumer.service";
import { getAllSecretaries } from "@/services/secretary.service";
import { getLocations } from "@/services/location.service";
import {
  getHistoricalReadings,
  getDailyConsumption,
  getLiveMeterData
} from "@/services/water.service";

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: 'Locations', href: '/admin/locations' },
];

const AdminDashboard: React.FC = () => {

  const [consumers, setConsumers] = useState<any[]>([]);
  const [secretaries, setSecretaries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dailyConsumption, setDailyConsumption] = useState<any[]>([]);
  const [historicalReadings, setHistoricalReadings] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [dateFilter, setDateFilter] = useState<"7" | "15" | "30" | "custom">("7");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loadingWater, setLoadingWater] = useState(false);
  

  /* ================= LOAD BASE DATA ================= */

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadConsumers(),
      loadSecretaries(),
      loadLocations()
    ]);
  };

  const loadConsumers = async () => {
    try {
      const res = await getConsumers();
      const array =
        Array.isArray(res) ? res :
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        [];
      setConsumers(array);
    } catch {
      setConsumers([]);
    }
  };

  const loadSecretaries = async () => {
    try {
      const res = await getAllSecretaries();
      const array =
        Array.isArray(res) ? res :
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        [];
      setSecretaries(array);
    } catch {
      setSecretaries([]);
    }
  };

  const loadLocations = async () => {
    try {
      const res = await getLocations();
      const array =
        Array.isArray(res) ? res :
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        [];
      setLocations(array);
    } catch {
      setLocations([]);
    }
  };

  /* ================= DATE RANGE ================= */

  const getDateRange = () => {
    const today = new Date();
    let start = new Date();

    if (dateFilter === "7") start.setDate(today.getDate() - 7);
    if (dateFilter === "15") start.setDate(today.getDate() - 15);
    if (dateFilter === "30") start.setDate(today.getDate() - 30);

    if (dateFilter === "custom" && startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    return {
      start: start.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
    };
  };

  /* ================= FETCH WATER DATA ================= */
useEffect(() => {
  if (!consumers?.length) return;

  const { start, end } = getDateRange();

  const fetchAllData = async () => {
    try {
      setLoadingWater(true);

      // STEP 1: Filter by location
      let filtered =
        selectedLocation === "all"
          ? consumers
          : consumers.filter(
              (c) =>
                c.locationId?.toString() ===
                selectedLocation?.toString()
            );

      // STEP 2: If specific user selected → override
      if (selectedUser !== "all") {
        filtered = filtered.filter(
          (c) => c._id?.toString() === selectedUser?.toString()
        );
      }

      const meterIds = filtered
        .map((c) => c.meterId)
        .filter(Boolean);

      if (!meterIds.length) {
        setDailyConsumption([]);
        return;
      }

      let allDaily: any[] = [];
      let lastLiveData: any = null;

      for (const deviceId of meterIds) {
        const daily = await getDailyConsumption(deviceId, start, end);
        const live = await getLiveMeterData(deviceId);

        const dailyArray =
          Array.isArray(daily) ? daily :
          Array.isArray(daily?.data) ? daily.data :
          Array.isArray(daily?.data?.data) ? daily.data.data :
          [];

        allDaily = [...allDaily, ...dailyArray];
        lastLiveData = live?.data || live || null;
      }

      // Merge by date
      const grouped: Record<string, number> = {};

      allDaily.forEach((item) => {
        const date = item.reading_date;
        const value = Number(item.consumption || 0);

        if (!grouped[date]) grouped[date] = 0;
        grouped[date] += value;
      });

      const merged = Object.keys(grouped).map((date) => ({
        reading_date: date,
        consumption: grouped[date],
      }));

      setDailyConsumption(merged);
      setLiveData(lastLiveData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWater(false);
    }
  };

  fetchAllData();

}, [
  selectedLocation,
  selectedUser,
  dateFilter,
  startDate,
  endDate,
  consumers
]);
useEffect(() => {
  setSelectedUser("all");
}, [selectedLocation]);

  /* ================= DERIVED DATA ================= */
const usersForDropdown =
  selectedLocation === "all"
    ? consumers
    : consumers.filter(
        (c) =>
          c.locationId?.toString() ===
          selectedLocation?.toString()
      );
  const filteredConsumers =
    selectedLocation === "all"
      ? consumers
      : consumers.filter(c => c.locationId === selectedLocation);

  const filteredSecretaries =
    selectedLocation === "all"
      ? secretaries
      : secretaries.filter(s => s.locationId === selectedLocation);

  const totalWaterConsumption = dailyConsumption.reduce(
    (s, d) => s + Number(d.consumption || 0), 0
  );

  const leakageDetected = Number(liveData?.flow_rate || 0) > 0.02;

  const consumptionChartData = dailyConsumption.map(d => ({
    date: d.reading_date,
    consumption: Number(d.consumption),
  }));

  /* ================= RENDER ================= */

 return (
  <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">

    {/* HEADER SECTION */}
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Water Analytics Overview
      </h1>
      <p className="text-muted-foreground">
        Monitor consumption, flow rate and user activity
      </p>
    </div>

    {/* FILTER SECTION */}
    <Card className="mb-6 shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6 grid md:grid-cols-4 gap-4">

        {/* LOCATION */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Locations</option>
            {Array.isArray(locations) &&
              locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
          </select>
        </div>

        {/* USER */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Users</option>
            {usersForDropdown.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name || u.consumerName || u.email}
              </option>
            ))}
          </select>
        </div>

        {/* DATE FILTER */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block">
            Date Range
          </label>

          <div className="flex flex-wrap gap-2">
            {["7", "15", "30"].map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d as any)}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  dateFilter === d
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border hover:bg-blue-100"
                }`}
              >
                Last {d} Days
              </button>
            ))}

            <button
              onClick={() => setDateFilter("custom")}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                dateFilter === "custom"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border hover:bg-blue-100"
              }`}
            >
              Custom
            </button>

            {dateFilter === "custom" && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>

    {/* LEAKAGE ALERT */}
    {leakageDetected && (
      <Card className="mb-6 border-red-400 bg-red-50">
        <CardContent className="p-4 text-red-600 font-semibold flex items-center gap-2">
          ⚠️ Possible Leakage Detected — Flow Rate Above Threshold
        </CardContent>
      </Card>
    )}

    {/* STATS SECTION */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <div className="hover:scale-[1.02] transition">
        <StatsCard title="Consumers" value={filteredConsumers.length} icon={Users} />
      </div>
      <div className="hover:scale-[1.02] transition">
        <StatsCard title="Secretaries" value={filteredSecretaries.length} icon={UserCheck} />
      </div>
      <div className="hover:scale-[1.02] transition">
        <StatsCard title="Flow Rate (L/s)" value={`${liveData?.flow_rate || 0}`} icon={Activity} />
      </div>
      <div className="hover:scale-[1.02] transition">
        <StatsCard title="Total Consumption" value={`${totalWaterConsumption}`} icon={Droplets} />
      </div>
    </div>

    {/* CHART SECTION */}
    <Card className="shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Water Consumption Trend
        </CardTitle>
        <CardDescription>
          Aggregated daily usage based on selected filters
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loadingWater ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consumptionChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
             <XAxis
  dataKey="date"
  tickFormatter={(value) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
  }
/>
              <YAxis />
              <Tooltip
  labelFormatter={(value) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
  }
/>
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>

  </DashboardLayout>
);
};

export default AdminDashboard;