"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

const emptyForm = {
  drugName: "",
  genericName: "",
  dosage: "",
  category: "otc" as "otc" | "prescription" | "vitamins" | "first_aid",
  batchNumber: "",
  expiryDate: "",
  safetyThreshold: "",
  unitPrice: "",
  quantity: "",
};

export function ReceiveShipmentModal() {
  const { receiveShipment } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const isValid =
    form.drugName.trim() &&
    form.batchNumber.trim() &&
    form.expiryDate &&
    Number(form.safetyThreshold) > 0 &&
    Number(form.unitPrice) > 0 &&
    Number(form.quantity) > 0;

  function handleSubmit() {
    if (!isValid) return;
    receiveShipment({
      drugName: form.drugName.trim(),
      genericName: form.genericName,
      dosage: form.dosage,
      category: form.category,
      isRx: form.category === "prescription",
      batchNumber: form.batchNumber.trim(),
      expiryDate: form.expiryDate,
      safetyThreshold: Number(form.safetyThreshold),
      unitPrice: Number(form.unitPrice),
      quantity: Number(form.quantity),
    });
    setForm(emptyForm);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PackageCheck className="h-4 w-4" />
          Receive Shipment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Incoming Stock</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="drugName">Drug name</Label>
            <Input
              id="drugName"
              value={form.drugName}
              onChange={(e) => setForm({ ...form, drugName: e.target.value })}
              placeholder="e.g. Ceftriaxone 1g"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="batchNumber">Batch number</Label>
            <Input
              id="batchNumber"
              value={form.batchNumber}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              placeholder="CFT-2026-001"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="expiryDate">Expiry date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="safetyThreshold">Safety threshold</Label>
            <Input
              id="safetyThreshold"
              type="number"
              min={1}
              value={form.safetyThreshold}
              onChange={(e) => setForm({ ...form, safetyThreshold: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="unitPrice">Unit price (USD)</Label>
            <Input
              id="unitPrice"
              type="number"
              min={0.01}
              step={0.01}
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="quantity">Quantity received</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Record Shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
