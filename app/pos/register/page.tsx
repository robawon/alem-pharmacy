"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, DollarSign } from "lucide-react";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/utils";

export default function RegisterPage() {
  const { shiftOpenFloat, completedSales } = useStore();
  const cashSales = completedSales.filter(s => s.paymentMethod === "cash").reduce((s, i) => s + i.total, 0);

  return (
    <AppShell requiredRole="cashier">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Register &amp; Cash Drawer</h1>
          <p className="text-sm text-muted">Register float monitoring and cash reconciliation stats.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currency(shiftOpenFloat)}</p>
                <p className="text-xs text-muted">Opening Cash Float</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currency(cashSales)}</p>
                <p className="text-xs text-muted">Current Cash in Drawer</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
