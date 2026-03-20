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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";

import {
  createConsumer,
  getConsumers,
  updateConsumer,
  deleteConsumer,
} from "@/services/consumer.service";

import { getLocations } from "@/services/location.service";

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Secretaries", href: "/admin/secretaries" },
  { label: "Rates", href: "/admin/rates" },
  { label: "Invoices", href: "/admin/invoices" },
  { label: "Locations", href: "/admin/locations" },
];

const AdminUsers = () => {
  const { toast } = useToast();

  const [consumers, setConsumers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string | "all">("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsumer, setEditingConsumer] = useState<any>(null);

  const [consumerToDelete, setConsumerToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("blockId");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
const [submitting, setSubmitting] = useState(false);
const [deleting, setDeleting] = useState(false);
 const [formData, setFormData] = useState({
  name: "",
  email: "",
  meterId: "",
  serialNumber: "",
    blockId: "",     // ✅ added
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
const loadData = async () => {
  try {
    const cachedConsumers = localStorage.getItem("consumers");
    const cachedLocations = localStorage.getItem("locations");

    // ✅ Only show loader if NO cache
    if (!cachedConsumers || !cachedLocations) {
      setLoading(true);
    }

    if (cachedConsumers) {
      setConsumers(JSON.parse(cachedConsumers));
    }
    if (cachedLocations) {
      setLocations(JSON.parse(cachedLocations));
    }

    const [consumersRes, locationsRes] = await Promise.all([
      getConsumers(),
      getLocations(),
    ]);

    const freshConsumers = extractArray(consumersRes);
    const freshLocations = extractArray(locationsRes);

    setConsumers(freshConsumers);
    setLocations(freshLocations);

    localStorage.setItem("consumers", JSON.stringify(freshConsumers));
    localStorage.setItem("locations", JSON.stringify(freshLocations));

  } catch (err) {
    console.error("❌ Load error:", err);

    if (!localStorage.getItem("consumers")) setConsumers([]);
    if (!localStorage.getItem("locations")) setLocations([]);

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, []);

  /* ================= FILTER ================= */

  const filteredConsumers = consumers.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "all" || c.locationId === locationFilter;

    return matchesSearch && matchesLocation;
  });
  const sortedConsumers = [...filteredConsumers].sort((a, b) => {
  let valueA: any;
  let valueB: any;

  if (sortColumn === "blockId") {
    const numA = parseInt(a.blockId);
    const numB = parseInt(b.blockId);

    if (!isNaN(numA) && !isNaN(numB)) {
      valueA = numA;
      valueB = numB;
    } else {
      valueA = a.blockId || "";
      valueB = b.blockId || "";
    }
  } else {
    valueA = a[sortColumn] || "";
    valueB = b[sortColumn] || "";
  }

  if (typeof valueA === "string") valueA = valueA.toLowerCase();
  if (typeof valueB === "string") valueB = valueB.toLowerCase();

  if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
  if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;

  return 0;
});

  /* ================= FORM ================= */

const resetForm = () => {
  setFormData({
    name: "",
    email: "",
    meterId: "",
    serialNumber: "",
    blockId: "",     // ✅ added
    locationId: "",
    password: "",
  });
  setEditingConsumer(null);
};

  const openDialog = (consumer?: any) => {
    if (consumer) {
      setEditingConsumer(consumer);
     setFormData({
  name: consumer.name,
  email: consumer.email,
  meterId: consumer.meterId,
  serialNumber: consumer.serialNumber || "",
  blockId: consumer.blockId || "",
  locationId: consumer.locationId,
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
    setSubmitting(true);

    if (editingConsumer) {
  const updatedConsumer = await updateConsumer(editingConsumer._id, formData);

const updatedList = consumers.map(c =>
  c._id === editingConsumer._id ? (updatedConsumer.data || updatedConsumer) : c
);

setConsumers(updatedList);
localStorage.setItem("consumers", JSON.stringify(updatedList));
      setConsumers(updatedList);
      localStorage.setItem("consumers", JSON.stringify(updatedList));

      toast({ title: "Consumer Updated" });

    } else {
      const res = await createConsumer(formData);
const newConsumer = res.data || res;

      const updatedList = [...consumers, newConsumer];

      setConsumers(updatedList);
      localStorage.setItem("consumers", JSON.stringify(updatedList));

      toast({ title: "Consumer Created" });
    }

    // ✅ MUST be inside try
    setIsDialogOpen(false);
    resetForm();

  } catch {
    toast({
      title: "Operation Failed",
      variant: "destructive",
    });
  } finally {
    setSubmitting(false);
  }
};
const handleSort = (column: string) => {
  if (sortColumn === column) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortColumn(column);
    setSortDirection("asc");
  }
};
  /* ================= DELETE ================= */

const handleDelete = async () => {
  if (!consumerToDelete) return;

  try {
    setDeleting(true);

    await deleteConsumer(consumerToDelete._id);

    const updatedList = consumers.filter(
      c => c._id !== consumerToDelete._id
    );

    setConsumers(updatedList);
    localStorage.setItem("consumers", JSON.stringify(updatedList));

    toast({ title: "Consumer Deleted" });

    setIsDeleteDialogOpen(false);
    setConsumerToDelete(null);

  } catch {
    toast({
      title: "Delete Failed",
      variant: "destructive",
    });
  } finally {
    setDeleting(false);
  }
};

  /* ================= UI ================= */

  return (
    <DashboardLayout navItems={adminNavItems} title="Consumer Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Consumer Management</h1>

          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Consumer
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* LOCATION CARDS */}
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
                      {consumers.length} Consumers
                    </p>
                  </div>
                  <Badge>{consumers.length}</Badge>
                </CardContent>
              </Card>

              {locations.map((loc) => {
                const count = consumers.filter(
                  (c) => c.locationId === loc._id
                ).length;

                return (
                  <Card
                    key={loc._id}
                    className={`cursor-pointer ${
                      locationFilter === loc._id ? "ring-2 ring-primary" : ""
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
                          {count} Consumers
                        </p>
                      </div>
                      <Badge>{count}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* TABLE */}
            <Card>
              <CardHeader>
                <Input
                  placeholder="Search consumers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CardHeader>

              <CardContent>
                {filteredConsumers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No consumers found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
  <TableRow>

    <TableHead
      onClick={() => handleSort("blockId")}
      className="cursor-pointer select-none"
    >
      Block {sortColumn === "blockId" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>

    <TableHead
      onClick={() => handleSort("name")}
      className="cursor-pointer select-none"
    >
      Name {sortColumn === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>
        <TableHead
      onClick={() => handleSort("email")}
      className="cursor-pointer select-none"
    >
      Email {sortColumn === "email" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>
        <TableHead
      onClick={() => handleSort("CityName")}
      className="cursor-pointer select-none"
    >
      CityName {sortColumn === "CityName" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>

    <TableHead
      onClick={() => handleSort("serialNumber")}
      className="cursor-pointer select-none"
    >
      Serial Number {sortColumn === "serialNumber" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>

    <TableHead
      onClick={() => handleSort("meterId")}
      className="cursor-pointer select-none"
    >
      Meter {sortColumn === "meterId" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>




    <TableHead
      onClick={() => handleSort("usage")}
      className="cursor-pointer select-none"
    >
      Status {sortColumn === "usage" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </TableHead>

  </TableRow>
</TableHeader>

                    <TableBody>
                      {sortedConsumers.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell>{c.blockId}</TableCell>

                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>
                            {
                              locations.find(
                                (l) => l._id === c.locationId
                              )?.name
                            }
                          </TableCell>
                            <TableCell>{c.serialNumber}</TableCell>
                          <TableCell>{c.meterId}</TableCell>
                          <TableCell>
                            <Badge>
                              {c.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
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
                              onClick={() => {
                                setConsumerToDelete(c);
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
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* CREATE / EDIT DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConsumer ? "Edit Consumer" : "Add Consumer"}
              </DialogTitle>
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
                placeholder="Meter ID"
                value={formData.meterId}
                onChange={(e) =>
                  setFormData({ ...formData, meterId: e.target.value })
                }
                required
              />
              <Input
  placeholder="Serial Number"
  value={formData.serialNumber}
  onChange={(e) =>
    setFormData({ ...formData, serialNumber: e.target.value })
  }
  required
/>
<Input
  placeholder="Block ID"
  value={formData.blockId}
  onChange={(e) =>
    setFormData({ ...formData, blockId: e.target.value })
  }
  required
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

              {!editingConsumer && (
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

              <DialogFooter>
              <Button type="submit" disabled={submitting}>
  {submitting ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
      Processing...
    </div>
  ) : editingConsumer ? (
    "Update"
  ) : (
    "Create"
  )}
</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DELETE DIALOG */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>

            <p>
              Are you sure you want to delete{" "}
              <strong>{consumerToDelete?.name}</strong>?
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>

             <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
  {deleting ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
      Deleting...
    </div>
  ) : (
    "Delete"
  )}
</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;