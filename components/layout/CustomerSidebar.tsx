"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  FileUp,
  Package,
  HeartPulse,
  User,
  LogOut,
  Pill,
  Menu,
  X,
  LifeBuoy,
  UserCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

export function CustomerSidebar() {
  const { currentUser, customerOrders, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const patientName = currentUser?.name || "Guest Patient";
  const firstName = patientName.split(" ")[0];

  // Count active orders for badge
  const activeOrderCount = customerOrders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;

  const PORTAL_NAV_ITEMS = [
    {
      href: "/portal",
      label: "Medication Storefront",
      icon: Store,
    },
    {
      href: "/portal/upload",
      label: "Upload Prescription",
      icon: FileUp,
    },
    {
      href: "/portal/orders",
      label: "My Active Orders",
      icon: Package,
      badgeCount: activeOrderCount,
    },
    {
      href: "/portal/prescriptions",
      label: "Saved Prescriptions",
      icon: HeartPulse,
    },
    {
      href: "/portal/account",
      label: "Account & Billing",
      icon: User,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-800 text-white border-r border-slate-700 p-4">
      {/* Brand Header */}
      <div className="mb-6 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h2 className="text-base font-bold leading-tight tracking-tight text-white">
              Alem Pharmacy
            </h2>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Patient Portal
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

      {/* Welcome Banner */}
      <div className="mx-1 mb-4 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 px-3.5 py-2.5">
        <p className="text-xs text-emerald-300 font-medium">Welcome back 👋</p>
        <p className="text-sm font-bold text-white mt-0.5">{firstName}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          My Pharmacy
        </p>
        {PORTAL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/portal" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-semibold"
                  : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span className="truncate flex-1">{item.label}</span>

              {/* Active Orders Badge */}
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-teal-500 text-white text-[11px] font-bold shadow-sm shadow-teal-500/40">
                  {item.badgeCount}
                </span>
              )}

              {/* Active Dot */}
              {isActive && (!item.badgeCount || item.badgeCount === 0) && (
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pharmacy Support Link */}
      <div className="mt-4 mx-1">
        <Link
          href="/portal/support"
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs text-slate-400 hover:text-emerald-300 hover:bg-slate-700/60 transition-all"
        >
          <LifeBuoy className="h-4 w-4 shrink-0" />
          <span>Pharmacy Support / Help</span>
        </Link>
      </div>

      {/* Footer Element - Patient Profile & Sign Out */}
      <div className="mt-2 pt-3 border-t border-slate-700">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <ProfileAvatar
              src={currentUser?.avatarUrl}
              name={patientName}
              size={40}
              className="rounded-full"
            />
            {/* Profile Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{patientName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="primary"
                  className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-semibold py-0 px-2"
                >
                  Patient
                </Badge>
              </div>
            </div>
          </div>

          {/* View Profile Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push("/portal/profile");
              setMobileOpen(false);
            }}
            className="mt-2 w-full gap-2 border-slate-600 bg-slate-800 text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/30 text-xs transition-all"
          >
            <UserCircle className="h-3.5 w-3.5" />
            My Profile
          </Button>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="mt-2 w-full gap-2 border-slate-600 bg-slate-800 text-slate-300 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 text-xs transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
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
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-white shadow-lg focus:outline-none"
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
