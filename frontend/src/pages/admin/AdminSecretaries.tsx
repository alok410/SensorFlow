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
  const [loading, setLoading] = useState(true);

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

  /* ================= LOAD DATA ================= */

  const extractArray = (res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };
const loadSecretaries = async () => {
  try {
    const cached = localStorage.getItem("secretaries");

    // ✅ Show cache instantly
    if (cached) {
      setSecretaries(JSON.parse(cached));
    }

    // ✅ Always fetch fresh data
    const res = await getAllSecretaries();
    const data = extractArray(res);

    setSecretaries(data);
    localStorage.setItem("secretaries", JSON.stringify(data));

  } catch (err) {
    console.error("❌ Secretaries error:", err);

    if (!localStorage.getItem("secretaries")) {
      setSecretaries([]);
    }
  }
};
const loadLocations = async () => {
  try {
    const cached = localStorage.getItem("locations");

    if (cached) {
      const data = JSON.parse(cached);
      console.log("📦 Locations from cache:", data);
      setLocations(data);
      return;
    }

    const res = await getLocations();
    const data = extractArray(res);

    console.log("🌐 Locations from API:", data);

    setLocations(data);

    if (data.length > 0) {
      localStorage.setItem("locations", JSON.stringify(data));
    }

  } catch (err) {
    console.error("❌ Locations error:", err);
    setLocations([]);
  }
};
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadSecretaries(), loadLocations()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  /* ================= FORM ================= */

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

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (editingSecretary) {
      const updated = await updateSecretary(editingSecretary._id, formData);
      const updatedSecretary = updated.data || updated;

      const updatedList = secretaries.map(s =>
        s._id === editingSecretary._id ? updatedSecretary : s
      );

      setSecretaries(updatedList);
      localStorage.setItem("secretaries", JSON.stringify(updatedList));

      toast({
        title: "Secretary Updated",
        description: "Secretary updated successfully",
      });

    } else {
      const res = await createSecretary(formData);
      const newSecretary = res.data || res;

      const updatedList = [...secretaries, newSecretary];

      setSecretaries(updatedList);
      localStorage.setItem("secretaries", JSON.stringify(updatedList));

      toast({
        title: "Secretary Created",
        description: "Secretary added successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();

  } catch {
    toast({
      title: "Error",
      description: "Operation failed",
      variant: "destructive",
    });
  }
};

 const confirmDelete = async () => {
  if (!secretaryToDelete) return;

  try {
    await deleteSecretary(secretaryToDelete._id);

    const updatedList = secretaries.filter(
      s => s._id !== secretaryToDelete._id
    );

    setSecretaries(updatedList);
    localStorage.setItem("secretaries", JSON.stringify(updatedList));

    toast({
      title: "Secretary Deleted",
      description: "Secretary removed successfully",
    });

    setIsDeleteDialogOpen(false);
    setSecretaryToDelete(null);

  } catch {
    toast({
      title: "Error",
      description: "Delete failed",
      variant: "destructive",
    });
  }
};

  return (
    <DashboardLayout navItems={adminNavItems} title="Secretary Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
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

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Location Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className={`cursor-pointer ${
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

              {locations.map((loc) => {
                const count = secretaries.filter(
                  (s) => s.locationId === loc._id
                ).length;

                return (
                  <Card
                    key={loc._id}
                    className={`cursor-pointer ${
                      locationFilter === loc._id
                        ? "ring-2 ring-primary"
                        : ""
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
                          {locations.find(
                            (l) => l._id === s.locationId
                          )?.name}
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {s.isActive ? "Active" : "Inactive"}
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
          </>
        )}
      </div>

      {/* Delete Dialog */}
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
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSecretaries;