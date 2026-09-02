"use client";

import { Logo } from "@/components/ui/Logo";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center animate-pulse">
        <Logo size={72} />
        <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
          <span>Loading Alem Pharmacy...</span>
        </div>
      </div>
    </div>
  );
}
