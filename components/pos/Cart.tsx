"use client";

import { useState } from "react";
import { Printer, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/utils";

export function Cart() {
  const { cart, removeFromCart, checkout } = useStore();
  const [lastReceiptTotal, setLastReceiptTotal] = useState<number | null>(null);

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  function handleCheckout() {
    setLastReceiptTotal(total);
    checkout();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Receipt className="h-4 w-4 text-primary-fixed-dim" />
        <CardTitle className="text-foreground">Active Transaction</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {cart.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Cart is empty — add items from the product grid.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {cart.map((item) => (
              <div key={item.batchId} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{item.drugName}</p>
                  <p className="text-xs text-muted">
                    {item.quantity} &times; {currency(item.unitPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{currency(item.unitPrice * item.quantity)}</span>
                  <button
                    onClick={() => removeFromCart(item.batchId)}
                    className="text-muted hover:text-destructive"
                    aria-label={`Remove ${item.drugName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>

        <Button className="w-full gap-2" disabled={cart.length === 0} onClick={handleCheckout}>
          <Printer className="h-4 w-4" />
          Complete Checkout &amp; Print
        </Button>

        {lastReceiptTotal !== null && cart.length === 0 && (
          <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
            🧾 Receipt printed — {currency(lastReceiptTotal)} charged. Inventory updated.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
