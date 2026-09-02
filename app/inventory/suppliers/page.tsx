"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Building2, Plus, CheckCircle2, Package, Phone, Mail } from "lucide-react";

interface SupplierOrder {
  id: string;
  supplier: string;
  drug: string;
  quantity: number;
  status: "pending" | "confirmed" | "delivered";
  orderedAt: string;
}

const MOCK_ORDERS: SupplierOrder[] = [
  { id: "PO-001", supplier: "Medpharm Ethiopia", drug: "Amoxicillin 500mg", quantity: 1000, status: "confirmed", orderedAt: "2026-07-28" },
  { id: "PO-002", supplier: "Afro Pharma Ltd", drug: "Metformin 850mg", quantity: 500, status: "pending", orderedAt: "2026-07-29" },
  { id: "PO-003", supplier: "East Africa Meds", drug: "Paracetamol 500mg", quantity: 2000, status: "delivered", orderedAt: "2026-07-25" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function SuppliersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>(MOCK_ORDERS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier: "", drug: "", quantity: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: SupplierOrder = {
      id: `PO-${String(orders.length + 1).padStart(3, "0")}`,
      supplier: form.supplier,
      drug: form.drug,
      quantity: Number(form.quantity),
      status: "pending",
      orderedAt: new Date().toISOString().split("T")[0],
    };
    setOrders((prev) => [newOrder, ...prev]);
    setForm({ supplier: "", drug: "", quantity: "" });
    setSubmitted(true);
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <AppShell requiredRole="inventory">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supplier Orders</h1>
            <p className="text-sm text-muted">Manage purchase orders and track supplier delivery statuses.</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold shrink-0"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>

        {submitted && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Purchase order created and sent to supplier.
          </div>
        )}

        {/* New Order Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Create Purchase Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Supplier Name</Label>
                  <Input required placeholder="e.g. Medpharm Ethiopia" value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Drug / Product</Label>
                  <Input required placeholder="e.g. Amoxicillin 500mg" value={form.drug}
                    onChange={(e) => setForm({ ...form, drug: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Quantity (units)</Label>
                  <Input required type="number" min="1" placeholder="e.g. 500" value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="sm:col-span-3 flex gap-2">
                  <Button type="submit" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                    <ClipboardList className="h-4 w-4" /> Submit Order
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-foreground">Purchase Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-orange-400 font-bold">{order.id}</span>
                    <span className="text-sm font-semibold text-foreground">{order.drug}</span>
                  </div>
                  <p className="text-xs text-muted">
                    <Building2 className="inline h-3 w-3 mr-1" />{order.supplier} · {order.quantity.toLocaleString()} units · {order.orderedAt}
                  </p>
                </div>
                <Badge className={`text-xs uppercase ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
