"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export default function QuarantinePage() {
  const { inventory } = useStore();
  const quarantinedBatches = inventory.filter((b) => b.quarantined);

  return (
    <AppShell requiredRole="pharmacist">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Quarantines</h1>
          <p className="text-sm text-muted">Stock batches locked out from dispensing due to safety recalls or quality control holds.</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Lock className="h-5 w-5 text-red-400" />
            <CardTitle className="text-foreground">Quarantined Stock Batches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {quarantinedBatches.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No batches are currently quarantined.</p>
            ) : (
              quarantinedBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{batch.drugName}</p>
                    <p className="text-xs text-muted">Batch #{batch.batchNumber} · Exp: {batch.expiryDate}</p>
                  </div>
                  <Badge variant="destructive">QUARANTINED</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
