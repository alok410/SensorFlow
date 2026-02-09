import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getConsumers, getSecretaries, getInvoices, getPayments, getMeterReadings } from '@/lib/storage';
import { Users, UserCheck, DollarSign, FileText, AlertTriangle, Droplets, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: "Locations", href: "/admin/locations" },

]

const AdminDashboard: React.FC = () => {
  const consumers = getConsumers();
  const secretaries = getSecretaries();
  const invoices = getInvoices();
  const payments = getPayments();
  const readings = getMeterReadings();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
  const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const collectionRate = invoices.length > 0 ? Math.round((paidInvoices / invoices.length) * 100) : 0;

  // Chart data
  const monthlyRevenue = [
    { month: 'Jan', revenue: 12400 },
    { month: 'Feb', revenue: 14500 },
    { month: 'Mar', revenue: 13200 },
    { month: 'Apr', revenue: 15800 },
    { month: 'May', revenue: 16200 },
    { month: 'Jun', revenue: totalRevenue },
  ];

  const consumptionData = [
    { month: 'Jan', consumption: 4500 },
    { month: 'Feb', consumption: 5200 },
    { month: 'Mar', consumption: 4800 },
    { month: 'Apr', consumption: 5100 },
    { month: 'May', consumption: 5500 },
    { month: 'Jun', consumption: totalConsumption },
  ];

  const invoiceStatusData = [
    { name: 'Paid', value: paidInvoices, color: 'hsl(var(--success))' },
    { name: 'Pending', value: pendingInvoices, color: 'hsl(var(--warning))' },
    { name: 'Overdue', value: overdueInvoices, color: 'hsl(var(--destructive))' },
  ];

  const recentInvoices = invoices.slice(-5).reverse();

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your water utility system performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Consumers"
            value={consumers.length}
            icon={Users}
            variant="primary"
            description="Active connections"
          />
          <StatsCard
            title="Total Secretaries"
            value={secretaries.length}
            icon={UserCheck}
            variant="default"
            description="Managing consumers"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            variant="success"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Collection Rate"
            value={`${collectionRate}%`}
            icon={TrendingUp}
            variant={collectionRate > 80 ? 'success' : collectionRate > 60 ? 'warning' : 'destructive'}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Pending Invoices"
            value={pendingInvoices}
            icon={FileText}
            variant="warning"
          />
          <StatsCard
            title="Overdue Invoices"
            value={overdueInvoices}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="Total Consumption"
            value={`${totalConsumption.toLocaleString()} units`}
            icon={Droplets}
            variant="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Monthly Revenue</CardTitle>
              <CardDescription>Revenue trends over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Consumption Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Water Consumption</CardTitle>
              <CardDescription>Total consumption trends (units)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={consumptionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Invoice Status Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Invoice Status</CardTitle>
              <CardDescription>Distribution of invoice statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {invoiceStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display">Recent Invoices</CardTitle>
              <CardDescription>Latest billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInvoices.map((invoice) => {
                  const consumer = consumers.find(c => c._id === invoice.consumerId);
                  return (
                    <div
                      key={invoice._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{consumer?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.consumption} units • {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${invoice.totalAmount.toFixed(2)}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-success/20 text-success'
                              : invoice.status === 'overdue'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;