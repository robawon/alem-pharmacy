"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, CustomerPrescriptionUpload } from "@/lib/store";
import { relativeTime } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Package,
} from "lucide-react";

interface PrescriptionReviewModalProps {
  upload: CustomerPrescriptionUpload | null;
  open: boolean;
  onClose: () => void;
}

export function PrescriptionReviewModal({
  upload,
  open,
  onClose,
}: PrescriptionReviewModalProps) {
  const { catalog, approveUploadedPrescription, rejectUploadedPrescription } = useStore();

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!upload) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleApprove = () => {
    approveUploadedPrescription(upload.id, selectedCatalogId || undefined);
    onClose();
  };

  const handleReject = () => {
    rejectUploadedPrescription(upload.id, rejectReason);
    setShowRejectForm(false);
    setRejectReason("");
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setZoom(1);
      setRotation(0);
      setShowRejectForm(false);
      setRejectReason("");
      setSelectedCatalogId("");
    }
  };

  const hasImage = Boolean(upload.fileUrl);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-surface-container border-border">
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border bg-surface-container-high flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-purple-400" />
                Review Customer Prescription
              </DialogTitle>
              <DialogDescription className="text-xs text-muted mt-0.5">
                Submitted {relativeTime(upload.uploadedAt)} • Status:{" "}
                <Badge
                  variant={
                    upload.status === "approved"
                      ? "success"
                      : upload.status === "rejected"
                      ? "destructive"
                      : "warning"
                  }
                  className="ml-1 text-[10px]"
                >
                  {upload.status.toUpperCase()}
                </Badge>
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Left: Prescription Image Display with Controls */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-border bg-black/40 flex flex-col items-center justify-center p-4 relative min-h-[320px]">
              {/* Image Controls Bar */}
              {hasImage && (
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 text-xs text-white">
                  <span className="font-mono opacity-80">
                    Zoom: {(zoom * 100).toFixed(0)}% • {rotation}°
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleZoomOut}
                      title="Zoom Out"
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      title="Zoom In"
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRotate}
                      title="Rotate Image"
                      className="p-1 hover:bg-white/20 rounded transition-colors ml-1"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setFullscreenImage(true)}
                      title="Expand Fullscreen"
                      className="p-1 hover:bg-white/20 rounded transition-colors ml-1"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Prescription Image Viewer */}
              {hasImage ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden py-8">
                  <img
                    src={upload.fileUrl}
                    alt={upload.fileName}
                    className="max-h-[380px] max-w-full object-contain transition-transform duration-200 cursor-zoom-in"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                    onClick={() => setFullscreenImage(true)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted gap-3">
                  <FileText className="h-16 w-16 opacity-30 text-purple-400" />
                  <p className="text-sm font-medium">{upload.fileName}</p>
                  <p className="text-xs text-muted/70">
                    Image preview not available for this document.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Details & Pharmacist Fulfill Actions */}
            <div className="md:col-span-5 p-6 flex flex-col gap-5 bg-surface-container">
              {/* Customer Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Clinical & Patient Info
                </h4>

                <div className="rounded-xl border border-border/60 bg-surface-container-high p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-muted text-[10px]">Patient Name</p>
                      <p className="font-semibold text-foreground">{upload.fileName.split('.')[0] || "Customer"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-muted text-[10px]">Prescribing Physician</p>
                      <p className="font-semibold text-foreground">Dr. {upload.doctorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-muted text-[10px]">Submitted Date</p>
                      <p className="font-medium text-foreground">
                        {new Date(upload.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-muted text-[10px]">Quantity Requested</p>
                      <p className="font-bold text-foreground text-sm">
                        {upload.requestedQuantity || 1} unit(s)
                      </p>
                    </div>
                  </div>

                  {upload.targetDrugName && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                      <Package className="h-4 w-4 text-teal-400 shrink-0" />
                      <div>
                        <p className="text-muted text-[10px]">Target Medication Requested</p>
                        <p className="font-semibold text-teal-300">{upload.targetDrugName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {upload.patientNotes && (
                  <div className="rounded-xl border border-border/60 bg-surface-container-high p-3 text-xs space-y-1">
                    <p className="font-medium text-muted">Patient Notes:</p>
                    <p className="text-foreground italic">"{upload.patientNotes}"</p>
                  </div>
                )}
              </div>

              {/* Inventory Fulfillment Selection */}
              {upload.status === "pending_review" && !showRejectForm && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-semibold text-foreground">
                    Fulfill with Inventory Item (Optional)
                  </Label>
                  <Select value={selectedCatalogId} onValueChange={setSelectedCatalogId}>
                    <SelectTrigger className="bg-surface-container-high border-border text-xs">
                      <SelectValue placeholder="Select medicine to deduct stock…" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.drugName} ({item.dosage}) — Stock: {item.quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted">
                    Approving will deduct <strong className="text-foreground">{upload.requestedQuantity || 1} unit(s)</strong> from selected inventory automatically.
                  </p>
                </div>
              )}

              {/* Rejection Reason Form */}
              {showRejectForm && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-semibold text-destructive">
                    Reason for Rejection
                  </Label>
                  <Textarea
                    placeholder="e.g. Unclear doctor signature, expired prescription, or dosage mismatch…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="bg-surface-container-high border-border text-xs resize-none h-20"
                  />
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => setShowRejectForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-xs gap-1"
                      onClick={handleReject}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Confirm Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <DialogFooter className="px-6 py-3 border-t border-border bg-surface-container-high flex flex-row items-center justify-between">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>

            {upload.status === "pending_review" && !showRejectForm && (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="h-4 w-4" /> Reject Prescription
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  onClick={handleApprove}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Fulfill Order
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Preview Dialog */}
      {fullscreenImage && hasImage && (
        <Dialog open={fullscreenImage} onOpenChange={setFullscreenImage}>
          <DialogContent className="max-w-5xl h-[90vh] bg-black/90 border-none p-4 flex flex-col items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={upload.fileUrl}
                alt={upload.fileName}
                className="max-h-full max-w-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
