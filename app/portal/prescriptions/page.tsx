"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, FileText, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_review: { label: "Under Review",  color: "bg-amber-500/20 text-amber-300 border-amber-500/30",    icon: Clock },
  approved:       { label: "Approved",       color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  rejected:       { label: "Rejected",       color: "bg-red-500/20 text-red-300 border-red-500/30",          icon: XCircle },
};

export default function SavedPrescriptionsPage() {
  const { uploadedPrescriptions } = useStore();

  return (
    <AppShell requiredRole="customer">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Prescriptions</h1>
          <p className="text-sm text-muted">Your uploaded prescription documents and their pharmacist review status.</p>
        </div>

        {uploadedPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <HeartPulse className="h-7 w-7" />
              </div>
              <p className="font-semibold text-foreground">No prescriptions on file</p>
              <p className="text-sm text-muted">
                Upload your doctor's prescription from the{" "}
                <a href="/portal/upload" className="text-emerald-400 underline hover:text-emerald-300">Upload Prescription</a>{" "}
                page to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {uploadedPrescriptions.map((rx) => {
              const cfg = STATUS_CONFIG[rx.status] ?? STATUS_CONFIG.pending_review;
              const Icon = cfg.icon;
              return (
                <Card key={rx.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold text-foreground">{rx.fileName}</p>
                        <p className="text-xs text-muted">
                          Dr. {rx.doctorName}
                          {rx.targetDrugName && <> · <span className="text-foreground/70">{rx.targetDrugName}</span></>}
                        </p>
                        <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {relativeTime(rx.uploadedAt)}
                        </p>
                        {rx.patientNotes && (
                          <p className="text-xs text-muted italic mt-1 max-w-sm truncate">"{rx.patientNotes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`flex items-center gap-1.5 text-xs ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <RefreshCw className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs text-muted leading-relaxed">
              <span className="text-emerald-300 font-semibold">Prescription validity: </span>
              Approved prescriptions are valid for 6 months from the issue date. Expired prescriptions must be re-issued by your doctor.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
