import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import {
  getSecretaries,
  setSecretaries,
  getConsumers,
  getUsers,
  setUsers,
  generateId,
} from '@/lib/storage';

import { Secretary, Location } from '@/types';
import { getLocations } from '@/services/location.service';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Users, MapPin } from 'lucide-react';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: "Locations", href: "/admin/locations" },

];

const AdminSecretaries = () => {
  const { toast } = useToast();

  const [secretaries, setSecretariesState] = useState<Secretary[]>(getSecretaries());
  const consumers = getConsumers();

  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | 'all'>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecretary, setEditingSecretary] = useState<Secretary | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    locationId: '',
  });

  /* ---------------- LOAD LOCATIONS ---------------- */
 useEffect(() => {
  const loadLocations = async () => {
    try {
      const res = await getLocations();

      const locationsArray =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setLocations(locationsArray);
    } catch (error) {
      console.error('Failed to load locations', error);
      setLocations([]);
    }
  };

  loadLocations();
}, []);


  /* ---------------- FILTER ---------------- */
  const filteredSecretaries = secretaries.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === 'all' || s.locationId === locationFilter;

    return matchesSearch && matchesLocation;
  });

  /* ---------------- HELPERS ---------------- */
  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', locationId: '' });
    setEditingSecretary(null);
  };

  const handleOpenDialog = (secretary?: Secretary) => {
    if (secretary) {
      setEditingSecretary(secretary);
      setFormData({
        name: secretary.name,
        email: secretary.email,
        phone: secretary.phone || '',
        locationId: secretary.locationId,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  /* ---------------- CREATE / UPDATE ---------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSecretary) {
      const updated = secretaries.map((s) =>
        s._id === editingSecretary._id ? { ...s, ...formData } : s
      );

      setSecretaries(updated);
      setSecretariesState(updated);

      const users = getUsers();
      setUsers(
        users.map((u) =>
          u.id === editingSecretary._id ? { ...u, ...formData } : u
        )
      );

      toast({
        title: 'Secretary Updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newSecretary: Secretary = {
        _id: generateId(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'secretary',
        createdAt: new Date().toISOString(),
        isActive: true,
        assignedConsumerIds: [],
        locationId: formData.locationId,
      };

      const updated = [...secretaries, newSecretary];
      setSecretaries(updated);
      setSecretariesState(updated);

      setUsers([...getUsers(), newSecretary]);

      toast({
        title: 'Secretary Added',
        description: `${formData.name} added successfully.`,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = (secretary: Secretary) => {
    const updated = secretaries.filter((s) => s._id !== secretary._id);
    setSecretaries(updated);
    setSecretariesState(updated);

    setUsers(getUsers().filter((u) => u.id !== secretary._id));

    toast({
      title: 'Secretary Deleted',
      description: `${secretary.name} removed.`,
      variant: 'destructive',
    });
  };

  /* ---------------- STATUS ---------------- */
  const toggleActive = (secretary: Secretary) => {
    const updated = secretaries.map((s) =>
      s._id === secretary._id ? { ...s, isActive: !s.isActive } : s
    );

    setSecretaries(updated);
    setSecretariesState(updated);

    setUsers(
      getUsers().map((u) =>
        u.id === secretary._id ? { ...u, isActive: !secretary.isActive } : u
      )
    );
  };

  /* ---------------- LOCATION STATS ---------------- */
  const getLocationStats = () =>
    locations.map((loc) => ({
      ...loc,
      count: secretaries.filter((s) => s.locationId === loc._id).length,
    }));

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">Secretary Management</h1>
            <p className="text-muted-foreground">
              Manage secretary accounts
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Secretary
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSecretary ? 'Edit Secretary' : 'Add Secretary'}
                </DialogTitle>
                <DialogDescription>
                  Manage secretary details
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />

                <Input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />

                <Select
                  value={formData.locationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, locationId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc._id} value={loc._id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DialogFooter>
                  <Button type="submit">
                    {editingSecretary ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Location Cards */}
        <div className="grid grid-cols-3 gap-4">
          {getLocationStats().map((loc) => (
            <Card
              key={loc._id}
              className={`cursor-pointer ${
                locationFilter === loc._id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() =>
                setLocationFilter(
                  locationFilter === loc._id ? 'all' : loc._id
                )
              }
            >
              <CardContent className="p-4 flex justify-between">
                <span>{loc.name}</span>
                <Badge>{loc.count}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <Input
                placeholder="Search secretaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Select
                value={locationFilter}
                onValueChange={(v) =>
                  setLocationFilter(v as string | 'all')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name}
                    </SelectItem>
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
                  <TableHead>Consumers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredSecretaries.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      {locations.find((l) => l._id === s.locationId)?.name}
                    </TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      {consumers.filter(
                        (c) => c.assignedSecretaryId === s._id
                      ).length}
                    </TableCell>
                    <TableCell>
                      <Badge
                        onClick={() => toggleActive(s)}
                        className="cursor-pointer"
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(s)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(s)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSecretaries;
