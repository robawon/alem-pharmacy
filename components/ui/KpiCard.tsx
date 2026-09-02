"use client";

import React from "react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "info" | "purple";
  icon: React.ElementType;
  iconBg?: string;
  gradient?: string;
  glowClass?: string;
  onClick?: () => void;
  href?: string;
}

export function KpiCard({
  label,
  value,
  subtext,
  badgeText,
  badgeVariant = "info",
  icon: Icon,
  iconBg = "bg-teal-500/20 text-teal-300 border-teal-500/30",
  gradient = "from-slate-900/90 via-slate-900/70 to-slate-800/90",
  glowClass = "shadow-lg shadow-teal-500/5",
  onClick,
  href,
}: KpiCardProps) {
  const content = (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${glowClass} ${onClick || href ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold tracking-tight text-white">{value}</p>
            {badgeText && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  badgeVariant === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : badgeVariant === "warning"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : badgeVariant === "purple"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-teal-500/20 text-teal-300 border-teal-500/30"
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtext && <p className="text-xs font-medium text-slate-400/90 mt-0.5">{subtext}</p>}
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner shrink-0 ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative ambient glowing orb */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-10 bg-white blur-xl" />
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}
