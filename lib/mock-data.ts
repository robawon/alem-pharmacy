import { AuditLogEntry, CatalogItem, CustomerOrder, Prescription, StaffProfile, StockBatch } from "./types";

export const initialStaffProfiles: StaffProfile[] = [
  { id: "u_admin1", name: "Selam Tesfaye", email: "selam.tesfaye@alempharma.et", role: "admin", status: "active", joinedAt: "2023-02-11T08:00:00.000Z" },
  { id: "u_pharm1", name: "Dr. Bethel Alemu", email: "bethel.alemu@alempharma.et", role: "pharmacist", status: "active", joinedAt: "2023-05-03T08:00:00.000Z" },
  { id: "u_cash1", name: "Yonas Girma", email: "yonas.girma@alempharma.et", role: "cashier", status: "active", joinedAt: "2024-01-20T08:00:00.000Z" },
  { id: "u_inv1", name: "Hana Desta", email: "hana.desta@alempharma.et", role: "inventory", status: "active", joinedAt: "2024-03-14T08:00:00.000Z" },
  { id: "u_pharm2", name: "Dr. Mekdes Fikre", email: "mekdes.fikre@alempharma.et", role: "pharmacist", status: "suspended", joinedAt: "2022-11-02T08:00:00.000Z" },
];

export const initialInventory: StockBatch[] = [
  { id: "b_001", drugName: "Amoxicillin 500mg", batchNumber: "AMX-2024-118", expiryDate: "2026-11-30", safetyThreshold: 50, unitPrice: 2.5, quantity: 420, quarantined: false },
  { id: "b_002", drugName: "Paracetamol 500mg", batchNumber: "PCM-2025-002", expiryDate: "2027-04-15", safetyThreshold: 100, unitPrice: 0.8, quantity: 980, quarantined: false },
  { id: "b_003", drugName: "Warfarin 5mg", batchNumber: "WFN-2024-077", expiryDate: "2026-08-01", safetyThreshold: 20, unitPrice: 4.2, quantity: 65, quarantined: false },
  { id: "b_004", drugName: "Metformin 850mg", batchNumber: "MTF-2023-441", expiryDate: "2026-01-10", safetyThreshold: 40, unitPrice: 1.9, quantity: 18, quarantined: false },
  { id: "b_005", drugName: "Ibuprofen 400mg", batchNumber: "IBU-2025-019", expiryDate: "2027-09-22", safetyThreshold: 60, unitPrice: 1.1, quantity: 512, quarantined: false },
  { id: "b_006", drugName: "Insulin Glargine", batchNumber: "INS-2024-305", expiryDate: "2026-02-28", safetyThreshold: 15, unitPrice: 18.75, quantity: 22, quarantined: false },
];

export const initialPrescriptions: Prescription[] = [
  {
    id: "rx_001",
    patientName: "Abel Mengistu",
    doctorName: "Dr. Selam Worku",
    patientHistory: ["Hypertension (2021)", "Penicillin allergy on file"],
    drugName: "Amoxicillin 500mg",
    batchId: "b_001",
    dosage: "1 capsule / 8h for 7 days",
    prescriptionText: "Amoxicillin 500mg • 1 capsule every 8 hours for 7 days • take with food • no refill",
    conflictWarning: "Patient has a documented penicillin-class allergy — verify before dispensing.",
    status: "pending",
    createdAt: "2026-07-23T06:15:00.000Z",
  },
  {
    id: "rx_002",
    patientName: "Liya Solomon",
    doctorName: "Dr. Hanna Bekele",
    patientHistory: ["Type 2 Diabetes (2019)", "No known allergies"],
    drugName: "Metformin 850mg",
    batchId: "b_004",
    dosage: "1 tablet / 12h",
    prescriptionText: "Metformin 850mg • 1 tablet every 12 hours • continue current dose • refill 2",
    conflictWarning: null,
    status: "pending",
    createdAt: "2026-07-23T06:43:00.000Z",
  },
  {
    id: "rx_003",
    patientName: "Dawit Kebede",
    doctorName: "Dr. Fitsum Tadesse",
    patientHistory: ["Atrial fibrillation (2020)", "Currently on Aspirin 81mg"],
    drugName: "Warfarin 5mg",
    batchId: "b_003",
    dosage: "1 tablet daily",
    prescriptionText: "Warfarin 5mg • 1 tablet once daily • monitor INR and confirm anticoagulation plan",
    conflictWarning: "Concurrent Aspirin use increases bleeding risk — confirm anticoagulation plan.",
    status: "pending",
    createdAt: "2026-07-23T06:58:00.000Z",
  },
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "log_seed_1",
    timestamp: "2026-07-23T05:58:00.000Z",
    action_type: "SHIPMENT_RECEIVED",
    user_id: "u_inv1",
    user_role: "inventory",
    payload_delta: "Received 200 units of Ibuprofen 400mg (batch IBU-2025-019)",
  },
  {
    id: "log_seed_2",
    timestamp: "2026-07-23T06:10:00.000Z",
    action_type: "PRESCRIPTION_VERIFIED",
    user_id: "u_pharm1",
    user_role: "pharmacist",
    payload_delta: "Verified prescription for Paracetamol 500mg — patient Frehiwot Assefa",
  },
];

export const initialCatalog: CatalogItem[] = [
  { id: "cat_001", drugName: "Paracetamol 500mg", genericName: "Acetaminophen", dosage: "500mg", category: "anti_pain", isRx: true, unitPrice: 0.8, quantity: 980, inStock: true },
  { id: "cat_002", drugName: "Ibuprofen 400mg", genericName: "Ibuprofen", dosage: "400mg", category: "anti_pain", isRx: true, unitPrice: 1.1, quantity: 512, inStock: true },
  { id: "cat_003", drugName: "Loratadine 10mg", genericName: "Loratadine", dosage: "10mg", category: "respiratory_drug", isRx: true, unitPrice: 0.5, quantity: 340, inStock: true },
  { id: "cat_004", drugName: "Amoxicillin 500mg", genericName: "Amoxicillin", dosage: "500mg", category: "anti_biotic", isRx: true, unitPrice: 2.5, quantity: 420, inStock: true },
  { id: "cat_005", drugName: "Metformin 850mg", genericName: "Metformin HCl", dosage: "850mg", category: "anti_diabetics", isRx: true, unitPrice: 1.9, quantity: 18, inStock: true },
  { id: "cat_006", drugName: "Warfarin 5mg", genericName: "Warfarin Sodium", dosage: "5mg", category: "cv", isRx: true, unitPrice: 4.2, quantity: 65, inStock: true },
  { id: "cat_007", drugName: "Insulin Glargine", genericName: "Insulin Glargine", dosage: "100U/mL", category: "anti_diabetics", isRx: true, unitPrice: 18.75, quantity: 22, inStock: true },
  { id: "cat_008", drugName: "Vitamin D3 1000IU", genericName: "Cholecalciferol", dosage: "1000IU", category: "vitamins_minerals", isRx: true, unitPrice: 0.3, quantity: 650, inStock: true },
  { id: "cat_009", drugName: "Vitamin C 500mg", genericName: "Ascorbic Acid", dosage: "500mg", category: "vitamins_minerals", isRx: true, unitPrice: 0.25, quantity: 720, inStock: true },
  { id: "cat_010", drugName: "Multivitamin Daily", genericName: "Multivitamin", dosage: "1 tablet", category: "vitamins_minerals", isRx: true, unitPrice: 0.6, quantity: 410, inStock: true },
  { id: "cat_011", drugName: "First Aid Bandages", genericName: "Adhesive Bandage", dosage: "Assorted", category: "medical_equipment", isRx: true, unitPrice: 2.0, quantity: 200, inStock: true },
  { id: "cat_012", drugName: "Antiseptic Cream", genericName: "Bacitracin", dosage: "1oz tube", category: "dermatology", isRx: true, unitPrice: 3.5, quantity: 150, inStock: true },
  { id: "cat_013", drugName: "Metronidazole 500mg", genericName: "Metronidazole", dosage: "500mg", category: "anti_protozal", isRx: true, unitPrice: 1.45, quantity: 280, inStock: true },
  { id: "cat_014", drugName: "Omeprazole 20mg", genericName: "Omeprazole", dosage: "20mg", category: "gi", isRx: true, unitPrice: 0.9, quantity: 195, inStock: true },
  { id: "cat_015", drugName: "Hydrating Facial Cream", genericName: "Skin Care Lotion", dosage: "200ml", category: "cosmetics", isRx: false, unitPrice: 12.50, quantity: 150, inStock: true },
  { id: "cat_016", drugName: "Sunscreen Shield SPF50", genericName: "UV Protection Lotion", dosage: "100ml", category: "cosmetics", isRx: false, unitPrice: 15.00, quantity: 220, inStock: true },
  { id: "cat_017", drugName: "Nasal Spray Relief", genericName: "Oxymetazoline", dosage: "15ml", category: "eye_ear_nasal", isRx: true, unitPrice: 4.50, quantity: 90, inStock: true },
];

export const initialCustomerOrders: CustomerOrder[] = [
  {
    id: "ord_001",
    patientName: "Abel Mengistu",
    items: ["Paracetamol 500mg", "Vitamin C 500mg"],
    isRx: false,
    status: "ready",
    createdAt: "2026-07-22T10:30:00.000Z",
    updatedAt: "2026-07-23T08:15:00.000Z",
    pickupReady: true,
  },
  {
    id: "ord_002",
    patientName: "Abel Mengistu",
    items: ["Amoxicillin 500mg"],
    isRx: true,
    status: "pharmacist_review",
    createdAt: "2026-07-23T06:15:00.000Z",
    updatedAt: "2026-07-23T06:15:00.000Z",
    pickupReady: false,
  },
];
