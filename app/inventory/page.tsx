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
import { Plus, Pill } from "lucide-react";

export default function InventoryPage() {
  return (
    <AppShell requiredRole="inventory">
      <InventoryContent />
    </AppShell>
  );
}

function InventoryContent() {
  const { auditLogs } = useStore();
  const [showAddMedicine, setShowAddMedicine] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stock & Batch Control</h1>
          <p className="text-sm text-muted">Filterable inventory of every drug batch, with expiry and safety-threshold tracking.</p>
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
