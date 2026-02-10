import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getWaterRates, setWaterRates, generateId } from '@/lib/storage';
import { WaterRate, FREE_TIER_LITERS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Save, Info } from 'lucide-react';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Secretaries', href: '/admin/secretaries' },
  { label: 'Rates', href: '/admin/rates' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: "Locations", href: "/admin/Locations" },

];

const AdminRates: React.FC = () => {
  const { toast } = useToast();
  const [rate, setRate] = useState<WaterRate | null>(null);
  const [ratePerLiter, setRatePerLiter] = useState('0.002');
  const [freeTierLiters, setFreeTierLiters] = useState(FREE_TIER_LITERS.toString());

  useEffect(() => {
    const rates = getWaterRates();
    if (rates.length > 0 && rates[0].ratePerLiter !== undefined) {
      setRate(rates[0]);
      setRatePerLiter(rates[0].ratePerLiter.toString());
      setFreeTierLiters((rates[0].freeTierLiters || FREE_TIER_LITERS).toString());
    }
  }, []);

  const handleSave = () => {
    const newRateValue = parseFloat(ratePerLiter);
    const newFreeTier = parseInt(freeTierLiters);
    
    if (isNaN(newRateValue) || newRateValue < 0) {
      toast({ title: 'Invalid Rate', description: 'Please enter a valid rate per liter', variant: 'destructive' });
      return;
    }

    if (isNaN(newFreeTier) || newFreeTier < 0) {
      toast({ title: 'Invalid Free Tier', description: 'Please enter a valid free tier amount', variant: 'destructive' });
      return;
    }

    const updatedRate: WaterRate = {
      _id: rate?._id || generateId(),
      ratePerLiter: newRateValue,
      freeTierLiters: newFreeTier,
      effectiveFrom: rate?.effectiveFrom || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWaterRates([updatedRate]);
    setRate(updatedRate);
    
    toast({ title: 'Settings Updated', description: `Free tier: ${newFreeTier.toLocaleString()}L, Rate: $${newRateValue.toFixed(4)}/L` });
  };

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Water Rate Configuration</h1>
          <p className="text-muted-foreground mt-1">Set the per-liter rate for consumption above free tier</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Free Tier Allowance
              </CardTitle>
              <CardDescription>Monthly free water allowance for all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="freeTier">Free Liters per Month</Label>
                <Input
                  id="freeTier"
                  type="number"
                  step="1000"
                  min="0"
                  value={freeTierLiters}
                  onChange={(e) => setFreeTierLiters(e.target.value)}
                  className="text-lg font-mono"
                />
              </div>
              <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Every consumer gets {parseInt(freeTierLiters || '0').toLocaleString()} liters of water free each billing period. 
                  They only pay for consumption above this threshold.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Per Liter</CardTitle>
              <CardDescription>Applied to consumption above the free tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate per Liter ($)</Label>
                <div className="flex gap-4">
                  <Input
                    id="rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={ratePerLiter}
                    onChange={(e) => setRatePerLiter(e.target.value)}
                    className="text-lg font-mono"
                  />
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Rate
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm font-medium mb-3">Example Calculation:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Consumption:</span>
                    <span className="font-mono">20,000 liters</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>Free Tier:</span>
                    <span className="font-mono">- {parseInt(freeTierLiters || '0').toLocaleString()} liters</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-muted-foreground">Chargeable:</span>
                    <span className="font-mono">{Math.max(0, 20000 - parseInt(freeTierLiters || '0')).toLocaleString()} liters</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Bill Amount:</span>
                    <span className="font-mono">${(Math.max(0, 20000 - parseInt(freeTierLiters || '0')) * parseFloat(ratePerLiter || '0')).toFixed(2)}</span>
                  </div>
                </div>
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
