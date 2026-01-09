import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getConsumers, getInvoices, getPrepaidBalances, setPrepaidBalances, getPayments, setPayments, generateId, getMeterReadings, getWaterRates } from '@/lib/storage';
import { Consumer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, FileText, AlertTriangle, Wallet, Plus, Droplets, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const secretaryNavItems = [
  { label: 'Overview', href: '/secretary' },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

const SecretaryDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const allConsumers = getConsumers();
  const invoices = getInvoices();
  const prepaidBalances = getPrepaidBalances();
  const meterReadings = getMeterReadings();
  const waterRates = getWaterRates();
  
  const assignedConsumers = allConsumers.filter(c => c.assignedSecretaryId === user?.id);
  const assignedConsumerIds = assignedConsumers.map(c => c.id);
  
  const assignedInvoices = invoices.filter(inv => assignedConsumerIds.includes(inv.consumerId));
  const assignedReadings = meterReadings.filter(r => assignedConsumerIds.includes(r.consumerId));
  
  const pendingInvoices = assignedInvoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = assignedInvoices.filter(i => i.status === 'overdue').length;
  const totalOutstanding = assignedInvoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  // Water usage analytics
  const totalConsumption = assignedInvoices.reduce((sum, inv) => sum + inv.consumption, 0);
  const totalFreeConsumption = assignedInvoices.reduce((sum, inv) => sum + inv.freeConsumption, 0);
  const totalChargeableConsumption = assignedInvoices.reduce((sum, inv) => sum + inv.chargeableConsumption, 0);
  const avgConsumptionPerUser = assignedConsumers.length > 0 ? totalConsumption / assignedConsumers.length : 0;

  // Get current free tier
  const currentRate = waterRates.length > 0 ? waterRates[waterRates.length - 1] : null;
  const freeTierLimit = currentRate?.freeTierLiters || 13000;

  // Per-consumer usage data for chart
  const consumerUsageData = assignedConsumers.map(consumer => {
    const consumerInvoices = assignedInvoices.filter(inv => inv.consumerId === consumer.id);
    const consumerReadings = assignedReadings.filter(r => r.consumerId === consumer.id);
    const latestReading = consumerReadings.length > 0 
      ? consumerReadings.reduce((latest, r) => new Date(r.readingDate) > new Date(latest.readingDate) ? r : latest)
      : null;
    const totalUsage = consumerInvoices.reduce((sum, inv) => sum + inv.consumption, 0);
    
    return {
      name: consumer.name.split(' ')[0],
      fullName: consumer.name,
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
    const existingIndex = currentBalances.findIndex(b => b.consumerId === selectedConsumer.id);

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
        consumerId: selectedConsumer.id,
        balance: amount,
        lastRechargeAmount: amount,
        lastRechargeDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setPrepaidBalances(currentBalances);

    // Record payment transaction
    const payment = {
      id: generateId(),
      consumerId: selectedConsumer.id,
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

  return (
    <DashboardLayout navItems={secretaryNavItems} title="Secretary Dashboard">
      <div className="space-y-6 animate-fade-in" key={refreshKey}>
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">Manage your assigned consumers and monitor water usage</p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <StatsCard title="Assigned Consumers" value={assignedConsumers.length} icon={Users} variant="primary" />
          <StatsCard title="Total Usage" value={`${(totalConsumption / 1000).toFixed(1)}K L`} icon={Droplets} variant="default" />
          <StatsCard title="Avg Usage/User" value={`${(avgConsumptionPerUser / 1000).toFixed(1)}K L`} icon={TrendingUp} variant="default" />
          <StatsCard title="Pending Invoices" value={pendingInvoices} icon={FileText} variant="warning" />
          <StatsCard title="Total Outstanding" value={`$${totalOutstanding.toFixed(2)}`} icon={DollarSign} variant="destructive" />
        </div>

        {/* Water Usage Analytics Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Consumer Usage
              </CardTitle>
              <CardDescription>Water consumption by assigned consumers (Liters)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {consumerUsageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consumerUsageData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <YAxis dataKey="name" type="category" width={60} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} L`, 'Consumption']}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="consumption" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Usage Distribution
              </CardTitle>
              <CardDescription>Free tier vs chargeable consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {totalConsumption > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usageDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {usageDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} L`, '']}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Free Tier Limit:</span>
                  <span className="font-medium">{freeTierLimit.toLocaleString()} L per user</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Consumers</CardTitle>
            <CardDescription>Water usage and balance management for assigned consumers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Meter ID</TableHead>
                  <TableHead>Total Usage</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Prepaid Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedConsumers.map((consumer) => {
                  const usage = getConsumerUsage(consumer.id);
                  return (
                    <TableRow key={consumer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{consumer.name}</p>
                          <p className="text-sm text-muted-foreground">{consumer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{consumer.meterId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-primary" />
                          <span className="font-medium">{(usage / 1000).toFixed(1)}K L</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={consumer.accountType === 'prepaid' ? 'default' : 'secondary'}>
                          {consumer.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-success" />
                          <span className="font-semibold text-success">
                            ${getConsumerBalance(consumer.id).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={consumer.isActive ? 'default' : 'destructive'}>
                          {consumer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
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
                Add balance for {selectedConsumer?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Balance:</span>
                  <span className="font-semibold text-lg text-success">
                    ${selectedConsumer ? getConsumerBalance(selectedConsumer.id).toFixed(2) : '0.00'}
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
    </DashboardLayout>
  );
};

export default SecretaryDashboard;
