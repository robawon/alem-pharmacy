/**
 * lib/db.ts
 * Database helper functions — thin wrappers around supabase client.
 * Each function maps Supabase snake_case columns → app camelCase types.
 */
import { supabase } from "./supabase";
import type {
  AuditLogEntry, CatalogItem, CustomerOrder, Prescription,
  SaleRecord, StaffProfile, StockBatch, CustomerContactInfo,
} from "./types";

// ── Mappers ─────────────────────────────────────────────────────────────────

function toStockBatch(r: any): StockBatch {
  return {
    id: r.id, drugName: r.drug_name, batchNumber: r.batch_number,
    expiryDate: r.expiry_date, safetyThreshold: r.safety_threshold,
    unitPrice: Number(r.unit_price), quantity: r.quantity, quarantined: r.quarantined,
  };
}

function toPrescription(r: any): Prescription {
  return {
    id: r.id, patientName: r.patient_name, doctorName: r.doctor_name,
    patientHistory: r.patient_history ?? [], drugName: r.drug_name,
    batchId: r.batch_id, dosage: r.dosage, prescriptionText: r.prescription_text,
    conflictWarning: r.conflict_warning ?? null, status: r.status,
    rejectionReason: r.rejection_reason ?? undefined,
    createdAt: r.created_at, verifiedAt: r.verified_at ?? undefined,
    rejectedAt: r.rejected_at ?? undefined,
  };
}

function toAuditLog(r: any): AuditLogEntry {
  return {
    id: r.id, timestamp: r.timestamp, action_type: r.action_type,
    user_id: r.user_id, user_role: r.user_role, payload_delta: r.payload_delta,
  };
}

function toCatalogItem(r: any): CatalogItem {
  return {
    id: r.id, drugName: r.drug_name, genericName: r.generic_name, dosage: r.dosage,
    category: r.category, isRx: r.is_rx, unitPrice: Number(r.unit_price),
    quantity: r.quantity, inStock: r.in_stock, imageUrl: r.image_url ?? undefined,
  };
}

function toStaffProfile(r: any): StaffProfile {
  return {
    id: r.id, name: r.name, email: r.email,
    role: r.role, status: r.status, joinedAt: r.joined_at,
    avatarUrl: r.avatar_url ?? undefined,
  };
}

function toCustomerOrder(r: any): CustomerOrder {
  const contactInfo: CustomerContactInfo | undefined =
    r.contact_phone
      ? {
          fullName: r.contact_full_name ?? "",
          phone: r.contact_phone ?? "",
          email: r.contact_email ?? "",
          address: r.contact_address ?? "",
          notes: r.contact_notes ?? "",
        }
      : undefined;
  return {
    id: r.id, patientName: r.patient_name, items: r.items ?? [],
    isRx: r.is_rx, status: r.status, createdAt: r.created_at,
    updatedAt: r.updated_at, pickupReady: r.pickup_ready ?? false,
    contactInfo, prescriptionFileName: r.prescription_file_name ?? undefined,
    prescriptionNotes: r.prescription_notes ?? undefined,
  };
}

function toSaleRecord(r: any): SaleRecord {
  return {
    id: r.id, items: r.items ?? [], subtotal: Number(r.subtotal),
    discount: r.discount ?? null, discountAmount: Number(r.discount_amount),
    tax: Number(r.tax), total: Number(r.total),
    paymentMethod: r.payment_method, amountTendered: Number(r.amount_tendered),
    changeDue: Number(r.change_due), timestamp: r.timestamp,
  };
}

// ── Fetch functions ─────────────────────────────────────────────────────────

export async function fetchInventory(): Promise<StockBatch[]> {
  const { data, error } = await supabase.from("inventory").select("*").order("created_at", { ascending: true });
  if (error) { console.error("fetchInventory:", error.message); return []; }
  return (data ?? []).map(toStockBatch);
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
  if (error) { console.error("fetchPrescriptions:", error.message); return []; }
  return (data ?? []).map(toPrescription);
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(100);
  if (error) { console.error("fetchAuditLogs:", error.message); return []; }
  return (data ?? []).map(toAuditLog);
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const { data, error } = await supabase.from("catalog_items").select("*").order("drug_name");
  if (error) { console.error("fetchCatalog:", error.message); return []; }
  return (data ?? []).map(toCatalogItem);
}

export async function fetchCustomerOrders(): Promise<CustomerOrder[]> {
  const { data, error } = await supabase.from("customer_orders").select("*").order("created_at", { ascending: false });
  if (error) { console.error("fetchCustomerOrders:", error.message); return []; }
  return (data ?? []).map(toCustomerOrder);
}

export async function fetchCompletedSales(): Promise<SaleRecord[]> {
  const { data, error } = await supabase.from("completed_sales").select("*").order("timestamp", { ascending: false });
  if (error) { console.error("fetchCompletedSales:", error.message); return []; }
  return (data ?? []).map(toSaleRecord);
}

export async function fetchStaffProfiles(): Promise<StaffProfile[]> {
  const { data, error } = await supabase.from("staff_profiles").select("*").order("joined_at");
  if (error) { console.error("fetchStaffProfiles:", error.message); return []; }
  return (data ?? []).map(toStaffProfile);
}

// ── Write functions ──────────────────────────────────────────────────────────

export async function insertInventoryBatch(batch: StockBatch) {
  const { error } = await supabase.from("inventory").insert({
    id: batch.id, drug_name: batch.drugName, batch_number: batch.batchNumber,
    expiry_date: batch.expiryDate, safety_threshold: batch.safetyThreshold,
    unit_price: batch.unitPrice, quantity: batch.quantity, quarantined: batch.quarantined,
  });
  if (error) console.error("insertInventoryBatch:", error.message);
}

export async function updateInventoryBatch(id: string, patch: Partial<{ quantity: number; quarantined: boolean }>) {
  const { error } = await supabase.from("inventory").update(patch).eq("id", id);
  if (error) console.error("updateInventoryBatch:", error.message);
}

export async function restoreInventoryStock(batchId: string, amount: number) {
  const { error: rpcError } = await supabase.rpc("increment_inventory_stock", {
    batch_id: batchId,
    amount: amount,
  });

  if (rpcError) {
    const { data: current } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", batchId)
      .single();
    if (current) {
      const newQty = (current.quantity || 0) + amount;
      await supabase.from("inventory").update({ quantity: newQty }).eq("id", batchId);
    }
  }
}

export async function restoreCatalogStock(catalogId: string, amount: number) {
  const { error: rpcError } = await supabase.rpc("increment_catalog_stock", {
    catalog_id: catalogId,
    amount: amount,
  });

  if (rpcError) {
    const { data: current } = await supabase
      .from("catalog_items")
      .select("quantity")
      .eq("id", catalogId)
      .single();
    if (current) {
      const newQty = (current.quantity || 0) + amount;
      await supabase
        .from("catalog_items")
        .update({ quantity: newQty, in_stock: newQty > 0 })
        .eq("id", catalogId);
    }
  }
}

export async function deductInventoryStock(batchId: string, amount: number) {
  const { error: rpcError } = await supabase.rpc("increment_inventory_stock", {
    batch_id: batchId,
    amount: -amount,
  });

  if (rpcError) {
    const { data: current } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", batchId)
      .single();
    if (current) {
      const newQty = Math.max(0, (current.quantity || 0) - amount);
      await supabase.from("inventory").update({ quantity: newQty }).eq("id", batchId);
    }
  }
}

export async function deductCatalogStock(catalogId: string, amount: number) {
  const { error: rpcError } = await supabase.rpc("increment_catalog_stock", {
    catalog_id: catalogId,
    amount: -amount,
  });

  if (rpcError) {
    const { data: current } = await supabase
      .from("catalog_items")
      .select("quantity")
      .eq("id", catalogId)
      .single();
    if (current) {
      const newQty = Math.max(0, (current.quantity || 0) - amount);
      await supabase
        .from("catalog_items")
        .update({ quantity: newQty, in_stock: newQty > 0 })
        .eq("id", catalogId);
    }
  }
}

export async function deleteInventoryBatch(id: string) {
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) console.error("deleteInventoryBatch:", error.message);
}

export async function insertStaffProfile(profile: StaffProfile) {
  const { error } = await supabase.from("staff_profiles").insert({
    id: profile.id, name: profile.name, email: profile.email,
    role: profile.role, status: profile.status, joined_at: profile.joinedAt,
  });
  if (error) console.error("insertStaffProfile:", error.message);
}

export async function updateStaffRole(id: string, role: string) {
  const { error } = await supabase.from("staff_profiles").update({ role }).eq("id", id);
  if (error) console.error("updateStaffRole:", error.message);
}

export async function updateStaffStatus(id: string, status: string) {
  const { error } = await supabase.from("staff_profiles").update({ status }).eq("id", id);
  if (error) console.error("updateStaffStatus:", error.message);
}

export async function updateStaffProfile(
  id: string,
  patch: { name?: string; phone?: string; address?: string; avatar_url?: string }
) {
  const { error } = await supabase.from("staff_profiles").update(patch).eq("id", id);
  if (error) console.error("updateStaffProfile:", error.message);
}

export async function updatePrescriptionStatus(
  id: string,
  status: string,
  extra?: { rejection_reason?: string; verified_at?: string; rejected_at?: string }
) {
  const { error } = await supabase.from("prescriptions").update({ status, ...extra }).eq("id", id);
  if (error) console.error("updatePrescriptionStatus:", error.message);
}

export async function appendAuditLog(log: AuditLogEntry) {
  const { error } = await supabase.from("audit_logs").insert({
    id: log.id, action_type: log.action_type, user_id: log.user_id,
    user_role: log.user_role, payload_delta: log.payload_delta,
  });
  if (error) console.error("appendAuditLog:", error.message);
}

export async function insertCatalogItem(item: CatalogItem) {
  const { error } = await supabase.from("catalog_items").insert({
    id: item.id, drug_name: item.drugName, generic_name: item.genericName,
    dosage: item.dosage, category: item.category, is_rx: item.isRx,
    unit_price: item.unitPrice, quantity: item.quantity, in_stock: item.inStock,
    image_url: item.imageUrl ?? null,
  });
  if (error) console.error("insertCatalogItem:", error.message);
}

export async function insertCustomerOrder(order: CustomerOrder) {
  const { error } = await supabase.from("customer_orders").insert({
    id: order.id, patient_name: order.patientName, items: order.items,
    is_rx: order.isRx, status: order.status, created_at: order.createdAt,
    updated_at: order.updatedAt, pickup_ready: order.pickupReady ?? false,
    contact_full_name: order.contactInfo?.fullName ?? null,
    contact_phone: order.contactInfo?.phone ?? null,
    contact_email: order.contactInfo?.email ?? null,
    contact_address: order.contactInfo?.address ?? null,
    contact_notes: order.contactInfo?.notes ?? null,
    prescription_file_name: order.prescriptionFileName ?? null,
    prescription_notes: order.prescriptionNotes ?? null,
  });
  if (error) console.error("insertCustomerOrder:", error.message);
}

export async function updateCustomerOrderStatus(id: string, status: string) {
  const { error } = await supabase.from("customer_orders")
    .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("updateCustomerOrderStatus:", error.message);
}

export async function insertCompletedSale(sale: SaleRecord) {
  const { error } = await supabase.from("completed_sales").insert({
    id: sale.id, items: sale.items as any, subtotal: sale.subtotal,
    discount: sale.discount as any, discount_amount: sale.discountAmount,
    tax: sale.tax, total: sale.total, payment_method: sale.paymentMethod,
    amount_tendered: sale.amountTendered, change_due: sale.changeDue,
    timestamp: sale.timestamp,
  });
  if (error) console.error("insertCompletedSale:", error.message);
}

export async function insertUploadedPrescription(rx: {
  id: string; fileName: string; fileUrl?: string; doctorName: string;
  targetDrugName?: string; patientNotes?: string; userId?: string;
  requestedQuantity?: number;
}) {
  const { error } = await supabase.from("uploaded_prescriptions").insert({
    id: rx.id, file_name: rx.fileName, file_url: rx.fileUrl ?? null, doctor_name: rx.doctorName,
    target_drug_name: rx.targetDrugName ?? null,
    patient_notes: rx.patientNotes ?? null,
    user_id: rx.userId ?? null, status: "pending_review",
    requested_quantity: rx.requestedQuantity ?? 1,
  });
  if (error) console.error("insertUploadedPrescription:", error.message);
}

export async function fetchUploadedPrescriptions() {
  const { data, error } = await supabase
    .from("uploaded_prescriptions")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error) { console.error("fetchUploadedPrescriptions:", error.message); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    fileName: r.file_name,
    fileUrl: r.file_url ?? undefined,
    doctorName: r.doctor_name,
    targetDrugName: r.target_drug_name ?? undefined,
    patientNotes: r.patient_notes ?? undefined,
    status: r.status,
    uploadedAt: r.uploaded_at,
    userId: r.user_id ?? undefined,
    requestedQuantity: r.requested_quantity ?? 1,
  }));
}

export async function updateUploadedPrescriptionStatus(
  id: string,
  status: "pending_review" | "approved" | "rejected"
) {
  const { error } = await supabase
    .from("uploaded_prescriptions")
    .update({ status })
    .eq("id", id);
  if (error) console.error("updateUploadedPrescriptionStatus:", error.message);
}

export async function uploadPrescriptionImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `prescriptions/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("prescriptions")
      .upload(filePath, file);

    if (uploadError) {
      console.warn("Supabase storage upload error, using local Data URL fallback:", uploadError.message);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: urlData } = supabase.storage
      .from("prescriptions")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn("Storage upload exception, falling back to FileReader:", err);
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
