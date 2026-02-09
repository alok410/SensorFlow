import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";

import { Consumer, Secretary, AccountType, Location } from "@/types";
import { getLocations } from "@/services/location.service";
import { useToast } from "@/hooks/use-toast";

import {
  getConsumers,
  setConsumers,
  getSecretaries,
} from "@/lib/storage";

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Secretaries", href: "/admin/secretaries" },
  { label: "Rates", href: "/admin/rates" },
  { label: "Invoices", href: "/admin/invoices" },
  { label: "Locations", href: "/admin/Locations" },

];

const AdminUsers: React.FC = () => {
  const { toast } = useToast();

  const [consumers, setConsumersState] = useState<Consumer[]>(getConsumers());
  const [secretaries] = useState<Secretary[]>(getSecretaries());
  const [locations, setLocations] = useState<Location[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsumer, setEditingConsumer] = useState<Consumer | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    accountType: "postpaid" as AccountType,
    assignedSecretaryId: "",
    locationId: "",
  });

  /*======================
     LOAD LOCATIONS
  ======================*/

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


  /* ======================
     FILTERS
  ====================== */

  const filteredConsumers = consumers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.meterId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "all" || c.locationId === locationFilter;

    return matchesSearch && matchesLocation;
  });

  const filteredSecretaries = secretaries.filter(
    (s) => s.locationId === formData.locationId
  );

  /*====================
     HELPERS
    ====================*/

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      accountType: "postpaid",
      assignedSecretaryId: "",
      locationId: "",
    });
    setEditingConsumer(null);
  };

  const openDialog = (consumer?: Consumer) => {
    if (consumer) {
      setEditingConsumer(consumer);
      setFormData({
        name: consumer.name,
        email: consumer.email,
        phone: consumer.phone ?? "",
        address: consumer.address ?? "",
        accountType: consumer.accountType,
        assignedSecretaryId: consumer.assignedSecretaryId ?? "",
        locationId: consumer.locationId,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  /* =================== hy,n
     CREATE / UPDATE
     =================== */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let updated: Consumer[];

    if (editingConsumer) {
      updated = consumers.map((c) =>
        c._id === editingConsumer._id ? { ...c, ...formData } : c
      );

      toast({
        title: "Consumer Updated",
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newConsumer: Consumer = {
        _id: crypto.randomUUID(),
        role: "consumer",
        createdAt: new Date().toISOString(),
        isActive: true,
        meterId: `MTR-${Math.floor(100000 + Math.random() * 900000)}`,
        connectionDate: new Date().toISOString(),
        ...formData,
      };

      updated = [...consumers, newConsumer];

      toast({
        title: "Consumer Added",
        description: `${formData.name} has been added successfully.`,
      });
    }

    setConsumers(updated);
    setConsumersState(updated);
    setIsDialogOpen(false);
    resetForm();
  };

  /* ======================
     DELETE / TOGGLE
  ====================== */

  const handleDelete = (consumer: Consumer) => {
    const updated = consumers.filter((c) => c._id !== consumer._id);
    setConsumers(updated);
    setConsumersState(updated);

    toast({
      title: "Consumer Deleted",
      description: `${consumer.name} has been removed.`,
      variant: "destructive",
    });
  };

  const toggleActive = (consumer: Consumer) => {
    const updated = consumers.map((c) =>
      c._id === consumer._id ? { ...c, isActive: !c.isActive } : c
    );
    setConsumers(updated);
    setConsumersState(updated);
  };

  /* ======================
     LOCATION STATS
  ====================== */

const locationStats = Array.isArray(locations)
  ? locations.map((loc) => ({
      ...loc,
      count: consumers.filter((c) => c.locationId === loc._id).length,
    }))
  : [];

  /* ======================
     RENDER
  ====================== */

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Consumer Management</h1>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Consumer
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingConsumer ? "Edit Consumer" : "Add Consumer"}
                </DialogTitle>
                <DialogDescription>
                  Manage consumer details
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

                <Select
                  value={formData.locationId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      locationId: value,
                      assignedSecretaryId: "",
                    })
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

                <Select
                  value={formData.accountType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, accountType: v as AccountType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="postpaid">Postpaid</SelectItem>
                  </SelectContent>
                </Select>

                <DialogFooter>
                  <Button type="submit">
                    {editingConsumer ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* LOCATION STATS */}
        <div className="grid grid-cols-3 gap-4">
          {locationStats.map((loc) => (
            <Card
              key={loc._id}
              onClick={() =>
                setLocationFilter(
                  locationFilter === loc._id ? "all" : loc._id
                )
              }
              className={`cursor-pointer ${
                locationFilter === loc._id ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className="p-4 flex justify-between">
                <span>{loc.name}</span>
                <Badge>{loc.count}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <Input
                placeholder="Search consumers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Select
                value={locationFilter}
                onValueChange={(v) => setLocationFilter(v as string | "all")}
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
                  <TableHead>Meter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredConsumers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      {locations.find((l) => l._id === c.locationId)?.name}
                    </TableCell>
                    <TableCell>{c.meterId}</TableCell>
                    <TableCell>
                      <Badge
                        onClick={() => toggleActive(c)}
                        className="cursor-pointer"
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDialog(c)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(c)}
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

export default AdminUsers;
