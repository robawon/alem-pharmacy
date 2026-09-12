export type Role = "admin" | "pharmacist" | "cashier" | "inventory" | "customer";

export type StaffStatus = "active" | "suspended";

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: StaffStatus;
  joinedAt: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

/**
 * Immutable audit log entry. Once appended, entries are never edited or removed
 * from the array — mirrors the append-only design of the Supabase `audit_logs` table,
 * which in production is protected by a Postgres rule / RLS policy disallowing
 * UPDATE and DELETE for every role, including admin.
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  action_type: string;
  user_id: string;
  user_role: Role;
  payload_delta: string;
}

export interface StockBatch {
  id: string;
  drugName: string;
  category?: DrugCategory;
  batchNumber: string;
  expiryDate: string; // ISO date
  safetyThreshold: number;
  unitPrice: number;
  quantity: number;
  quarantined: boolean;
}

export type PrescriptionStatus = "pending" | "verified" | "rejected";

export interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  patientHistory: string[];
  drugName: string;
  batchId: string;
  dosage: string;
  prescriptionText: string;
  conflictWarning: string | null;
  status: PrescriptionStatus;
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
}

export interface CartItem {
  batchId: string;
  drugName: string;
  unitPrice: number;
  quantity: number;
}

export interface InPersonOrderItem {
  id: string;
  drugName: string;
  dosage?: string;
  genericName?: string;
  unitPrice: number;
  quantity: number;
}

export type InPersonOrderStatus = "pending_cashier" | "ready_for_checkout" | "completed" | "cancelled";

export interface InPersonOrder {
  id: string;
  patientName: string;
  items: InPersonOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InPersonOrderStatus;
  createdBy: string; // Pharmacist ID
  createdAt: string;
  receivedBy?: string; // Cashier ID
  receivedAt?: string;
  completedAt?: string;
}

export interface DiscountInfo {
  percent: number;
  reason: string;
}

export interface SaleRecord {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: DiscountInfo | null;
  discountAmount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile";
  amountTendered: number;
  changeDue: number;
  timestamp: string;
  salespersonId?: string;
}

export interface ParkedCart {
  id: string;
  label: string;
  items: CartItem[];
  parkedAt: string;
}

export type DrugCategory =
  | "anti_diabetics"
  | "anti_biotic"
  | "anti_pain"
  | "anti_protozal"
  | "cns_drugs"
  | "cv"
  | "dermatology"
  | "eye_ear_nasal"
  | "gi"
  | "hormonal_drug"
  | "medical_equipment"
  | "respiratory_drug"
  | "vitamins_minerals"
  | "cosmetics";

export interface CatalogItem {
  id: string;
  drugName: string;
  genericName: string;
  dosage: string;
  category: DrugCategory;
  isRx: boolean;
  unitPrice: number;
  quantity: number;
  inStock: boolean;
  imageUrl?: string;
}

export type OrderStatus = "placed" | "pharmacist_review" | "preparing" | "ready" | "completed" | "cancelled";

export interface CustomerContactInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface CustomerOrder {
  id: string;
  patientName: string;
  items: string[];
  isRx: boolean;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  pickupReady?: boolean;
  contactInfo?: CustomerContactInfo;
  prescriptionFileName?: string;
  prescriptionNotes?: string;
}
