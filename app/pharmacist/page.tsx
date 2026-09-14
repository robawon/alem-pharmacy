"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PrescriptionQueue } from "@/components/pharmacist/PrescriptionQueue";
import { InPersonOrderDialog } from "@/components/pharmacist/InPersonOrderDialog";
import { AddMedicineDialog } from "@/components/ui/AddMedicineDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { PrescriptionReviewModal } from "@/components/pharmacist/PrescriptionReviewModal";
import { CustomerPrescriptionUpload } from "@/lib/store";
import {
  Package, Phone, Mail, MapPin, FileText, User, Plus,
  CheckCircle2, Clock, Loader2, PackageCheck, FileSearch, MessageSquare, Package2,
  DollarSign, Pill, Bell, X, AlertTriangle, ShieldAlert,
} from "lucide-react";
import { currency, relativeTime } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  placed:            { label: "Order Placed",     color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  pharmacist_review: { label: "Needs Review",     color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  preparing:         { label: "Preparing",         color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  ready:             { label: "Ready for Pickup", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  completed:         { label: "Completed",         color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  cancelled:         { label: "Cancelled",         color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export default function PharmacistPage() {
  return (
    <AppShell requiredRole="pharmacist">
      <PharmacistContent />
    </AppShell>
  );
}

function PharmacistContent() {
  const { customerOrders, uploadedPrescriptions, updateCustomerOrderStatus, currentUser, inPersonOrders, cancelInPersonOrder, completedSales, inventory, prescriptions, dbReady } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [inPersonOrderDialogOpen, setInPersonOrderDialogOpen] = useState(false);
  const [addMedicineDialogOpen, setAddMedicineDialogOpen] = useState(false);
  const [reviewingUpload, setReviewingUpload] = useState<CustomerPrescriptionUpload | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; message: string; timestamp: string }[]>([]);

  // Live sales cards — only the current pharmacist's own sales
  const myOrderIds = inPersonOrders
    .filter((o) => o.createdBy === currentUser?.id)
    .map((o) => o.id);

  // In-person orders created by this pharmacist and completed
  const myCompletedOrders = inPersonOrders.filter(
    (o) => o.createdBy === currentUser?.id && o.status === "completed"
  );

  // Total meds sold by this pharmacist (sum of quantities in completed in-person orders)
  const myUnitsSold = myCompletedOrders.reduce(
    (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  // Total revenue made by this pharmacist
  const myRevenue = myCompletedOrders.reduce((sum, o) => sum + o.total, 0);

  // All orders needing pharmacist action (not yet ready/completed/cancelled)
  const pendingOrders = customerOrders.filter(
    (o) => o.status === "placed" || o.status === "pharmacist_review"
  );
  const preparingOrders = customerOrders.filter((o) => o.status === "preparing");
  const readyOrders = customerOrders.filter((o) => o.status === "ready");
  const completedOrders = customerOrders.filter((o) => o.status === "completed");
  const order = customerOrders.find((o) => o.id === selectedOrder);

  // Notify when a customer order is completed (cashier finished the receipt)
  const seenCompletedRef = useRef<Set<string>>(new Set(completedOrders.map((o) => o.id)));
  useEffect(() => {
    const newlyCompleted = completedOrders.filter((o) => !seenCompletedRef.current.has(o.id));
    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach((o) => seenCompletedRef.current.add(o.id));
      const newNotifs = newlyCompleted.map((o) => ({
        id: o.id,
        message: `Order for ${o.patientName} has been completed and receipt printed`,
        timestamp: o.updatedAt,
      }));
      setNotifications((prev) => [...newNotifs, ...prev]);
    }
  }, [completedOrders]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pharmacist Workstation</h1>
        <p className="text-sm text-muted">Pending prescription verification queue, customer orders with contact details, and dispensing workflows.</p>
      </div>

      {/* In-Person Order & Stock Management Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setInPersonOrderDialogOpen(true)}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus size={18} />
          Create In-Person Order
        </Button>
        <Button
          onClick={() => setAddMedicineDialogOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Package2 size={18} />
          Add Medicine to Stock
        </Button>
      </div>

      {/* Pharmacist Notifications */}
      {notifications.length > 0 && (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-300">{notif.message}</p>
                  <p className="text-xs text-muted">{relativeTime(notif.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My In-Person Orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-foreground">My In-Person Orders</CardTitle>
          </div>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-xs font-bold px-1.5">
            {inPersonOrders.filter(o => o.createdBy === currentUser?.id).length}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {inPersonOrders.filter(o => o.createdBy === currentUser?.id).length === 0 ? (
            <p className="text-sm text-muted text-center py-8">You haven&apos;t created any in-person orders yet.</p>
          ) : (
            inPersonOrders
              .filter(o => o.createdBy === currentUser?.id)
              .map((order) => {
                const cfg = order.status === "pending_cashier" ? { label: "Awaiting Cashier", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" } :
                            order.status === "ready_for_checkout" ? { label: "Ready for Checkout", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" } :
                            order.status === "completed" ? { label: "Completed", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" } :
                            { label: "Cancelled", color: "bg-red-500/20 text-red-300 border-red-500/30" };
                const canCancel = order.status === "pending_cashier" || order.status === "ready_for_checkout";
                return (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-container-high/40"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-teal-400" />
                        <p className="text-sm font-semibold text-foreground">{order.patientName}</p>
                      </div>
                      <p className="text-xs text-muted">
                        {order.items.map(i => `${i.drugName} x${i.quantity}`).join(", ")} · {currency(order.total)} · {relativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[11px] ${cfg.color}`}>{cfg.label}</Badge>
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInPersonOrder(order.id)}
                          className="h-7 text-xs border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 gap-1"
                          title="Cancel this order"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left: Rx Queue */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <PrescriptionQueue />

          {/* Customer Orders Inbox */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-foreground">Customer Orders Inbox</CardTitle>
              </div>
              {pendingOrders.length > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-xs font-bold px-1.5">
                  {pendingOrders.length}
                </span>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {customerOrders.filter(o => o.status !== "completed" && o.status !== "cancelled").length === 0 ? (
                <p className="text-sm text-muted text-center py-8">No active customer orders received yet.</p>
              ) : (
                customerOrders
                  .filter(o => o.status !== "completed" && o.status !== "cancelled")
                  .map((ord) => {
                  const cfg = STATUS_CONFIG[ord.status] ?? STATUS_CONFIG.placed;
                  return (
                    <div
                      key={ord.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-container-high/40 cursor-pointer hover:bg-surface-container-high transition-all"
                      onClick={() => setSelectedOrder(ord.id)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-teal-400" />
                          <p className="text-sm font-semibold text-foreground">{ord.patientName}</p>
                          {ord.isRx && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] py-0">Rx</Badge>}
                        </div>
                        <p className="text-xs text-muted">{ord.items.join(", ")} · {relativeTime(ord.createdAt)}</p>
                        {ord.contactInfo?.phone && (
                          <p className="text-xs text-teal-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />{ord.contactInfo.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-[11px] ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-foreground">Completed Orders</CardTitle>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-xs font-bold px-1.5">
                  {completedOrders.length}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {completedOrders.map((ord) => {
                  const cfg = STATUS_CONFIG[ord.status] ?? STATUS_CONFIG.completed;
                  return (
                    <div
                      key={ord.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-emerald-400" />
                          <p className="text-sm font-semibold text-foreground">{ord.patientName}</p>
                          {ord.isRx && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] py-0">Rx</Badge>}
                        </div>
                        <p className="text-xs text-muted">{ord.items.join(", ")} · {relativeTime(ord.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-[11px] ${cfg.color}`}>{cfg.label}</Badge>
                        <span className="text-[10px] text-muted">Receipt printed</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Uploaded Prescriptions */}
          {uploadedPrescriptions.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-foreground">Uploaded Rx Files ({uploadedPrescriptions.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {uploadedPrescriptions.map((rx) => (
                  <div key={rx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{rx.fileName}</p>
                        <p className="text-xs text-muted">Dr. {rx.doctorName}{rx.targetDrugName ? ` · ${rx.targetDrugName}` : ""} · Qty: {rx.requestedQuantity || 1}</p>
                        {rx.patientNotes && <p className="text-xs text-muted italic">"{rx.patientNotes}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                        onClick={() => setReviewingUpload(rx)}
                      >
                        <FileSearch className="h-3 w-3" /> Review Prescription
                      </Button>
                      <Badge className={`text-[10px] ${rx.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : rx.status === "rejected" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                        {rx.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Quick Stats */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* ── Live Sales Cards (this pharmacist only) ─────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-surface-container">
              <CardContent className="flex items-center gap-2.5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400"><Pill className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{myUnitsSold}</p>
                  <p className="text-[11px] text-muted">Meds Sold by Me</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-teal-500/30 bg-gradient-to-br from-teal-950/40 to-surface-container">
              <CardContent className="flex items-center gap-2.5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400"><DollarSign className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{currency(myRevenue)}</p>
                  <p className="text-[11px] text-muted">Revenue I Made</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-2.5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400"><Clock className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{pendingOrders.length}</p>
                  <p className="text-[11px] text-muted">Awaiting Review</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2.5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400"><Loader2 className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{preparingOrders.length}</p>
                  <p className="text-[11px] text-muted">Preparing</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2.5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400"><PackageCheck className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{readyOrders.length}</p>
                  <p className="text-[11px] text-muted">Ready / Cashier</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-2.5 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400"><FileText className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{uploadedPrescriptions.filter(r => r.status === "pending_review").length}</p>
                  <p className="text-[11px] text-muted">Rx Uploads</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-400" />
              Order Details — {order?.id}
            </DialogTitle>
          </DialogHeader>
          {order && (
            <div className="flex flex-col gap-4">
              {/* Items */}
              <div className="rounded-xl border border-border bg-surface-container-high/40 p-3.5">
                <p className="text-xs font-bold uppercase text-muted mb-2">Ordered Items</p>
                <div className="flex flex-wrap gap-1.5">
                  {order.items.map((item, i) => (
                    <span key={i} className="rounded-lg bg-surface-container-high px-2.5 py-1 text-xs font-medium text-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              {order.contactInfo && (
                <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-3.5 flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase text-teal-400 mb-1">Patient Contact Info</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted" /><span className="text-foreground font-medium">{order.contactInfo.fullName}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted" /><span className="text-foreground">{order.contactInfo.phone}</span></div>
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted" /><span className="text-foreground truncate">{order.contactInfo.email}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted" /><span className="text-foreground">{order.contactInfo.address}</span></div>
                  </div>
                  {order.contactInfo.notes && (
                    <div className="flex items-start gap-2 mt-1"><MessageSquare className="h-3.5 w-3.5 text-muted mt-0.5" /><span className="text-xs text-muted italic">"{order.contactInfo.notes}"</span></div>
                  )}
                </div>
              )}

              {/* Prescription File */}
              {order.prescriptionFileName && (
                <div className="flex items-center justify-between gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <FileText className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300">Attached Prescription File</p>
                      <p className="text-xs text-foreground mt-0.5">{order.prescriptionFileName}</p>
                      {order.prescriptionNotes && <p className="text-xs text-muted italic mt-0.5">"{order.prescriptionNotes}"</p>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shrink-0"
                    onClick={() => alert(`Opening prescription file:\nFile: ${order.prescriptionFileName}\nPatient Notes: ${order.prescriptionNotes || "None"}`)}
                  >
                    <FileSearch className="h-3.5 w-3.5" /> View File
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {(order.status === "placed" || order.status === "pharmacist_review") && (
                  <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex-1" onClick={() => { updateCustomerOrderStatus(order.id, "preparing"); setSelectedOrder(null); }}>
                    <CheckCircle2 className="h-4 w-4" /> Approve & Start Preparing
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm flex-1" onClick={() => { updateCustomerOrderStatus(order.id, "ready"); setSelectedOrder(null); }}>
                    <PackageCheck className="h-4 w-4" /> Mark Ready → Send to Cashier
                  </Button>
                )}
                {(order.status === "placed" || order.status === "pharmacist_review" || order.status === "preparing") && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { updateCustomerOrderStatus(order.id, "cancelled"); setSelectedOrder(null); }}>
                    Cancel Order
                  </Button>
                )}
                <Button variant="outline" className="gap-1.5 text-sm" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Prescription Review Modal */}
      <PrescriptionReviewModal
        upload={reviewingUpload}
        open={!!reviewingUpload}
        onClose={() => setReviewingUpload(null)}
      />
      {/* In-Person Order Dialog */}
      <InPersonOrderDialog open={inPersonOrderDialogOpen} onOpenChange={setInPersonOrderDialogOpen} />
      {/* Add Medicine to Stock Dialog */}
      <AddMedicineDialog open={addMedicineDialogOpen} onClose={() => setAddMedicineDialogOpen(false)} />
    </div>
  );
}
