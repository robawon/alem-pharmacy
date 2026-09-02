"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck, PackagePlus, CheckCircle2, Hash, Building2, CalendarDays, Layers } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ReceiveShipmentsPage() {
  const { receiveShipment } = useStore();
  const [form, setForm] = useState({
    drugName: "",
    genericName: "",
    dosage: "",
    category: "otc" as "otc" | "prescription" | "vitamins" | "first_aid",
    batchNumber: "",
    quantity: "",
    supplier: "",
    expiryDate: "",
    unitPrice: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    receiveShipment({
      drugName: form.drugName,
      genericName: form.genericName,
      dosage: form.dosage,
      category: form.category,
      isRx: form.category === "prescription",
      batchNumber: form.batchNumber,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      expiryDate: form.expiryDate,
      safetyThreshold: 10,
      quarantined: false,
    });
    setSubmitted(true);
    setForm({ drugName: "", genericName: "", dosage: "", category: "otc", batchNumber: "", quantity: "", supplier: "", expiryDate: "", unitPrice: "" });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <AppShell requiredRole="inventory">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receive Shipments</h1>
          <p className="text-sm text-muted">Log incoming stock deliveries and register new batch records.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intake Form */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center gap-2">
              <Truck className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-foreground">New Shipment Intake</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Shipment received and logged to inventory successfully.
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Drug / Product Name</Label>
                  <Input
                    required
                    placeholder="e.g. Amoxicillin 500mg"
                    value={form.drugName}
                    onChange={(e) => setForm({ ...form, drugName: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Batch Number</Label>
                  <Input
                    required
                    placeholder="e.g. BAT-2024-001"
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Quantity Received (units)</Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Unit Cost (ETB)</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 12.50"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Supplier Name</Label>
                  <Input
                    required
                    placeholder="e.g. Medpharm Ethiopia"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Expiry Date</Label>
                  <Input
                    required
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    <PackagePlus className="h-4 w-4" />
                    Confirm Shipment Receipt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Intake Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs text-muted">
              {[
                { icon: Hash, text: "Verify batch number matches supplier invoice before entry." },
                { icon: Building2, text: "Only register from approved supplier list on record." },
                { icon: CalendarDays, text: "Do not accept batches with less than 6 months to expiry." },
                { icon: Layers, text: "All intakes generate an immutable audit log entry." },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-container-high/40 border border-border">
                  <Icon className="h-3.5 w-3.5 text-orange-400 mt-0.5 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
