import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Droplets, Activity } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar,LabelList
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getConsumers } from "@/services/consumer.service";
import { getAllSecretaries } from "@/services/secretary.service";
import { getLocations } from "@/services/location.service";
import {
  getHistoricalReadings,
  getDailyConsumption,
  getLiveMeterData
} from "@/services/water.service";
import { log } from 'console';
import { useNavigate } from "react-router-dom";

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: 'Locations', href: '/admin/locations' },
];

const AdminDashboard: React.FC = () => {
  const [dailyConsumptionByMeter, setDailyConsumptionByMeter] = useState<any[]>([]);
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
  const [topLimit, setTopLimit] = useState(10);
  const navigate = useNavigate();   
const isValidConsumer = (c: any) => {
  if (!c) return false;

  const blockInvalid =
    !c.blockId || c.blockId.toString().trim() === "00";

  const locationInvalid =
    c.locationCode === 1 || c.locationCode === "1";

  const meterInvalid =
    !c.meterId || c.meterId === "MAIN" || c.meterId === "0";

  const valid = !(blockInvalid || locationInvalid || meterInvalid);

  

  return valid;
};



const mainMeter = consumers.find(
  (c) =>
    c?.blockId?.toString() === "00" ||
    c?.locationCode === 1 ||
    c?.meterId === "MAIN"
);


const [mainMeterData, setMainMeterData] = useState({
  total: 0,
  today: 0,
  month: 0,
});
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
    const cached = localStorage.getItem("consumers");

    if (cached) {
      setConsumers(JSON.parse(cached));
      return; // 🚀 STOP API CALL
    }

    const res = await getConsumers();

    const array =
      Array.isArray(res) ? res :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.data?.data) ? res.data.data :
      [];

    setConsumers(array);

    localStorage.setItem("consumers", JSON.stringify(array)); // 💾 SAVE
  } catch {
    setConsumers([]);
  }
};

 const loadSecretaries = async () => {
  try {
    const cached = localStorage.getItem("secretaries");

    if (cached) {
      setSecretaries(JSON.parse(cached));
      return;
    }

    const res = await getAllSecretaries();

    const array =
      Array.isArray(res) ? res :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.data?.data) ? res.data.data :
      [];

    setSecretaries(array);
    localStorage.setItem("secretaries", JSON.stringify(array));
  } catch {
    setSecretaries([]);
  }
};
const loadLocations = async () => {
  try {
    const cached = localStorage.getItem("locations");

    if (cached) {
      setLocations(JSON.parse(cached));
      return;
    }

    const res = await getLocations();

    const array =
      Array.isArray(res) ? res :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.data?.data) ? res.data.data :
      [];

    setLocations(array);
    localStorage.setItem("locations", JSON.stringify(array));
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
const { start, end } = getDateRange();

const cacheKey = `waterData_${selectedLocation}_${selectedUser}_${start}_${end}`;
  /* ================= FETCH WATER DATA ================= */
  useEffect(() => {
    if (!consumers?.length) return;

    const { start, end } = getDateRange();

    const fetchAllData = async () => {
  const { start, end } = getDateRange();

  const cacheKey = `waterData_${selectedLocation}_${selectedUser}_${start}_${end}`;

  try {
    setLoadingWater(true);

    /* ================= CACHE CHECK ================= */
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      console.log("⚡ Loaded from cache");

      setDailyConsumption(parsed.dailyConsumption);
      setDailyConsumptionByMeter(parsed.dailyConsumptionByMeter);
      setLiveData(parsed.liveData);

      setLoadingWater(false);
      
      return; // 🚀 STOP API CALL
    }


    /* ================= FILTER USERS ================= */
   let filtered =
  selectedLocation === "all"
    ? consumers.filter(isValidConsumer)
    : consumers.filter(
        (c) =>
          isValidConsumer(c) &&
          c.locationId?.toString() === selectedLocation?.toString()
      );

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
      setLoadingWater(false);
      return;
    }

    const grouped: Record<string, number> = {};
    const groupedByMeter: Record<string, number> = {};

    let lastLiveData: any = null;

    /* ================= API CALLS ================= */
    for (const deviceId of meterIds) {
      const daily = await getDailyConsumption(deviceId, start, end);
      const live = await getLiveMeterData(deviceId);

      const dailyArray =
        Array.isArray(daily)
          ? daily
          : Array.isArray(daily?.data)
          ? daily.data
          : [];

      dailyArray.forEach((item: any) => {
        const date = item.reading_date;
        const value = Number(item.consumption || 0);

        if (!grouped[date]) grouped[date] = 0;
        grouped[date] += value;

        if (!groupedByMeter[deviceId]) groupedByMeter[deviceId] = 0;
        groupedByMeter[deviceId] += value;
      });

      lastLiveData = live?.data || live || null;
    }

    /* ================= FORMAT DATA ================= */

    const mergedMeters = Object.keys(groupedByMeter).map((meterId) => ({
      meterId,
      consumption: groupedByMeter[meterId],
    }));

    const merged = Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        reading_date: date,
        consumption: grouped[date],
      }));

    /* ================= SET STATE ================= */

    setDailyConsumption(merged);
    setDailyConsumptionByMeter(mergedMeters);
    setLiveData(lastLiveData);

    /* ================= SAVE CACHE ================= */
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        dailyConsumption: merged,
        dailyConsumptionByMeter: mergedMeters,
        liveData: lastLiveData,
        time: Date.now(),
      })
    );

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
  if (!mainMeter?.meterId) return;

  const fetchMainMeter = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthStart = startOfMonth.toISOString().split("T")[0];

      /* ================= 1. LIVE DATA ================= */
      const liveRes = await getLiveMeterData(mainMeter.meterId);
      const live = liveRes?.data || liveRes || {};
      const latestReading = Number(live?.meter_reading || 0);

      /* ================= 2. TODAY USAGE ================= */
      const todayLogsRes = await getDailyConsumption(mainMeter.meterId, today, today);
      const todayLogs = Array.isArray(todayLogsRes) ? todayLogsRes : Array.isArray(todayLogsRes?.data) ? todayLogsRes.data : [];
      const todayUsage = todayLogs.reduce((sum, item) => sum + Number(item.consumption || 0), 0);

      /* ================= 3. MONTH USAGE ================= */
      const monthLogsRes = await getDailyConsumption(mainMeter.meterId, monthStart, today);
      const monthLogs = Array.isArray(monthLogsRes) ? monthLogsRes : Array.isArray(monthLogsRes?.data) ? monthLogsRes.data : [];
      const monthUsage = monthLogs.reduce((sum, item) => sum + Number(item.consumption || 0), 0);

      /* ================= FINAL ================= */
      setMainMeterData({
        total: latestReading,   // ✅ live reading
        today: todayUsage,      // ✅ sum of today's consumption
        month: monthUsage,      // ✅ sum of month consumption
      });

    } catch (err) {
      console.error("Main meter fetch error:", err);
    }
  };

  fetchMainMeter();
}, [mainMeter]);
  useEffect(() => {
    setSelectedUser("all");
  }, [selectedLocation]);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  /* ================= DERIVED DATA ================= */
const usersForDropdown =
  selectedLocation === "all"
    ? consumers.filter(isValidConsumer)
    : consumers.filter(
        (c) =>
          isValidConsumer(c) &&
          c.locationId?.toString() === selectedLocation?.toString()
      );
const filteredConsumers =
  selectedLocation === "all"
    ? consumers.filter(isValidConsumer)
    : consumers.filter(
        (c) =>
          isValidConsumer(c) &&
          c.locationId === selectedLocation
      );

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
  const formatLiters = (value: number) => {

    return value +" L";
  };
  const getTodayUsage = (meterId: string) => {

    const meter = dailyConsumptionByMeter.find(
      (m) => m.meterId?.toString() === meterId?.toString()
    );

    return meter ? Number(meter.consumption || 0) : 0;
  };
  const sortedConsumers = [...filteredConsumers].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    if (sortColumn === "usage") {
      valueA = getTodayUsage(a.meterId);
      valueB = getTodayUsage(b.meterId);
    }
    else if (sortColumn === "blockId") {
      const numA = parseInt(a.blockId);
      const numB = parseInt(b.blockId);

      if (!isNaN(numA) && !isNaN(numB)) {
        valueA = numA;
        valueB = numB;
      } else {
        valueA = a.blockId || "";
        valueB = b.blockId || "";
      }
    }
    else {
      valueA = a[sortColumn] || "";
      valueB = b[sortColumn] || "";
    }

    if (typeof valueA === "string") valueA = valueA.toLowerCase();
    if (typeof valueB === "string") valueB = valueB.toLowerCase();

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;

    return 0;
  });
  /* ================= RENDER ================= */
const getTopUsersData = (limit: number) => {
  return dailyConsumptionByMeter
    .map((m) => {
      const user = consumers.find(
        (c) =>
          c.meterId?.toString() === m.meterId?.toString()
      );

      // ❌ REMOVE invalid users completely
      if (!isValidConsumer(user)) {
        console.log("🚫 Skipping invalid user in chart:", user);
        return null;
      }

      return {
        label: `${user.blockId}|${user.name}`,
        consumption: Number(m.consumption || 0),
      };
    })
    .filter(Boolean) // 🔥 REMOVE NULLS
    .sort((a, b) => b!.consumption - a!.consumption)
    .slice(0, limit);
};

const topUsers = getTopUsersData(topLimit);

  const top5Users = getTopUsersData(5);
  const top10Users = getTopUsersData(10);
  const CustomXAxisTick = ({ x, y, payload }: any) => {
  const [block, name] = payload.value.split("|");

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fontSize={12}>
        <tspan x="0" dy="15">{block}</tspan>
        <tspan x="0" dy="14">{name}</tspan>
      </text>
    </g>
  );
};
  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">

 

<Card
  className="mb-6 cursor-pointer hover:shadow-lg transition border-2 border-blue-500"
onClick={() => {
  if (mainMeter?._id) {
    navigate(`/admin/user/${mainMeter._id}`);
  }
}}
>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Activity className="text-blue-600" />
      Main Meter Overview
    </CardTitle>
    <CardDescription>
      Click to view detailed analytics
    </CardDescription>
  </CardHeader>

  <CardContent className="grid md:grid-cols-3 gap-4">

    <div className="bg-blue-50 p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">Today's Usage</p>
      <p className="text-xl font-bold text-blue-700">
        {formatLiters(mainMeterData.today)}
      </p>
    </div>

    <div className="bg-green-50 p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">This Month</p>
      <p className="text-xl font-bold text-green-700">
        {formatLiters(mainMeterData.month)}
      </p>
    </div>

    <div className="bg-purple-50 p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">Total Usage</p>
      <p className="text-xl font-bold text-purple-700">
        {formatLiters(mainMeterData.total*1000)}
      </p>
    </div>

  </CardContent>
</Card>

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
              {locations
  .filter((l) => l.locationCode !== 1)
  .map((l) => (
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
                  className={`px-4 py-2 text-sm rounded-full transition-all ${dateFilter === d
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border hover:bg-blue-100"
                    }`}
                >
                  Last {d} Days
                </button>
              ))}

              <button
                onClick={() => setDateFilter("custom")}
                className={`px-4 py-2 text-sm rounded-full transition-all ${dateFilter === "custom"
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
          <StatsCard title="Total Consumption" value={`${Number(totalWaterConsumption).toLocaleString("en-IN")} L`} icon={Droplets} />
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
    <Card className="mt-6">
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle>Top Water Consumers</CardTitle>
      <CardDescription>
        Showing top {topLimit} users based on usage
      </CardDescription>
    </div>

    {/* 🔥 TOGGLE BUTTONS */}
    <div className="flex gap-2">
      <Button
        variant={topLimit === 5 ? "default" : "outline"}
        size="sm"
        onClick={() => setTopLimit(5)}
      >
        Top 5
      </Button>

      <Button
        variant={topLimit === 10 ? "default" : "outline"}
        size="sm"
        onClick={() => setTopLimit(10)}
      >
        Top 10
      </Button>
    </div>
  </CardHeader>

  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
    <BarChart data={topUsers}>
  <CartesianGrid strokeDasharray="3 3" />

  <XAxis
    dataKey="label"
    tick={<CustomXAxisTick />}
    interval={0}
    height={70}
  />

  <YAxis />

  <Tooltip
    formatter={(value: number) => `${value.toLocaleString()} L`}
  />

  <Bar dataKey="consumption" fill="#2563eb">
    <LabelList
      dataKey="consumption"
      position="inside"
      formatter={(value: number) =>
        value > 1000
          ? `${(value / 1000).toFixed(1)}K`
          : value
      }
      style={{
        fill: "#ffffff",
        fontWeight: "bold",
        fontSize: 12,
      }}
    />
  </Bar>
</BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Consumers Today's Water Usage</CardTitle>
          <CardDescription>
            Real-time usage per meter
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("blockId")} className="cursor-pointer">
                  Block {sortColumn === "blockId" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  Name {sortColumn === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>

                <TableHead onClick={() => handleSort("meterId")} className="cursor-pointer">
                  Meter {sortColumn === "meterId" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>

                <TableHead onClick={() => handleSort("serialNumber")} className="cursor-pointer">
                  Serial Number {sortColumn === "serialNumber" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>

                <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                  Email {sortColumn === "email" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>

                <TableHead onClick={() => handleSort("usage")} className="cursor-pointer">
                  Total Usage {sortColumn === "usage" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>

              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedConsumers.map((consumer) => (
             <TableRow
  key={consumer._id}
  className="cursor-pointer hover:bg-muted"
  onClick={() => navigate(`/admin/user/${consumer._id}`)}
>


                  <TableCell>
                    <div>
                      <p className="font-medium">{consumer.blockId}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{consumer.name}</p>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-sm">
                    {consumer.meterId}
                  </TableCell>

                  <TableCell className="font-mono text-sm">
                    {consumer.serialNumber}
                  </TableCell>

                  <TableCell>
                    {consumer.email}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {formatLiters(getTodayUsage(consumer.meterId))}
                      </span>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </DashboardLayout>
  );
};

export default AdminDashboard;