"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
      </div>
      <div className="flex flex-col gap-2 max-w-sm">
        <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
        <p className="text-sm text-slate-400">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
        <a
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-slate-300 text-sm font-medium transition-all"
        >
          <Home className="h-4 w-4" /> Go Home
        </a>
      </div>
    </div>
  );
}
