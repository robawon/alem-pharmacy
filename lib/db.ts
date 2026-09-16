/**
 * lib/db.ts
 * Database helper functions — thin wrappers around supabase client.
 * Each function maps Supabase snake_case columns → app camelCase types.
 */
import { createClient } from "./supabase/client";
import type {
  AuditLogEntry, CatalogItem, CustomerOrder, Prescription,
  SaleRecord, StaffProfile, StockBatch, CustomerContactInfo,
  InPersonOrder, InPersonOrderStatus,
} from "./types";

const supabase = createClient();

// ── Mappers ─────────────────────────────────────────────────────────────────

function toStockBatch(r: any): StockBatch {
  return {
    id: r.id, drugName: r.drug_name, batchNumber: r.batch_number,
    expiryDate: r.expiry_date, safetyThreshold: r.safety_threshold,
    unitPrice: Number(r.unit_price), quantity: r.quantity, quarantined: r.quarantined,
    category: r.category ?? undefined,
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
  const pharmacistName =
    r.pharmacist?.full_name ||
    r.pharmacist?.name ||
    r.staff_profiles?.full_name ||
    r.staff_profiles?.name ||
    r.pharmacist_name ||
    undefined;

  const cashierName =
    r.cashier_staff?.full_name ||
    r.cashier_staff?.name ||
    r.cashier?.full_name ||
    r.cashier?.name ||
    r.cashier_name ||
    undefined;

  return {
    id: r.id,
    items: r.items ?? [],
    subtotal: Number(r.subtotal),
    discount: r.discount ?? null,
    discountAmount: Number(r.discount_amount),
    tax: Number(r.tax),
    total: Number(r.total),
    paymentMethod: r.payment_method,
    amountTendered: Number(r.amount_tendered),
    changeDue: Number(r.change_due),
    timestamp: r.timestamp,
    salespersonId: r.salesperson_id || r.pharmacist_id || r.user_id || undefined,
    pharmacistName,
    cashierId: r.cashier_id || undefined,
    cashierName,
  };
}

// ── Fetch functions ─────────────────────────────────────────────────────────

export async function fetchInventory(): Promise<StockBatch[]> {
  const allRows: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("fetchInventory:", error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows.map(toStockBatch);
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
  const allRows: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("catalog_items")
      .select("*")
      .order("drug_name")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("fetchCatalog:", error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows.map(toCatalogItem);
}

export async function fetchCustomerOrders(): Promise<CustomerOrder[]> {
  const { data, error } = await supabase.from("customer_orders").select("*").order("created_at", { ascending: false });
  if (error) { console.error("fetchCustomerOrders:", error.message); return []; }
  return (data ?? []).map(toCustomerOrder);
}

// ── Pharmacy Orders (Pharmacist → Cashier in-person orders) ──────────────────
// Uses the dedicated pharmacy_orders table with its own status check constraint.
// The old customer_orders + prescription_file_name="IN_PERSON_ORDER" hack has been
// removed because its CHECK CONSTRAINT rejected 'pending_cashier' and
// 'ready_for_checkout', silently dropping every INSERT.

function toInPersonOrder(r: any): InPersonOrder {
  return {
    id: r.id,
    patientName: r.patient_name,
    // items is stored as JSONB, so Supabase returns it already parsed
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    total: Number(r.total),
    status: r.status as InPersonOrderStatus,
    createdBy: r.created_by ?? "",
    createdAt: r.created_at,
    receivedBy: r.received_by ?? undefined,
    receivedAt: r.received_at ?? undefined,
    completedAt: r.completed_at ?? undefined,
    saleId: r.sale_id ?? undefined,
  };
}

export async function fetchPharmacyOrders(): Promise<InPersonOrder[]> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchPharmacyOrders:", error.message);
    return [];
  }

  return (data ?? []).map(toInPersonOrder);
}

export async function insertPharmacyOrder(order: InPersonOrder): Promise<{ error: string | null }> {
  const { error } = await supabase.from("pharmacy_orders").insert({
    id: order.id,
    patient_name: order.patientName,
    items: order.items,          // JSONB — no serialisation needed
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    status: order.status,        // 'pending_cashier' — valid in pharmacy_orders
    created_by: order.createdBy,
    created_at: order.createdAt,
  });
  if (error) {
    console.error("insertPharmacyOrder:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function updatePharmacyOrder(
  orderId: string,
  patch: Partial<{
    status: InPersonOrderStatus;
    receivedBy: string | null;
    receivedAt: string | null;
    completedAt: string | null;
    saleId: string | null;
  }>
): Promise<{ error: string | null }> {
  const dbPatch: Record<string, any> = {};
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.receivedBy !== undefined) dbPatch.received_by = patch.receivedBy;
  if (patch.receivedAt !== undefined) dbPatch.received_at = patch.receivedAt;
  if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt;
  if (patch.saleId !== undefined) dbPatch.sale_id = patch.saleId;

  const { error } = await supabase.from("pharmacy_orders").update(dbPatch).eq("id", orderId);
  if (error) {
    console.error("updatePharmacyOrder:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function claimPharmacyOrder(orderId: string, saleId: string): Promise<{ claimed: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .update({ sale_id: saleId })
    .eq("id", orderId)
    .eq("status", "ready_for_checkout")
    .is("sale_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("claimPharmacyOrder:", error.message);
    return { claimed: false, error: error.message };
  }
  return { claimed: Boolean(data), error: null };
}

export async function fetchCompletedSales(): Promise<SaleRecord[]> {
  // Join completed_sales with staff_profiles table using salesperson_id & cashier_id foreign keys
  const { data, error } = await supabase
    .from("completed_sales")
    .select("*, pharmacist:staff_profiles!salesperson_id(id, name, email, role), cashier_staff:staff_profiles!cashier_id(id, name, email, role)")
    .order("timestamp", { ascending: false });

  if (error) {
    // Fallback: fetch without explicit FK join alias if relationship is implicit or unconstrained
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("completed_sales")
      .select("*, staff_profiles(id, name)")
      .order("timestamp", { ascending: false });

    if (fallbackErr) {
      const { data: simpleData, error: simpleErr } = await supabase
        .from("completed_sales")
        .select("*")
        .order("timestamp", { ascending: false });

      if (simpleErr) {
        console.error("fetchCompletedSales:", simpleErr.message);
        return [];
      }
      return (simpleData ?? []).map(toSaleRecord);
    }
    return (fallbackData ?? []).map(toSaleRecord);
  }

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
    id: batch.id,
    drug_name: batch.drugName,
    batch_number: batch.batchNumber,
    expiry_date: batch.expiryDate,
    safety_threshold: batch.safetyThreshold,
    unit_price: batch.unitPrice,
    quantity: batch.quantity,
    quarantined: batch.quarantined,
  });

  if (error) {
    throw new Error(`Failed to insert inventory batch: ${error.message}`);
  }
}

export async function updateCatalogItem(
  catalogId: string,
  patch: Partial<{ category: string; unitPrice: number; quantity: number; inStock: boolean; drugName: string }>
) {
  const dbPatch: Record<string, any> = {};
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.unitPrice !== undefined) dbPatch.unit_price = patch.unitPrice;
  if (patch.quantity !== undefined) {
    dbPatch.quantity = patch.quantity;
    dbPatch.in_stock = patch.quantity > 0;
  }
  if (patch.inStock !== undefined) dbPatch.in_stock = patch.inStock;
  if (patch.drugName !== undefined) dbPatch.drug_name = patch.drugName;

  const { error } = await supabase.from("catalog_items").update(dbPatch).eq("id", catalogId);
  if (error) {
    console.error("updateCatalogItem error:", error.message);
    throw new Error(`Failed to update catalog item: ${error.message}`);
  }
}

export async function updateInventoryBatch(id: string, patch: Partial<{ quantity: number; quarantined: boolean }>) {
  const { error } = await supabase.from("inventory").update(patch).eq("id", id);
  if (error) {
    console.error("updateInventoryBatch error:", error.message);
    throw new Error(`Failed to update inventory batch: ${error.message}`);
  }
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
  if (error) {
    console.error("deleteInventoryBatch error:", error.message);
    throw new Error(`Failed to delete inventory batch: ${error.message}`);
  }
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

export async function deleteStaffProfile(id: string) {
  const { error } = await supabase.from("staff_profiles").delete().eq("id", id);
  if (error) console.error("deleteStaffProfile:", error.message);
}

export async function updateMedicineRecord(
  batchId: string,
  patch: {
    drugName?: string;
    genericName?: string;
    dosage?: string;
    category?: string;
    isRx?: boolean;
    unitPrice?: number;
    quantity?: number;
    batchNumber?: string;
    expiryDate?: string;
    safetyThreshold?: number;
  }
) {
  const invPatch: Record<string, any> = {};
  if (patch.drugName !== undefined) invPatch.drug_name = patch.drugName;
  if (patch.batchNumber !== undefined) invPatch.batch_number = patch.batchNumber;
  if (patch.expiryDate !== undefined) invPatch.expiry_date = patch.expiryDate;
  if (patch.safetyThreshold !== undefined) invPatch.safety_threshold = patch.safetyThreshold;
  if (patch.unitPrice !== undefined) invPatch.unit_price = patch.unitPrice;
  if (patch.quantity !== undefined) invPatch.quantity = patch.quantity;

  if (Object.keys(invPatch).length > 0) {
    const { error: invErr } = await supabase.from("inventory").update(invPatch).eq("id", batchId);
    if (invErr) {
      console.error("updateMedicineRecord (inventory) error:", invErr.message);
      throw new Error(`Failed to update inventory record: ${invErr.message}`);
    }
  }

  const catPatch: Record<string, any> = {};
  if (patch.drugName !== undefined) catPatch.drug_name = patch.drugName;
  if (patch.genericName !== undefined) catPatch.generic_name = patch.genericName;
  if (patch.dosage !== undefined) catPatch.dosage = patch.dosage;
  if (patch.category !== undefined) catPatch.category = patch.category;
  if (patch.isRx !== undefined) catPatch.is_rx = patch.isRx;
  if (patch.unitPrice !== undefined) catPatch.unit_price = patch.unitPrice;
  if (patch.quantity !== undefined) {
    catPatch.quantity = patch.quantity;
    catPatch.in_stock = patch.quantity > 0;
  }

  if (Object.keys(catPatch).length > 0) {
    const { error: catErr } = await supabase.from("catalog_items").update(catPatch).eq("id", batchId);
    if (catErr) {
      console.error("updateMedicineRecord (catalog) error:", catErr.message);
      // Not throwing if catalog item with exact batchId doesn't exist
    }
  }
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

export async function insertCompletedSale(sale: SaleRecord): Promise<Record<string, unknown>> {
  const payload = {
    id: sale.id,
    items: sale.items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    discount_amount: sale.discountAmount,
    tax: sale.tax,
    total: sale.total,
    payment_method: sale.paymentMethod,
    amount_tendered: sale.amountTendered,
    change_due: sale.changeDue,
    timestamp: sale.timestamp,
  };

  console.log("=== CASHIER SALE START ===");
  console.log("SALE RECORD:", sale);

  if (!Number.isFinite(sale.total) || Number.isNaN(Date.parse(sale.timestamp))) {
    throw new Error("completed_sales insert failed: sale total or timestamp is invalid");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  console.log("SUPABASE AUTH USER:", user);
  console.log("SUPABASE AUTH ERROR:", authError);
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("SUPABASE SESSION:", sessionData.session);

  const { data, error } = await supabase
    .from("completed_sales")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("COMPLETED SALE INSERT FAILED:", error);
    console.error("=== CASHIER SALE DATABASE ERROR ===", error);
    throw new Error(`completed_sales insert failed: ${error.message}`);
  }

  console.log("=== CASHIER SALE DATABASE RESULT ===", data);
  console.log("COMPLETED SALE INSERTED:", data);
  return data as Record<string, unknown>;
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
