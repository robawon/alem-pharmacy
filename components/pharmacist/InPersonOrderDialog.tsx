"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { InPersonOrderItem } from "@/lib/types";
import { currency } from "@/lib/utils";
import { calculateTaxStatus } from "@/lib/tax";
import { Trash2, Tag } from "lucide-react";

interface InPersonOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InPersonOrderDialog({ open, onOpenChange }: InPersonOrderDialogProps) {
  const { inventory, createInPersonOrder } = useStore();
  const [patientName, setPatientName] = useState("");
  const [selectedItems, setSelectedItems] = useState<(InPersonOrderItem & { category?: string })[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState("");

  const selectedMedicine = useMemo(() => {
    if (!selectedMedicineId) return null;
    return inventory.find(b => b.id === selectedMedicineId);
  }, [selectedMedicineId, inventory]);

  const filteredMedicines = useMemo(() => {
    const query = medicineSearch.trim().toLowerCase();
    let base = inventory.filter(b => b.quantity > 0 && !b.quarantined);
    if (!query) return base;
    return base.filter(b =>
      b.drugName.toLowerCase().includes(query) ||
      b.batchNumber.toLowerCase().includes(query)
    );
  }, [inventory, medicineSearch]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [selectedItems]);

  const tax = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const taxRes = calculateTaxStatus(item.category, item.drugName);
      return acc + (item.unitPrice * item.quantity * taxRes.taxRate);
    }, 0);
  }, [selectedItems]);

  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleAddItem = () => {
    if (!selectedMedicine || !quantity || parseInt(quantity) <= 0) {
      alert("Please select a medicine and enter a valid quantity");
      return;
    }

    const requestedQty = parseInt(quantity);
    const existingItem = selectedItems.find(i => i.drugName === selectedMedicine.drugName);
    const currentQtyInOrder = existingItem ? existingItem.quantity : 0;
    const totalNewQty = currentQtyInOrder + requestedQty;

    if (totalNewQty > selectedMedicine.quantity) {
      alert(`Cannot add ${requestedQty} units. Only ${selectedMedicine.quantity} units are available in stock (${currentQtyInOrder} already added to order).`);
      return;
    }

    const newItem = {
      id: selectedMedicine.id,
      drugName: selectedMedicine.drugName,
      dosage: selectedMedicine.batchNumber ? `Batch: ${selectedMedicine.batchNumber}` : "",
      genericName: selectedMedicine.drugName,
      unitPrice: selectedMedicine.unitPrice,
      quantity: requestedQty,
      category: selectedMedicine.category,
    };

    setSelectedItems(prev => {
      const existing = prev.find(i => i.drugName === newItem.drugName);
      if (existing) {
        return prev.map(i => i.drugName === newItem.drugName ? { ...i, quantity: i.quantity + newItem.quantity } : i);
      }
      return [...prev, newItem];
    });

    setSelectedMedicineId("");
    setMedicineSearch("");
    setMedicineDropdownOpen(false);
    setQuantity("");
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert("Please add at least one medicine");
      return;
    }

    const created = await createInPersonOrder(patientName.trim() || "Walk-in Patient", selectedItems);
    if (!created) return;
    setPatientName("");
    setSelectedItems([]);
    setSelectedMedicineId("");
    setQuantity("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create In-Person Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medicine Selection */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold mb-3">Add Medicines</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <Label htmlFor="medicine">Select Medicine *</Label>
                <Input
                  id="medicine"
                  placeholder="Type to search medicine…"
                  value={medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value);
                    setMedicineDropdownOpen(true);
                    if (selectedMedicineId && selectedMedicineId !== e.target.value) {
                      setSelectedMedicineId("");
                    }
                  }}
                  onFocus={() => setMedicineDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setMedicineDropdownOpen(false), 150)}
                />
                {selectedMedicine && (
                  <div className="mt-1.5 flex items-center justify-between rounded-md bg-teal-500/10 border border-teal-500/30 px-2.5 py-1.5">
                    <span className="text-xs font-medium text-teal-300">
                      {selectedMedicine.drugName} ({selectedMedicine.batchNumber})
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedMedicineId(""); setMedicineSearch(""); }}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {medicineDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-xl max-h-48">
                    {filteredMedicines.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted">No available stock batches found.</div>
                    ) : (
                      filteredMedicines.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedMedicineId(item.id);
                            setMedicineSearch(item.drugName);
                            setMedicineDropdownOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-teal-50"
                        >
                          <span className="font-medium text-slate-800">
                            {item.drugName} ({item.batchNumber})
                          </span>
                          <span className="text-xs text-muted shrink-0">{currency(item.unitPrice)} • {item.quantity} in stock</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddItem} className="w-full">Add Item</Button>
              </div>
            </div>
          </div>

          {/* Selected Items Table */}
          {selectedItems.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Order Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.drugName}</div>
                          {item.dosage && <div className="text-xs text-gray-500">{item.dosage}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{currency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.quantity === 1 ? (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              title="Remove item"
                              className="flex h-6 w-6 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedItems((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
                                );
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface-container hover:bg-surface-container-highest"
                            >
                              -
                            </button>
                          )}
                          <span className="w-6 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const batch = inventory.find((b) => b.drugName.toLowerCase() === item.drugName.toLowerCase());
                              if (batch && item.quantity >= batch.quantity) {
                                alert(`Cannot add more than ${batch.quantity} units available in stock.`);
                                return;
                              }
                              setSelectedItems((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
                              );
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface-container hover:bg-surface-container-highest"
                          >
                            +
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{currency(item.unitPrice * item.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Order Summary */}
          {selectedItems.length > 0 && (
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{currency(subtotal)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Vitamin Tax (15%):</span>
                    <span>{currency(tax)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{currency(total)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
          >
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
