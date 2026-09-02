"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, ShoppingBag, Users, Receipt, CreditCard, Smartphone, Banknote,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { currency, relativeTime } from "@/lib/utils";

import { KpiCard } from "@/components/ui/KpiCard";

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  cash: Banknote, card: CreditCard, mobile: Smartphone,
};

export default function AdminFinancePage() {
  const { completedSales, staffProfiles, shiftOpenFloat } = useStore();

  const totalRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const totalTax = completedSales.reduce((acc, s) => acc + (s.tax || 0), 0);
  const totalDiscounts = completedSales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
  const avgOrder = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    completedSales.forEach((s) => {
      if (!map[s.paymentMethod]) map[s.paymentMethod] = { count: 0, total: 0 };
      map[s.paymentMethod].count++;
      map[s.paymentMethod].total += s.total;
    });
    return Object.entries(map).map(([method, data]) => ({ method, ...data }));
  }, [completedSales]);

  // Build hourly revenue chart from completed sales
  const hourlyData = useMemo(() => {
    const hours: Record<string, number> = {};
    completedSales.forEach((s) => {
      const h = new Date(s.timestamp).getHours();
      const label = `${h}:00`;
      hours[label] = (hours[label] || 0) + s.total;
    });
    return Object.entries(hours)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([time, revenue]) => ({ time, revenue: Math.round(revenue) }));
  }, [completedSales]);

  const cashiers = staffProfiles.filter((s) => s.role === "cashier");

  return (
    <AppShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Reports & Analytics</h1>
          <p className="text-sm text-muted">Real-time revenue metrics pulled live from cashier POS sessions.</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Revenue"
            value={currency(totalRevenue)}
            subtext="Live Register Sales"
            badgeText="Live POS"
            badgeVariant="success"
            icon={DollarSign}
            iconBg="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            gradient="from-emerald-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-emerald-500/10"
          />
          <KpiCard
            label="Completed Sales"
            value={completedSales.length}
            subtext="Total Orders Today"
            badgeText="Transactions"
            badgeVariant="info"
            icon={ShoppingBag}
            iconBg="bg-blue-500/20 text-blue-300 border-blue-500/30"
            gradient="from-blue-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-blue-500/10"
          />
          <KpiCard
            label="Avg. Order Value"
            value={currency(avgOrder)}
            subtext="Per completed sale"
            badgeText="Average"
            badgeVariant="purple"
            icon={TrendingUp}
            iconBg="bg-teal-500/20 text-teal-300 border-teal-500/30"
            gradient="from-teal-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-teal-500/10"
          />
          <KpiCard
            label="Opening Float"
            value={currency(shiftOpenFloat)}
            subtext="Register Shift Starting Cash"
            badgeText="Float Cash"
            badgeVariant="warning"
            icon={Banknote}
            iconBg="bg-amber-500/20 text-amber-300 border-amber-500/30"
            gradient="from-amber-950/50 via-slate-900/80 to-slate-900/90"
            glowClass="shadow-lg shadow-amber-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue by Hour (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-muted">No sales data yet. Cashier transactions will appear here in real-time.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip formatter={(v) => [currency(Number(v)), "Revenue"]} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {paymentBreakdown.length === 0 ? (
                <p className="text-xs text-muted">No transactions yet.</p>
              ) : (
                paymentBreakdown.map(({ method, count, total }) => {
                  const Icon = PAYMENT_ICONS[method] ?? Receipt;
                  return (
                    <div key={method} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-container-high/40">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground capitalize">{method}</p>
                          <p className="text-[11px] text-muted">{count} transaction{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-emerald-400">{currency(total)}</p>
                    </div>
                  );
                })
              )}
              <div className="border-t border-border pt-2 flex justify-between text-xs">
                <span className="text-muted">Discounts Given</span>
                <span className="font-semibold text-amber-400">{currency(totalDiscounts)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Tax Collected</span>
                <span className="font-semibold text-foreground">{currency(totalTax)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Cashier Sessions */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" />
            <CardTitle className="text-foreground">Cashier POS Sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cashiers.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No cashier accounts found.</p>
            ) : (
              cashiers.map((c) => {
                const cashierSales = completedSales; // in production, filter by cashier ID
                const cashierTotal = cashierSales.reduce((acc, s) => acc + s.total, 0);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/15 text-teal-400 font-bold text-sm">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">{currency(cashierTotal)}</p>
                        <p className="text-[11px] text-muted">{cashierSales.length} sales today</p>
                      </div>
                      <Badge className={`text-[10px] ${c.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}>
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Full Transaction Log from Cashier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">All Completed Transactions (Cashier Log)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {completedSales.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No sales completed yet. Transactions from the POS will appear here in real-time.</p>
            ) : (
              [...completedSales].reverse().map((sale) => {
                const Icon = PAYMENT_ICONS[sale.paymentMethod] ?? Receipt;
                return (
                  <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted">{sale.id}</span>
                          <Badge className="text-[10px] capitalize bg-surface-container-high border-border text-muted">{sale.paymentMethod}</Badge>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {sale.items.length} item(s) · {relativeTime(sale.timestamp)}
                          {sale.discount && <span className="text-amber-400 ml-1">· {sale.discount.percent}% off</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <p className="font-bold text-emerald-400 text-base">{currency(sale.total)}</p>
                        <p className="text-muted">tendered: {currency(sale.amountTendered)}</p>
                      </div>
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
