"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Pill, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { DrugCategory } from "@/lib/types";
import { calculateTaxStatus } from "@/lib/tax";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  drugName: "",
  genericName: "",
  dosage: "",
  category: "anti_biotic" as DrugCategory,
  isRx: true,
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

  const taxStatus = calculateTaxStatus(form.category, form.drugName);

  const handleCategoryChange = (val: DrugCategory) => {
    setForm((f) => ({ ...f, category:val, isRx: val !== "cosmetics" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drugName.trim()) {
      alert("Please enter the drug/medication name.");
      return;
    }
    const isRxItem = form.category !== "cosmetics";
    const evaluatedTax = calculateTaxStatus(form.category, form.drugName);
    addCatalogItem({
      drugName: form.drugName,
      genericName: form.genericName || form.drugName,
      dosage: form.dosage,
      category: form.category,
      isRx: isRxItem,
      unitPrice: Number(form.unitPrice) || 0,
      quantity: Number(form.quantity) || 0,
      inStock: Number(form.quantity) > 0,
      hasTax: evaluatedTax.hasTax,
      taxRate: evaluatedTax.taxRate,
    } as any);
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
            Only the medication name is required to register. Pricing, stock quantity, and batch details can be added or updated later.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <p className="text-base font-semibold text-foreground">Medicine added successfully!</p>
            <p className="text-xs text-muted">"{form.drugName}" is now registered in the catalog.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Catalog Information Section */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-teal-400 uppercase">Catalog & Pricing</p>
                {/* Dynamic Tax Badge Indicator */}
                <Badge
                  className={`text-[11px] font-bold px-2.5 py-0.5 transition-all ${
                    taxStatus.hasTax
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {taxStatus.badgeLabel}
                  {taxStatus.hasTax ? " (15%)" : ""}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-foreground font-medium flex items-center justify-between">
                    <span>Drug / Brand Name</span>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase">Required</span>
                  </Label>
                  <Input placeholder="e.g. Amoxicillin 500mg or Vitamin C" value={form.drugName}
                    onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Generic Name <span className="text-[10px] text-slate-400">(Optional)</span></Label>
                  <Input placeholder="e.g. Amoxicillin" value={form.genericName}
                    onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Dosage / Strength <span className="text-[10px] text-slate-400">(Optional)</span></Label>
                  <Input placeholder="e.g. 500mg or 10ml" value={form.dosage}
                    onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-xs text-muted">Category</Label>
                  <CategorySelect value={form.category} onChange={handleCategoryChange} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Unit Price (ETB) <span className="text-[10px] text-slate-400">(Optional)</span></Label>
                  <Input type="number" min="0" step="0.01" placeholder="e.g. 2.50" value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted">Initial Quantity <span className="text-[10px] text-slate-400">(Optional)</span></Label>
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

            {form.category !== "cosmetics" && (
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
