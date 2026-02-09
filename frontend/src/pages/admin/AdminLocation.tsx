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

import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/services/location.service";
import { useToast } from "@/hooks/use-toast";
import { Location } from "@/types";

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Secretaries", href: "/admin/secretaries" },
  { label: "Rates", href: "/admin/rates" },
  { label: "Invoices", href: "/admin/invoices" },
  { label: "Locations", href: "/admin/Locations" },

];

const AdminLocations: React.FC = () => {
  const { toast } = useToast();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    isActive: true,
  });

  /* ======================
      LOAD LOCATIONS
  ====================== */

  const loadLocations = async () => {
    try {
      const res = await getLocations();
      setLocations(res.data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  /* ======================
        HELPERS
  ====================== */

  const resetForm = () => {
    setFormData({ code: "", name: "", isActive: true });
    setEditingLocation(null);
  };

  const openDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        code: location.code,
        name: location.name,
        isActive: location.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  /* ======================
     CREATE / UPDATE
  ====================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLocation) {
        await updateLocation(editingLocation._id, formData);
        toast({
          title: "Location Updated",
          description: `${formData.name} updated successfully`,
        });
      } else {
        await createLocation(formData);
        toast({
          title: "Location Created",
          description: `${formData.name} added successfully`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      });
    }
  };

  /* ======================
          DELETE
  ====================== */

  const handleDelete = async (location: Location) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      await deleteLocation(location._id);
      toast({
        title: "Location Deleted",
        description: `${location.name} removed successfully`,
        variant: "destructive",
      });
      loadLocations();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    }
  };

  /* ======================
           RENDER
  ====================== */

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Location Management</h1>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "Edit Location" : "Add Location"}
                </DialogTitle>
                <DialogDescription>
                  Manage location details
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Location Code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />

                <Input
                  placeholder="Location Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <DialogFooter>
                  <Button type="submit">
                    {editingLocation ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader />
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc._id}>
                    <TableCell>{loc.code}</TableCell>
                    <TableCell>{loc.name}</TableCell>
                    <TableCell>
                      <Badge>
                        {loc.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDialog(loc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(loc)}
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

export default AdminLocations;
