"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className = "", size = 36, showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative overflow-hidden rounded-xl border border-teal-500/30 shadow-md shrink-0 bg-slate-900 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.jpeg"
          alt="Alem Pharmacy Logo"
          width={size}
          height={size}
          className="object-cover w-full h-full"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-foreground tracking-tight text-base">Alem Pharmacy</span>
          <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest">Management System</span>
        </div>
      )}
    </div>
  );
}
