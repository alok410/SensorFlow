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
import { getSecretaries, setSecretaries, getConsumers, getUsers, setUsers, generateId } from '@/lib/storage';
import { Secretary, Location, LOCATIONS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Users, MapPin } from 'lucide-react';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
];

const AdminSecretaries: React.FC = () => {
  const [secretaries, setSecretariesState] = useState<Secretary[]>(getSecretaries());
  const consumers = getConsumers();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<Location | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecretary, setEditingSecretary] = useState<Secretary | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: 'ahmedabad' as Location,
  });

  const filteredSecretaries = secretaries.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || s.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', location: 'ahmedabad' });
    setEditingSecretary(null);
  };

  const handleOpenDialog = (secretary?: Secretary) => {
    if (secretary) {
      setEditingSecretary(secretary);
      setFormData({
        name: secretary.name,
        email: secretary.email,
        phone: secretary.phone || '',
        location: secretary.location,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSecretary) {
      const updated = secretaries.map((s) =>
        s.id === editingSecretary.id ? { ...s, ...formData } : s
      );
      setSecretaries(updated);
      setSecretariesState(updated);

      // Update users too
      const users = getUsers();
      const updatedUsers = users.map((u) =>
        u.id === editingSecretary.id ? { ...u, ...formData } : u
      );
      setUsers(updatedUsers);

      toast({ title: 'Secretary Updated', description: `${formData.name} has been updated.` });
    } else {
      const newSecretary: Secretary = {
        id: generateId(),
        email: formData.email,
        name: formData.name,
        role: 'secretary',
        phone: formData.phone,
        createdAt: new Date().toISOString(),
        isActive: true,
        assignedConsumerIds: [],
        location: formData.location,
      };

      const updated = [...secretaries, newSecretary];
      setSecretaries(updated);
      setSecretariesState(updated);

      // Add to users
      const users = getUsers();
      setUsers([...users, newSecretary]);

      toast({ title: 'Secretary Added', description: `${formData.name} has been added to ${LOCATIONS.find(l => l.value === formData.location)?.label}.` });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (secretary: Secretary) => {
    const updated = secretaries.filter((s) => s.id !== secretary.id);
    setSecretaries(updated);
    setSecretariesState(updated);

    // Remove from users
    const users = getUsers();
    setUsers(users.filter((u) => u.id !== secretary.id));

    toast({ title: 'Secretary Deleted', description: `${secretary.name} has been removed.`, variant: 'destructive' });
  };

  const toggleActive = (secretary: Secretary) => {
    const updated = secretaries.map((s) =>
      s.id === secretary.id ? { ...s, isActive: !s.isActive } : s
    );
    setSecretaries(updated);
    setSecretariesState(updated);

    // Update users
    const users = getUsers();
    const updatedUsers = users.map((u) =>
      u.id === secretary.id ? { ...u, isActive: !secretary.isActive } : u
    );
    setUsers(updatedUsers);

    toast({
      title: secretary.isActive ? 'Secretary Deactivated' : 'Secretary Activated',
      description: `${secretary.name} has been ${secretary.isActive ? 'deactivated' : 'activated'}.`,
    });
  };

  const getLocationStats = () => {
    return LOCATIONS.map(loc => ({
      ...loc,
      count: secretaries.filter(s => s.location === loc.value).length
    }));
  };

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Secretary Management</h1>
            <p className="text-muted-foreground mt-1">Manage secretary accounts across locations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Secretary
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingSecretary ? 'Edit Secretary' : 'Add New Secretary'}</DialogTitle>
                <DialogDescription>
                  {editingSecretary ? 'Update secretary details' : 'Create a new secretary account'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value: Location) => setFormData({ ...formData, location: value })}
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
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingSecretary ? 'Update' : 'Create'}</Button>
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
                  <Badge variant="secondary">{loc.count} secretary</Badge>
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
                  placeholder="Search secretaries..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Consumers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecretaries.map((secretary) => {
                  const assignedCount = consumers.filter(c => c.assignedSecretaryId === secretary.id).length;
                  const locationLabel = LOCATIONS.find(l => l.value === secretary.location)?.label;
                  return (
                    <TableRow key={secretary.id}>
                      <TableCell className="font-medium">{secretary.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{locationLabel}</Badge>
                      </TableCell>
                      <TableCell>{secretary.email}</TableCell>
                      <TableCell>{secretary.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {assignedCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={secretary.isActive ? 'default' : 'destructive'}
                          className="cursor-pointer"
                          onClick={() => toggleActive(secretary)}
                        >
                          {secretary.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(secretary)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(secretary)}>
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

export default AdminSecretaries;
