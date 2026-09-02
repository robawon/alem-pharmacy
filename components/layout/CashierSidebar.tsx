"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MonitorSmartphone,
  Clock,
  Wallet,
  Receipt,
  LogOut,
  ShoppingCart,
  Menu,
  X,
  UserCircle,
  Bell,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

export function CashierSidebar() {
  const { currentUser, parkedCarts, logout, closeShift, completedSales, inPersonOrders } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Calculate held/parked carts count for dynamic badge
  const parkedCount = parkedCarts.length;
  const pharmacistOrderCount = inPersonOrders.filter((order) => order.status === "pending_cashier" || order.status === "ready_for_checkout").length;

  const handleCloseShift = () => {
    const shiftSales = completedSales.reduce((sum, s) => sum + s.total, 0);
    closeShift(shiftSales);
    logout();
    router.push("/");
  };

  const cashierName = currentUser?.name || "Yonas Girma";

  const CASHIER_NAV_ITEMS = [
    {
      href: "/pos",
      label: "POS Terminal",
      icon: MonitorSmartphone,
    },
    {
      href: "/pos/notifications",
      label: "Pharmacist Orders",
      icon: Bell,
      badgeCount: pharmacistOrderCount,
    },
    {
      href: "/pos/parked",
      label: "Held / Parked Carts",
      icon: Clock,
      badgeCount: parkedCount,
    },
    {
      href: "/pos/register",
      label: "Shift Register & Drawer",
      icon: Wallet,
    },
    {
      href: "/pos/receipts",
      label: "Past Receipts",
      icon: Receipt,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-white border-r border-slate-800 p-3.5">
      {/* Brand Header */}
      <div className="mb-5 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <div>
            <h2 className="text-sm font-bold leading-tight tracking-tight text-white">
              Alem Pharmacy
            </h2>
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest">
              POS Checkout
            </span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          className="md:hidden text-slate-400 hover:text-white p-1"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Register Navigation
        </p>
        {CASHIER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/pos" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10 font-semibold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-teal-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span className="truncate flex-1">{item.label}</span>

              {/* Dynamic Badge for Parked Carts */}
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold shadow-sm shadow-amber-500/40">
                  {item.badgeCount}
                </span>
              )}

              {/* Active Dot */}
              {isActive && (!item.badgeCount || item.badgeCount === 0) && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Element - Cashier Profile & Close Shift Button */}
      <div className="mt-auto pt-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <ProfileAvatar
              src={currentUser?.avatarUrl}
              name={cashierName}
              size={36}
              className="rounded-full"
            />
            {/* Profile Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{cashierName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant="primary"
                  className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[9px] font-medium py-0 px-1.5"
                >
                  Cashier - Register 1
                </Badge>
              </div>
            </div>
          </div>

          {/* View Profile Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push("/pos/profile");
              setMobileOpen(false);
            }}
            className="mt-2 w-full gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:bg-teal-500/15 hover:text-teal-300 hover:border-teal-500/30 text-[11px] h-8 transition-all"
          >
            <UserCircle className="h-3.5 w-3.5" />
            My Profile
          </Button>

          {/* Close Shift & Log Out Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloseShift}
            className="mt-2 w-full gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/30 text-[11px] h-8 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Close Shift &amp; Log Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white shadow-lg focus:outline-none"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar (w-56 to maximize POS space) */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-56 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
