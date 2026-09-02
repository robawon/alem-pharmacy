"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

export default function ParkedCartsPage() {
  const { parkedCarts, resumeCart } = useStore();

  return (
    <AppShell requiredRole="cashier">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Held &amp; Parked Carts</h1>
          <p className="text-sm text-muted">Manage active carts put on hold for customer retrieval.</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-foreground">Parked Register Carts ({parkedCarts.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {parkedCarts.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">No carts are currently parked on hold.</p>
            ) : (
              parkedCarts.map((pc) => {
                const total = pc.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
                return (
                  <div key={pc.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{pc.label}</p>
                      <p className="text-xs text-muted">{pc.items.length} item(s) · {currency(total)}</p>
                    </div>
                    <Button size="sm" onClick={() => resumeCart(pc.id)} className="gap-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30">
                      <ShoppingCart className="h-3.5 w-3.5" /> Resume Cart
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
