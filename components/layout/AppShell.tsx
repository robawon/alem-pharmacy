"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Boxes,
  UserCircle2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { AdminSidebar } from "./AdminSidebar";
import { PharmacistSidebar } from "./PharmacistSidebar";
import { CashierSidebar } from "./CashierSidebar";
import { InventorySidebar } from "./InventorySidebar";
import { CustomerSidebar } from "./CustomerSidebar";

const NAV_BY_ROLE: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [{ href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard }],
  pharmacist: [{ href: "/pharmacist", label: "Pharmacist Workstation", icon: Pill }],
  cashier: [{ href: "/pos", label: "Point of Sale", icon: ShoppingCart }],
  inventory: [{ href: "/inventory", label: "Stock & Batch Control", icon: Boxes }],
  customer: [{ href: "/portal", label: "My Pharmacy Portal", icon: UserCircle2 }],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "System Admin",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
  inventory: "Inventory Clerk",
  customer: "Customer",
};

export function AppShell({
  requiredRole,
  children,
}: {
  requiredRole: Role;
  children: React.ReactNode;
}) {
  const { currentUser, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  // Active role based on current path or user preference
  const effectiveRole = currentUser?.role || requiredRole;

  // Use dedicated AdminSidebar for admin role
  if (requiredRole === "admin") {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    );
  }

  // Use dedicated PharmacistSidebar for pharmacist role
  if (requiredRole === "pharmacist") {
    return (
      <div className="flex min-h-screen bg-background">
        <PharmacistSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    );
  }

  // Use dedicated CashierSidebar for cashier role
  if (requiredRole === "cashier") {
    return (
      <div className="flex min-h-screen bg-background">
        <CashierSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    );
  }

  // Use dedicated InventorySidebar for inventory role
  if (requiredRole === "inventory") {
    return (
      <div className="flex min-h-screen bg-background">
        <InventorySidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    );
  }

  // Use dedicated CustomerSidebar for customer/portal role
  if (requiredRole === "customer") {
    return (
      <div className="flex min-h-screen bg-background">
        <CustomerSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    );
  }

  const ALL_MODULES = [
    { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
    { href: "/pharmacist", label: "Pharmacist Workstation", icon: Pill },
    { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
    { href: "/inventory", label: "Stock & Batch Control", icon: Boxes },
    { href: "/portal", label: "Patient Portal", icon: UserCircle2 },
  ];

  const userDisplayName = currentUser?.name || "Active Session";
  const userRoleDisplay = currentUser?.role ? ROLE_LABEL[currentUser.role] : "System User";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface-container p-4">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Logo size={36} />
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">Alem Pharmacy</p>
            <p className="text-xs leading-tight text-muted">PMS Operations</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
            Navigation Modules
          </p>
          {ALL_MODULES.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary/20 text-primary-fixed-dim border border-primary/30 font-semibold"
                    : "text-foreground/80 hover:bg-surface-container-high hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-border bg-surface-container-high p-3.5">
          <p className="text-sm font-semibold text-foreground truncate">{userDisplayName}</p>
          <Badge variant="primary" className="mt-1 text-[10px]">
            {userRoleDisplay}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2 text-xs"
            onClick={async () => {
              await logout();
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
