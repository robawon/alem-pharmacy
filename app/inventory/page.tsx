"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockTable } from "@/components/inventory/StockTable";
import { ReceiveShipmentModal } from "@/components/inventory/ReceiveShipmentModal";
import { AuditLogPanel } from "@/components/audit/AuditLogPanel";
import { AddMedicineDialog } from "@/components/ui/AddMedicineDialog";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Plus, Pill, ArrowLeft } from "lucide-react";

export default function InventoryPage() {
  return (
    <AppShell requiredRole="inventory">
      <InventoryContent />
    </AppShell>
  );
}

function InventoryContent() {
  const { auditLogs, currentUser } = useStore();
  const [showAddMedicine, setShowAddMedicine] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="group flex items-center gap-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 text-xs font-semibold text-teal-300 transition-all hover:bg-teal-500/20 hover:border-teal-500/50 shadow-sm shrink-0"
            title="Return to Admin Dashboard"
          >
            <Logo size={28} />
            <span className="flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Admin Dashboard
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Stock & Batch Control</h1>
            <p className="text-sm text-muted">Filterable inventory of every drug batch, with expiry and safety-threshold tracking.</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddMedicine(true)}
          className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add New Medicine
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-foreground">Batch Inventory</CardTitle>
            <ReceiveShipmentModal />
          </CardHeader>
          <CardContent>
            <StockTable />
          </CardContent>
        </Card>
        <div className="xl:col-span-2">
          <AuditLogPanel logs={auditLogs} title="Recent Stock Activity" limit={25} />
        </div>
      </div>

      <AddMedicineDialog open={showAddMedicine} onClose={() => setShowAddMedicine(false)} />
    </div>
  );
}
