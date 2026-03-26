import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { useToast } from "@/hooks/use-toast";

import { BarChart3 } from "lucide-react";

import {
  subDays,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from "date-fns";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { fetchMeterReadingsFromSenseflow } from "../../services/senseflow";

const API_URL = import.meta.env.VITE_API_URL;

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
];

const AdminUserAnalysis: React.FC = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [consumer, setConsumer] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<number>(7);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());

  /* ================= FETCH CONSUMER ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!id || !token) return;

    fetch(`${API_URL}/consumers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setConsumer(data.data))
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load consumer",
          variant: "destructive",
        })
      )
      .finally(() => setLoading(false));
  }, [id]);

  /* ================= FETCH READINGS ================= */
  useEffect(() => {
    if (!consumer?.meterId) return;

    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    fetchMeterReadingsFromSenseflow(
      consumer.meterId,
      consumer._id,
      startStr,
      endStr
    )
      .then(setReadings)
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load readings",
          variant: "destructive",
        })
      );
  }, [consumer, startDate, endDate]);

  /* ================= FILTERED DATA ================= */
  const filteredReadings = useMemo(() => {
    return readings.filter((r) =>
      isWithinInterval(parseISO(r.readingDate), {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      })
    );
  }, [readings, startDate, endDate]);

  /* ================= CALCULATIONS ================= */
  const totalConsumption = useMemo(() => {
    return filteredReadings.reduce(
      (sum, r) => sum + (r.consumption || 0),
      0
    );
  }, [filteredReadings]);

  const avgConsumption = useMemo(() => {
    if (!filteredReadings.length) return 0;
    return Math.round(totalConsumption / filteredReadings.length);
  }, [filteredReadings, totalConsumption]);

  const minConsumption = useMemo(() => {
    if (!filteredReadings.length) return 0;
    return Math.min(...filteredReadings.map((r) => r.consumption || 0));
  }, [filteredReadings]);

  const maxConsumption = useMemo(() => {
    if (!filteredReadings.length) return 0;
    return Math.max(...filteredReadings.map((r) => r.consumption || 0));
  }, [filteredReadings]);

  const todayConsumption = useMemo(() => {
    const today = new Date();

    const todayReading = readings.find((r) => {
      const d = new Date(r.readingDate);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });

    return todayReading?.consumption || 0;
  }, [readings]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();

    return readings
      .filter((r) => {
        const d = parseISO(r.readingDate);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, r) => sum + r.consumption, 0);
  }, [readings]);

  const lastReading = useMemo(() => {
    if (!filteredReadings.length) return null;

    return [...filteredReadings].sort(
      (a, b) =>
        new Date(b.readingDate).getTime() -
        new Date(a.readingDate).getTime()
    )[0];
  }, [filteredReadings]);

  const consumptionData = useMemo(() => {
    return filteredReadings
      .sort(
        (a, b) =>
          new Date(a.readingDate).getTime() -
          new Date(b.readingDate).getTime()
      )
      .map((r) => ({
        date: r.readingDate,
        consumption: r.consumption,
      }));
  }, [filteredReadings]);

  /* ================= UI ================= */
  if (loading) {
    return (
  <DashboardLayout navItems={adminNavItems} title="Loading...">
    <div className="p-6">Loading...</div>
  </DashboardLayout>
);
  }

  if (!consumer) {
   return (
  <DashboardLayout navItems={adminNavItems} title="Not Found">
    <div className="p-6">Consumer not found</div>
  </DashboardLayout>
);
  }

  return (
    <DashboardLayout navItems={adminNavItems} title="User Analysis">
      <div className="space-y-6">

        {/* USER INFO */}
        <Card>
          <CardContent className="p-4 grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{consumer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{consumer.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Block ID</p>
              <p className="font-semibold">{consumer.blockId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SR No</p>
              <p className="font-semibold">{consumer._id}</p>
            </div>
          </CardContent>
        </Card>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
    
          <StatsCard title="Today" value={`${todayConsumption} L`} variant="success" />
          <StatsCard title="Average" value={`${avgConsumption} L`} />
          <StatsCard title="This Month" value={`${thisMonthTotal} L`} variant="warning" />
          <StatsCard title="Last" value={`${lastReading?.consumption || 0} L`} variant="default" />
        </div>

        {/* FILTER */}
        <div className="flex gap-2">
          {[7, 15, 30].map((d) => (
            <button
              key={d}
              onClick={() => {
                const end = new Date();
                const start = subDays(end, d);
                setStartDate(start);
                setEndDate(end);
                setActiveFilter(d);
              }}
              className={`px-3 py-1 rounded-md border ${
                activeFilter === d ? "bg-primary text-white" : "bg-muted"
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
              <StatsCard title="Total" value={`${totalConsumption} L`} icon={BarChart3} variant="primary" />

        {/* GRAPH */}
        <Card>
          <CardHeader>
            <CardTitle>Consumption (Last {activeFilter} Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis tickFormatter={(d) => format(parseISO(d), "dd MMM")} dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="consumption" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* QUICK INSIGHTS */}
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Min</span><span>{minConsumption} L</span></div>
            <div className="flex justify-between"><span>Max</span><span>{maxConsumption} L</span></div>
            <div className="flex justify-between"><span>Avg</span><span>{avgConsumption} L</span></div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AdminUserAnalysis;