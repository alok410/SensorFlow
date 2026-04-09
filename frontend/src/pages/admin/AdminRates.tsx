import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Save } from 'lucide-react';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: "Locations", href: "/admin/locations" },
];

const AdminRates: React.FC = () => {
  const { toast } = useToast();

  const [isDirty, setIsDirty] = useState(false);
  const [rate, setRate] = useState<any>(null);
  const [ratePerLiter, setRatePerLiter] = useState('0.002');
  const [freeTierLiters, setFreeTierLiters] = useState('0');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // ✅ Fetch data
  useEffect(() => {
    fetch(`${API_URL}/water-rate`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setRate(data);
          setRatePerLiter(data.ratePerLiter?.toString() || '0.002');
          setFreeTierLiters(data.freeTierLiters?.toString() || '0');
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Save
  const handleSave = async () => {
    const newRateValue = parseFloat(ratePerLiter);
    const newFreeTier = parseInt(freeTierLiters);

    if (isNaN(newRateValue) || newRateValue < 0) {
      toast({ title: 'Invalid Rate', variant: 'destructive' });
      return;
    }

    if (isNaN(newFreeTier) || newFreeTier < 0) {
      toast({ title: 'Invalid Free Tier', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/water-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ratePerLiter: newRateValue,
          freeTierLiters: newFreeTier,
        }),
      });

      const data = await res.json();
      setRate(data.data);

      // ✅ reset dirty
      setIsDirty(false);

      toast({
        title: "Saved",
        description: "Water settings updated",
      });

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ Loader
  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading water settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Water Rate Configuration</h1>

        {/* ✅ Not Saved Warning */}
      {isDirty && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-base font-semibold flex items-center gap-2">
    ⚠️ Changes not saved
  </div>
)}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* FREE TIER */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Free Tier Allowance
              </CardTitle>
              <CardDescription>Monthly free water allowance</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Label>Free Liters per Month</Label>
              <Input
                type="number"
                value={freeTierLiters}
                onChange={(e) => {
                  setFreeTierLiters(e.target.value);
                  setIsDirty(true);
                }}
              />

              <p className="text-sm text-muted-foreground">
                Users get {parseInt(freeTierLiters || '0').toLocaleString()}L free.
              </p>
            </CardContent>
          </Card>

          {/* RATE */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Per Liter</CardTitle>
              <CardDescription>Applied after free limit</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Label>Rate per Liter</Label>

              <Input
                type="number"
                step="0.0001"
                value={ratePerLiter}
                onChange={(e) => {
                  setRatePerLiter(e.target.value);
                  setIsDirty(true);
                }}
              />

              {/* ✅ Button with states */}
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? "Saving..."
                  : isDirty
                  ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )
                  : "Saved ✓"}
              </Button>

              {/* Example */}
              <div className="text-sm border p-3 rounded">
                <p>Example:</p>
                <p>
                  Bill = {(
                    Math.max(0, 20000 - parseInt(freeTierLiters || '0')) *
                    parseFloat(ratePerLiter || '0')
                  ).toFixed(2)}
                </p>
              </div>

              {rate && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(rate.updatedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminRates;