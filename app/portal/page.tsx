"use client";

import { useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { CatalogItem, DrugCategory } from "@/lib/types";
import { currency, relativeTime } from "@/lib/utils";
import { uploadPrescriptionImage } from "@/lib/db";
import {
  Pill,
  FileSearch,
  PackageCheck,
  Repeat,
  Search,
  Shield,
  Upload,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  X,
  CloudUpload,
  FileText,
  ChevronRight,
  Sparkles,
  Heart,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_FILTERS: { label: string; value: DrugCategory | "all" }[] = [
  { label: "All Categories", value: "all" },
  { label: "Anti Diabetics", value: "anti_diabetics" },
  { label: "Anti Biotic", value: "anti_biotic" },
  { label: "Anti Pain", value: "anti_pain" },
  { label: "Anti Protozoal", value: "anti_protozal" },
  { label: "CNS Drugs", value: "cns_drugs" },
  { label: "CV", value: "cv" },
  { label: "Dermatology", value: "dermatology" },
  { label: "Eye-Ear & Nasal Prep", value: "eye_ear_nasal" },
  { label: "GI", value: "gi" },
  { label: "Hormonal Drug", value: "hormonal_drug" },
  { label: "Medical Equipment", value: "medical_equipment" },
  { label: "Respiratory Drug", value: "respiratory_drug" },
  { label: "Vitamin & Minerals", value: "vitamins_minerals" },
  { label: "Cosmetics", value: "cosmetics" },
];

const CATEGORY_COLORS: Record<DrugCategory | "all", string> = {
  all: "border-primary/30 bg-primary/10 text-primary-fixed-dim",
  anti_diabetics: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  anti_biotic: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  anti_pain: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  anti_protozal: "border-red-400/30 bg-red-500/10 text-red-300",
  cns_drugs: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300",
  cv: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  dermatology: "border-pink-400/30 bg-pink-500/10 text-pink-300",
  eye_ear_nasal: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
  gi: "border-orange-400/30 bg-orange-500/10 text-orange-300",
  hormonal_drug: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  medical_equipment: "border-slate-400/30 bg-slate-500/10 text-slate-300",
  respiratory_drug: "border-teal-400/30 bg-teal-500/10 text-teal-300",
  vitamins_minerals: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  cosmetics: "border-success/30 bg-success/10 text-success",
};

const ORDER_STEPS = [
  { key: "placed", label: "Order Placed", icon: CheckCircle2 },
  { key: "pharmacist_review", label: "Pharmacist Review", icon: FileSearch },
  { key: "preparing", label: "Preparing Order", icon: Loader2 },
  { key: "ready", label: "Ready for Pickup", icon: PackageCheck },
] as const;

const STATUS_ORDER_INDEX: Record<string, number> = {
  placed: 0,
  pharmacist_review: 1,
  preparing: 2,
  ready: 3,
  completed: 3,
  cancelled: -1,
};

// ─── Main Page Export ───────────────────────────────────────────────────────

export default function PortalPage() {
  return (
    <AppShell requiredRole="customer">
      <PortalContent />
    </AppShell>
  );
}

// ─── Portal Content ─────────────────────────────────────────────────────────

function PortalContent() {
  const {
    currentUser,
    catalog,
    customerCart,
    customerOrders,
    uploadedPrescriptions,
    addToCustomerCart,
    removeFromCustomerCart,
    updateCustomerCartQty,
    placeCustomerOrder,
    uploadCustomerPrescription,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DrugCategory | "all">("all");
  const [rxUploadOpen, setRxUploadOpen] = useState(false);
  const [rxUploadTarget, setRxUploadTarget] = useState<string | undefined>(undefined);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlacedAnim, setOrderPlacedAnim] = useState(false);

  // ── KPI calculations ────────────────────────────────────────────────────
  const totalInStock = catalog.filter((c) => c.inStock).length;
  const prescriptionsUnderReview = uploadedPrescriptions.filter(
    (u) => u.status === "pending_review"
  ).length;
  const ordersReady = customerOrders.filter(
    (o) => o.status === "ready" || o.status === "placed" || o.status === "preparing"
  ).length;
  const savedRx = uploadedPrescriptions.filter((u) => u.status === "approved").length;

  // ── Filtered catalog ───────────────────────────────────────────────────
  const filteredCatalog = catalog.filter((item) => {
    const inStock = item.inStock && Number(item.quantity) > 0;
    const matchesCategory = activeFilter === "all" || item.category === activeFilter;
    const matchesSearch =
      item.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    return inStock && matchesCategory && matchesSearch;
  });

  // ── Cart total ─────────────────────────────────────────────────────────
  const cartSubtotal = customerCart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );
  const cartCount = customerCart.reduce((acc, i) => acc + i.quantity, 0);

  const handleOpenRxUpload = useCallback((drugName?: string) => {
    setRxUploadTarget(drugName);
    setRxUploadOpen(true);
  }, []);

  const handlePlaceOrder = useCallback((contactInfo: { fullName: string; phone: string; email: string; address: string; notes: string }) => {
    placeCustomerOrder(contactInfo);
    setOrderPlacedAnim(true);
    setCartOpen(false);
    setTimeout(() => setOrderPlacedAnim(false), 3000);
  }, [placeCustomerOrder]);

  const mostRecentOrder = customerOrders[0] ?? null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary-fixed-dim" />
            <span className="text-xs font-medium tracking-widest uppercase text-primary-fixed-dim">
              Patient Portal
            </span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-fixed-dim via-secondary to-tertiary bg-clip-text text-transparent">
            Welcome back, {currentUser?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Browse medications, upload prescriptions, and track your orders — all in one place.
          </p>
        </div>
        <Button
          onClick={() => setCartOpen(true)}
          className="relative gap-2 bg-primary/20 border border-primary/40 text-primary-fixed-dim hover:bg-primary/30"
        >
          <ShoppingCart className="h-4 w-4" />
          My Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary text-[10px] font-bold">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Order placed banner ─────────────────────────────────────────── */}
      {orderPlacedAnim && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            Order placed successfully! The pharmacy team has been notified.
          </p>
        </div>
      )}

      {/* ── Section 1: KPI Cards ─────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Available Medications"
            value={totalInStock}
            subtext="In-stock and ready for order"
            icon={Pill}
            iconBg="bg-teal-500/20 border-teal-400/30 text-teal-300"
            glowClass="glow-teal"
            gradient="from-teal-950/40 via-teal-900/20 to-surface-container"
          />
          <KpiCard
            label="Prescriptions Under Review"
            value={prescriptionsUnderReview}
            subtext="Awaiting clinical approval"
            icon={FileSearch}
            iconBg="bg-amber-500/20 border-amber-400/30 text-amber-300"
            glowClass="glow-amber"
            gradient="from-amber-950/40 via-amber-900/20 to-surface-container"
          />
          <KpiCard
            label="Active Orders"
            value={ordersReady}
            subtext="Processing or ready for pickup"
            icon={PackageCheck}
            iconBg="bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
            glowClass="glow-emerald"
            gradient="from-emerald-950/40 via-emerald-900/20 to-surface-container"
          />
          <KpiCard
            label="Saved Prescriptions"
            value={savedRx}
            subtext="Verified Rx on file"
            icon={Heart}
            iconBg="bg-blue-500/20 border-blue-400/30 text-blue-300"
            glowClass="glow-blue"
            gradient="from-blue-950/40 via-blue-900/20 to-surface-container"
          />
        </div>
      </section>

      {/* ── Section 2 + 4 layout: Catalog + Order Tracking ─────────────── */}
      <div className="flex gap-6">
        {/* Left: Catalog */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* ── Section 2: Medication Catalog ──────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Medication Catalog
              </h2>
              <span className="text-xs text-muted">
                {filteredCatalog.length} product{filteredCatalog.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search by drug name or generic name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-surface-container border-border"
              />
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-all duration-150 ${
                    activeFilter === f.value
                      ? CATEGORY_COLORS[f.value] + " shadow-sm"
                      : "border-border/50 bg-surface-container text-muted hover:border-border hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            {filteredCatalog.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-muted">
                <Search className="h-8 w-8 opacity-30" />
                <p className="text-sm">No medications match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCatalog.map((item) => (
                  <MedicationCard
                    key={item.id}
                    item={item}
                    onAddToCart={addToCustomerCart}
                    onUploadRx={handleOpenRxUpload}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Section 3: Prescription Upload Widget ──────────────────── */}
          <section>
            <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-transparent p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
                  <Upload className="h-6 w-6 text-purple-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">Upload a Prescription</h3>
                  <p className="text-sm text-muted mt-0.5">
                    Have a doctor's prescription? Submit it securely for pharmacist review so we can
                    dispense your medication.
                  </p>
                  <Button
                    className="mt-3 gap-2 bg-purple-600/80 hover:bg-purple-500/90 text-white border border-purple-400/30"
                    onClick={() => handleOpenRxUpload()}
                  >
                    <CloudUpload className="h-4 w-4" />
                    Upload Prescription Document
                  </Button>
                </div>
              </div>

              {/* Uploaded Rx list */}
              {uploadedPrescriptions.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Your Submissions
                  </p>
                  {uploadedPrescriptions.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-container/60 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-300 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{upload.fileName}</p>
                          <p className="text-xs text-muted">
                            Dr. {upload.doctorName}
                            {upload.targetDrugName ? ` · ${upload.targetDrugName}` : ""}
                            {" · "}
                            {relativeTime(upload.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          upload.status === "approved"
                            ? "success"
                            : upload.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {upload.status === "pending_review"
                          ? "Pending Review"
                          : upload.status === "approved"
                          ? "Approved"
                          : "Rejected"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Order Tracking Panel */}
        <aside className="hidden xl:flex flex-col gap-5 w-80 shrink-0">
          <OrderTrackingPanel order={mostRecentOrder} />
        </aside>
      </div>

      {/* ── Prescription Upload Dialog ───────────────────────────────────── */}
      <PrescriptionUploadDialog
        open={rxUploadOpen}
        targetDrugName={rxUploadTarget}
        onClose={() => setRxUploadOpen(false)}
        onSubmit={(data) => {
          uploadCustomerPrescription(data);
          setRxUploadOpen(false);
          setCartOpen(true);
        }}
      />

      {/* ── Cart Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md border-border bg-surface-container p-0 flex flex-col">
          <CartPanel
            cart={customerCart}
            subtotal={cartSubtotal}
            onRemove={removeFromCustomerCart}
            onUpdateQty={updateCustomerCartQty}
            onPlaceOrder={handlePlaceOrder}
            onOpenRxUpload={handleOpenRxUpload}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ElementType;
  iconBg: string;
  glowClass?: string;
  gradient: string;
}

function KpiCard({ label, value, subtext, icon: Icon, iconBg, glowClass, gradient }: KpiCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${glowClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-4xl font-extrabold text-foreground">{value}</p>
          <p className="mt-1 text-xs font-medium text-muted/90">{subtext}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-10 bg-white blur-xl" />
    </div>
  );
}

// ─── Medication Card ─────────────────────────────────────────────────────────

interface MedicationCardProps {
  item: CatalogItem;
  onAddToCart: (id: string) => void;
  onUploadRx: (drugName: string) => void;
}

const CATEGORY_BADGE_VARIANT: Record<
  DrugCategory,
  "default" | "primary" | "success" | "destructive" | "warning"
> = {
  anti_diabetics: "primary",
  anti_biotic: "primary",
  anti_pain: "warning",
  anti_protozal: "destructive",
  cns_drugs: "primary",
  cv: "destructive",
  dermatology: "warning",
  eye_ear_nasal: "default",
  gi: "warning",
  hormonal_drug: "primary",
  medical_equipment: "default",
  respiratory_drug: "primary",
  vitamins_minerals: "warning",
  cosmetics: "success",
};

const CATEGORY_LABEL: Record<DrugCategory, string> = {
  anti_diabetics: "Anti Diabetics",
  anti_biotic: "Anti Biotic",
  anti_pain: "Anti Pain",
  anti_protozal: "Anti Protozoal",
  cns_drugs: "CNS Drug",
  cv: "CV",
  dermatology: "Dermatology",
  eye_ear_nasal: "Eye/Ear/Nasal",
  gi: "GI",
  hormonal_drug: "Hormonal",
  medical_equipment: "Medical Equip",
  respiratory_drug: "Respiratory",
  vitamins_minerals: "Vitamin & Mineral",
  cosmetics: "Cosmetics",
};

function MedicationCard({ item, onAddToCart, onUploadRx }: MedicationCardProps) {
  const isRx = item.isRx;

  return (
    <div
      className={`group flex flex-col rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
        isRx
          ? "border-purple-500/20 bg-gradient-to-b from-purple-600/8 to-surface-container"
          : "border-border/60 bg-surface-container"
      }`}
    >
      {/* Card top accent line */}
      <div
        className={`h-0.5 rounded-t-xl ${
          isRx ? "bg-gradient-to-r from-purple-500 to-violet-400" : "bg-gradient-to-r from-success/60 to-teal-400/60"
        }`}
      />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{item.drugName}</p>
            <p className="text-xs text-muted truncate">{item.genericName}</p>
          </div>
          <Badge variant={CATEGORY_BADGE_VARIANT[item.category]} className="shrink-0 text-[10px]">
            {isRx && <Shield className="h-2.5 w-2.5" />}
            {CATEGORY_LABEL[item.category]}
          </Badge>
        </div>

        {/* Dosage & stock */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <Pill className="h-3.5 w-3.5 shrink-0" />
          <span>{item.dosage}</span>
          <span className="mx-1 text-border">·</span>
          <span
            className={`font-medium ${
              item.inStock ? "text-success" : "text-destructive"
            }`}
          >
            {item.inStock ? `In Stock (${item.quantity})` : "Out of Stock"}
          </span>
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-foreground">
          {currency(item.unitPrice)}
          <span className="text-xs font-normal text-muted ml-1">/ unit</span>
        </p>

        {/* Action */}
        <div className="mt-auto pt-1">
          {isRx ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2 border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 text-xs h-9"
                onClick={() => onUploadRx(item.drugName)}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Prescription to Order
              </Button>
              <div className="flex items-center gap-1.5 text-[10px] text-muted/70">
                <Shield className="h-3 w-3 text-purple-400" />
                <span>Requires valid prescription from a licensed physician</span>
              </div>
            </div>
          ) : (
            <Button
              className="w-full gap-2 bg-success/15 border border-success/30 text-success hover:bg-success/25 text-xs h-9 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (item.quantity <= 0) {
                  alert(`Sorry, ${item.drugName} is currently out of stock.`);
                  return;
                }
                onAddToCart(item.id);
              }}
              disabled={!item.inStock || item.quantity <= 0}
            >
              <Plus className="h-3.5 w-3.5" />
              {item.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Prescription Upload Dialog ──────────────────────────────────────────────

interface PrescriptionUploadDialogProps {
  open: boolean;
  targetDrugName?: string;
  onClose: () => void;
  onSubmit: (data: {
    fileName: string;
    fileUrl?: string;
    doctorName: string;
    patientNotes: string;
    targetDrugName?: string;
    requestedQuantity?: number;
  }) => void;
}

function PrescriptionUploadDialog({
  open,
  targetDrugName,
  onClose,
  onSubmit,
}: PrescriptionUploadDialogProps) {
  const [doctorName, setDoctorName] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert("Please upload a valid image (.png, .jpg, .jpeg, .webp) or PDF document.");
      return;
    }
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const finalDoctorName = doctorName.trim() || "Paper Rx / Unspecified";
    setIsUploading(true);

    try {
      const publicUrl = await uploadPrescriptionImage(selectedFile);

      onSubmit({
        fileName: selectedFile.name,
        fileUrl: publicUrl,
        doctorName: finalDoctorName,
        patientNotes: patientNotes.trim(),
        targetDrugName,
        requestedQuantity: Math.max(1, requestedQuantity),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedFile(null);
        setFilePreview(null);
        setDoctorName("");
        setPatientNotes("");
        setRequestedQuantity(1);
      }, 1500);
    } catch (err) {
      console.error("Prescription upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedFile(null);
      setDoctorName("");
      setPatientNotes("");
      setRequestedQuantity(1);
      setSubmitted(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/20">
              <Upload className="h-4 w-4 text-purple-300" />
            </div>
            Upload Prescription
          </DialogTitle>
          <DialogDescription>
            {targetDrugName
              ? `Submit your prescription for ${targetDrugName}. A pharmacist will review and approve it before dispensing.`
              : "Submit your doctor's prescription for pharmacist review and approval."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 border border-success/20">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <p className="font-semibold text-foreground">Submitted for Review!</p>
            <p className="text-sm text-muted text-center">
              Your prescription has been sent to the pharmacist queue.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drag-and-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-purple-400 bg-purple-500/10"
                  : selectedFile
                  ? "border-success/40 bg-success/8"
                  : "border-border hover:border-purple-400/50 hover:bg-purple-500/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              {selectedFile ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15">
                    <FileText className="h-6 w-6 text-success" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted">
                      {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high border border-border">
                    <CloudUpload className="h-6 w-6 text-muted" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Drop your prescription image here
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Accepts PNG, JPG, WEBP, PDF · Max 10MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quantity requested */}
            <div className="space-y-1.5">
              <Label htmlFor="requested-quantity" className="text-xs text-muted uppercase tracking-wider">
                Quantity Needed <span className="text-purple-400 font-bold">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 border-border"
                  onClick={() => setRequestedQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="requested-quantity"
                  type="number"
                  min="1"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-surface-container border-border text-center font-bold text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 border-border"
                  onClick={() => setRequestedQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Doctor's name */}
            <div className="space-y-1.5">
              <Label htmlFor="doctor-name" className="text-xs text-muted uppercase tracking-wider">
                Doctor's Name <span className="text-muted">(optional)</span>
              </Label>
              <Input
                id="doctor-name"
                placeholder="e.g. Dr. Hanna Bekele"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="bg-surface-container border-border"
              />
            </div>

            {/* Patient notes */}
            <div className="space-y-1.5">
              <Label htmlFor="patient-notes" className="text-xs text-muted uppercase tracking-wider">
                Patient Notes <span className="text-muted">(optional)</span>
              </Label>
              <Textarea
                id="patient-notes"
                placeholder="Any additional instructions, allergies, or notes for the pharmacist…"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                className="bg-surface-container border-border resize-none h-20"
              />
            </div>
          </div>
        )}

        {!submitted && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isUploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              className="gap-2 bg-purple-600/80 hover:bg-purple-500/90 text-white border border-purple-400/30 font-semibold"
              disabled={!selectedFile || isUploading}
              onClick={handleSubmit}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading Prescription…
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4" />
                  Submit for Pharmacist Review
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Cart Panel (inside Sheet) ───────────────────────────────────────────────

interface CartPanelProps {
  cart: { batchId: string; drugName: string; unitPrice: number; quantity: number }[];
  subtotal: number;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onPlaceOrder: (contact: { fullName: string; phone: string; email: string; address: string; notes: string }) => void;
  onOpenRxUpload: () => void;
}

function CartPanel({ cart, subtotal, onRemove, onUpdateQty, onPlaceOrder, onOpenRxUpload }: CartPanelProps) {
  const { currentUser } = useStore();
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [contact, setContact] = useState({
    fullName: currentUser?.name || "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceOrder(contact);
    setShowCheckoutForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary-fixed-dim" />
          <h2 className="font-semibold text-foreground">{showCheckoutForm ? "Checkout Details" : "Active Cart"}</h2>
          {cart.length > 0 && !showCheckoutForm && (
            <Badge variant="primary" className="text-[10px]">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {showCheckoutForm ? (
          <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3 text-xs">
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 mb-2 text-teal-300">
              Please enter your contact & delivery details below so the pharmacist can fulfill your order.
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted">Full Name *</Label>
              <Input required placeholder="e.g. Frehiwot Assefa" value={contact.fullName}
                onChange={(e) => setContact({ ...contact, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted">Phone Number *</Label>
              <Input required type="tel" placeholder="e.g. +251 91 123 4567" value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted">Email Address</Label>
              <Input type="email" placeholder="e.g. patient@example.com" value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted">Delivery / Pickup Address *</Label>
              <Input required placeholder="e.g. Bole Sub-city, Woreda 03, Addis Ababa" value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted">Order / Delivery Notes</Label>
              <Textarea placeholder="Special delivery instructions or pharmacist notes..." value={contact.notes} rows={2}
                onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
            </div>
          </form>
        ) : (
          cart.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted">
              <ShoppingCart className="h-8 w-8 opacity-25" />
              <p className="text-sm text-center">
                Your cart is empty.
                <br />
                Browse the catalog to add OTC items.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.batchId}
                className="rounded-xl border border-border/60 bg-surface-container-high p-3 flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest shrink-0">
                  <Pill className="h-4 w-4 text-primary-fixed-dim" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.drugName}</p>
                  <p className="text-xs text-muted">{currency(item.unitPrice)} / unit</p>
                </div>
                <div className="flex items-center gap-1">
                  {item.quantity === 1 ? (
                    <button
                      onClick={() => onRemove(item.batchId)}
                      title="Remove item"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateQty(item.batchId, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest text-muted hover:text-foreground transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  )}
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(item.batchId, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest text-muted hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground w-14 text-right">
                  {currency(item.unitPrice * item.quantity)}
                </p>
                {item.quantity > 1 && (
                  <button
                    onClick={() => onRemove(item.batchId)}
                    title="Remove all"
                    className="text-muted hover:text-destructive transition-colors ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Footer / Checkout */}
      <div className="border-t border-border px-6 py-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-bold text-foreground text-lg">{currency(subtotal)}</span>
        </div>

        {showCheckoutForm ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCheckoutForm(false)}>
              Back to Cart
            </Button>
            <Button form="checkout-form" type="submit" size="sm" className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <PackageCheck className="h-4 w-4" /> Confirm Order
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-muted bg-surface-container rounded-lg px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              <span>You can adjust quantities (+ / -) for all prescription & cosmetics items in your cart below.</span>
            </div>
            <Button
              className="w-full gap-2 bg-primary/20 border border-primary/40 text-primary-fixed-dim hover:bg-primary/30 font-semibold"
              disabled={cart.length === 0}
              onClick={() => setShowCheckoutForm(true)}
            >
              <PackageCheck className="h-4 w-4" />
              Proceed to Contact Details
              {subtotal > 0 && <span className="ml-auto text-xs opacity-70">{currency(subtotal)}</span>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
              onClick={onOpenRxUpload}
            >
              Upload Prescription Document
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Order Tracking Panel ────────────────────────────────────────────────────

interface OrderTrackingPanelProps {
  order: {
    id: string;
    patientName: string;
    items: string[];
    isRx: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    pickupReady?: boolean;
  } | null;
}

function OrderTrackingPanel({ order }: OrderTrackingPanelProps) {
  const steps = order?.isRx ? ORDER_STEPS : ORDER_STEPS.filter((s) => s.key !== "pharmacist_review");
  const currentStepIndex = order ? STATUS_ORDER_INDEX[order.status] ?? 0 : -1;

  return (
    <div className="rounded-2xl border border-border/60 bg-surface-container overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
        <PackageCheck className="h-5 w-5 text-emerald-400" />
        <h3 className="font-semibold text-foreground text-sm">Order Tracking</h3>
      </div>

      {!order ? (
        <div className="flex flex-col items-center gap-2 py-12 px-5 text-muted text-center">
          <Clock className="h-8 w-8 opacity-25" />
          <p className="text-sm">No active orders yet.</p>
          <p className="text-xs opacity-70">Place an order to track it here.</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          {/* Order details */}
          <div className="rounded-xl border border-border/50 bg-surface-container-high p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted">{order.id}</span>
              {order.isRx && (
                <Badge className="border-purple-400/30 bg-purple-500/10 text-purple-300 text-[10px]">
                  <Shield className="h-2.5 w-2.5" /> Rx Order
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted">{order.items.join(", ")}</p>
            <p className="text-[11px] text-muted/60">
              Placed {relativeTime(order.createdAt)}
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isLast = idx === steps.length - 1;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex gap-3">
                  {/* Connector column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                        isCompleted
                          ? isCurrent
                            ? "border-primary bg-primary/20 text-primary-fixed-dim"
                            : "border-success/50 bg-success/10 text-success"
                          : "border-border bg-surface-container text-muted/40"
                      }`}
                    >
                      <StepIcon
                        className={`h-3.5 w-3.5 ${isCurrent ? "animate-pulse" : ""}`}
                      />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] transition-all duration-500 ${
                          idx < currentStepIndex ? "bg-success/40" : "bg-border/40"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step label */}
                  <div className="flex-1 pb-4 pt-1">
                    <p
                      className={`text-xs font-medium ${
                        isCurrent
                          ? "text-primary-fixed-dim"
                          : isCompleted
                          ? "text-success"
                          : "text-muted/50"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] text-muted mt-0.5">
                        Updated {relativeTime(order.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ready banner */}
          {(order.status === "ready" || order.status === "completed") && (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <p className="text-xs font-medium text-success">
                Your order is ready for pickup!
              </p>
            </div>
          )}
        </div>
      )}

      {/* All Orders summary */}
      <div className="border-t border-border/50 px-5 py-3">
        <p className="text-xs text-muted text-center">
          Most recent order shown above
        </p>
      </div>
    </div>
  );
}
