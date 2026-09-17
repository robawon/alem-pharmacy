"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  DollarSign,
  Download,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Pill,
  Plus,
  ShieldAlert,
  TerminalSquare,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { AuditLogPanel } from "@/components/audit/AuditLogPanel";
import { AddMedicineDialog } from "@/components/ui/AddMedicineDialog";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import type { Role, StaffProfile } from "@/lib/types";
import { currency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getLast7CalendarDays, getLocalDateKey, isDateIn7DayWindow } from "@/lib/date-range";

const roleOptions: Role[] = ["admin", "pharmacist", "cashier", "inventory", "customer"];
const roleLabels: Record<Role, string> = {
  admin: "Admin",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
  inventory: "Inventory Clerk",
  customer: "Customer",
};

const chartTooltipStyle = {
  contentStyle: {
    background: "#1b2338",
    border: "1px solid #3e4850",
    borderRadius: "0.5rem",
    color: "#dae2fd",
    fontSize: "0.875rem",
  },
};

export default function AdminDashboardPage() {
  return (
    <AppShell requiredRole="admin">
      <AdminDashboardContent />
    </AppShell>
  );
}

function AdminDashboardContent() {
  const { inventory, auditLogs, staffProfiles, completedSales, changeRole, toggleStaffStatus, removeStaff, currentUser } = useStore();
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSheetProfile, setActiveSheetProfile] = useState<StaffProfile | null>(null);

  const [pendingVerificationCount, setPendingVerificationCount] = useState<number | null>(null);
  const [dashboardDate, setDashboardDate] = useState(() => new Date());

  useEffect(() => {
    async function loadPendingCount() {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from("staff_profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_verified", false);

        if (!error && count !== null) {
          setPendingVerificationCount(count);
        }
      } catch (err) {
        console.warn("Failed to load pending verification count:", err);
      }
    }
    loadPendingCount();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-kpi-approvals-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, () => {
        loadPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const scheduleNextDayRefresh = () => {
      const now = new Date();
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return window.setTimeout(() => {
        setDashboardDate(new Date());
      }, Math.max(1000, nextDay.getTime() - now.getTime() + 100));
    };

    const timeoutId = scheduleNextDayRefresh();
    return () => window.clearTimeout(timeoutId);
  }, [dashboardDate]);

  const totalRevenue = completedSales.reduce((sum, entry) => sum + Number(entry.total), 0);
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const unsoldValue = inventory.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const criticalAlerts = inventory.filter((item) => item.quantity <= item.safetyThreshold || item.quarantined).length;

  const liveKpis = useMemo(() => {
    const activeStaff = staffProfiles.filter((profile) => profile.status === "active").length;
    const disabledAccounts = staffProfiles.filter((profile) => profile.status === "suspended").length;
    const pendingApprovals = pendingVerificationCount !== null 
      ? pendingVerificationCount 
      : staffProfiles.filter((profile) => profile.role === "customer" || (profile as any).is_verified === false).length;
    // Count currently logged in user / active sessions
    const onlineStaff = staffProfiles.filter((profile) => (profile.isOnline || (currentUser && profile.id === currentUser.id)) && profile.status === "active").length;

    return { activeStaff, pendingApprovals, disabledAccounts, onlineStaff };
  }, [staffProfiles, currentUser, pendingVerificationCount]);

  const filteredProfiles = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return staffProfiles.filter((profile) => {
      const haystack = `${profile.name} ${profile.email} ${profile.role}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchTerm, staffProfiles]);

  const weeklyRevenue = useMemo(() => {
    const days = getLast7CalendarDays(dashboardDate);
    const revenueByDay = new Map<string, number>();

    completedSales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp);
      const dayKey = getLocalDateKey(saleDate);
      revenueByDay.set(dayKey, (revenueByDay.get(dayKey) ?? 0) + Number(sale.total || 0));
    });

    return days.map((day) => ({
      day: day.label,
      revenue: revenueByDay.get(day.key) ?? 0,
    }));
  }, [completedSales, dashboardDate]);

  const recentTransactions = useMemo(
    () => {
      const days = getLast7CalendarDays(dashboardDate);

      return completedSales
        .filter((sale) => isDateIn7DayWindow(new Date(sale.timestamp), days))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((sale) => {
          const pharmacistName = sale.pharmacistName ||
            (sale.salespersonId ? staffProfiles.find((s) => s.id === sale.salespersonId)?.name : undefined) ||
            "N/A";
          const cashierName = sale.cashierName ||
            (sale.cashierId ? staffProfiles.find((s) => s.id === sale.cashierId)?.name : undefined) ||
            "N/A";

          return {
            id: sale.id,
            pharmacist: pharmacistName,
            cashier: cashierName,
            time: new Date(sale.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
            amount: Number(sale.total),
            paymentMethod: sale.paymentMethod,
          };
        });
    },
    [completedSales, dashboardDate, staffProfiles],
  );

  const handleRoleChange = (profileId: string, role: Role) => {
    changeRole(profileId, role);
    setToastMessage(`Updated role to ${roleLabels[role]}.`);
  };

  const handleAuthorityToggle = (profileId: string) => {
    const profile = staffProfiles.find((item) => item.id === profileId);
    toggleStaffStatus(profileId);
    setToastMessage(
      profile?.status === "active"
        ? `Suspended access for ${profile.name ?? "staff member"}.`
        : `Restored access for ${profile?.name ?? "staff member"}.`,
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted">Clinical & financial overview of Alem Pharmacy operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
            onClick={() => setShowAddMedicine(true)}
          >
            <Plus className="h-4 w-4" />
            Add New Medicine
          </Button>
          <Button variant="outline" size="sm" onClick={() => setToastMessage("Revenue export is ready for download.")}>
            <Download className="mr-1 h-4 w-4" />
            Download Revenue Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={currency(totalRevenue)}
          subtext="from completed sales"
          badgeText="Live"
          badgeVariant="success"
          icon={DollarSign}
          iconBg="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
          gradient="from-emerald-950/50 via-slate-900/80 to-slate-900/90"
          glowClass="shadow-lg shadow-emerald-500/10"
          href="/admin/finance"
        />
        <KpiCard
          label="Medications in Stock"
          value={inventory.length.toLocaleString()}
          subtext={`Total Units: ${totalUnits.toLocaleString()}`}
          badgeText="Catalog Active"
          badgeVariant="info"
          icon={Pill}
          iconBg="bg-teal-500/20 text-teal-300 border-teal-500/30"
          gradient="from-teal-950/50 via-slate-900/80 to-slate-900/90"
          glowClass="shadow-lg shadow-teal-500/10"
          href="/inventory"
        />
        <KpiCard
          label="Unsold Asset Value"
          value={currency(unsoldValue)}
          subtext="Current shelf valuation"
          badgeText="Live Audit"
          badgeVariant="purple"
          icon={Wallet}
          iconBg="bg-purple-500/20 text-purple-300 border-purple-500/30"
          gradient="from-purple-950/50 via-slate-900/80 to-slate-900/90"
          glowClass="shadow-lg shadow-purple-500/10"
          href="/inventory"
        />
        <KpiCard
          label="Critical Alerts"
          value={criticalAlerts}
          subtext="Low stock or quarantined batches"
          badgeText="Action Needed"
          badgeVariant="warning"
          icon={AlertTriangle}
          iconBg="bg-amber-500/20 text-amber-300 border-amber-500/30"
          gradient="from-amber-950/50 via-slate-900/80 to-slate-900/90"
          glowClass="shadow-lg shadow-amber-500/10"
          href="/inventory/expiry"
        />
      </div>

      <AddMedicineDialog open={showAddMedicine} onClose={() => setShowAddMedicine(false)} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenue} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3e4850" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#8a93a6", fontSize: 13 }} axisLine={{ stroke: "#3e4850" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8a93a6", fontSize: 13 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `$${value}`} />
                  <Tooltip contentStyle={chartTooltipStyle.contentStyle} labelStyle={{ color: "#dae2fd", fontWeight: 600 }} formatter={(value) => [currency(Number(value)), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Pharmacist</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted">
                      No transactions in the last 7 days.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                      <TableCell className="font-medium text-slate-200">{tx.pharmacist}</TableCell>
                      <TableCell>{tx.time}</TableCell>
                      <TableCell className="font-medium text-slate-200">{tx.cashier}</TableCell>
                      <TableCell className="capitalize">{tx.paymentMethod}</TableCell>
                      <TableCell className="text-right font-medium">{currency(tx.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success">Approved</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AuditLogPanel logs={auditLogs} title="Recent Verification & Clinical Activity" limit={25} />
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Project Context & Architecture</CardTitle>
              <p className="mt-1 text-sm text-muted">
                Staff & user management for Alem Pharmacy powered by live Supabase records.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setToastMessage("Staff roster refreshed from the database.")}>
              <Activity className="mr-1 h-4 w-4" />
              Refresh View
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="employee-roster" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <a href="#employee-roster" className="block">
              <Card className="border-emerald-500/20 bg-emerald-500/10 cursor-pointer hover:border-emerald-400/40 transition-all">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Active Staff</CardTitle>
                  <Users className="h-5 w-5 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{liveKpis.activeStaff}</p>
                  <p className="mt-1 text-xs text-muted font-medium text-emerald-400">View Active Roster →</p>
                </CardContent>
              </Card>
            </a>
            <a href="/admin/users" className="block">
              <Card className="border-amber-500/20 bg-amber-500/10 cursor-pointer hover:border-amber-400/40 transition-all">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Pending Signups</CardTitle>
                  <UserPlus className="h-5 w-5 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{liveKpis.pendingApprovals}</p>
                  <p className="mt-1 text-xs text-muted font-medium text-amber-400">View Pending Users →</p>
                </CardContent>
              </Card>
            </a>
            <a href="#employee-roster" className="block">
              <Card className="border-rose-500/20 bg-rose-500/10 cursor-pointer hover:border-rose-400/40 transition-all">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Disabled Accounts</CardTitle>
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{liveKpis.disabledAccounts}</p>
                  <p className="mt-1 text-xs text-muted font-medium text-rose-400">View Suspended Users →</p>
                </CardContent>
              </Card>
            </a>
            <a href="#employee-roster" className="block">
              <Card className="border-emerald-500/20 bg-emerald-500/10 cursor-pointer hover:border-emerald-400/40 transition-all">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Online / On Shift</CardTitle>
                  <Wifi className="h-5 w-5 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{liveKpis.onlineStaff}</p>
                  <p className="mt-1 text-xs text-muted font-medium text-emerald-400">Currently Active Sessions →</p>
                </CardContent>
              </Card>
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-container-high/70 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">Employee Roster & Sign-up Table</p>
              <p className="text-sm text-muted">Review, assign roles, and manage authority state in real time.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search staff"
                className="w-full md:w-64"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} className={profile.status === "suspended" ? "bg-rose-950/20 opacity-70" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary-fixed-dim">
                          {profile.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{profile.name}</p>
                          <p className="text-xs text-muted">
                            {profile.role === "cashier"
                              ? "Main POS Counter"
                              : profile.role === "admin"
                                ? "Control Desk"
                                : profile.role === "inventory"
                                  ? "Store Room"
                                  : profile.role === "pharmacist"
                                    ? "Dispensary Station 1"
                                    : "Customer Portal"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Select value={profile.role} onValueChange={(value) => handleRoleChange(profile.id, value as Role)}>
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {roleLabels[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={profile.status === "active" ? "success" : "secondary"}
                        className={profile.status === "suspended" ? "bg-rose-500/15 text-rose-300" : ""}
                        onClick={() => handleAuthorityToggle(profile.id)}
                      >
                        {profile.status === "active" ? "ACTIVE" : "DISABLED"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isUserOnline = (profile.isOnline || (currentUser && profile.id === currentUser.id)) && profile.status === "active";
                        return (
                          <Badge variant={isUserOnline ? "success" : "default"} className="gap-1">
                            {isUserOnline ? <Wifi className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                            {isUserOnline ? "Online" : "Offline"}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setToastMessage(`Edit profile flow is connected to the live staff record for ${profile.name}.`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToastMessage(`Password reset requested for ${profile.name}.`)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActiveSheetProfile(profile)}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> View Employee Audit Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToastMessage(`Terminal assignment is managed from the live staff record, ${profile.name}.`)}>
                            <TerminalSquare className="mr-2 h-4 w-4" /> Assign Terminal / Shift
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/60 font-medium"
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove user "${profile.name}" from the database?`)) {
                                removeStaff(profile.id);
                                setToastMessage(`Removed user ${profile.name} from the database.`);
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-rose-400" /> Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border border-border bg-surface-container-high/60 p-4">
            <p className="text-sm font-medium">Audit Activity Feed</p>
            <div className="mt-3 space-y-2">
              {auditLogs.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-start justify-between rounded-md border border-border/70 bg-background/40 p-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.action_type}</p>
                    <p className="text-muted">{entry.payload_delta}</p>
                  </div>
                  <span className="text-xs text-muted">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {toastMessage ? (
        <div className="fixed bottom-4 right-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <Sheet open={!!activeSheetProfile} onOpenChange={(open) => !open && setActiveSheetProfile(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{activeSheetProfile?.name ? `${activeSheetProfile.name} Activity` : "Employee Activity"}</SheetTitle>
            <SheetDescription>Only the actions recorded for this employee appear in the timeline.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {auditLogs.filter((entry) => entry.user_id === activeSheetProfile?.id).length === 0 ? (
              <p className="text-sm text-muted">No activity recorded yet.</p>
            ) : (
              auditLogs
                .filter((entry) => entry.user_id === activeSheetProfile?.id)
                .map((entry) => (
                  <div key={entry.id} className="rounded-md border border-border bg-surface-container-high/60 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{entry.action_type}</p>
                      <span className="text-xs text-muted">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-muted">{entry.payload_delta}</p>
                  </div>
                ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
