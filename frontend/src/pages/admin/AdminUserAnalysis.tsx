import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { useToast } from "@/hooks/use-toast";

import {
  Droplets,
  TrendingUp,
  Wallet,
  IndianRupee,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const adminNavItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
];

const AdminUserAnalysis: React.FC = () => {
  const { id } = useParams(); // 🔥 IMPORTANT
  const { toast } = useToast();

  const [consumer, setConsumer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH CONSUMER ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!id || !token) return;

    fetch(`${API_URL}/consumers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setConsumer(data);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load consumer",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems} title="Loading...">
        <div className="p-6">Loading consumer data...</div>
      </DashboardLayout>
    );
  }

  if (!consumer) {
    return (
      <DashboardLayout navItems={adminNavItems} title="Not Found">
        <div className="p-6">Consumer not found</div>
      </DashboardLayout>
    );
  }

  /* ================= UI ================= */
  return (
    <DashboardLayout navItems={adminNavItems} title="User Analysis">
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">
            {consumer.name}
          </h1>
          <p className="text-muted-foreground">
            Meter ID: {consumer.meterId}
          </p>
        </div>

        {/* BASIC STATS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Meter ID"
            value={consumer.meterId || "-"}
            icon={Droplets}
          />

          <StatsCard
            title="Block"
            value={consumer.blockId || "-"}
            icon={TrendingUp}
          />

          <StatsCard
            title="Email"
            value={consumer.email || "-"}
            icon={Wallet}
          />

          <StatsCard
            title="Status"
            value={consumer.status || "Active"}
            icon={IndianRupee}
          />
        </div>

        {/* DETAILS CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Consumer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {consumer.name}</p>
            <p><strong>Email:</strong> {consumer.email}</p>
            <p><strong>Meter ID:</strong> {consumer.meterId}</p>
            <p><strong>Block:</strong> {consumer.blockId}</p>
            <p><strong>Serial No:</strong> {consumer.serialNumber}</p>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AdminUserAnalysis;