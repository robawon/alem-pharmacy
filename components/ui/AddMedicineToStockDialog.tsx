"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Pill, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { DrugCategory } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: DrugCategory; label: string }[] = [
  { value: "anti_diabetics",    label: "Anti Diabetics" },
  { value: "anti_biotic",       label: "Anti Biotic" },
  { value: "anti_pain",         label: "Anti Pain" },
  { value: "anti_protozal",     label: "Anti Protozoal" },
  { value: "cns_drugs",         label: "CNS Drugs" },
  { value: "cv",                label: "CV" },
  { value: "dermatology",       label: "Dermatology" },
  { value: "eye_ear_nasal",     label: "Eye-Ear and Nasal Preparation Drugs" },
  { value: "gi",                label: "GI" },
  { value: "hormonal_drug",     label: "Hormonal Drug" },
  { value: "medical_equipment", label: "Medical Equipment" },
  { value: "respiratory_drug",  label: "Respiratory Drug" },
  { value: "vitamins_minerals", label: "Vitamin and Minerals" },
  { value: "cosmetics",         label: "Cosmetics" },
];

const EMPTY = {
  drugName: "",
  genericName: "",
  dosage: "",
  batchNumber: "",
  quantity: "",
  unitPrice: "",
  expiryDate: "",
  safetyThreshold: "",
};

export function AddMedicineToStockDialog({ open, onClose }: Props) {
  const { receiveShipment } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [category, setCategory] = useState<DrugCategory>("anti_biotic");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.drugName.trim()) {
      alert("Please enter a drug name");
      return;
    }
    
    if (!form.quantity || Number(form.quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (!form.unitPrice || Number(form.unitPrice) <= 0) {
      alert("Please enter a valid unit price");
      return;
    }

    if (!form.expiryDate) {
      alert("Please enter an expiry date");
      return;
    }

    receiveShipment({
      drugName: form.drugName,
      genericName: form.genericName,
      dosage: form.dosage,
      category,
      isRx: category !== "cosmetics",
      batchNumber: form.batchNumber || `BATCH-${Date.now()}`,
      expiryDate: form.expiryDate,
      safetyThreshold: Number(form.safetyThreshold) || 10,
      unitPrice: Number(form.unitPrice),
      quantity: Number(form.quantity),
      quarantined: false,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY);
      setCategory("anti_biotic");
      onClose();
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm(EMPTY); setSubmitted(false); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Plus className="h-4 w-4" />
            </div>
            Add Medicine to Stock
          </DialogTitle>
          <DialogDescription className="text-muted">
            Record a new stock batch or shipment received. Enter all required information below.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <p className="text-base font-semibold text-foreground">Stock added successfully!</p>
            <p className="text-xs text-muted">"{form.drugName}" batch added to inventory.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Stock Information Section */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs font-semibold text-emerald-400 mb-3 uppercase">Medicine & Batch Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Drug / Brand Name *</Label>
                  <Input 
                    placeholder="e.g. Amoxicillin 500mg" 
                    value={form.drugName}
                    onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Generic Name</Label>
                  <Input 
                    placeholder="e.g. Amoxicillin" 
                    value={form.genericName}
                    onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Dosage / Strength</Label>
                  <Input 
                    placeholder="e.g. 500mg or 10ml" 
                    value={form.dosage}
                    onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Category *</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val as DrugCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Batch Number</Label>
                  <Input 
                    placeholder="e.g. CFT-2026-001" 
                    value={form.batchNumber}
                    onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Unit Price (ETB) *</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="e.g. 2.50" 
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Quantity *</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="e.g. 200" 
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Expiry Date (YYYY-MM-DD) *</Label>
                  <Input 
                    type="date" 
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Safety Threshold (Low-Stock Alert)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="e.g. 10" 
                    value={form.safetyThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, safetyThreshold: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setForm(EMPTY); setCategory("anti_biotic"); onClose(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Pill className="mr-2 h-4 w-4" />
                Add to Stock
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
