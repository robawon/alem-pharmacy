"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarOff, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";

import { KpiCard } from "@/components/ui/KpiCard";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getSeverity(days: number): "critical" | "warning" | "ok" {
  if (days < 0) return "critical";
  if (days <= 30) return "critical";
  if (days <= 90) return "warning";
  return "ok";
}

export default function ExpiryTrackingPage() {
  const { inventory, quarantineBatch } = useStore();

  const batches = inventory
    .filter((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      return days <= 90;
    })
    .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

  const critical = batches.filter((b) => getSeverity(getDaysUntilExpiry(b.expiryDate)) === "critical");
  const warning = batches.filter((b) => getSeverity(getDaysUntilExpiry(b.expiryDate)) === "warning");

  return (
    <AppShell requiredRole="inventory">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expiry Tracking</h1>
          <p className="text-sm text-muted">Monitor batches expiring within 90 days — quarantine or flag for disposal.</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Critical Expiring"
            value={critical.length}
            subtext="Expires in ≤30 days"
            badgeText="Critical"
            badgeVariant="warning"
            icon={ShieldAlert}
            iconBg="bg-red-500/20 text-red-300 border-red-500/30"
            gradient="from-red-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-red-500/10"
          />
          <KpiCard
            label="Warning Expiring"
            value={warning.length}
            subtext="Expires in 31–90 days"
            badgeText="Warning"
            badgeVariant="warning"
            icon={AlertTriangle}
            iconBg="bg-amber-500/20 text-amber-300 border-amber-500/30"
            gradient="from-amber-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-amber-500/10"
          />
          <KpiCard
            label="Total Monitored"
            value={batches.length}
            subtext="Within 90 days threshold"
            badgeText="Monitored"
            badgeVariant="info"
            icon={CalendarOff}
            iconBg="bg-orange-500/20 text-orange-300 border-orange-500/30"
            gradient="from-orange-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-orange-500/10"
          />
        </div>

        {/* Expiry Table */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <CalendarOff className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-foreground">Expiring Batches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {batches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-semibold text-foreground">All clear!</p>
                <p className="text-xs text-muted">No batches expiring within the next 90 days.</p>
              </div>
            ) : (
              batches.map((batch) => {
                const days = getDaysUntilExpiry(batch.expiryDate);
                const severity = getSeverity(days);
                return (
                  <div
                    key={batch.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                      severity === "critical"
                        ? "border-red-500/30 bg-red-500/8"
                        : "border-amber-500/30 bg-amber-500/8"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{batch.drugName}</p>
                        {batch.quarantined && (
                          <Badge variant="destructive" className="text-[10px] py-0">QUARANTINED</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        Batch #{batch.batchNumber} · {batch.quantity} units · Expires: {batch.expiryDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`text-xs font-bold ${
                          severity === "critical"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {days < 0 ? "EXPIRED" : `${days}d left`}
                      </Badge>
                      {!batch.quarantined && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => quarantineBatch(batch.id)}
                          className="text-[11px] h-7 border-red-500/30 text-red-300 hover:bg-red-500/15 hover:text-red-200"
                        >
                          Quarantine
                        </Button>
                      )}
                    </div>
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
