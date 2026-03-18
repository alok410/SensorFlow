import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getConsumers } from '@/services/consumer.service';
import { getAllSecretaries } from '@/services/secretary.service';
import { getInvoices, getPrepaidBalances, setPrepaidBalances, getPayments, setPayments, generateId, getMeterReadings, getWaterRates } from '@/lib/storage';
import { Consumer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, FileText, AlertTriangle, Wallet, Plus, Droplets, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend ,LabelList} from 'recharts';
import { getDailyConsumption } from "@/services/water.service";
import { LineChart, Line } from "recharts";
import { getLocations } from "@/services/location.service";

const secretaryNavItems = [
  { label: 'Overview', href: '/secretary' },
  { label: 'My Users', href: '/secretary/Users' },

];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

const SecretaryDashboard: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"7" | "15" | "30" | "custom">("7");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [secretaryLocationName, setSecretaryLocationName] = useState<string>("");



  const [dailyConsumptionByDate, setDailyConsumptionByDate] = useState<any[]>([]);
  const [dailyConsumptionByMeter, setDailyConsumptionByMeter] = useState<any[]>([]);

  const [loadingWater, setLoadingWater] = useState(false);
  const [allConsumers, setAllConsumers] = useState<Consumer[]>([]);
  const [secretaryLocationId, setSecretaryLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const invoices = getInvoices();
  const prepaidBalances = getPrepaidBalances();
  const meterReadings = getMeterReadings();
  const waterRates = getWaterRates();
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch consumers
        const consumersRes = await getConsumers();
        const consumersArray =
          Array.isArray(consumersRes) ? consumersRes :
            Array.isArray(consumersRes.data) ? consumersRes.data :
              Array.isArray(consumersRes.data?.data) ? consumersRes.data.data :
                [];

        setAllConsumers(consumersArray);

        // Fetch secretaries
        const secretariesRes = await getAllSecretaries();
        const secretariesArray =
          Array.isArray(secretariesRes) ? secretariesRes :
            Array.isArray(secretariesRes.data) ? secretariesRes.data :
              Array.isArray(secretariesRes.data?.data) ? secretariesRes.data.data :
                [];

        const loggedSecretary = secretariesArray.find(
          (s: any) => s._id === user.id
        );

        if (loggedSecretary) {
          setSecretaryLocationId(loggedSecretary.locationId);

          const locationsRes = await getLocations();

          const locationsArray =
            Array.isArray(locationsRes) ? locationsRes :
              Array.isArray(locationsRes.data) ? locationsRes.data :
                Array.isArray(locationsRes.data?.data) ? locationsRes.data.data :
                  [];

          setLocations(locationsArray);

          const matchedLocation = locationsArray.find(
            (loc: any) =>
              loc._id?.toString() === loggedSecretary.locationId?.toString()
          );



          if (matchedLocation) {
            setSecretaryLocationName(matchedLocation.name);
          }
        }

      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const assignedConsumers = useMemo(() => {
    return allConsumers.filter(
      (c) =>
        c.locationId?.toString() === secretaryLocationId?.toString()
    );
  }, [allConsumers, secretaryLocationId]);

  const assignedConsumerIds = assignedConsumers.map(c => c._id);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingWater(true);

        if (!assignedConsumers.length) {
          setDailyConsumptionByDate([]);
          setDailyConsumptionByMeter([]);
          return;
        }
        const today = new Date();
        let startDateObj = new Date();

        if (dateFilter === "7") startDateObj.setDate(today.getDate() - 7);
        if (dateFilter === "15") startDateObj.setDate(today.getDate() - 15);
        if (dateFilter === "30") startDateObj.setDate(today.getDate() - 30);

        let start: string;
        let end: string;


        if (dateFilter === "custom" && startDate && endDate) {
          start = startDate;
          end = endDate;
        } else {
          start = startDateObj.toISOString().split("T")[0];
          end = today.toISOString().split("T")[0];
        }

        const filteredConsumers =
          selectedUser === "all"
            ? assignedConsumers
            : assignedConsumers.filter(
              (c) => c._id?.toString() === selectedUser
            );

        const meterIds = filteredConsumers
          .map((c) => c.meterId)
          .filter((id) => id && id.trim() !== "");

        if (!meterIds.length) {
          setDailyConsumptionByDate([]);
          setDailyConsumptionByMeter([]);
          return;
        }

        const groupedByDate: Record<string, number> = {};
        const groupedByMeter: Record<string, any> = {};

        for (const deviceId of meterIds) {
          try {

            const response = await getDailyConsumption(deviceId, start, end);
            const dailyArray =
              Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                  ? response.data
                  : [];

            dailyArray.forEach((item: any) => {
              const date = item.reading_date;

              const value = Number(item.consumption || 0);

              if (!groupedByDate[date]) groupedByDate[date] = 0;
              groupedByDate[date] += value;
              if (!groupedByMeter[deviceId]) {
                groupedByMeter[deviceId] = {
                  consumption: 0
                };
              }

              groupedByMeter[deviceId].consumption += value;
            });

          } catch (err) {
            console.error("Meter fetch failed:", deviceId, err);
          }
        }
        const mergedByDate = Object.keys(groupedByDate)
          .sort()
          .map((date) => ({
            reading_date: date,
            consumption: groupedByDate[date],
          }));
        const mergedByMeter = Object.keys(groupedByMeter).map((meterId) => ({
          meterId,
          consumption: groupedByMeter[meterId].consumption
        }));

        setDailyConsumptionByDate(mergedByDate);
        setDailyConsumptionByMeter(mergedByMeter);

      } catch (err) {
        console.error("Water fetch error:", err);
        setDailyConsumptionByDate([]);
        setDailyConsumptionByMeter([]);
      } finally {
        setLoadingWater(false);
      }
    };

    fetchData();
  }, [selectedUser, dateFilter, startDate, endDate, assignedConsumers]);



  const totalWaterConsumption = dailyConsumptionByDate.reduce(
    (s, d) => s + (Number(d.consumption || 0)),
    0
  );
  const consumptionChartData = dailyConsumptionByDate.map((d) => ({
    date: d.reading_date,
    consumption: Number(d.consumption || 0), // convert to liters
  }));
  const formatName = (consumer: any) => {
    if (!consumer?.blockId) return consumer?.name || "";
    return `${consumer.blockId}-${consumer.name}`;
  };
  const assignedInvoices = invoices.filter(inv => assignedConsumerIds.includes(inv.consumerId));
  const assignedReadings = meterReadings.filter(r => assignedConsumerIds.includes(r.consumerId));

  const pendingInvoices = assignedInvoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = assignedInvoices.filter(i => i.status === 'overdue').length;
  const totalOutstanding = assignedInvoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalConsumption = assignedInvoices.reduce((sum, inv) => sum + inv.consumption, 0);
  const totalFreeConsumption = assignedInvoices.reduce((sum, inv) => sum + inv.freeConsumption, 0);
  const totalChargeableConsumption = assignedInvoices.reduce((sum, inv) => sum + inv.chargeableConsumption, 0);
  const avgConsumptionPerUser = assignedConsumers.length > 0 ? totalConsumption / assignedConsumers.length : 0;

  const currentRate = waterRates.length > 0 ? waterRates[waterRates.length - 1] : null;
  const freeTierLimit = currentRate?.freeTierLiters || 13000;

  const consumerUsageData = assignedConsumers.map(consumer => {
    const consumerInvoices = assignedInvoices.filter(inv => inv.consumerId === consumer._id);
    const consumerReadings = assignedReadings.filter(r => r.consumerId === consumer._id);
    const latestReading = consumerReadings.length > 0
      ? consumerReadings.reduce((latest, r) => new Date(r.readingDate) > new Date(latest.readingDate) ? r : latest)
      : null;
    const totalUsage = consumerInvoices.reduce((sum, inv) => sum + inv.consumption, 0);

    return {

      name: formatName(consumer),
      fullName: formatName(consumer),
      consumption: totalUsage,
      latestReading: latestReading?.reading || 0,
      meterId: consumer.meterId,
    };
  }).sort((a, b) => b.consumption - a.consumption).slice(0, 10);

  // Usage distribution pie chart data
  const usageDistribution = [
    { name: 'Free Tier Used', value: totalFreeConsumption },
    { name: 'Chargeable Usage', value: totalChargeableConsumption },
  ];

  // Add balance dialog state
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);
  const [cashAmount, setCashAmount] = useState('');

  const getConsumerBalance = (consumerId: string) => {
    const balance = prepaidBalances.find(b => b.consumerId === consumerId);
    return balance?.balance || 0;
  };

  const getConsumerUsage = (consumerId: string) => {
    const consumerInvoices = assignedInvoices.filter(inv => inv.consumerId === consumerId);
    return consumerInvoices.reduce((sum, inv) => sum + inv.consumption, 0);
  };
  const getTodayUsage = (meterId: string) => {
    const meter = dailyConsumptionByMeter.find(
      (m) => m.meterId?.toString() === meterId?.toString()
    );

    return meter ? Number(meter.consumption || 0) : 0;
  };



  const handleOpenAddBalance = (consumer: Consumer) => {
    setSelectedConsumer(consumer);
    setCashAmount('');
    setIsAddBalanceOpen(true);
  };

  const handleAddCashBalance = () => {
    if (!selectedConsumer || !user) return;

    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    // Update prepaid balance
    const currentBalances = getPrepaidBalances();
    const existingIndex = currentBalances.findIndex(b => b.consumerId === selectedConsumer._id);

    if (existingIndex >= 0) {
      currentBalances[existingIndex] = {
        ...currentBalances[existingIndex],
        balance: currentBalances[existingIndex].balance + amount,
        lastRechargeAmount: amount,
        lastRechargeDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      currentBalances.push({
        consumerId: selectedConsumer._id,
        balance: amount,
        lastRechargeAmount: amount,
        lastRechargeDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setPrepaidBalances(currentBalances);

    // Record payment transaction
    const payment = {
      _id: generateId(),
      consumerId: selectedConsumer._id,
      amount,
      method: 'manual' as const,
      transactionId: `CASH-${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
      notes: `Cash payment received by ${user.name}`,
      createdAt: new Date().toISOString(),
      recordedBy: user.id,
    };
    const allPayments = getPayments();
    setPayments([...allPayments, payment]);

    toast({
      title: 'Balance Added',
      description: `Added $${amount.toFixed(2)} to ${selectedConsumer.name}'s account`
    });

    setIsAddBalanceOpen(false);
    setSelectedConsumer(null);
    setCashAmount('');
    setRefreshKey(prev => prev + 1);
  };

  const formatLiters = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + " ML";
    if (value >= 1000) return (value / 1000).toFixed(2) + "L";
    return value.toFixed(0) + " L";
  };

  const top5UsageData = dailyConsumptionByMeter
    .map((d) => {
      const consumer = assignedConsumers.find(
        (c) => c.meterId === d.meterId
      );

      return {
        name: consumer ? formatName(consumer) : "Unknown",
        usage: Number(d.consumption || 0),
      };
    })
    .filter((u) => u.usage > 0)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

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
  const sortedConsumers = [...assignedConsumers].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    if (sortColumn === "usage") {
      valueA = getTodayUsage(a.meterId);
      valueB = getTodayUsage(b.meterId);
    } else {
      valueA = a[sortColumn] || "";
      valueB = b[sortColumn] || "";
    }

    if (typeof valueA === "string") valueA = valueA.toLowerCase();
    if (typeof valueB === "string") valueB = valueB.toLowerCase();

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;

    return 0;
  });

  return (
    <DashboardLayout navItems={secretaryNavItems} title="Secretary Dashboard">
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in" key={refreshKey}>
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome, {user?.name} -  {secretaryLocationName}
            </h1>``
            <p className="text-muted-foreground mt-1">Manage your assigned consumers and monitor water usage</p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <StatsCard title="Assigned Consumers" value={assignedConsumers.length} icon={Users} variant="primary" />
            <StatsCard
              title="Total Usage (Filtered)"
              value={totalWaterConsumption + " L"}
              icon={Droplets}
              variant="default"
            />
            <StatsCard title="Avg Usage/User" value={`${(avgConsumptionPerUser / 1000).toFixed(1)}K L`} icon={TrendingUp} variant="default" />
            <StatsCard title="Pending Invoices" value={pendingInvoices} icon={FileText} variant="warning" />
            <StatsCard title="Total Outstanding" value={`$${totalOutstanding.toFixed(2)}`} icon={DollarSign} variant="destructive" />
          </div>
          <Card className="mb-6">
            <CardContent className="p-6 grid md:grid-cols-3 gap-4">

              {/* USER FILTER */}
              <div>
                <label className="text-sm font-medium mb-1 block">User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="all">All Users</option>
                  {assignedConsumers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {formatName(u)}
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
                      className={`px-4 py-2 text-sm rounded-full ${dateFilter === d
                        ? "bg-primary text-white"
                        : "bg-white border"
                        }`}
                    >
                      Last {d} Days
                    </button>
                  ))}

                  <button
                    onClick={() => setDateFilter("custom")}
                    className={`px-4 py-2 text-sm rounded-full ${dateFilter === "custom"
                      ? "bg-primary text-white"
                      : "bg-white border"
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
          {/* Water Usage Analytics Section */}

          <Card>
            <CardHeader>
              <CardTitle>Water Consumption Trend</CardTitle>
              <CardDescription>
                Based on selected user & date range
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loadingWater ? (
                <div className="h-[300px] flex items-center justify-center">
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
                    />     <YAxis />
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>







          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top 5 Users by Usage (Liters)
              </CardTitle>
              <CardDescription>
                Water consumption comparison in Liters
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="h-[300px]">
                {top5UsageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top5UsageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                      <XAxis type="number" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tickFormatter={(value) =>
                          value.length > 12 ? value.substring(0, 12) + "..." : value
                        }
                      />

                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toLocaleString()} L`,
                          "Usage",
                        ]}
                        labelFormatter={(label) => `User: ${label}`}
                      />
<Bar
  dataKey="usage"
  fill="#2563eb"
  radius={[0, 8, 8, 0]}
>
  <LabelList
    dataKey="usage"
    position="inside"
    formatter={(value: number) => `${value}`}
    style={{
      fill: "#ffffff",
      fontWeight: "bold",
      fontSize: 12,
    }}
  />
</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assigned Consumers</CardTitle>
              <CardDescription>Water usage and balance management for assigned consumers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>

                    <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                      Name {sortColumn === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </TableHead>

                    <TableHead onClick={() => handleSort("meterId")} className="cursor-pointer">
                      Meter {sortColumn === "meterId" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </TableHead>

                    <TableHead onClick={() => handleSort("serialNumber")} className="cursor-pointer">
                      Serial Number {sortColumn === "serialNumber" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </TableHead>

                    <TableHead onClick={() => handleSort("usage")} className="cursor-pointer">
                      Total Usage {sortColumn === "usage" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </TableHead>

                    <TableHead className="text-right">
                      Actions
                    </TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedConsumers.map((consumer) => {
                    const todayUsage = getTodayUsage(consumer.meterId);
                    return (
                      <TableRow key={consumer._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatName(consumer)}</p>
                            <p className="text-sm text-muted-foreground">{consumer.email}</p>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-sm">
                          <div>

                            <div>{consumer.meterId}</div>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-sm">
                          <div>
                            {consumer.serialNumber || "-"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {formatLiters(getTodayUsage(consumer.meterId))}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleOpenAddBalance(consumer)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Cash
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Cash Balance Dialog */}
          <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cash Payment</DialogTitle>
                <DialogDescription>
                  Add balance for {selectedConsumer ? formatName(selectedConsumer) : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Balance:</span>
                    <span className="font-semibold text-lg text-success">
                      Rs{selectedConsumer ? getConsumerBalance(selectedConsumer._id).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cashAmount">Cash Amount Received ($)</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[10, 25, 50, 100, 200].map(amt => (
                    <Button key={amt} variant="outline" size="sm" onClick={() => setCashAmount(amt.toString())}>
                      ${amt}
                    </Button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddBalanceOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCashBalance}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Add ${cashAmount || '0'} Balance
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

    </DashboardLayout>
  );
};

export default SecretaryDashboard;
