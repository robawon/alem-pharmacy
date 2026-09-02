"use client";

import { useMemo, useState } from "react";
import { Search, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/utils";

function isExpired(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

function isLowStock(quantity: number, threshold: number): boolean {
  return quantity <= threshold;
}

export function StockTable() {
  const { inventory, disposeStock, removeStock } = useStore();
  const [query, setQuery] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const handleRemoveStock = (batchId: string) => {
    if (confirmRemoveId === batchId) {
      removeStock(batchId);
      setConfirmRemoveId(null);
    } else {
      setConfirmRemoveId(batchId);
      setTimeout(() => setConfirmRemoveId(null), 3000);
    }
  };

  const filtered = useMemo(
    () => inventory.filter((b) => b.drugName.toLowerCase().includes(query.toLowerCase().trim())),
    [inventory, query]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Filter by drug name…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Drug Name</TableHead>
            <TableHead>Batch Number</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Safety Threshold</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((batch) => {
            const expired = isExpired(batch.expiryDate);
            const low = isLowStock(batch.quantity, batch.safetyThreshold);
            return (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {batch.drugName}
                    {batch.quarantined && <Badge variant="destructive">Quarantined</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted">{batch.batchNumber}</TableCell>
                <TableCell>
                  <span className={expired ? "text-destructive" : undefined}>
                    {new Date(batch.expiryDate).toLocaleDateString()}
                  </span>
                  {expired && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Expired
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{batch.safetyThreshold}</TableCell>
                <TableCell>{currency(batch.unitPrice)}</TableCell>
                <TableCell>
                  <span className={low ? "font-semibold text-tertiary" : undefined}>{batch.quantity}</span>
                  {low && batch.quantity > 0 && (
                    <Badge variant="warning" className="ml-2">
                      Low stock
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={batch.quantity === 0}
                      onClick={() => disposeStock(batch.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Dispose
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleRemoveStock(batch.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmRemoveId === batch.id ? "Confirm?" : "Remove Drug"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted">
                No batches match this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
