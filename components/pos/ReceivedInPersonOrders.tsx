"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/utils";
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";

export function ReceivedInPersonOrders() {
  const { inPersonOrders, receiveInPersonOrder, completeInPersonOrder, cancelInPersonOrder } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancelNotification, setCancelNotification] = useState<string | null>(null);

  const handleCancelOrder = (orderId: string) => {
    cancelInPersonOrder(orderId);
    setExpandedOrderId(null);
    setCancelNotification(`Order ${orderId} was successfully cancelled.`);
    setTimeout(() => {
      setCancelNotification(null);
    }, 5000);
  };

  const pendingOrders = useMemo(() => {
    return inPersonOrders.filter(order => order.status === "pending_cashier");
  }, [inPersonOrders]);

  const receivedOrders = useMemo(() => {
    return inPersonOrders.filter(order => order.status === "ready_for_checkout");
  }, [inPersonOrders]);

  if (pendingOrders.length === 0 && receivedOrders.length === 0) {
    return (
      <div className="space-y-4">
        {cancelNotification && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-between animate-fade-in">
            <span>{cancelNotification}</span>
            <span className="text-xs text-red-300 font-mono">(Disappears in 5s)</span>
          </div>
        )}
        <Card className="p-8 text-center">
          <p className="text-gray-500">No in-person orders at this time</p>
        </Card>
      </div>
    );
  }

  const OrderCard = ({ orderId, patientName, items, subtotal, tax, total, status, isExpanded, onToggle, onReceive, onComplete, onCancel }: any) => (
    <Card className="mb-4 overflow-hidden border-l-4" style={{ borderLeftColor: status === "pending_cashier" ? "#fbbf24" : "#10b981" }}>
      <div
        className="p-4 bg-white cursor-pointer hover:bg-gray-50 flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">{patientName}</h3>
            <Badge variant={status === "pending_cashier" ? "warning" : "success"}>
              {status === "pending_cashier" ? "Awaiting Pickup" : "Ready for Checkout"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{items.length} item(s) • {currency(total)}</p>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t">
          {/* Items List */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Items:</h4>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.drugName}
                    {item.dosage && <span className="text-gray-500 ml-1">({item.dosage})</span>}
                  </span>
                  <span className="font-medium">
                    {item.quantity}x {currency(item.unitPrice)} = {currency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white p-3 rounded border space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{currency(subtotal)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Vitamin Tax (15%):</span>
                <span>{currency(tax)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-green-600">{currency(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {status === "pending_cashier" ? (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onReceive(orderId)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Receive Order
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(orderId)}
                >
                  <XCircle size={16} className="mr-2" />
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onComplete(orderId)}
              >
                <CheckCircle size={16} className="mr-2" />
                Complete & Checkout
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );

  const [paymentModalOrder, setPaymentModalOrder] = useState<any | null>(null);
  const [inPersonPaymentMethod, setInPersonPaymentMethod] = useState<"cash" | "mobile" | "other" | "">("");
  const [inPersonAmountTendered, setInPersonAmountTendered] = useState("");
  const [inPersonError, setInPersonError] = useState<string | null>(null);

  const handleOpenPaymentModal = (order: any) => {
    setPaymentModalOrder(order);
    setInPersonPaymentMethod("");
    setInPersonAmountTendered("");
    setInPersonError(null);
  };

  const handleConfirmInPersonCheckout = async () => {
    if (!paymentModalOrder) return;
    setInPersonError(null);

    if (!inPersonPaymentMethod) {
      setInPersonError("Please select a payment method before completing the checkout.");
      return;
    }

    if (inPersonPaymentMethod === "cash") {
      const tendered = parseFloat(inPersonAmountTendered);
      if (isNaN(tendered) || tendered < paymentModalOrder.total) {
        setInPersonError("Amount tendered is insufficient.");
        return;
      }
    }

    const tendered = inPersonPaymentMethod === "cash" ? parseFloat(inPersonAmountTendered) : paymentModalOrder.total;
    const change = inPersonPaymentMethod === "cash" ? Math.max(0, tendered - paymentModalOrder.total) : 0;

    const success = await completeInPersonOrder(paymentModalOrder.id, {
      paymentMethod: inPersonPaymentMethod as any,
      amountTendered: tendered,
      changeDue: change,
    });

    if (success) {
      setExpandedOrderId(null);
      setPaymentModalOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      {cancelNotification && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-between animate-fade-in">
          <span>{cancelNotification}</span>
          <span className="text-xs text-red-300 font-mono">(Disappears in 5s)</span>
        </div>
      )}
      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Pending Orders ({pendingOrders.length})</h2>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                orderId={order.id}
                patientName={order.patientName}
                items={order.items}
                subtotal={order.subtotal}
                tax={order.tax}
                total={order.total}
                status={order.status}
                isExpanded={expandedOrderId === order.id}
                onToggle={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                onReceive={() => {
                  receiveInPersonOrder(order.id);
                  setExpandedOrderId(null);
                }}
                onComplete={() => handleOpenPaymentModal(order)}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Received Orders Section */}
      {receivedOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Ready for Checkout ({receivedOrders.length})</h2>
          <div className="space-y-3">
            {receivedOrders.map(order => (
              <OrderCard
                key={order.id}
                orderId={order.id}
                patientName={order.patientName}
                items={order.items}
                subtotal={order.subtotal}
                tax={order.tax}
                total={order.total}
                status={order.status}
                isExpanded={expandedOrderId === order.id}
                onToggle={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                onReceive={() => {}}
                onComplete={() => handleOpenPaymentModal(order)}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment Selection Modal for In-Person Orders */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Checkout Payment — {paymentModalOrder.patientName}</h3>
            <p className="text-xs text-muted">Total Amount Due: <span className="font-bold text-emerald-400">{currency(paymentModalOrder.total)}</span></p>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted block">Select Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash" },
                  { id: "mobile", label: "Mobile Banking" },
                  { id: "other", label: "Other" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      inPersonPaymentMethod === item.id
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold"
                        : "border-border bg-surface-container text-muted hover:text-foreground"
                    }`}
                    onClick={() => {
                      setInPersonPaymentMethod(item.id as any);
                      setInPersonError(null);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {inPersonPaymentMethod === "cash" && (
                <div className="space-y-2 rounded-lg border border-border bg-slate-800/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-28">Amount Tendered</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-8 flex-1 rounded-md border border-border bg-slate-950 px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={inPersonAmountTendered}
                      onChange={(e) => {
                        setInPersonAmountTendered(e.target.value);
                        setInPersonError(null);
                      }}
                    />
                  </div>
                  {parseFloat(inPersonAmountTendered) >= paymentModalOrder.total ? (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted">Change Due:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {currency(parseFloat(inPersonAmountTendered) - paymentModalOrder.total)}
                      </span>
                    </div>
                  ) : inPersonAmountTendered !== "" ? (
                    <p className="text-xs text-rose-400 pt-1">Amount tendered is insufficient.</p>
                  ) : null}
                </div>
              )}

              {inPersonError && (
                <p className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-md">
                  {inPersonError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPaymentModalOrder(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={handleConfirmInPersonCheckout}>
                Confirm & Complete Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
