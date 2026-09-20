"use client";

import { useState, useRef, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { useStore } from "@/lib/store";
import { parseOCRText, ExtractedMedicine, normalizeExpiryDate, ImportHistoryRecord } from "@/lib/ocr";
import { DrugCategory } from "@/lib/types";
import { createWorker } from "tesseract.js";
import {
  Camera, Upload, FileText, CheckCircle2, AlertTriangle, ArrowLeft,
  RotateCcw, Sparkles, Plus, Copy, Trash2, Edit3, Save, ShieldAlert,
  Clock, PackageCheck, History, ArrowRight, Loader2, Info
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

type ImportStep = "upload" | "preview" | "processing" | "review" | "approval" | "summary";

export default function MedicineImportPage() {
  return (
    <AppShell requiredRole="inventory">
      <MedicineImportContent />
    </AppShell>
  );
}

function MedicineImportContent() {
  const { inventory, catalog, addCatalogItem, updateMedicine, currentUser, addLog } = useStore();

  // Workflow steps: upload -> preview -> processing -> review -> approval -> summary
  const [step, setStep] = useState<ImportStep>("upload");

  // File & Camera state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // OCR Processing state
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");

  // Extracted items list
  const [extractedItems, setExtractedItems] = useState<ExtractedMedicine[]>([]);

  // Editing state for table rows
  const [editingId, setEditingId] = useState<string | null>(null);

  // Import History & Summary state
  const [summaryData, setSummaryData] = useState<{
    added: number;
    updated: number;
    skipped: number;
    failed: number;
    details: { name: string; action: string; status: string; reason?: string }[];
  } | null>(null);

  const [importHistory, setImportHistory] = useState<ImportHistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"import" | "history">("import");

  // ── 1. CAMERA & FILE INPUT HANDLERS ──────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setStep("preview");
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check camera permissions or upload an image file instead.");
      setCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setSelectedImage(dataUrl);
      setFileName(`camera-capture-${Date.now()}.jpg`);
      stopCamera();
      setStep("preview");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleResetImage = () => {
    stopCamera();
    setSelectedImage(null);
    setFileName("");
    setStep("upload");
  };

  // ── 2. OCR EXTRACTION & PARSING ──────────────────────────────────────────

  const runOCR = async () => {
    if (!selectedImage) return;
    setStep("processing");
    setOcrProgress(10);
    setOcrStatusText("Initializing OCR Engine...");

    try {
      const worker = await createWorker("eng");
      setOcrProgress(30);
      setOcrStatusText("Analyzing image & extracting text...");

      const ret = await worker.recognize(selectedImage);
      setOcrProgress(80);
      setOcrStatusText("Parsing medicine list structure...");

      const rawText = ret.data.text;
      setExtractedText(rawText);

      await worker.terminate();
      setOcrProgress(100);

      // Parse structured items
      const parsed = parseOCRText(rawText);

      // Match against existing inventory / catalog batches
      const crossChecked = parsed.map((item) => crossCheckWithInventory(item));

      setExtractedItems(crossChecked);
      setStep("review");
    } catch (err: any) {
      console.error("OCR Error:", err);
      alert("Failed to process image with OCR: " + (err.message || err));
      setStep("preview");
    }
  };

  // Match extracted item against existing inventory/catalog
  const crossCheckWithInventory = (item: ExtractedMedicine): ExtractedMedicine => {
    if (!item.batchNumber) {
      return { ...item, isExisting: false };
    }

    const normBatch = item.batchNumber.trim().toUpperCase();
    const existing = inventory.find(
      (b) => b.batchNumber && b.batchNumber.trim().toUpperCase() === normBatch
    );

    if (existing) {
      const catItem = catalog.find((c) => c.id === existing.id || c.drugName.toLowerCase() === existing.drugName.toLowerCase());
      return {
        ...item,
        isExisting: true,
        existingBatchId: existing.id,
        existingOldQty: existing.quantity,
        existingOldPrice: existing.unitPrice,
        userDecision: item.userDecision || "update",
        category: (catItem?.category || existing.category || item.category) as DrugCategory,
      };
    }

    return { ...item, isExisting: false };
  };

  // ── 3. EDIT & MANIPULATION FUNCTIONS FOR REVIEW PAGE ───────────────────────

  const handleUpdateItem = (id: string, field: keyof ExtractedMedicine, val: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== id) return item;

        const updated = { ...item, [field]: val };

        // Re-validate row fields
        const reasons: string[] = [];
        if (!updated.drugName.trim()) reasons.push("Missing medicine name");
        if (!updated.batchNumber.trim()) reasons.push("Batch number missing / needs review");
        if (!updated.expiryDate.trim()) reasons.push("Expiry date missing / needs review");
        if (updated.quantity === "" || isNaN(Number(updated.quantity))) reasons.push("Quantity missing / needs review");
        if (updated.unitPrice === "" || isNaN(Number(updated.unitPrice))) reasons.push("Unit price missing / needs review");

        updated.needsReview = reasons.length > 0;
        updated.reviewReasons = reasons;

        // Re-check inventory match if batch number changed
        if (field === "batchNumber" || field === "drugName") {
          return crossCheckWithInventory(updated);
        }

        return updated;
      })
    );
  };

  const handleAddBlankRow = () => {
    const newItem: ExtractedMedicine = {
      tempId: `manual-${Date.now()}`,
      category: "anti_biotic",
      categoryLabel: "Anti Biotic",
      drugName: "",
      batchNumber: "",
      expiryDate: "",
      quantity: "",
      unitPrice: "",
      needsReview: true,
      reviewReasons: ["Newly added row — please fill details"],
      isExisting: false,
    };
    setExtractedItems((prev) => [...prev, newItem]);
    setEditingId(newItem.tempId);
  };

  const handleDuplicateRow = (item: ExtractedMedicine) => {
    const dup: ExtractedMedicine = {
      ...item,
      tempId: `dup-${Date.now()}`,
      batchNumber: item.batchNumber ? `${item.batchNumber}-COPY` : "",
      isExisting: false,
    };
    setExtractedItems((prev) => [...prev, dup]);
  };

  const handleDeleteRow = (id: string) => {
    setExtractedItems((prev) => prev.filter((i) => i.tempId !== id));
  };

  // ── 4. STATS COMPUTATION ──────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = extractedItems.length;
    const ready = extractedItems.filter((i) => !i.needsReview).length;
    const reviewNeeded = extractedItems.filter((i) => i.needsReview).length;
    const existing = extractedItems.filter((i) => i.isExisting).length;
    const newItems = extractedItems.filter((i) => !i.isExisting).length;
    return { total, ready, reviewNeeded, existing, newItems };
  }, [extractedItems]);

  // ── 5. FINAL IMPORT COMMIT TO SUPABASE / STORE ────────────────────────────

  const handleFinalCommit = async () => {
    // Check if any row has unresolved review flags
    const invalidRows = extractedItems.filter((i) => i.needsReview);
    if (invalidRows.length > 0) {
      alert(
        `Cannot import yet! ${invalidRows.length} item(s) still have "Needs Review" flags or missing required values. Please resolve them first.`
      );
      setStep("review");
      return;
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const logDetails: { name: string; action: string; status: string; reason?: string }[] = [];

    for (const item of extractedItems) {
      if (item.userDecision === "skip") {
        skippedCount++;
        logDetails.push({ name: item.drugName, action: "Skip", status: "Skipped by user" });
        continue;
      }

      try {
        if (item.isExisting && item.existingBatchId && item.userDecision === "update") {
          // Update existing inventory batch
          await updateMedicine(item.existingBatchId, {
            drugName: item.drugName,
            category: item.category,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          });
          updatedCount++;
          logDetails.push({ name: item.drugName, action: "Update", status: "Success" });
        } else {
          // Add as new medicine batch
          const isRxItem = item.category !== "cosmetics";
          await addCatalogItem({
            drugName: item.drugName,
            genericName: item.drugName,
            category: item.category,
            isRx: isRxItem,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            inStock: Number(item.quantity) > 0,
            safetyThreshold: 10,
          } as any);
          addedCount++;
          logDetails.push({ name: item.drugName, action: "Add", status: "Success" });
        }
      } catch (err: any) {
        console.error(`Import failed for ${item.drugName}:`, err);
        failedCount++;
        logDetails.push({ name: item.drugName, action: item.isExisting ? "Update" : "Add", status: "Failed", reason: err.message || String(err) });
      }
    }

    // Record import history log
    const histRecord: ImportHistoryRecord = {
      id: `imp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || "Inventory Manager",
      userRole: currentUser?.role || "inventory",
      addedCount,
      updatedCount,
      skippedCount,
      failedCount,
      details: logDetails,
    };

    setImportHistory((prev) => [histRecord, ...prev]);

    addLog(
      "MEDICINE_IMPORT",
      `Medicine List OCR Import completed: Added ${addedCount}, Updated ${updatedCount}, Skipped ${skippedCount}, Failed ${failedCount}`
    );

    setSummaryData({
      added: addedCount,
      updated: updatedCount,
      skipped: skippedCount,
      failed: failedCount,
      details: logDetails,
    });

    setStep("summary");
  };

  // ── RENDER COMPONENT ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="group flex items-center gap-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 text-xs font-semibold text-teal-300 transition-all hover:bg-teal-500/20 hover:border-teal-500/50 shadow-sm shrink-0"
          >
            <Logo size={24} />
            <span className="flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Stock Inventory
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-teal-400" />
              Medicine List Review & Import
            </h1>
            <p className="text-sm text-muted">
              Scan paper delivery invoices, lists, or camera photos to extract, review, and import medicine batches into inventory.
            </p>
          </div>
        </div>

        {/* Tab switch between Import & History */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <Button
            size="sm"
            variant={activeTab === "import" ? "default" : "ghost"}
            className={activeTab === "import" ? "bg-teal-600 hover:bg-teal-700 text-white font-semibold" : "text-slate-400"}
            onClick={() => setActiveTab("import")}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            New Import
          </Button>
          <Button
            size="sm"
            variant={activeTab === "history" ? "default" : "ghost"}
            className={activeTab === "history" ? "bg-teal-600 hover:bg-teal-700 text-white font-semibold" : "text-slate-400"}
            onClick={() => setActiveTab("history")}
          >
            <History className="mr-1.5 h-4 w-4" />
            Import History ({importHistory.length})
          </Button>
        </div>
      </div>

      {activeTab === "history" ? (
        /* History View */
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-teal-400" />
              Audit Log & Import History
            </CardTitle>
            <CardDescription className="text-muted">
              Record of past OCR & list import sessions, showing added, updated, and failed medicine batches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No import sessions recorded in this session yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {importHistory.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-sm font-semibold text-white">{new Date(rec.timestamp).toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-3">By {rec.userName} ({rec.userRole})</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">+{rec.addedCount} Added</Badge>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{rec.updatedCount} Updated</Badge>
                        {rec.skippedCount > 0 && <Badge className="bg-slate-700 text-slate-300">{rec.skippedCount} Skipped</Badge>}
                        {rec.failedCount > 0 && <Badge className="bg-red-500/20 text-red-300 border-red-500/30">{rec.failedCount} Failed</Badge>}
                      </div>
                    </div>

                    {rec.details && rec.details.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {rec.details.map((d, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-200 truncate font-medium">{d.name}</span>
                            <span className={d.status === "Success" ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                              {d.action}: {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Workflow Stepper Container */
        <div className="space-y-6">
          {/* Step Breadcrumbs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs sm:text-sm font-medium">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${step === "upload" ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40" : "text-slate-400"}`}>
              <span>1. Upload / Camera</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${step === "preview" ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40" : "text-slate-400"}`}>
              <span>2. Preview</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${step === "processing" ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40" : "text-slate-400"}`}>
              <span>3. OCR Scan</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${step === "review" ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40" : "text-slate-400"}`}>
              <span>4. Review & Edit</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${step === "approval" ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40" : "text-slate-400"}`}>
              <span>5. Final Approval</span>
            </div>
          </div>

          {/* STEP 1: UPLOAD / CAMERA */}
          {step === "upload" && (
            <Card className="border-slate-800 bg-slate-900/70 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Upload Option */}
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 hover:border-teal-500/50 hover:bg-slate-900/80 transition-all text-center">
                  <div className="h-16 w-16 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4 border border-teal-500/30">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Upload Medicine List File</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-xs">
                    Select an image (JPEG, PNG, WEBP) or photo of your medicine shipment list.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-semibold gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Browse Device Storage
                  </Button>
                </div>

                {/* Camera Option */}
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 hover:border-teal-500/50 hover:bg-slate-900/80 transition-all text-center">
                  <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/30">
                    <Camera className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Use Live Camera</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-xs">
                    Snap a live photo of paper invoices or physical medicine boxes using your camera.
                  </p>
                  {!cameraActive ? (
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Open Camera
                    </Button>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="relative w-full max-w-sm rounded-xl overflow-hidden border-2 border-teal-500">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={captureCameraPhoto} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                          Snap Photo
                        </Button>
                        <Button onClick={stopCamera} variant="ghost" className="text-slate-400">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rules & Guidance */}
              <div className="mt-6 p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-teal-300">
                  <Info className="h-4 w-4" />
                  Best Practices for OCR Recognition:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Group items under Category headings (e.g. <strong className="text-teal-300">ANTIBIOTICS</strong>, <strong className="text-teal-300">VITAMINS & MINERALS</strong>).</li>
                  <li>Include drug name, dosage, batch number, expiry date (YYYY-MM or MM/YYYY), quantity, and price.</li>
                  <li>Full medicine names with dosages (e.g., "Amoxicillin 500mg Tablets BP") will be preserved completely.</li>
                  <li>Nothing will be saved to the database until you explicitly review and approve.</li>
                </ul>
              </div>
            </Card>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && selectedImage && (
            <Card className="border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/2 flex flex-col items-center gap-3">
                  <div className="relative w-full max-h-96 rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center p-2">
                    <img src={selectedImage} alt="Selected Medicine List" className="max-h-80 object-contain rounded" />
                  </div>
                  <p className="text-xs text-slate-400 italic">{fileName || "Selected Image"}</p>
                </div>

                <div className="w-full md:w-1/2 space-y-4">
                  <h3 className="text-xl font-bold text-white">Confirm Medicine List Image</h3>
                  <p className="text-sm text-slate-300">
                    Verify that text and medicine details in the image are clear, well-lit, and readable before scanning.
                  </p>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-400 space-y-1">
                    <p>✓ Image loaded successfully</p>
                    <p>✓ Ready for OCR text extraction</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button onClick={runOCR} className="bg-teal-600 hover:bg-teal-500 text-white font-semibold gap-2 flex-1">
                      <Sparkles className="h-4 w-4" />
                      Start OCR Scan & Extraction
                    </Button>
                    <Button onClick={handleResetImage} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      Choose Different Image
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: PROCESSING */}
          {step === "processing" && (
            <Card className="border-slate-800 bg-slate-900/70 p-12 text-center">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse border border-teal-500/40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Analyzing & Extracting Medicine List</h2>
              <p className="text-sm text-slate-400 mb-6">{ocrStatusText}</p>

              <div className="w-full max-w-md mx-auto bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
              </div>
            </Card>
          )}

          {/* STEP 4: REVIEW PAGE */}
          {step === "review" && (
            <div className="space-y-6">
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
                  <p className="text-xs font-semibold text-slate-400">Total Detected</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <p className="text-xs font-semibold text-emerald-300">Ready to Add</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.ready}</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <p className="text-xs font-semibold text-amber-300">Needs Review</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.reviewNeeded}</p>
                </div>
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                  <p className="text-xs font-semibold text-blue-300">Existing Batches</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.existing}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddBlankRow} variant="outline" size="sm" className="border-teal-500/40 text-teal-300 hover:bg-teal-500/10">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Missing Medicine
                  </Button>
                  <Button onClick={handleResetImage} variant="ghost" size="sm" className="text-slate-400">
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Back to Upload
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setStep("approval")}
                    disabled={extractedItems.length === 0}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-semibold gap-2"
                  >
                    Proceed to Final Approval ({extractedItems.length})
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Medicines Editable Table */}
              <Card className="border-slate-800 bg-slate-900/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-200">
                    <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Category</th>
                        <th className="p-3">Medicine Name (Preserved Full Name)</th>
                        <th className="p-3">Batch No</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Stock Qty</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {extractedItems.map((item) => {
                        const isEditing = editingId === item.tempId;

                        return (
                          <tr
                            key={item.tempId}
                            className={`hover:bg-slate-800/50 transition-colors ${
                              item.needsReview
                                ? "bg-amber-500/5 border-l-4 border-l-amber-500"
                                : item.isExisting
                                ? "bg-blue-500/5 border-l-4 border-l-blue-500"
                                : "border-l-4 border-l-emerald-500"
                            }`}
                          >
                            {/* Category */}
                            <td className="p-3 min-w-[160px]">
                              <CategorySelect
                                value={item.category}
                                onChange={(val: DrugCategory) => handleUpdateItem(item.tempId, "category", val)}
                              />
                            </td>

                            {/* Medicine Name */}
                            <td className="p-3 min-w-[220px]">
                              <Input
                                value={item.drugName}
                                onChange={(e) => handleUpdateItem(item.tempId, "drugName", e.target.value)}
                                className={`text-sm ${!item.drugName ? "border-red-500 bg-red-500/10" : "border-slate-700 bg-slate-950"}`}
                                placeholder="Medicine Name & Dosage"
                              />
                            </td>

                            {/* Batch Number */}
                            <td className="p-3 min-w-[130px]">
                              <Input
                                value={item.batchNumber}
                                onChange={(e) => handleUpdateItem(item.tempId, "batchNumber", e.target.value)}
                                className={`text-sm ${!item.batchNumber ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-950"}`}
                                placeholder="e.g. AB123"
                              />
                            </td>

                            {/* Expiry Date */}
                            <td className="p-3 min-w-[130px]">
                              <Input
                                value={item.expiryDate}
                                onChange={(e) => handleUpdateItem(item.tempId, "expiryDate", e.target.value)}
                                className={`text-sm ${!item.expiryDate ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-950"}`}
                                placeholder="YYYY-MM"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="p-3 w-28">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.tempId, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                                className={`text-sm ${item.quantity === "" ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-950"}`}
                                placeholder="Qty"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="p-3 w-28">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.tempId, "unitPrice", e.target.value === "" ? "" : Number(e.target.value))}
                                className={`text-sm ${item.unitPrice === "" ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-950"}`}
                                placeholder="ETB"
                              />
                            </td>

                            {/* Status & Badges */}
                            <td className="p-3 min-w-[140px]">
                              {item.needsReview ? (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 w-fit">
                                  <AlertTriangle className="h-3 w-3" />
                                  Needs Review
                                </Badge>
                              ) : item.isExisting ? (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 flex items-center gap-1 w-fit">
                                  <Info className="h-3 w-3" />
                                  Existing Batch
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="h-3 w-3" />
                                  New Item
                                </Badge>
                              )}

                              {item.isExisting && (
                                <div className="mt-1 text-[11px] text-slate-400">
                                  Old Qty: {item.existingOldQty} | Price: {item.existingOldPrice} ETB
                                  <div className="mt-1 flex gap-1">
                                    <button
                                      onClick={() => handleUpdateItem(item.tempId, "userDecision", "update")}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${item.userDecision !== "new_batch" && item.userDecision !== "skip" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                    >
                                      Update
                                    </button>
                                    <button
                                      onClick={() => handleUpdateItem(item.tempId, "userDecision", "new_batch")}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${item.userDecision === "new_batch" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                    >
                                      As New
                                    </button>
                                    <button
                                      onClick={() => handleUpdateItem(item.tempId, "userDecision", "skip")}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${item.userDecision === "skip" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                    >
                                      Skip
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDuplicateRow(item)}
                                  title="Duplicate Row"
                                  className="h-8 w-8 text-slate-400 hover:text-white"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteRow(item.tempId)}
                                  title="Delete Row"
                                  className="h-8 w-8 text-red-400 hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 5: APPROVAL PAGE */}
          {step === "approval" && (
            <Card className="border-slate-800 bg-slate-900/70 p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-teal-400" />
                    Review & Approve Medicines
                  </h2>
                  <p className="text-sm text-slate-400">
                    Final confirmation before inserting or updating stock batches in Supabase database.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep("review")} variant="outline" className="border-slate-700 text-slate-300">
                    Back to Review
                  </Button>
                  <Button onClick={handleFinalCommit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2">
                    <PackageCheck className="h-4 w-4" />
                    Add All to Inventory
                  </Button>
                </div>
              </div>

              {/* Stats & Validation warning */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <p className="text-xs font-medium text-slate-400">Total Medicines Detected</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <p className="text-xs font-medium text-emerald-300">Medicines Ready to Commit</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.ready}</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <p className="text-xs font-medium text-amber-300">Medicines Needing Review</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.reviewNeeded}</p>
                </div>
              </div>

              {stats.reviewNeeded > 0 && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center gap-3 text-sm text-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Warning:</strong> {stats.reviewNeeded} item(s) are flagged as "Needs Review". You must correct missing fields or remove them before saving to database.
                  </span>
                </div>
              )}

              {/* Readonly/Confirmation List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Batches to be Processed:</h3>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {extractedItems.map((item, idx) => (
                    <div key={item.tempId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs">
                      <div>
                        <span className="font-bold text-white text-sm">{idx + 1}. {item.drugName}</span>
                        <div className="text-slate-400 mt-0.5 flex flex-wrap gap-x-4">
                          <span>Category: <strong className="text-slate-200">{item.categoryLabel}</strong></span>
                          <span>Batch: <strong className="text-slate-200">{item.batchNumber || "N/A"}</strong></span>
                          <span>Expiry: <strong className="text-slate-200">{item.expiryDate || "N/A"}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-slate-300">Qty: <strong>{item.quantity}</strong></span>
                        <span className="text-slate-300">Price: <strong>{item.unitPrice} ETB</strong></span>

                        {item.isExisting ? (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Update Existing</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">New Batch</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* STEP 6: SUMMARY PAGE */}
          {step === "summary" && summaryData && (
            <Card className="border-slate-800 bg-slate-900/70 p-8 text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Import Completed Successfully</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Database changes have been committed and audit logs updated.
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                  <p className="text-xs text-emerald-300 font-medium">Added New</p>
                  <p className="text-xl font-bold text-emerald-400">{summaryData.added}</p>
                </div>
                <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                  <p className="text-xs text-blue-300 font-medium">Updated Existing</p>
                  <p className="text-xl font-bold text-blue-400">{summaryData.updated}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-700 bg-slate-950">
                  <p className="text-xs text-slate-400 font-medium">Skipped</p>
                  <p className="text-xl font-bold text-slate-300">{summaryData.skipped}</p>
                </div>
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                  <p className="text-xs text-red-300 font-medium">Failed</p>
                  <p className="text-xl font-bold text-red-400">{summaryData.failed}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <Button onClick={() => setStep("upload")} className="bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                  Start Another Import
                </Button>
                <Link href="/inventory">
                  <Button variant="outline" className="border-slate-700 text-slate-300">
                    Return to Inventory
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
