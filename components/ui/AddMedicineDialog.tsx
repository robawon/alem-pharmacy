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
  { value: "otc",          label: "Over-the-Counter (OTC)" },
  { value: "prescription", label: "Prescription (Rx)" },
  { value: "vitamins",     label: "Vitamins & Supplements" },
  { value: "first_aid",    label: "First Aid" },
];

const EMPTY = {
  drugName: "",
  genericName: "",
  dosage: "",
  category: "otc" as DrugCategory,
  isRx: false,
  unitPrice: "",
  quantity: "",
  batchNumber: "",
  expiryDate: "",
  safetyThreshold: "",
};

export function AddMedicineDialog({ open, onClose }: Props) {
  const { addCatalogItem } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const handleCategoryChange = (val: DrugCategory) => {
    setForm((f) => ({ ...f, category: val, isRx: val === "prescription" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // At least one of drugName or quantity must be provided
    if (!form.drugName.trim() && !form.quantity) {
      alert("Please enter at least a drug name or quantity");
      return;
    }
    addCatalogItem({
      drugName: form.drugName,
      genericName: form.genericName,
      dosage: form.dosage,
      category: form.category,
      isRx: form.category === "prescription",
      unitPrice: Number(form.unitPrice) || 0,
      quantity: Number(form.quantity) || 0,
      inStock: Number(form.quantity) > 0,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY);
      onClose();
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm(EMPTY); setSubmitted(false); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Pill className="h-4 w-4" />
            </div>
            Add New Medicine to Catalog
          </DialogTitle>
          <DialogDescription className="text-muted">
            Fill in all fields below. The medicine will be immediately available in the patient portal and POS catalog.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <p className="text-base font-semibold text-foreground">Medicine added successfully!</p>
            <p className="text-xs text-muted">"{form.drugName}" is now live in the catalog.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Catalog Information Section */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs font-semibold text-teal-400 mb-3 uppercase">Catalog & Pricing</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Drug / Brand Name</Label>
                  <Input placeholder="e.g. Amoxicillin 500mg" value={form.drugName}
                    onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Generic Name</Label>
                  <Input placeholder="e.g. Amoxicillin" value={form.genericName}
                    onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Dosage / Strength</Label>
                  <Input placeholder="e.g. 500mg or 10ml" value={form.dosage}
                    onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Category</Label>
                  <Select value={form.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Unit Price (ETB)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="e.g. 2.50" value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Initial Quantity</Label>
                  <Input type="number" min="0" placeholder="e.g. 200" value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Batch & Stock Management Section */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs font-semibold text-orange-400 mb-3 uppercase">Batch Information (Optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Batch Number</Label>
                  <Input placeholder="e.g. CFT-2026-001" value={form.batchNumber}
                    onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Expiry Date</Label>
                  <Input type="date" value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Safety Threshold</Label>
                  <Input type="number" min="0" placeholder="Minimum stock level" value={form.safetyThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, safetyThreshold: e.target.value }))} />
                </div>
              </div>
            </div>

            {form.category === "prescription" && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-2.5 text-xs text-amber-300">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">Rx Required</Badge>
                This drug requires a valid pharmacist-verified prescription before dispensing.
              </div>
            )}

            <DialogFooter className="gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                <Plus className="h-4 w-4" /> Add Medicine
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
