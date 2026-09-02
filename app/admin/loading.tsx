import { Logo } from "@/components/ui/Logo";
import { Loader2 } from "lucide-react";

export default function AdminDashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo size={64} />
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading admin dashboard…</span>
        </div>
      </div>
    </div>
  );
}
