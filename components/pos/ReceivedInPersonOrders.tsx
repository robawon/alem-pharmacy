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

  // Per-order inline state for payment method selection directly on the card
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Record<string, "cash" | "mobile" | "other" | "">>({});
  const [amountsTendered, setAmountsTendered] = useState<Record<string, string>>({});
  const [orderErrors, setOrderErrors] = useState<Record<string, string | null>>({});

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

  const handleProcessOrder = async (order: any) => {
    const orderId = order.id;
    const method = selectedPaymentMethods[orderId];
    setOrderErrors((prev) => ({ ...prev, [orderId]: null }));

    if (!method) {
      setOrderErrors((prev) => ({
        ...prev,
        [orderId]: "Please select a payment method before approving the order.",
      }));
      return;
    }

    if (method === "cash") {
      const tendered = parseFloat(amountsTendered[orderId] || "");
      if (isNaN(tendered) || tendered < order.total) {
        setOrderErrors((prev) => ({
          ...prev,
          [orderId]: "Amount tendered is insufficient for cash payment.",
        }));
        return;
      }
    }

    const tendered = method === "cash" ? parseFloat(amountsTendered[orderId]) : order.total;
    const change = method === "cash" ? Math.max(0, tendered - order.total) : 0;

    const success = await completeInPersonOrder(orderId, {
      paymentMethod: method as any,
      amountTendered: tendered,
      changeDue: change,
    });

    if (success) {
      setExpandedOrderId(null);
      setSelectedPaymentMethods((prev) => ({ ...prev, [orderId]: "" }));
      setAmountsTendered((prev) => ({ ...prev, [orderId]: "" }));
      setOrderErrors((prev) => ({ ...prev, [orderId]: null }));
    }
  };

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

  const OrderCard = ({ order }: { order: any }) => {
    const isExpanded = expandedOrderId === order.id;
    const status = order.status;
    const orderId = order.id;
    const currentMethod = selectedPaymentMethods[orderId] || "";
    const currentTendered = amountsTendered[orderId] || "";
    const errorMsg = orderErrors[orderId];

    return (
      <Card className="mb-4 overflow-hidden border-l-4" style={{ borderLeftColor: status === "pending_cashier" ? "#fbbf24" : "#10b981" }}>
        <div
          className="p-4 bg-white cursor-pointer hover:bg-gray-50 flex items-center justify-between"
          onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">{order.patientName}</h3>
              <Badge variant={status === "pending_cashier" ? "warning" : "success"}>
                {status === "pending_cashier" ? "Awaiting Cashier Approval" : "Ready for Checkout"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{order.items.length} item(s) • {currency(order.total)}</p>
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
        </div>

        {isExpanded && (
          <div className="bg-gray-50 p-4 border-t">
            {/* Items List */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Items:</h4>
              <div className="space-y-2">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-700">
                    <span>
                      {item.drugName}
                      {item.dosage && <span className="text-gray-500 ml-1">({item.dosage})</span>}
                    </span>
                    <span className="font-medium text-gray-900">
                      {item.quantity}x {currency(item.unitPrice)} = {currency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white p-3 rounded border border-gray-200 space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal:</span>
                <span>{currency(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Vitamin Tax (15%):</span>
                  <span>{currency(order.tax)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Total:</span>
                <span className="text-emerald-600 font-mono text-base">{currency(order.total)}</span>
              </div>
            </div>

            {/* MANDATORY Payment Method Selector required before Receive/Approval */}
            <div className="bg-white p-4 rounded-lg border border-emerald-500/40 space-y-3 mb-4 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  1. Select Payment Method <span className="text-red-500">*</span>
                </label>
                {!currentMethod && (
                  <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Required before receiving
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash" },
                  { id: "mobile", label: "Mobile Banking" },
                  { id: "other", label: "Other" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      currentMethod === item.id
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30"
                        : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                    onClick={() => {
                      setSelectedPaymentMethods((prev) => ({ ...prev, [orderId]: item.id as any }));
                      setOrderErrors((prev) => ({ ...prev, [orderId]: null }));
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {currentMethod === "cash" && (
                <div className="mt-3 space-y-2 pt-3 border-t border-gray-100 bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 font-medium w-32">Amount Tendered:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-9 flex-1 rounded border border-gray-300 bg-white px-3 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={currentTendered}
                      onChange={(e) => {
                        setAmountsTendered((prev) => ({ ...prev, [orderId]: e.target.value }));
                        setOrderErrors((prev) => ({ ...prev, [orderId]: null }));
                      }}
                    />
                  </div>
                  {parseFloat(currentTendered) >= order.total ? (
                    <div className="flex items-center justify-between pt-1 text-xs font-semibold text-emerald-700">
                      <span>Change Due:</span>
                      <span className="font-bold font-mono text-sm">{currency(parseFloat(currentTendered) - order.total)}</span>
                    </div>
                  ) : currentTendered !== "" ? (
                    <p className="text-red-500 text-xs font-medium pt-1">Amount tendered is insufficient.</p>
                  ) : null}
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 p-2.5 rounded-md flex items-center gap-2">
                  <XCircle size={16} className="shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className={`flex-1 font-bold text-white transition-all ${
                  currentMethod
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                    : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-80"
                }`}
                onClick={() => handleProcessOrder(order)}
              >
                <CheckCircle size={16} className="mr-2" />
                {status === "pending_cashier" ? "Receive & Complete Order" : "Complete & Checkout"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancelOrder(orderId)}
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
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
          <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
            <span>Pending Pharmacist Orders</span>
            <Badge variant="warning">{pendingOrders.length}</Badge>
          </h2>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Received Orders Section */}
      {receivedOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
            <span>Ready for Checkout</span>
            <Badge variant="success">{receivedOrders.length}</Badge>
          </h2>
          <div className="space-y-3">
            {receivedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
