"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useStore } from "@/lib/store";
import { currency, relativeTime } from "@/lib/utils";

export default function ReceiptsPage() {
  const { completedSales } = useStore();

  return (
    <AppShell requiredRole="cashier">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Past Receipts</h1>
          <p className="text-sm text-muted">History of completed transaction receipts for this shift.</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Receipt className="h-5 w-5 text-teal-400" />
            <CardTitle className="text-foreground">Shift Receipts Log</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {completedSales.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">No receipt history recorded yet for this shift.</p>
            ) : (
              completedSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{sale.id}</p>
                    <p className="text-xs text-muted">{sale.items.length} items · Payment: {sale.paymentMethod.toUpperCase()} · {relativeTime(sale.timestamp)}</p>
                  </div>
                  <span className="font-bold text-base text-emerald-400">{currency(sale.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
