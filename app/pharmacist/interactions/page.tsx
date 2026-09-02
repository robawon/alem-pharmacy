"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";

export default function InteractionsPage() {
  const { prescriptions } = useStore();
  const warnings = prescriptions.filter((p) => p.conflictWarning !== null);

  return (
    <AppShell requiredRole="pharmacist">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Drug Interactions Database</h1>
          <p className="text-sm text-muted">Clinical cross-reference checks and automated drug allergy alerts.</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-foreground">Active Clinical Conflict Alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {warnings.map((rx) => (
              <div key={rx.id} className="flex flex-col gap-1.5 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-amber-300">{rx.drugName}</span>
                  <span className="text-xs text-muted">Patient: {rx.patientName}</span>
                </div>
                <p className="text-xs text-amber-200/90">{rx.conflictWarning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
