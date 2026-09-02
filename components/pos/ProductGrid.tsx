"use client";

import { useState } from "react";
import { PackagePlus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/utils";

export function ProductGrid() {
  const { inventory, addToCart } = useStore();
  const [query, setQuery] = useState("");

  const results = inventory.filter((b) =>
    b.drugName.toLowerCase().includes(query.toLowerCase().trim()) && b.quantity > 0 && !b.quarantined
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Scan barcode or search drug name…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((batch) => (
          <Card key={batch.id}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{batch.drugName}</p>
                {batch.quarantined && <Badge variant="destructive">Quarantined</Badge>}
              </div>
              <p className="text-xs text-muted">Batch {batch.batchNumber}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-base font-semibold">{currency(batch.unitPrice)}</span>
                <span className="text-xs text-muted">{batch.quantity} in stock</span>
              </div>
              <Button
                size="sm"
                className="mt-2 gap-2"
                onClick={() => addToCart(batch.id)}
              >
                <PackagePlus className="h-3.5 w-3.5" />
                Add / Scan Item
              </Button>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted">No matching products found.</p>
        )}
      </div>
    </div>
  );
}
