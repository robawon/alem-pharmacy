"use client";

export default function CustomerProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-6 w-full max-w-2xl px-4">
        <div className="h-8 bg-slate-700 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-slate-700 rounded animate-pulse w-1/4" />
        
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="h-6 bg-slate-700 rounded animate-pulse w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-2/3" />
                <div className="h-6 bg-slate-700 rounded animate-pulse w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
