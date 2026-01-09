import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getConsumers, setConsumers, getSecretaries, setSecretaries, generateId, generateMeterId } from '@/lib/storage';
import { Consumer, Secretary, AccountType, Location, LOCATIONS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
];

const AdminUsers: React.FC = () => {
  const [consumers, setConsumersState] = useState<Consumer[]>(getConsumers());
  const [secretaries] = useState<Secretary[]>(getSecretaries());
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<Location | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsumer, setEditingConsumer] = useState<Consumer | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    accountType: 'postpaid' as AccountType,
    assignedSecretaryId: '',
    location: 'ahmedabad' as Location,
  });

  const filteredConsumers = consumers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.meterId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || c.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  // Filter secretaries by selected location in form
  const filteredSecretaries = secretaries.filter(s => s.location === formData.location);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      accountType: 'postpaid',
      assignedSecretaryId: '',
      location: 'ahmedabad',
    });
    setEditingConsumer(null);
  };

  const handleOpenDialog = (consumer?: Consumer) => {
    if (consumer) {
      setEditingConsumer(consumer);
      setFormData({
        name: consumer.name,
        email: consumer.email,
        phone: consumer.phone || '',
        address: consumer.address || '',
        accountType: consumer.accountType,
        assignedSecretaryId: consumer.assignedSecretaryId || '',
        location: consumer.location,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingConsumer) {
      // Update existing
      const updated = consumers.map((c) =>
        c.id === editingConsumer.id
          ? { ...c, ...formData }
          : c
      );
      setConsumers(updated);
      setConsumersState(updated);
      
      // Update secretary assignments
      if (formData.assignedSecretaryId !== editingConsumer.assignedSecretaryId) {
        const secs = getSecretaries();
        const updatedSecs = secs.map(s => {
          if (s.id === editingConsumer.assignedSecretaryId) {
            return { ...s, assignedConsumerIds: s.assignedConsumerIds.filter(id => id !== editingConsumer.id) };
          }
          if (s.id === formData.assignedSecretaryId) {
            return { ...s, assignedConsumerIds: [...s.assignedConsumerIds, editingConsumer.id] };
          }
          return s;
        });
        setSecretaries(updatedSecs);
      }

      toast({ title: 'Consumer Updated', description: `${formData.name} has been updated.` });
    } else {
      // Create new
      const newConsumer: Consumer = {
        id: generateId(),
        email: formData.email,
        name: formData.name,
        role: 'user',
        phone: formData.phone,
        address: formData.address,
        createdAt: new Date().toISOString(),
        isActive: true,
        meterId: generateMeterId(),
        accountType: formData.accountType,
        assignedSecretaryId: formData.assignedSecretaryId || undefined,
        connectionDate: new Date().toISOString(),
        location: formData.location,
      };

      const updated = [...consumers, newConsumer];
      setConsumers(updated);
      setConsumersState(updated);

      // Update secretary
      if (formData.assignedSecretaryId) {
        const secs = getSecretaries();
        const updatedSecs = secs.map(s =>
          s.id === formData.assignedSecretaryId
            ? { ...s, assignedConsumerIds: [...s.assignedConsumerIds, newConsumer.id] }
            : s
        );
        setSecretaries(updatedSecs);
      }

      toast({ title: 'Consumer Added', description: `${formData.name} has been added to ${LOCATIONS.find(l => l.value === formData.location)?.label}.` });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (consumer: Consumer) => {
    const updated = consumers.filter((c) => c.id !== consumer.id);
    setConsumers(updated);
    setConsumersState(updated);

    // Remove from secretary
    if (consumer.assignedSecretaryId) {
      const secs = getSecretaries();
      const updatedSecs = secs.map(s =>
        s.id === consumer.assignedSecretaryId
          ? { ...s, assignedConsumerIds: s.assignedConsumerIds.filter(id => id !== consumer.id) }
          : s
      );
      setSecretaries(updatedSecs);
    }

    toast({ title: 'Consumer Deleted', description: `${consumer.name} has been removed.`, variant: 'destructive' });
  };

  const toggleActive = (consumer: Consumer) => {
    const updated = consumers.map((c) =>
      c.id === consumer.id ? { ...c, isActive: !c.isActive } : c
    );
    setConsumers(updated);
    setConsumersState(updated);
    toast({
      title: consumer.isActive ? 'Consumer Deactivated' : 'Consumer Activated',
      description: `${consumer.name} has been ${consumer.isActive ? 'deactivated' : 'activated'}.`,
    });
  };

  const getLocationStats = () => {
    return LOCATIONS.map(loc => ({
      ...loc,
      count: consumers.filter(c => c.location === loc.value).length
    }));
  };

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Consumer Management</h1>
            <p className="text-muted-foreground mt-1">Manage all consumer accounts across locations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Consumer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingConsumer ? 'Edit Consumer' : 'Add New Consumer'}</DialogTitle>
                <DialogDescription>
                  {editingConsumer ? 'Update consumer details' : 'Create a new consumer account'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value: Location) => setFormData({ ...formData, location: value, assignedSecretaryId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map(loc => (
                          <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value: AccountType) => setFormData({ ...formData, accountType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prepaid">Prepaid</SelectItem>
                        <SelectItem value="postpaid">Postpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretary">Assign to Secretary</Label>
                    <Select
                      value={formData.assignedSecretaryId}
                      onValueChange={(value) => setFormData({ ...formData, assignedSecretaryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a secretary" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {filteredSecretaries.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingConsumer ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Location Stats */}
        <div className="grid grid-cols-3 gap-4">
          {getLocationStats().map(loc => (
            <Card 
              key={loc.value} 
              className={`cursor-pointer transition-all ${locationFilter === loc.value ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setLocationFilter(locationFilter === loc.value ? 'all' : loc.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{loc.label}</span>
                  </div>
                  <Badge variant="secondary">{loc.count} users</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search consumers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v as Location | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {LOCATIONS.map(loc => (
                    <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Meter ID</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Secretary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumers.map((consumer) => {
                  const secretary = secretaries.find(s => s.id === consumer.assignedSecretaryId);
                  const locationLabel = LOCATIONS.find(l => l.value === consumer.location)?.label;
                  return (
                    <TableRow key={consumer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{consumer.name}</p>
                          <p className="text-sm text-muted-foreground">{consumer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{locationLabel}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{consumer.meterId}</TableCell>
                      <TableCell>
                        <Badge variant={consumer.accountType === 'prepaid' ? 'default' : 'secondary'}>
                          {consumer.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell>{secretary?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={consumer.isActive ? 'default' : 'destructive'}
                          className="cursor-pointer"
                          onClick={() => toggleActive(consumer)}
                        >
                          {consumer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(consumer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(consumer)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
