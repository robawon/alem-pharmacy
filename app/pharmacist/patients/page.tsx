"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderHeart, User, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export default function PatientsPage() {
  const { prescriptions } = useStore();

  return (
    <AppShell requiredRole="pharmacist">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Histories</h1>
          <p className="text-sm text-muted">View patient medical records, active allergy profiles, and past drug dispensing history.</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <FolderHeart className="h-5 w-5 text-teal-400" />
            <CardTitle className="text-foreground">Patient Records on File</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-teal-400" />
                    <span className="font-semibold text-sm">{rx.patientName}</span>
                  </div>
                  <Badge variant="primary" className="text-[10px]">Dr. {rx.doctorName}</Badge>
                </div>
                <div className="text-xs text-muted flex flex-wrap gap-2">
                  <span>History / Allergies:</span>
                  {rx.patientHistory.map((h, i) => (
                    <span key={i} className="rounded bg-surface-container-highest px-2 py-0.5 text-[11px] text-foreground">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
