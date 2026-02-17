import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

import {
  createSecretary,
  getAllSecretaries,
  updateSecretary,
  deleteSecretary,
} from "@/services/secretary.service";

import { getLocations } from "@/services/location.service";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Secretaries", href: "/admin/secretaries" },
  { label: "Rates", href: "/admin/rates" },
  { label: "Invoices", href: "/admin/invoices" },
  { label: "Locations", href: "/admin/locations" },
];

const AdminSecretaries = () => {
  const { toast } = useToast();

  const [secretaries, setSecretaries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string | "all">("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecretary, setEditingSecretary] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [secretaryToDelete, setSecretaryToDelete] = useState<any>(null);


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    locationId: "",
    password: "",
  });

  /* ================= LOAD SECRETARIES ================= */
  const loadSecretaries = async () => {
  try {
    const res = await getAllSecretaries();

    const secretariesArray =
      Array.isArray(res) ? res :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.data?.data) ? res.data.data :
      [];

    setSecretaries(secretariesArray);
  } catch (error) {
    setSecretaries([]);
  }
};


  /* ================= LOAD LOCATIONS ================= */
const loadLocations = async () => {
  try {
    const res = await getLocations();

    const locationsArray =
      Array.isArray(res) ? res :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.data?.data) ? res.data.data :
      [];

    setLocations(locationsArray);
  } catch (error) {
    setLocations([]);
  }
};
  useEffect(() => {
    loadSecretaries();
    loadLocations();
  }, []);

  /* ================= FILTER ================= */
  const filteredSecretaries = secretaries.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "all" || s.locationId === locationFilter;

    return matchesSearch && matchesLocation;
  });

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      locationId: "",
      password: "",
    });
    setEditingSecretary(null);
  };

  const handleOpenDialog = (secretary?: any) => {
    if (secretary) {
      setEditingSecretary(secretary);
      setFormData({
        name: secretary.name,
        email: secretary.email,
        phone: secretary.phone || "",
        locationId: secretary.locationId,
        password: "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSecretary) {
        await updateSecretary(editingSecretary._id, formData);

        toast({
          title: "Secretary Updated",
          description: "Secretary updated successfully",
        });
      } else {
        await createSecretary(formData);

        toast({
          title: "Secretary Created",
          description: "Secretary added successfully",
        });
      }

      await loadSecretaries();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Operation failed",
        variant: "destructive",
      });
    }
  };

  /* ================= DELETE ================= */
const confirmDelete = async () => {
  if (!secretaryToDelete) return;

  try {
    await deleteSecretary(secretaryToDelete._id);

    toast({
      title: "Secretary Deleted",
      description: "Secretary removed successfully",
    });

    await loadSecretaries();
    setIsDeleteDialogOpen(false);
    setSecretaryToDelete(null);
  } catch (error) {
    toast({
      title: "Error",
      description: "Delete failed",
      variant: "destructive",
    });
  }
};

  

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Secretary Management</h1>

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
                  {editingSecretary ? "Edit Secretary" : "Add Secretary"}
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

                {!editingSecretary && (
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                )}

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
                    {editingSecretary ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
{/* ================= LOCATION CARDS ================= */}

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card
    className={`cursor-pointer transition ${
      locationFilter === "all" ? "ring-2 ring-primary" : ""
    }`}
    onClick={() => setLocationFilter("all")}
  >
    <CardContent className="p-4 flex justify-between items-center">
      <div>
        <p className="font-semibold">All Locations</p>
        <p className="text-sm text-muted-foreground">
          {secretaries.length} Secretaries
        </p>
      </div>
      <Badge>{secretaries.length}</Badge>
    </CardContent>
  </Card>

  {Array.isArray(locations) &&
    locations.map((loc) => {
      const count = secretaries.filter(
        (s) => s.locationId === loc._id
      ).length;

      const isActive = locationFilter === loc._id;

      return (
        <Card
          key={loc._id}
          className={`cursor-pointer transition ${
            isActive ? "ring-2 ring-primary" : ""
          }`}
          onClick={() =>
            setLocationFilter(
              locationFilter === loc._id ? "all" : loc._id
            )
          }
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{loc.name}</p>
              <p className="text-sm text-muted-foreground">
                {count} Secretaries
              </p>
            </div>
            <Badge>{count}</Badge>
          </CardContent>
        </Card>
      );
    })}
</div>

        {/* Table */}
        <Card>
          <CardHeader>
            <Input
              placeholder="Search secretaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredSecretaries.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      {locations.find((l) => l._id === s.locationId)?.name}
                    </TableCell>
                    <TableCell>
                      <Badge>{s.isActive ? "Active" : "Inactive"}</Badge>
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
                       onClick={() => {
  setSecretaryToDelete(s);
  setIsDeleteDialogOpen(true);
}}

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
      {/* ================= DELETE CONFIRMATION DIALOG ================= */}

<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete{" "}
        <strong>{secretaryToDelete?.name}</strong>?
        <br />
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setIsDeleteDialogOpen(false)}
      >
        Cancel
      </Button>

      <Button
        variant="destructive"
        onClick={confirmDelete}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </DashboardLayout>
  );
};

export default AdminSecretaries;
