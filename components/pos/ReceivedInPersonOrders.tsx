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

  const pendingOrders = useMemo(() => {
    return inPersonOrders.filter(order => order.status === "pending_cashier");
  }, [inPersonOrders]);

  const receivedOrders = useMemo(() => {
    return inPersonOrders.filter(order => order.status === "ready_for_checkout");
  }, [inPersonOrders]);

  if (pendingOrders.length === 0 && receivedOrders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No in-person orders at this time</p>
      </Card>
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
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (15%):</span>
              <span>{currency(tax)}</span>
            </div>
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

  return (
    <div className="space-y-6">
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
                onComplete={() => {
                  completeInPersonOrder(order.id);
                  setExpandedOrderId(null);
                }}
                onCancel={() => {
                  cancelInPersonOrder(order.id);
                  setExpandedOrderId(null);
                }}
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
                onComplete={() => {
                  completeInPersonOrder(order.id);
                  setExpandedOrderId(null);
                }}
                onCancel={() => {
                  cancelInPersonOrder(order.id);
                  setExpandedOrderId(null);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
