"use client";

import { useState, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUp, CloudUpload, CheckCircle2, FileText, X, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";

export default function UploadPrescriptionPage() {
  const { uploadCustomerPrescription, uploadedPrescriptions } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ doctorName: "", targetDrugName: "", patientNotes: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    uploadCustomerPrescription({
      fileName: file.name,
      doctorName: form.doctorName,
      patientNotes: form.patientNotes,
      targetDrugName: form.targetDrugName || undefined,
    });
    setFile(null);
    setForm({ doctorName: "", targetDrugName: "", patientNotes: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const recent = uploadedPrescriptions.slice(0, 5);

  return (
    <AppShell requiredRole="customer">
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload Prescription</h1>
          <p className="text-sm text-muted">Submit your doctor's prescription for pharmacist review and dispensing approval.</p>
        </div>

        {submitted && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Prescription uploaded successfully!</p>
              <p className="text-xs opacity-80 mt-0.5">Our pharmacist team will review it within 1–2 hours.</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <FileUp className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-foreground">New Prescription Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all p-8 flex flex-col items-center gap-3 text-center"
              >
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CloudUpload className="h-6 w-6" />
                </div>
                {file ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-foreground">{file.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      <X className="h-4 w-4 text-muted hover:text-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Drop your prescription here or <span className="text-emerald-400 underline">browse</span></p>
                    <p className="text-xs text-muted">Supports PDF, JPG, PNG · Max 10MB</p>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted">Prescribing Doctor's Name</Label>
                <Input required placeholder="e.g. Dr. Yohannes Tadesse" value={form.doctorName}
                  onChange={(e) => setForm({ ...form, doctorName: e.target.value })} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted">Drug Name (optional)</Label>
                <Input placeholder="e.g. Amoxicillin 500mg" value={form.targetDrugName}
                  onChange={(e) => setForm({ ...form, targetDrugName: e.target.value })} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted">Notes for Pharmacist (optional)</Label>
                <Textarea placeholder="e.g. Allergic to Penicillin, please note..." rows={3} value={form.patientNotes}
                  onChange={(e) => setForm({ ...form, patientNotes: e.target.value })} />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-3 text-xs text-amber-300">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Prescription-only (Rx) medications will only be dispensed after pharmacist verification. You will be notified when approved.</span>
              </div>

              <Button type="submit" disabled={!file} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-40">
                <FileUp className="h-4 w-4" />
                Submit Prescription for Review
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        {recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recent.map((rx) => (
                <div key={rx.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-container-high/40">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{rx.fileName}</p>
                      <p className="text-[11px] text-muted">Dr. {rx.doctorName}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${rx.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : rx.status === "rejected" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                    {rx.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
