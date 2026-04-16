
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MeterReading } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getHistoricalReadings } from '../../services/water.service';

const API_URL2 = import.meta.env.VITE_API_URL;
import {
  Droplets,
  FileText,
  CreditCard,
  TrendingUp,
  Wallet,
  Gift,
  CalendarIcon,
  BarChart3,
  IndianRupee ,
  Clock,
  AlignCenter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  subMonths,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  fetchMeterReadingsFromSenseflow,
  fetchLatestFlowmeterStatus,
} from '../../services/senseflow';

const API_URL = API_URL2;
const consumerNavItems = [{ label: 'Dashboard', href: '/dashboard' }];

const ConsumerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const [waterConfig, setWaterConfig] = useState({
  ratePerLiter: 0,
  freeTierLiters: 0,
});

  /* ================= STATE ================= */
  const [consumer, setConsumer] = useState<any>(null);
  const [loadingConsumer, setLoadingConsumer] = useState(true);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [prepaidBalance, setPrepaidBalance] = useState(0);

  const currentPrepaidBalance = prepaidBalance; // ✅ FIX

  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const isFetchingRef = useRef(false);
  const [monthReadings, setMonthReadings] = useState<MeterReading[]>([]);
  const [latestStatus, setLatestStatus] = useState<{
    last_active: string;
    meter_reading: string;
  } | null>(null);

  const [loadingLastActive, setLoadingLastActive] = useState(false);

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<number | null>(30);
  const [rechargeAmount, setRechargeAmount] = useState('50');
  const [paymentMethod, setPaymentMethod] =
    useState<'online' | 'prepaid'>('online');

  const [startDate, setStartDate] = useState<Date | undefined>(
    subMonths(new Date(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);
useEffect(() => {
  fetch(`${API_URL}/water-rate`)
    .then(res => res.json())
    .then(data => {
      if (data) {
        setWaterConfig({
          ratePerLiter: data.ratePerLiter || 0,
          freeTierLiters: data.freeTierLiters || 0,
        });
      }
    })
    .catch(err => console.error("Rate fetch error:", err));
}, []);

useEffect(() => {
  if (!consumer) return;

  const loadMonthData = async () => {
    try {
      const start = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      const end = format(new Date(), 'yyyy-MM-dd');

      const data = await fetchMeterReadingsFromSenseflow(
        consumer.meterId,
        consumer._id,
        start,
        end
      );

      setMonthReadings(data);
    } catch (err) {
      console.error("Month data error:", err);
    }
  };

  loadMonthData();
}, [consumer]);
  /* ================= FETCH CONSUMER ================= */
  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setConsumer)
      .catch(() =>
        toast({
          title: 'Error',
          description: 'Consumer not found',
          variant: 'destructive',
        })
      )
      .finally(() => setLoadingConsumer(false));
  }, [token]);

  /* ================= FETCH INVOICES & PREPAID ================= */
  useEffect(() => {
    if (!consumer?._id) return;

    fetch(`${API_URL}/invoices/consumer/${consumer._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setInvoices);

    fetch(`${API_URL}/prepaid/${consumer._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setPrepaidBalance(d.balance || 0));
  }, [consumer?._id, token]);

  /* ================= FETCH READINGS ================= */
useEffect(() => {
  if (!consumer || !startDate || !endDate) return;

  setAppliedStartDate(startDate);
  setAppliedEndDate(endDate);
  applyQuickFilter(7);
}, [consumer]);

useEffect(() => {
  if (!consumer || !appliedStartDate || !appliedEndDate) return;

  const loadReadings = async () => {
    setLoadingReadings(true);

    try {
      
      /* 1️⃣ Get historical readings from DB */
      const dbReadings = await fetchMeterReadingsFromSenseflow(
        consumer.meterId,
        consumer._id,
        format(appliedStartDate, 'yyyy-MM-dd'),
        format(appliedEndDate, 'yyyy-MM-dd')
      );
      
      let mergedReadings = [...dbReadings];
      
      /* 2️⃣ Fetch today's live readings from Senseflow */
   const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

/* fetch last 3 days instead of only today */
const startSenseflow = format(subMonths(today, 0), 'yyyy-MM-dd'); // today
const past3Days = new Date(today.getTime() - 3 * 86400000);

let apiData: any = null;

try {

  apiData = await getHistoricalReadings(
    consumer.meterId,
    format(past3Days, 'yyyy-MM-dd'),
    format(today, 'yyyy-MM-dd')
  );

} catch (err) {

  console.log("Senseflow API failed or no data for today");

}

/* filter only today's readings */
const todayReadings =
  apiData?.data?.filter((r: any) =>
    r.reading_datetime.startsWith(todayStr)
  ) || [];

const exists = mergedReadings.some(
  (r) => r.readingDate === todayStr
);

if (!exists) {

  if (todayReadings.length >= 1) {

    const sorted = [...todayReadings].sort(
      (a, b) =>
        new Date(a.reading_datetime).getTime() -
        new Date(b.reading_datetime).getTime()
    );

    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];

    const opening = Number(earliest.meter_reading);
    const closing = Number(latest.meter_reading);

    const consumption =
      sorted.length > 1
        ? (closing - opening) * 1000
        : 0;

    mergedReadings.push({
      _id: 'today-reading',
      consumerId: consumer._id,
      meterId: consumer.meterId,
      source: 'smart_meter',
      readingDate: todayStr,
      reading: closing,
      previousReading: opening,
      consumption: consumption,
    });

  } else {

    /* today data not found */

    mergedReadings.push({
      _id: 'today-reading-missing',
      consumerId: consumer._id,
      meterId: consumer.meterId,
      source: 'smart_meter',
      readingDate: todayStr,
      reading: 0,
      previousReading: 0,
      consumption: 0,
    });

  }

}

      if (apiData?.data?.length >= 1) {

        const sorted = [...apiData.data].sort(
  (a, b) =>
    new Date(a.reading_datetime).getTime() -
    new Date(b.reading_datetime).getTime()
);

const earliest = sorted[0];
const latest = sorted[sorted.length - 1];

const opening = Number(earliest.meter_reading);
const closing = Number(latest.meter_reading);

const consumption = sorted.length > 1
  ? (closing - opening) * 1000
  : 0;

        const todayStr = format(today, 'yyyy-MM-dd');

        const exists = mergedReadings.some(
          (r) => r.readingDate === todayStr
        );

        if (!exists) {

    mergedReadings.push({
  _id: 'today-reading',
  consumerId: consumer._id,
  meterId: consumer.meterId,
  source: 'smart_meter',
  readingDate: todayStr,
  reading: closing,
  previousReading: opening,
  consumption: consumption,
});

        }

      }

setReadings(
  mergedReadings.sort(
    (a, b) =>
      new Date(a.readingDate).getTime() -
      new Date(b.readingDate).getTime()
  )
);

    } catch (err) {

      console.error('Error loading readings:', err);

    } finally {

      setLoadingReadings(false);

    }
  };

  loadReadings();

}, [consumer?._id, appliedStartDate, appliedEndDate]);

  /* ================= LAST ACTIVE ================= */
  useEffect(() => {
    if (!consumer?.meterId) return;

    setLoadingLastActive(true);

    fetchLatestFlowmeterStatus(consumer.meterId)
      .then(setLatestStatus)
      .finally(() => setLoadingLastActive(false));
      
  }, [consumer?.meterId]);


/* ================= THIS MONTH TOTAL ================= */
const thisMonthTotal = useMemo(() => {
  if (!monthReadings?.length) return 0;

  const now = new Date();

  return monthReadings
    .filter((r) => {
      const d = parseISO(r.readingDate);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, r) => sum + (r.consumption || 0), 0);
}, [monthReadings]);

const thisMonthChargeableLiters = useMemo(() => {
  const free = waterConfig.freeTierLiters || 0;
  return Math.max(0, thisMonthTotal - free);
}, [thisMonthTotal, waterConfig]);


  /* ================= DERIVED ================= */
  const filteredReadings = useMemo(() => {
    if (!appliedStartDate || !appliedEndDate) return [];
    return readings.filter((r) =>
      isWithinInterval(parseISO(r.readingDate), {
        start: startOfDay(appliedStartDate),
        end: endOfDay(appliedEndDate),
      })
    );
  }, [readings, appliedStartDate, appliedEndDate]);

const lastReading = [...filteredReadings].sort(
  (a, b) =>
    new Date(b.readingDate).getTime() -
    new Date(a.readingDate).getTime()
)[0];
const consumptionData = filteredReadings.map((r) => ({
  date: r.readingDate,
  label: format(parseISO(r.readingDate), 'dd MMM'),
  consumption: r.consumption,
}));

  const monthlyAnalysis = useMemo(() => {
  if (filteredReadings.length === 0) {
    return {
      totalConsumption: 0,
      avgConsumption: 0,
      chargeableConsumption: 0,
      estimatedBill: 0,
      minConsumption: 0,
      maxConsumption: 0,
      readingsCount: 0,
    };
  }

  const consumptions = filteredReadings.map((r) => r.consumption);
  const total = consumptions.reduce((a, b) => a + b, 0);

  const freeLimit = waterConfig.freeTierLiters;
  const rate = waterConfig.ratePerLiter;

  const chargeable = Math.max(0, total - freeLimit);
  const bill = chargeable * rate;

  return {
    totalConsumption: total,
    avgConsumption: Math.round(total / consumptions.length),
    chargeableConsumption: chargeable,
    estimatedBill: bill,
    minConsumption: Math.min(...consumptions),
    maxConsumption: Math.max(...consumptions),
    readingsCount: consumptions.length,
  };
}, [filteredReadings, waterConfig]);
const thisMonthBill = useMemo(() => {
  const free = waterConfig.freeTierLiters || 0;
  const rate = waterConfig.ratePerLiter || 0;

  const chargeable = Math.max(0, thisMonthTotal - free);
  return chargeable * rate;
}, [thisMonthTotal, waterConfig]);
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid');
  const totalOutstanding = pendingInvoices.reduce(
    (s, i) => s + i.totalAmount,
    0
  );
  const selectedInvoiceData = invoices.find((i) => i.id === selectedInvoice);
  const canPayWithPrepaid =
    selectedInvoiceData &&
    currentPrepaidBalance >= selectedInvoiceData.totalAmount;

  /* ================= ACTIONS ================= */
  const handlePayInvoice = () => {
    toast({
      title: 'Payment',
      description: 'Payment integration coming next',
    });
    setIsPayDialogOpen(false);
  };

  const handleRecharge = () => {
    toast({
      title: 'Recharge',
      description: `Recharge of $${rechargeAmount} initiated`,
    });
    setIsRechargeDialogOpen(false);
  };
  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setStartDate(start);
    setEndDate(end);
    setAppliedStartDate(start);
    setAppliedEndDate(end);
    setActiveQuickFilter(days);
  };

  const applyCustomFilter = () => {
    if (!startDate || !endDate) return;

    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setActiveQuickFilter(null);
  };

  if (loadingConsumer) return null;

  return (
    <DashboardLayout navItems={consumerNavItems} title="Consumer Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Welcome, {consumer.name}</h1>
            <p className="text-muted-foreground mt-1">Meter ID: {consumer.meterId}</p>
          </div>
          <Button onClick={() => setIsRechargeDialogOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Recharge Balance
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatsCard 
  title="Free Tier" 
  value={`${waterConfig.freeTierLiters.toLocaleString()} L`} 
  icon={Gift} 
  variant="primary" 
/>
          {/* <StatsCard title="Last Reading" value={`${(lastReading?.reading || 0).toLocaleString()} M³`} icon={Droplets} variant="default" /> */}
          <StatsCard title="Last Consumption" value={`${((lastReading?.consumption) || 0).toLocaleString()} L`} icon={TrendingUp} variant="default" />
           <StatsCard
  title="This Month Bill"
  value={`₹${thisMonthBill.toFixed(2)}`}
  icon={IndianRupee}
  variant="success"
/>
            <StatsCard
  title="This Month Consumption"
  value={`${thisMonthTotal.toLocaleString()} L`}
  icon={BarChart3}
  variant="success"
/>
<StatsCard
  title="Chargeable Usage (This Month)"
  value={`${thisMonthChargeableLiters.toLocaleString()} L`}
  icon={Droplets}
  variant="warning"
/>
          <StatsCard
            title="Last Active"
            value={
              loadingLastActive
                ? "Loading..."
                : latestStatus?.last_active
                  ? format(
                    new Date(latestStatus.last_active),
                    "dd MMM yyyy, hh:mm a"
                  )
                  : "—"
            }
            icon={Clock}
            variant={latestStatus ? "warning" : "default"}
          />
          <StatsCard
            title="Latest Meter Reading"
            value={
              loadingLastActive
                ? "Loading..."
                : latestStatus?.meter_reading
                  ? `${Number(latestStatus.meter_reading).toLocaleString()} M³`
                  : "—"
            }
            icon={Droplets}
            variant="primary"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Consumption History in Liters</CardTitle>
              <CardDescription>Your water usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={consumptionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                 <XAxis
  dataKey="date"
  tickFormatter={(d) => format(parseISO(d), "dd MMM")}
  className="text-xs"
/>
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="consumption" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your billing history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(-5).reverse().map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold">₹{invoice.totalAmount.toFixed(2)}</span>
                          <p className="text-xs text-muted-foreground">
                            {invoice.consumption.toLocaleString()}L used ({invoice.chargeableConsumption?.toLocaleString() || 0}L charged)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={invoice.status === 'paid' ? 'bg-success/20 text-success' : invoice.status === 'overdue' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.status !== 'paid' && (
                          <Button size="sm" onClick={() => { setSelectedInvoice(invoice.id); setIsPayDialogOpen(true); }}>
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Readings & Analysis
                </CardTitle>
                <CardDescription>View meter readings and consumption analysis by date range</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">From:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd MMM yyyy") : <span>Start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">To:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd MMM yyyy") : <span>End date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" variant={activeQuickFilter === 7 ? "default" : "outline"} disabled={loadingReadings} onClick={() => applyQuickFilter(7)}>
                    Last 7 Days
                  </Button>

                  <Button size="sm" variant={activeQuickFilter === 15 ? "default" : "outline"} disabled={loadingReadings} onClick={() => applyQuickFilter(15)}>
                    Last 15 Days
                  </Button>

                  <Button size="sm" variant={activeQuickFilter === 30 ? "default" : "outline"} disabled={loadingReadings} onClick={() => applyQuickFilter(30)}>
                    Last 30 Days
                  </Button>
                  <Button size="sm" onClick={applyCustomFilter}>
                    Apply Filter
                  </Button>

                </div>

              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Analysis Summary */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total Consumption</p>
                <p className="text-2xl font-bold text-primary">{((monthlyAnalysis.totalConsumption)).toLocaleString() } L</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">Average per Reading</p>
                <p className="text-2xl font-bold">{(monthlyAnalysis.avgConsumption).toLocaleString()} L</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">Chargeable Usage</p>
                <p className="text-2xl font-bold">{monthlyAnalysis.chargeableConsumption.toLocaleString()} L</p>
<p className="text-xs text-muted-foreground">
  (After {waterConfig.freeTierLiters.toLocaleString()}L free)
</p>
              </div>
              
            </div>

            {/* Readings Table */}
            {loadingReadings ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Loading readings...
                </p>
              </div>
            ) : filteredReadings.length > 0 ? (

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Current Reading</TableHead>
                    <TableHead>Previous Reading</TableHead>          
                
                    <TableHead>Consumption</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReadings.slice()
                    .sort(
                      (a, b) =>
                        new Date(b.readingDate).getTime() -
                        new Date(a.readingDate).getTime()).map((reading) => (
                          <TableRow key={reading._id}>
                    <TableCell>
  {format(parseISO(reading.readingDate), 'dd MMM yyyy')}
  {reading._id === 'today-reading' && (
    <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">
      Live
    </Badge>
  )}
</TableCell>
                            <TableCell className="font-medium">{reading.reading.toLocaleString()} M³</TableCell>
                            <TableCell className="text-muted-foreground">{reading.previousReading.toLocaleString()} M³</TableCell>
                            <TableCell>
                  <Badge
  variant="outline"
  className={
    reading.consumption > waterConfig.freeTierLiters
      ? 'border-warning text-warning'
      : 'border-success text-success'
  }
>


                                {(reading.consumption).toLocaleString()} L
                              </Badge>
                            </TableCell>
                           
                          </TableRow>
                        ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Droplets className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No readings found for the selected date range</p>
              </div>
            )}

            {/* Min/Max Summary */}
            {filteredReadings.length > 0 && (
              <div className="flex gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Min:</span>
                  <Badge variant="outline" className="border-success text-success">{(monthlyAnalysis.minConsumption).toLocaleString()} L</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Max:</span>
                  <Badge variant="outline" className="border-warning text-warning">{(monthlyAnalysis.maxConsumption).toLocaleString()} L</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Readings:</span>
                  <Badge variant="secondary">{monthlyAnalysis.readingsCount}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pay Dialog with Payment Method Options */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pay Invoice</DialogTitle>
              <DialogDescription>Choose your payment method</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <p className="text-3xl font-bold text-center text-primary">
                ₹{selectedInvoiceData?.totalAmount.toFixed(2)}
              </p>

              <Tabs defaultValue="online" onValueChange={(v) => setPaymentMethod(v as 'online' | 'prepaid')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="online">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Online Payment
                  </TabsTrigger>
                  <TabsTrigger value="prepaid">
                    <Wallet className="h-4 w-4 mr-2" />
                    Prepaid Balance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="online" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Pay securely using your debit/credit card or online banking
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prepaid" className="mt-4">
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Available Balance:</span>
                        <span className="font-semibold text-lg">₹{currentPrepaidBalance.toFixed(2)}</span>
                      </div>
                      {!canPayWithPrepaid && (
                        <p className="text-sm text-destructive">
                          Insufficient balance. Please recharge to use this option.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handlePayInvoice}

                disabled={paymentMethod === 'prepaid' && !canPayWithPrepaid}
              >
                {paymentMethod === 'prepaid' ? 'Pay from Balance' : 'Pay Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recharge Dialog */}
        <Dialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recharge Prepaid Balance</DialogTitle>
              <DialogDescription>Add funds to pay bills instantly</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Balance:</span>
                  <span className="font-semibold text-lg">₹{currentPrepaidBalance.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Recharge Amount (₹)</Label>
                <Input id="amount" type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} min="1" />
              </div>
              <div className="flex gap-2">
                {[25, 50, 100, 200].map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setRechargeAmount(amt.toString())}>
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRechargeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRecharge}>Recharge ₹{rechargeAmount}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ConsumerDashboard;
