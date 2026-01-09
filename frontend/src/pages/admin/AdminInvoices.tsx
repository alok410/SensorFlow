import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getInvoices, setInvoices, getConsumers, getPayments, setPayments, generateId } from '@/lib/storage';
import { Invoice, InvoiceStatus, Payment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, CheckCircle, DollarSign } from 'lucide-react';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
];

const AdminInvoices: React.FC = () => {
  const [invoices, setInvoicesState] = useState<Invoice[]>(getInvoices());
  const consumers = getConsumers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const { toast } = useToast();

  const filteredInvoices = invoices.filter((inv) => {
    const consumer = consumers.find(c => c.id === inv.consumerId);
    const matchesSearch =
      consumer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => {
    const updated = invoices.map((inv) =>
      inv.id === invoice.id
        ? {
            ...inv,
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date().toISOString() : inv.paidAt,
          }
        : inv
    );
    setInvoices(updated);
    setInvoicesState(updated);
    toast({ title: 'Invoice Updated', description: `Invoice status changed to ${newStatus}.` });
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;

    // Create payment record
    const payment: Payment = {
      id: generateId(),
      consumerId: selectedInvoice.consumerId,
      invoiceId: selectedInvoice.id,
      amount: selectedInvoice.totalAmount,
      method: 'manual',
      notes: paymentNotes,
      createdAt: new Date().toISOString(),
      recordedBy: 'admin',
    };

    const payments = getPayments();
    setPayments([...payments, payment]);

    // Update invoice status
    handleStatusChange(selectedInvoice, 'paid');

    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
    setPaymentNotes('');
    toast({ title: 'Payment Recorded', description: 'Manual payment has been recorded successfully.' });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      approved: 'outline',
      overdue: 'destructive',
    };
    const colors: Record<InvoiceStatus, string> = {
      paid: 'bg-success/20 text-success border-success/30',
      pending: 'bg-warning/20 text-warning border-warning/30',
      approved: 'bg-primary/20 text-primary border-primary/30',
      overdue: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Invoice Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all billing invoices</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Consumer</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const consumer = consumers.find(c => c.id === invoice.consumerId);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.id.slice(0, 12)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{consumer?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{consumer?.meterId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(invoice.billPeriodStart).toLocaleDateString()} -<br />
                        {new Date(invoice.billPeriodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{invoice.consumption} units</TableCell>
                      <TableCell className="font-semibold">${invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(invoice, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {invoice.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Record Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Manual Payment</DialogTitle>
              <DialogDescription>
                Record a manual payment for invoice {selectedInvoice?.id.slice(0, 12)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Amount to record</p>
                <p className="text-2xl font-bold">${selectedInvoice?.totalAmount.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Payment Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Cash payment received at office"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment}>
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminInvoices;