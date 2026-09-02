"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, Clock, Loader2, PackageCheck, FileSearch, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  placed:            { label: "Order Placed",       color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     icon: CheckCircle2 },
  pharmacist_review: { label: "Under Review",       color: "bg-amber-500/20 text-amber-300 border-amber-500/30",  icon: FileSearch },
  preparing:         { label: "Preparing",           color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: Loader2 },
  ready:             { label: "Ready for Pickup",   color: "bg-teal-500/20 text-teal-300 border-teal-500/30",     icon: PackageCheck },
  completed:         { label: "Completed",           color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  cancelled:         { label: "Cancelled",           color: "bg-red-500/20 text-red-300 border-red-500/30",       icon: Clock },
};

const STEPS = [
  { key: "placed",            label: "Order Placed" },
  { key: "pharmacist_review", label: "Pharmacist Review" },
  { key: "preparing",         label: "Preparing" },
  { key: "ready",             label: "Ready for Pickup" },
];

const STEP_INDEX: Record<string, number> = {
  placed: 0, pharmacist_review: 1, preparing: 2, ready: 3, completed: 3,
};

export default function MyOrdersPage() {
  const { customerOrders, updateCustomerOrderStatus } = useStore();

  const active = customerOrders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const past   = customerOrders.filter((o) => o.status === "completed" || o.status === "cancelled");

  return (
    <AppShell requiredRole="customer">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Active Orders</h1>
          <p className="text-sm text-muted">Track your current and past medication orders in real time.</p>
        </div>

        {customerOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="font-semibold text-foreground">No orders yet</p>
              <p className="text-sm text-muted">Browse the storefront and add medications to your cart to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Orders */}
            {active.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Active Orders ({active.length})</h2>
                {active.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.placed;
                  const stepIdx = STEP_INDEX[order.status] ?? 0;
                  return (
                    <Card key={order.id}>
                      <CardContent className="p-5 flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-emerald-400" />
                              <p className="font-semibold text-sm text-foreground">{order.id}</p>
                            </div>
                            <p className="text-xs text-muted mt-0.5">{order.items.length} item(s) · {relativeTime(order.createdAt)}</p>
                          </div>
                          <Badge className={`text-[11px] shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                        </div>

                        {/* Progress Tracker */}
                        <div className="flex items-center gap-0">
                          {STEPS.map((step, i) => {
                            const done    = i <= stepIdx;
                            const current = i === stepIdx;
                            return (
                              <div key={step.key} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                    done ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/40" : "bg-surface-container-high border border-border text-muted"
                                  } ${current ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background" : ""}`}>
                                    {i + 1}
                                  </div>
                                  <span className={`text-[9px] text-center leading-tight max-w-[52px] ${done ? "text-emerald-300 font-medium" : "text-muted"}`}>
                                    {step.label}
                                  </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                  <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < stepIdx ? "bg-emerald-500" : "bg-border"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Items */}
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((item, i) => (
                            <span key={i} className="rounded-lg bg-surface-container-high px-2.5 py-1 text-[11px] text-foreground border border-border">
                              {typeof item === "string" ? item : (item as any).drugName}
                            </span>
                          ))}
                        </div>

                        {/* Customer Claim Button */}
                        {order.status === "ready" && (
                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                            <p className="text-xs text-teal-300 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-teal-400" /> Ready for Pickup / Delivery
                            </p>
                            <button
                              onClick={() => updateCustomerOrderStatus(order.id, "completed")}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <PackageCheck className="h-3.5 w-3.5" /> Claim Order / Mark Received
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Past Orders */}
            {past.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Order History</h2>
                {past.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.completed;
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{order.id}</p>
                        <p className="text-xs text-muted">{order.items.length} item(s) · {relativeTime(order.createdAt)}</p>
                      </div>
                      <Badge className={`text-[11px] ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
