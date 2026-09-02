"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Database,
  Truck,
  CalendarOff,
  ClipboardList,
  LogOut,
  Boxes,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

export function InventorySidebar() {
  const { currentUser, inventory, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const clerkName = currentUser?.name || "Tigist Haile";

  // Count batches expiring within 90 days
  const today = new Date();
  const expiringCount = inventory.filter((b) => {
    if (b.quarantined) return false;
    const expiry = new Date(b.expiryDate);
    const daysLeft = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 90;
  }).length;

  const INVENTORY_NAV_ITEMS = [
    {
      href: "/inventory",
      label: "Stock Master DB",
      icon: Database,
    },
    {
      href: "/inventory/intake",
      label: "Receive Shipments",
      icon: Truck,
    },
    {
      href: "/inventory/expiry",
      label: "Expiry Tracking",
      icon: CalendarOff,
      badgeCount: expiringCount,
    },
    {
      href: "/inventory/suppliers",
      label: "Supplier Orders",
      icon: ClipboardList,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-white border-r border-slate-800 p-4">
      {/* Brand Header */}
      <div className="mb-6 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h2 className="text-base font-bold leading-tight tracking-tight text-white">
              Alem Pharmacy
            </h2>
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-widest">
              Logistics Hub
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
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Inventory Operations
        </p>
        {INVENTORY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/inventory" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-orange-500/15 text-orange-300 border border-orange-500/30 shadow-sm shadow-orange-500/10 font-semibold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-orange-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span className="truncate flex-1">{item.label}</span>

              {/* Amber Expiry Warning Badge */}
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold shadow-sm shadow-amber-500/50 animate-pulse">
                  {item.badgeCount}
                </span>
              )}

              {/* Active Dot */}
              {isActive && (!item.badgeCount || item.badgeCount === 0) && (
                <span className="ml-auto h-2 w-2 rounded-full bg-orange-400 shadow-sm shadow-orange-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Element - Inventory Clerk Profile & Logout */}
      <div className="mt-auto pt-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <ProfileAvatar
              src={currentUser?.avatarUrl}
              name={clerkName}
              size={40}
              className="rounded-full"
            />
            {/* Profile Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{clerkName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="primary"
                  className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px] font-semibold py-0 px-2"
                >
                  Inventory Clerk
                </Badge>
              </div>
            </div>
          </div>

          {/* View Profile Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push("/inventory/profile");
              setMobileOpen(false);
            }}
            className="mt-2 w-full gap-2 border-slate-700 bg-slate-900 text-slate-300 hover:bg-orange-500/15 hover:text-orange-300 hover:border-orange-500/30 text-xs transition-all"
          >
            <UserCircle className="h-3.5 w-3.5" />
            View Profile
          </Button>

          {/* Log Out Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="mt-2 w-full gap-2 border-slate-700 bg-slate-900 text-slate-300 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 text-xs transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
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

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
