"use client";

import { useEffect, useState } from "react";
import {
  Banknote, CheckCircle2, Clock, CreditCard, DollarSign, Minus,
  PackagePlus, PauseCircle, Percent, Plus, Printer, Receipt,
  Search, ShoppingCart, Smartphone, Trash2, TrendingUp, X,
  XCircle, Package, Phone, Mail, MapPin, User, MessageSquare,
  ArrowRight, Bell,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { currency, relativeTime } from "@/lib/utils";
import { CustomerOrder } from "@/lib/types";
import { ReceivedInPersonOrders } from "@/components/pos/ReceivedInPersonOrders";

export default function PosPage() {
  const store = useStore();

  // ─── Local UI state ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [rxInput, setRxInput] = useState("");
  const [parkDialogOpen, setParkDialogOpen] = useState(false);
  const [parkLabel, setParkLabel] = useState("");
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [resumeSheetOpen, setResumeSheetOpen] = useState(false);
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false);
  const [closingCashInput, setClosingCashInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ total: number; method: string; change: number; orderId?: string } | null>(null);
  const [rxError, setRxError] = useState("");
  const [selectedReadyOrder, setSelectedReadyOrder] = useState<CustomerOrder | null>(null);
  const [ordersSheetOpen, setOrdersSheetOpen] = useState(false);
  const [showInPersonOrders, setShowInPersonOrders] = useState(false);

  useEffect(() => {
    if (store.inPersonOrders.some((order) => order.status === "pending_cashier" || order.status === "ready_for_checkout")) {
      setShowInPersonOrders(true);
    }
  }, [store.inPersonOrders]);

  // ─── Derived KPIs (Today's Sales) ───────────────────────────────
  const todaySales = store.completedSales.filter((s) => {
    const date = new Date(s.timestamp);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  });
  const totalRevenue = todaySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const completedCount = todaySales.length;
  const parkedCount = store.parkedCarts.length;
  const atv = completedCount > 0 ? totalRevenue / completedCount : 0;

  // ─── Ready orders (pharmacist approved) ────────────────────────
  const readyOrders = store.customerOrders.filter(
    (o) => o.status === "ready"
  );

  // ─── Discount / Tax calculations ────────────────────────────────
  const subtotal = store.cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity, 0
  );
  const discountAmount = store.activeDiscount
    ? subtotal * (store.activeDiscount.percent / 100) : 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.08;
  const cartTotal = taxableAmount + tax;

  // ─── Category filter ────────────────────────────────────────────
  const categories = [
    "All",
    "Anti Diabetics",
    "Anti Biotic",
    "Anti Pain",
    "Anti Protozoal",
    "CNS Drugs",
    "CV",
    "Dermatology",
    "Eye-Ear & Nasal",
    "GI",
    "Hormonal Drug",
    "Medical Equipment",
    "Respiratory Drug",
    "Vitamin & Minerals",
    "Cosmetics",
  ];

  const categoryValueMap: Record<string, string> = {
    "Anti Diabetics": "anti_diabetics",
    "Anti Biotic": "anti_biotic",
    "Anti Pain": "anti_pain",
    "Anti Protozoal": "anti_protozal",
    "CNS Drugs": "cns_drugs",
    "CV": "cv",
    "Dermatology": "dermatology",
    "Eye-Ear & Nasal": "eye_ear_nasal",
    "GI": "gi",
    "Hormonal Drug": "hormonal_drug",
    "Medical Equipment": "medical_equipment",
    "Respiratory Drug": "respiratory_drug",
    "Vitamin & Minerals": "vitamins_minerals",
    "Cosmetics": "cosmetics",
  };

  const filteredInventory = store.inventory.filter((b) => {
    // Never show zero-stock or quarantined batches
    if (b.quantity <= 0 || b.quarantined) return false;
    const matchesSearch = b.drugName.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (activeCategory === "All") return true;

    const catItem = store.catalog.find(c => c.drugName.trim().toLowerCase() === b.drugName.trim().toLowerCase());
    const itemCat = b.category || catItem?.category;
    const targetCat = categoryValueMap[activeCategory];
    return itemCat === targetCat || itemCat === activeCategory;
  });

  // ─── Load a ready order into the POS cart ───────────────────────
  function handleLoadOrderToRegister(order: CustomerOrder) {
    // Clear current cart, then find each item by name in inventory and add it
    store.cancelSale(); // clears cart
    order.items.forEach((itemName) => {
      const batch = store.inventory.find(
        (b) => b.drugName.toLowerCase() === itemName.toLowerCase() && b.quantity > 0 && !b.quarantined
      );
      if (batch) store.addToCart(batch.id);
    });
    setSelectedReadyOrder(order);
    setOrdersSheetOpen(false);
  }

  // ─── Complete sale tied to a ready order ────────────────────────
  async function handleCompleteSale() {
    if (store.cart.length === 0) return;
    const tendered = paymentMethod === "cash" ? parseFloat(amountTendered) || 0 : cartTotal;
    const change = paymentMethod === "cash" ? Math.max(0, tendered - cartTotal) : 0;
    const itemsCopy = [...store.cart];
    const completed = await store.completeSale({
      items: itemsCopy,
      subtotal,
      discount: store.activeDiscount,
      discountAmount,
      tax,
      total: cartTotal,
      paymentMethod,
      amountTendered: tendered,
      changeDue: change,
    });
    if (!completed) return;

    // Mark the linked order as completed
    if (selectedReadyOrder) {
      store.updateCustomerOrderStatus(selectedReadyOrder.id, "completed");
    }
    setLastSale({
      total: cartTotal,
      subtotal,
      tax,
      method: paymentMethod,
      change,
      orderId: selectedReadyOrder?.id,
      items: itemsCopy,
      patientName: selectedReadyOrder?.patientName || "Walk-in Customer",
    } as any);
    setSelectedReadyOrder(null);
    setReceiptModalOpen(true);
    setAmountTendered("");
    setPaymentMethod("cash");
  }

  // ─── Other handlers (unchanged) ─────────────────────────────────
  function handleParkCart() {
    if (store.cart.length === 0) return;
    setParkLabel(`Cart #${store.parkedCarts.length + 1}`);
    setParkDialogOpen(true);
  }
  function confirmParkCart() { store.parkCart(parkLabel); setParkDialogOpen(false); }
  function handleResumeCart(cartId: string) { store.resumeCart(cartId); setResumeSheetOpen(false); }
  function handleApplyDiscount() {
    if (discountPercent <= 0 || discountPercent > 100 || !discountReason) return;
    store.applyDiscount({ percent: discountPercent, reason: discountReason });
    setDiscountDialogOpen(false);
    setDiscountPercent(0);
    setDiscountReason("");
  }
  function handleCancelSale() {
    store.cancelSale();
    setSelectedReadyOrder(null);
    setPaymentMethod("cash");
    setAmountTendered("");
  }
  function handleImportRx() {
    setRxError("");
    const rxId = rxInput.trim().toLowerCase();
    const rx = store.prescriptions.find((p) => p.id.toLowerCase() === rxId);
    if (!rx) { setRxError(`Prescription "${rxInput}" not found`); return; }
    if (rx.status !== "verified") { setRxError(`Prescription "${rxInput}" is ${rx.status} — only verified prescriptions can be imported`); return; }
    store.importRxToCart(rx.id);
    setRxInput("");
  }
  function handleCloseShift() {
    const closingCash = parseFloat(closingCashInput);
    if (isNaN(closingCash) || closingCash < 0) return;
    store.closeShift(closingCash);
    setCloseShiftDialogOpen(false);
    setClosingCashInput("");
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <AppShell requiredRole="cashier">
      <div className="flex flex-col gap-5">

        {/* ── Approved Orders Banner ────────────────────────────── */}
        {readyOrders.length > 0 && (
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-950/60 to-surface-container px-4 py-3 cursor-pointer hover:border-teal-400/60 transition-all"
            onClick={() => setOrdersSheetOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-300">
                  {readyOrders.length} order{readyOrders.length > 1 ? "s" : ""} approved by pharmacist — ready to process
                </p>
                <p className="text-xs text-muted">
                  Click to view and load into the register
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-500 text-slate-950 text-xs font-bold px-1.5">
                {readyOrders.length}
              </span>
              <ArrowRight className="h-4 w-4 text-teal-400" />
            </div>
          </div>
        )}

        {/* ── In-Person Pharmacist Orders Alert Banner ────────────── */}
        {store.inPersonOrders.some((o) => o.status === "pending_cashier" || o.status === "ready_for_checkout") && (
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-surface-container px-4 py-3 cursor-pointer hover:border-amber-400/60 transition-all animate-pulse"
            onClick={() => setShowInPersonOrders(true)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                <Bell className="h-4 w-4 animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  {store.inPersonOrders.filter((o) => o.status === "pending_cashier" || o.status === "ready_for_checkout").length} In-Person Order(s) Received from Pharmacist
                </p>
                <p className="text-xs text-amber-200/70">
                  Pharmacist sent prescription orders to cashier for immediate checkout
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-xs font-bold px-1.5">
                {store.inPersonOrders.filter((o) => o.status === "pending_cashier" || o.status === "ready_for_checkout").length}
              </span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </div>
          </div>
        )}

        {/* ── In-Person Orders Section ──────────────────────────── */}
        {store.inPersonOrders.length > 0 && (
          <div className="border-t pt-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">In-Person Orders from Pharmacist</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInPersonOrders(!showInPersonOrders)}
              >
                {showInPersonOrders ? "Hide" : "Show"} ({store.inPersonOrders.length})
              </Button>
            </div>
            {showInPersonOrders && <ReceivedInPersonOrders />}
          </div>
        )}

        {/* ── Active Order Badge (if loaded) ───────────────────── */}
        {selectedReadyOrder && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-semibold">Processing order for:</span>
              <span className="text-foreground font-medium">{selectedReadyOrder.patientName}</span>
              {selectedReadyOrder.contactInfo?.phone && (
                <span className="text-muted flex items-center gap-1">
                  <Phone className="h-3 w-3" />{selectedReadyOrder.contactInfo.phone}
                </span>
              )}
            </div>
            <button onClick={() => setSelectedReadyOrder(null)} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Section 1: Live Shift Analytics KPI Cards ─────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-emerald-900/20 to-surface-container p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-extrabold text-foreground">{currency(totalRevenue)}</p>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">Total Shift Sales</p>
                <p className="text-[10px] text-muted">Revenue collected today</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/50 via-teal-900/20 to-surface-container p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-extrabold text-foreground">{completedCount}</p>
                <p className="text-xs font-semibold text-teal-400 mt-0.5">Completed Transactions</p>
                <p className="text-[10px] text-muted">Shift volume count</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-amber-900/20 to-surface-container p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-extrabold text-foreground">{readyOrders.length}</p>
                <p className="text-xs font-semibold text-amber-400 mt-0.5">Approved Orders</p>
                <p className="text-[10px] text-muted">Ready for payment</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-blue-900/20 to-surface-container p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-extrabold text-foreground">{currency(atv)}</p>
                <p className="text-xs font-semibold text-blue-400 mt-0.5">Avg Ticket Value</p>
                <p className="text-[10px] text-muted">Avg basket spend</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Command Header ─────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-container p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Rx ID (e.g. rx_001)"
              className="h-9 w-44"
              value={rxInput}
              onChange={(e) => setRxInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImportRx()}
            />
            <Button size="sm" onClick={handleImportRx}>Import Verified Rx</Button>
          </div>
          {rxError && <p className="text-xs text-destructive">{rxError}</p>}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">Opening float: {currency(store.shiftOpenFloat)}</span>
            <Button variant="outline" size="sm" onClick={() => setCloseShiftDialogOpen(true)}>
              <Clock className="mr-1.5 h-3.5 w-3.5" />Close Shift / Reconcile
            </Button>
          </div>
        </div>

        {/* ── Section 3: Split-Screen POS Layout ───────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          {/* Left: Product Catalog */}
          <div className="flex flex-col gap-4 xl:col-span-3">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search by Drug Name, Generic Name, or Barcode…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? "primary" : "default"}
                    className="cursor-pointer select-none"
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredInventory
                .filter((batch) => batch.quantity > 0 && !batch.quarantined)
                .map((batch) => {
                const lowStock = batch.quantity <= batch.safetyThreshold;
                return (
                  <Card key={batch.id}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{batch.drugName}</p>
                      </div>
                      <p className="text-xs text-muted">Batch {batch.batchNumber}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-base font-semibold">{currency(batch.unitPrice)}</span>
                        <span className={`text-xs ${lowStock ? "font-medium text-destructive" : "text-muted"}`}>
                          {batch.quantity} in stock
                        </span>
                      </div>
                      <Button size="sm" className="mt-2 gap-1.5" onClick={() => store.addToCart(batch.id)}>
                        <PackagePlus className="h-3.5 w-3.5" />Add
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredInventory.filter((batch) => batch.quantity > 0 && !batch.quarantined).length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-muted">No in-stock products found.</p>
              )}
            </div>
          </div>

          {/* Right: Active Cart & Register */}
          <div className="flex flex-col gap-4 xl:col-span-2">
            <Card className="flex flex-1 flex-col">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
                <ShoppingCart className="h-4 w-4 text-primary-fixed-dim" />
                <CardTitle className="text-foreground">Active Transaction</CardTitle>
                {store.activeDiscount && (
                  <Badge variant="warning" className="ml-auto text-[10px]">
                    -{store.activeDiscount.percent}% off
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {store.cart.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted">Cart is empty — add items from the product grid or load an approved order.</p>
                    {readyOrders.length > 0 && (
                      <Button variant="outline" size="sm" className="mt-3 gap-1.5 border-teal-500/40 text-teal-400 hover:bg-teal-500/10" onClick={() => setOrdersSheetOpen(true)}>
                        <Package className="h-3.5 w-3.5" />Load Approved Order ({readyOrders.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border">
                    {store.cart.map((item) => (
                      <div key={item.batchId} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.drugName}</p>
                          <p className="text-xs text-muted">{currency(item.unitPrice)} ea</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.quantity === 1 ? (
                            <button
                              onClick={() => store.removeFromCart(item.batchId)}
                              title="Remove item"
                              className="flex h-6 w-6 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => store.updateCartQty(item.batchId, -1)}
                              className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted hover:bg-surface-container-high hover:text-foreground"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const batch = store.inventory.find(b => b.id === item.batchId);
                              if (batch && item.quantity >= batch.quantity) {
                                alert(`Cannot add more than ${batch.quantity} units. Only ${batch.quantity} available in stock.`);
                                return;
                              }
                              store.updateCartQty(item.batchId, 1);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted hover:bg-surface-container-high hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-16 text-right font-medium">{currency(item.unitPrice * item.quantity)}</span>
                        {item.quantity > 1 && (
                          <button onClick={() => store.removeFromCart(item.batchId)} title="Remove all" className="text-muted hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {store.cart.length > 0 && (
                  <>
                    <div className="mt-auto space-y-1.5 border-t border-border pt-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{currency(subtotal)}</span></div>
                      {store.activeDiscount && (
                        <div className="flex justify-between text-tertiary">
                          <span>Discount ({store.activeDiscount.percent}% — {store.activeDiscount.reason})</span>
                          <span>-{currency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between"><span className="text-muted">Tax (8%)</span><span>{currency(tax)}</span></div>
                      <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold">
                        <span>Total</span><span>{currency(cartTotal)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={handleParkCart}>
                        <PauseCircle className="mr-1.5 h-3.5 w-3.5" />Park / Hold
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setResumeSheetOpen(true)} disabled={store.parkedCarts.length === 0}>
                        <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Resume ({store.parkedCarts.length})
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDiscountDialogOpen(true)}>
                        <Percent className="mr-1.5 h-3.5 w-3.5" />Discount
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/15" onClick={handleCancelSale}>
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />Cancel
                      </Button>
                    </div>

                    <div className="space-y-3 border-t border-border pt-3">
                      <div className="flex gap-1 rounded-lg border border-border bg-surface-container p-1">
                        {(["cash", "card", "mobile"] as const).map((method) => (
                          <button
                            key={method}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${paymentMethod === method ? "bg-primary text-on-primary shadow-sm" : "text-muted hover:text-foreground"}`}
                            onClick={() => setPaymentMethod(method)}
                          >
                            {method === "cash" && <Banknote className="h-3.5 w-3.5" />}
                            {method === "card" && <CreditCard className="h-3.5 w-3.5" />}
                            {method === "mobile" && <Smartphone className="h-3.5 w-3.5" />}
                            {method === "cash" ? "Cash" : method === "card" ? "Card" : "Mobile"}
                          </button>
                        ))}
                      </div>
                      {paymentMethod === "cash" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted w-28">Amount Tendered</span>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" className="h-8 flex-1" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} />
                          </div>
                          {parseFloat(amountTendered) >= cartTotal && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted w-28">Change Due</span>
                              <span className="text-base font-bold text-success">{currency(parseFloat(amountTendered) - cartTotal)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Button className="mt-2 w-full gap-2" disabled={store.cart.length === 0} onClick={handleCompleteSale}>
                  <Printer className="h-4 w-4" />
                  {selectedReadyOrder ? `Complete & Mark Order Done` : "Complete Sale & Print"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Approved Orders Sheet ─────────────────────────────────── */}
      <Sheet open={ordersSheetOpen} onOpenChange={setOrdersSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-400" />
              Pharmacist-Approved Orders
            </SheetTitle>
            <SheetDescription>
              These orders have been reviewed and approved by the pharmacist. Load one into the register to process payment.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 flex flex-col gap-3">
            {readyOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No approved orders waiting.</p>
            ) : (
              readyOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-teal-400" />
                        <p className="text-sm font-semibold text-foreground">{order.patientName}</p>
                        {order.isRx && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] py-0">Rx</Badge>}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{order.items.join(", ")}</p>
                    </div>
                    <span className="text-[10px] text-muted shrink-0">{relativeTime(order.createdAt)}</span>
                  </div>
                  {order.contactInfo && (
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {order.contactInfo.phone && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <Phone className="h-3 w-3 text-teal-400" />
                          <span>{order.contactInfo.phone}</span>
                        </div>
                      )}
                      {order.contactInfo.email && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <Mail className="h-3 w-3 text-teal-400" />
                          <span className="truncate">{order.contactInfo.email}</span>
                        </div>
                      )}
                      {order.contactInfo.address && (
                        <div className="flex items-center gap-1.5 text-muted col-span-2">
                          <MapPin className="h-3 w-3 text-teal-400" />
                          <span>{order.contactInfo.address}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => handleLoadOrderToRegister(order)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Load to Register
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Park Cart Dialog ───────────────────────────────────────── */}
      <Dialog open={parkDialogOpen} onOpenChange={setParkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Park / Hold Cart</DialogTitle>
            <DialogDescription>Give this cart a label so you can identify it later.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input placeholder="e.g. Cart #1, Walk-in Customer" value={parkLabel} onChange={(e) => setParkLabel(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={confirmParkCart}>Park Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Discount Dialog ────────────────────────────────────────── */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Enter discount percentage and select a reason.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-2">
              <Input type="number" min="1" max="100" placeholder="Discount %" className="w-28" value={discountPercent || ""} onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)} />
              <span className="text-sm text-muted">percent</span>
            </div>
            <Select value={discountReason} onValueChange={setDiscountReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Senior Citizen">Senior Citizen</SelectItem>
                <SelectItem value="Damaged Outer Box">Damaged Outer Box</SelectItem>
                <SelectItem value="Loyalty Program">Loyalty Program</SelectItem>
                <SelectItem value="Promotional Offer">Promotional Offer</SelectItem>
                <SelectItem value="Staff Discount">Staff Discount</SelectItem>
                <SelectItem value="Insurance Adjustment">Insurance Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleApplyDiscount} disabled={!discountPercent || !discountReason}>Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Resume Cart Sheet ──────────────────────────────────────── */}
      <Sheet open={resumeSheetOpen} onOpenChange={setResumeSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Resume Parked Cart</SheetTitle>
            <SheetDescription>Select a previously parked cart to restore to the active register.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-2">
            {store.parkedCarts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No parked carts.</p>
            ) : (
              store.parkedCarts.map((pc) => {
                const pcTotal = pc.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
                return (
                  <Card key={pc.id} className="cursor-pointer transition-colors hover:bg-surface-container-high" onClick={() => handleResumeCart(pc.id)}>
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{pc.label}</p>
                        <p className="text-xs text-muted">{pc.items.length} item(s) — {currency(pcTotal)}</p>
                      </div>
                      <Button size="sm" variant="outline"><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Resume</Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Close Shift Dialog ─────────────────────────────────────── */}
      <Dialog open={closeShiftDialogOpen} onOpenChange={setCloseShiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Shift / Reconcile Drawer</DialogTitle>
            <DialogDescription>Enter the closing cash balance to reconcile the drawer.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex justify-between text-sm"><span className="text-muted">Opening Float</span><span className="font-medium">{currency(store.shiftOpenFloat)}</span></div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total Cash Sales</span>
              <span className="font-medium">{currency(store.completedSales.filter((s) => s.paymentMethod === "cash").reduce((sum, s) => sum + s.total, 0))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted w-28">Closing Cash</span>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={closingCashInput} onChange={(e) => setClosingCashInput(e.target.value)} />
            </div>
            {closingCashInput && (
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted">Variance</span>
                <span className={`font-medium ${parseFloat(closingCashInput) - (store.shiftOpenFloat + store.completedSales.filter((s) => s.paymentMethod === "cash").reduce((sum, s) => sum + s.total, 0)) >= 0 ? "text-success" : "text-destructive"}`}>
                  {currency(parseFloat(closingCashInput) - (store.shiftOpenFloat + store.completedSales.filter((s) => s.paymentMethod === "cash").reduce((sum, s) => sum + s.total, 0)))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCloseShift} disabled={!closingCashInput}>Confirm Close Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Receipt Modal ──────────────────────────────────────────── */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">🧾 Alem Pharmacy Receipt</DialogTitle>
            <DialogDescription className="text-center">Sale Registered & Completed</DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex justify-between text-xs text-muted border-b border-border pb-2">
                <span>Customer: {(lastSale as any).patientName}</span>
                <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {/* Line items */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(lastSale as any).items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs text-foreground/90">
                    <span>{item.drugName} x{item.quantity}</span>
                    <span className="font-medium">{currency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="rounded-lg border border-border bg-surface-container-high p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{currency((lastSale as any).subtotal || lastSale.total)}</span>
                </div>
                {(lastSale as any).tax > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Tax</span>
                    <span>{currency((lastSale as any).tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground border-t border-border/70 pt-1.5">
                  <span>Total Paid</span>
                  <span className="text-emerald-400">{currency(lastSale.total)}</span>
                </div>
                <div className="flex justify-between text-muted pt-1 text-[11px] capitalize">
                  <span>Payment Method</span>
                  <span>{lastSale.method}</span>
                </div>
                {lastSale.change > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-400 text-xs pt-1">
                    <span>Change Due</span>
                    <span>{currency(lastSale.change)}</span>
                  </div>
                )}
              </div>

              {lastSale.orderId && (
                <p className="text-xs text-center text-teal-400 font-medium">
                  ✓ Online Customer Order Marked as Completed
                </p>
              )}
              <p className="text-[11px] text-center text-muted">
                ✓ Inventory deducted & sale logged in database.
              </p>
            </div>
          )}
          <DialogFooter className="justify-center">
            <DialogClose asChild><Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">Done & Print Receipt</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
