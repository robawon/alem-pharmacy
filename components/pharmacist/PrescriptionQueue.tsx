"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { RejectPrescriptionModal } from "./RejectPrescriptionModal";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sameDay(iso: string): boolean {
  const current = new Date();
  const date = new Date(iso);
  return (
    date.getFullYear() === current.getFullYear() &&
    date.getMonth() === current.getMonth() &&
    date.getDate() === current.getDate()
  );
}

export function PrescriptionQueue() {
  const { prescriptions, inventory, auditLogs, verifyPrescription, quarantineBatch, createInPersonOrder } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pending = useMemo(() => prescriptions.filter((p) => p.status === "pending"), [prescriptions]);

  useEffect(() => {
    if (pending.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !pending.some((item) => item.id === selectedId)) {
      setSelectedId(pending[0].id);
    }
  }, [pending, selectedId]);

  const selectedRx = pending.find((item) => item.id === selectedId) ?? null;
  const selectedBatch = selectedRx ? inventory.find((b) => b.id === selectedRx.batchId) ?? null : null;

  const priorityOrders = pending.filter((rx) => Boolean(rx.conflictWarning)).length;

  const verifiedProcessingTimes = prescriptions
    .filter((rx) => rx.status === "verified" && rx.createdAt && rx.verifiedAt)
    .map((rx) => {
      const start = new Date(rx.createdAt).getTime();
      const end = new Date(rx.verifiedAt!).getTime();
      return Math.max(1, Math.round((end - start) / 60000));
    });

  const averageProcessingTime =
    verifiedProcessingTimes.length > 0
      ? Math.round(verifiedProcessingTimes.reduce((sum, value) => sum + value, 0) / verifiedProcessingTimes.length)
      : 0;

  const safetyCatches = auditLogs.filter(
    (entry) => entry.action_type === "PRESCRIPTION_REJECTED" && sameDay(entry.timestamp)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted">Pending Queue</p>
              <p className="text-3xl font-semibold text-foreground">{pending.length}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted">STAT / Priority Orders</p>
              <p className="text-3xl font-semibold text-destructive">{priorityOrders}</p>
            </div>
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted">Avg. Processing Time</p>
              <p className="text-3xl font-semibold text-foreground">{averageProcessingTime}m</p>
            </div>
            <div className="rounded-full bg-success/10 p-3 text-success">
              <Clock3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-tertiary/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted">Safety Catches</p>
              <p className="text-3xl font-semibold text-foreground">{safetyCatches}</p>
            </div>
            <div className="rounded-full bg-tertiary/10 p-3 text-tertiary">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Incoming Queue</CardTitle>
            <p className="text-sm text-muted">Choose an order to open the clinical verification panel.</p>
          </CardHeader>
          <CardContent className="max-h-[620px] overflow-y-auto p-0">
            {pending.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted">
                No prescriptions pending verification. Great work keeping the queue clear.
              </div>
            ) : (
              pending.map((rx) => {
                const batch = inventory.find((b) => b.id === rx.batchId);
                const isSelected = selectedRx?.id === rx.id;
                return (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => setSelectedId(rx.id)}
                    className={`w-full border-b border-border px-6 py-4 text-left transition-colors ${
                      isSelected ? "bg-primary/10" : "bg-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{rx.patientName}</p>
                        <p className="text-sm text-muted">{rx.doctorName}</p>
                      </div>
                      <Badge variant={batch?.quarantined ? "destructive" : "default"}>
                        {formatTime(rx.createdAt)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/90">
                      <span>{rx.drugName}</span>
                      <span className="text-muted">•</span>
                      <span>{rx.dosage}</span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clinical Intelligence & Verification</CardTitle>
            <p className="text-sm text-muted">Review the prescription, patient context, and safety signals before acting.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedRx ? (
              <>
                <div className="rounded-lg border border-border bg-surface-container-high p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">Prescription details</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{selectedRx.drugName}</h3>
                      <p className="text-sm text-muted">{selectedRx.dosage}</p>
                    </div>
                    <Badge variant={selectedBatch?.quarantined ? "destructive" : selectedRx.conflictWarning ? "warning" : "default"}>
                      {selectedBatch?.quarantined ? "Batch quarantined" : selectedRx.conflictWarning ? "Urgent review" : "Standard"}
                    </Badge>
                  </div>
                  <div className="mt-3 rounded-md border border-border/70 bg-background p-3 text-sm text-foreground/90">
                    <p className="font-medium text-foreground">Doctor order</p>
                    <p className="mt-2 whitespace-pre-line">{selectedRx.prescriptionText}</p>
                    <p className="mt-3 text-xs text-muted">Requested by {selectedRx.doctorName} • Entered {formatDateLabel(selectedRx.createdAt)}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface-container-high p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Patient history</p>
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-foreground/90">
                    {selectedRx.patientHistory.map((history, index) => (
                      <li key={`${selectedRx.id}-${index}`}>{history}</li>
                    ))}
                  </ul>
                </div>

                {selectedRx.conflictWarning ? (
                  <div className="flex items-start gap-2 rounded-md border border-tertiary/30 bg-tertiary/10 p-3 text-sm text-tertiary animate-pulse">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{selectedRx.conflictWarning}</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-border/70 bg-background p-3 text-sm text-muted">
                    No interaction warning detected for the current prescription.
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Button
                    variant="success"
                    className="gap-2"
                    disabled={Boolean(selectedBatch?.quarantined) || selectedBatch?.quantity === 0}
                    onClick={() => {
                      verifyPrescription(selectedRx.id);
                      if (selectedBatch) {
                        createInPersonOrder(
                          selectedRx.patientName,
                          [{
                            id: `item_${Date.now()}`,
                            drugName: selectedRx.drugName,
                            dosage: selectedRx.dosage,
                            genericName: selectedRx.drugName,
                            unitPrice: selectedBatch.unitPrice,
                            quantity: 1,
                          }]
                        );
                      }
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    [Verify & Send to Cashier]
                  </Button>
                  <RejectPrescriptionModal prescription={selectedRx} />
                  {selectedBatch && !selectedBatch.quarantined && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => quarantineBatch(selectedBatch.id)}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      [Quarantine Batch]
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
                Select a pending prescription to view the clinical context and act on the order.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
