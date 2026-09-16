"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/utils";
import { Bell, CheckCircle, ChevronDown, ChevronUp, PackageCheck, ShoppingBag, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CashierNotificationsPage() {
  const {
    inPersonOrders,
    customerOrders,
    catalog,
    receiveInPersonOrder,
    completeInPersonOrder,
    cancelInPersonOrder,
    updateCustomerOrderStatus,
  } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const router = useRouter();

  // In-person orders from pharmacist
  const pendingInPersonOrders = useMemo(
    () => inPersonOrders.filter((order) => order.status === "pending_cashier"),
    [inPersonOrders]
  );

  const readyInPersonOrders = useMemo(
    () => inPersonOrders.filter((order) => order.status === "ready_for_checkout"),
    [inPersonOrders]
  );

  // Customer online orders approved/ready for pickup
  const readyOnlineOrders = useMemo(
    () => customerOrders.filter((order) => order.status === "ready"),
    [customerOrders]
  );

  const handleCompleteInPersonOrder = async (order: any) => {
    const completed = await completeInPersonOrder(order.id);
    if (!completed) return;
    setLastCompletedOrder(order);
    setExpandedOrderId(null);
    setReceiptOpen(true);
  };

  const handleCompleteOnlineOrder = (order: any) => {
    updateCustomerOrderStatus(order.id, "completed");

    // Construct receipt object for online customer order
    const itemDetails = order.items.map((itemName: string) => {
      const catItem = catalog.find((c) => c.drugName.toLowerCase() === itemName.toLowerCase());
      const unitPrice = catItem ? catItem.unitPrice : 50;
      return { drugName: itemName, quantity: 1, unitPrice };
    });

    const subtotal = itemDetails.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    setLastCompletedOrder({
      id: order.id,
      patientName: order.patientName || order.contactInfo?.fullName || "Online Customer",
      items: itemDetails,
      subtotal,
      tax,
      total,
      isOnline: true,
    });
    setExpandedOrderId(null);
    setReceiptOpen(true);
  };

  const totalNotifications = pendingInPersonOrders.length + readyInPersonOrders.length + readyOnlineOrders.length;

  if (totalNotifications === 0 && !receiptOpen) {
    return (
      <AppShell requiredRole="cashier">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-xl p-8 text-center border-slate-800 bg-slate-900/80">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-teal-400">
              <Bell className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-white">No active orders</h1>
            <p className="mt-2 text-sm text-slate-400">
              New in-person orders from pharmacists and approved online customer orders will appear here automatically.
            </p>
          </Card>
        </div>
      </AppShell>
    );
  }

  const renderInPersonOrderCard = (order: any) => {
    const isPending = order.status === "pending_cashier";
    const isExpanded = expandedOrderId === order.id;

    return (
      <Card key={order.id} className="mb-4 overflow-hidden border-l-4 border-l-amber-400 bg-slate-900/70 border-slate-800">
        <div
          className="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-slate-800/80"
          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-white">{order.patientName}</h2>
              <Badge className={isPending ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}>
                {isPending ? "Awaiting pickup" : "Ready for checkout"}
              </Badge>
              <Badge variant="default" className="text-[10px] text-slate-400 border-slate-700">In-Person</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">{order.items.length} item(s) • {currency(order.total)}</p>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
        </div>

        {isExpanded && (
          <div className="border-t border-slate-800 bg-slate-950/80 p-4">
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={`${order.id}-${idx}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                  <div>
                    <p className="font-medium">{item.drugName}</p>
                    {item.dosage && <p className="text-xs text-slate-400">{item.dosage}</p>}
                  </div>
                  <p className="font-medium text-slate-100">
                    {item.quantity} x {currency(item.unitPrice)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency(order.subtotal)}</span></div>
              <div className="mt-2 flex justify-between"><span>Tax (15%)</span><span>{currency(order.tax)}</span></div>
              <div className="mt-2 flex justify-between border-t border-slate-700 pt-2 font-semibold text-white"><span>Total</span><span>{currency(order.total)}</span></div>
            </div>

            <div className="mt-4 flex gap-2">
              {isPending ? (
                <>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => { receiveInPersonOrder(order.id); setExpandedOrderId(null); }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Receive Order
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-500/40 text-red-300 hover:bg-red-500/10" onClick={() => { cancelInPersonOrder(order.id); setExpandedOrderId(null); }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white" onClick={() => handleCompleteInPersonOrder(order)}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Complete & Checkout
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderOnlineOrderCard = (order: any) => {
    const isExpanded = expandedOrderId === order.id;

    return (
      <Card key={order.id} className="mb-4 overflow-hidden border-l-4 border-l-teal-400 bg-slate-900/70 border-slate-800">
        <div
          className="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-slate-800/80"
          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-white">{order.patientName || "Online Customer"}</h2>
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                Ready for Pickup
              </Badge>
              <Badge variant="default" className="text-[10px] text-teal-400 border-teal-500/30">Online Portal</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {order.items.length} item(s) • {order.isRx ? "Prescription Order" : "OTC Order"}
            </p>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
        </div>

        {isExpanded && (
          <div className="border-t border-slate-800 bg-slate-950/80 p-4">
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ordered Items</p>
              {order.items.map((itemName: string, idx: number) => {
                const catItem = catalog.find((c) => c.drugName.toLowerCase() === itemName.toLowerCase());
                const price = catItem ? catItem.unitPrice : 50;
                return (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                    <span>{itemName}</span>
                    <span className="font-medium text-slate-100">{currency(price)}</span>
                  </div>
                );
              })}
            </div>

            {order.contactInfo && (
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">Customer Contact Details:</p>
                <p>Phone: {order.contactInfo.phone || "N/A"}</p>
                {order.contactInfo.address && <p>Address: {order.contactInfo.address}</p>}
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white" onClick={() => handleCompleteOnlineOrder(order)}>
                <PackageCheck className="mr-2 h-4 w-4" />
                Complete Pickup & Checkout
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <AppShell requiredRole="cashier">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-400">Cashier Portal</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Pharmacist & Online Orders</h1>
          </div>
          <div className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-sm font-medium text-teal-300">
            {totalNotifications} total active
          </div>
        </div>

        {readyOnlineOrders.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-teal-300 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-teal-400" />
              Online Customer Portal Orders ({readyOnlineOrders.length})
            </h2>
            {readyOnlineOrders.map(renderOnlineOrderCard)}
          </div>
        )}

        {pendingInPersonOrders.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-amber-300">
              In-Person Orders - Awaiting Pickup ({pendingInPersonOrders.length})
            </h2>
            {pendingInPersonOrders.map(renderInPersonOrderCard)}
          </div>
        )}

        {readyInPersonOrders.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-emerald-300">
              In-Person Orders - Ready for Checkout ({readyInPersonOrders.length})
            </h2>
            {readyInPersonOrders.map(renderInPersonOrderCard)}
          </div>
        )}

        {/* Receipt Dialog */}
        {receiptOpen && lastCompletedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <Card className="w-full max-w-sm border-emerald-500/40 bg-slate-900 p-6 text-center shadow-2xl">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Sale Registered & Completed</h2>
              <p className="mt-1 text-xs text-slate-400">
                Receipt generated for {lastCompletedOrder.patientName} {lastCompletedOrder.isOnline ? "(Online Order)" : ""}
              </p>

              <div className="my-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-sm text-slate-200">
                <div className="space-y-1 mb-3">
                  {lastCompletedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{item.drugName} x{item.quantity}</span>
                      <span className="font-medium text-white">{currency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400 text-base">
                  <span>Total Paid</span>
                  <span>{currency(lastCompletedOrder.total)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4">✓ Stock automatically updated in database</p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" onClick={() => setReceiptOpen(false)}>
                Done & Print Receipt
              </Button>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
