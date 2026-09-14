"use client";

import React, { createContext, useCallback, useContext, useState, useMemo, useEffect } from "react";
import { AuditLogEntry, CartItem, CatalogItem, CurrentUser, CustomerContactInfo, CustomerOrder, DiscountInfo, ParkedCart, Prescription, Role, SaleRecord, StaffProfile, StockBatch, InPersonOrder, InPersonOrderItem } from "./types";
import { initialAuditLogs, initialCatalog, initialCustomerOrders, initialInventory, initialPrescriptions, initialStaffProfiles } from "./mock-data";
import { currency, newId } from "./utils";
import { createClient } from "./supabase/client";
import {
  fetchInventory, fetchPrescriptions, fetchAuditLogs, fetchCatalog,
  fetchCustomerOrders, fetchCompletedSales, fetchStaffProfiles,
  insertInventoryBatch, updateInventoryBatch, deleteInventoryBatch, updatePrescriptionStatus,
  appendAuditLog, insertCatalogItem, insertCustomerOrder,
  updateCustomerOrderStatus as dbUpdateOrderStatus, insertCompletedSale,
  insertUploadedPrescription, fetchUploadedPrescriptions, updateUploadedPrescriptionStatus,
  insertStaffProfile, updateStaffRole, updateStaffStatus, deleteStaffProfile, updateMedicineRecord,
  updateStaffProfile, restoreInventoryStock, restoreCatalogStock, deductInventoryStock, deductCatalogStock,
  updateCatalogItem,
} from "./db";

import { calculateTaxStatus } from "./tax";

const IN_PERSON_ORDERS_KEY = "alem-pharmacy-in-person-orders";

/** A prescription document uploaded by a customer through the portal */
export interface CustomerPrescriptionUpload {
  id: string;
  fileName: string;
  fileUrl?: string;
  doctorName: string;
  patientNotes: string;
  status: "pending_review" | "approved" | "rejected";
  uploadedAt: string;
  targetDrugName?: string;
  requestedQuantity?: number;
}

interface State {
  currentUser: CurrentUser | null;
  staffProfiles: StaffProfile[];
  inventory: StockBatch[];
  prescriptions: Prescription[];
  cart: CartItem[];
  auditLogs: AuditLogEntry[];
  completedSales: SaleRecord[];
  parkedCarts: ParkedCart[];
  activeDiscount: DiscountInfo | null;
  shiftOpenFloat: number;
  catalog: CatalogItem[];
  customerOrders: CustomerOrder[];
  customerCart: CartItem[];
  uploadedPrescriptions: CustomerPrescriptionUpload[];
  inPersonOrders: InPersonOrder[];
  dbReady: boolean;
}

interface StoreContextType extends State {
  login: (user: CurrentUser) => void;
  logout: () => void;
  updateUserProfile: (patch: { name?: string; avatarUrl?: string }) => void;
  addStaff: (staff: { name: string; email: string; role: Role }) => void;
  removeStaff: (id: string) => void;
  exportAuditLogs: () => void;
  changeRole: (id: string, role: Role) => void;
  toggleStaffStatus: (id: string) => void;
  receiveShipment: (form: any) => void;
  removeStock: (batchId: string) => void;
  updateMedicine: (batchId: string, patch: any) => void;
  disposeStock: (batchId: string) => void;
  verifyPrescription: (id: string) => void;
  quarantineBatch: (batchId: string) => void;
  rejectPrescription: (id: string, reason: string) => void;
  removeFromCart: (batchId: string) => void;
  checkout: () => void;
  addToCart: (batchId: string) => void;
  updateCartQty: (batchId: string, delta: number) => void;
  parkCart: (label: string) => void;
  resumeCart: (cartId: string) => void;
  applyDiscount: (discount: DiscountInfo) => void;
  completeSale: (sale: Omit<SaleRecord, "id" | "timestamp">) => void;
  cancelSale: () => void;
  importRxToCart: (rxId: string) => void;
  closeShift: (closingCash: number) => void;
  // Portal / Customer actions
  addToCustomerCart: (catalogId: string, quantityToAdd?: number, ignoreRxCheck?: boolean) => void;
  removeFromCustomerCart: (catalogId: string) => void;
  updateCustomerCartQty: (catalogId: string, delta: number) => void;
  placeCustomerOrder: (contactInfo: CustomerContactInfo, prescriptionFile?: { fileName: string; notes: string }) => void;
  uploadCustomerPrescription: (upload: Omit<CustomerPrescriptionUpload, "id" | "status" | "uploadedAt">) => void;
  addCatalogItem: (item: Omit<CatalogItem, "id">) => void;
  updateCustomerOrderStatus: (orderId: string, status: string) => void;
  approveUploadedPrescription: (id: string, selectedCatalogId?: string) => void;
  rejectUploadedPrescription: (id: string, reason?: string) => void;
  // In-person order actions (Pharmacist to Cashier)
  createInPersonOrder: (patientName: string, items: InPersonOrderItem[]) => void;
  receiveInPersonOrder: (orderId: string) => void;
  completeInPersonOrder: (orderId: string) => void;
  cancelInPersonOrder: (orderId: string) => void;
  // Dashboard refresh
  refreshDashboardData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [dbReady, setDbReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>(initialStaffProfiles);
  const [inventory, setInventory] = useState<StockBatch[]>(initialInventory);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [completedSales, setCompletedSales] = useState<SaleRecord[]>([]);
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<DiscountInfo | null>(null);
  const [shiftOpenFloat, setShiftOpenFloat] = useState<number>(100);
  const [catalog, setCatalog] = useState<CatalogItem[]>(initialCatalog);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(initialCustomerOrders);
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<CustomerPrescriptionUpload[]>([]);
  const [inPersonOrders, setInPersonOrders] = useState<InPersonOrder[]>([]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === IN_PERSON_ORDERS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setInPersonOrders(parsed);
        } catch (err) {}
      }
    };

    const handleCustomEvent = () => {
      try {
        const saved = window.localStorage.getItem(IN_PERSON_ORDERS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setInPersonOrders(parsed);
        }
      } catch (err) {}
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("in_person_orders_updated", handleCustomEvent);

    try {
      const saved = window.localStorage.getItem(IN_PERSON_ORDERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as InPersonOrder[];
        if (Array.isArray(parsed)) {
          setInPersonOrders(parsed);
        }
      }
    } catch (error) {
      console.warn("Failed to restore in-person orders:", error);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("in_person_orders_updated", handleCustomEvent);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(IN_PERSON_ORDERS_KEY, JSON.stringify(inPersonOrders));
      window.dispatchEvent(new Event("in_person_orders_updated"));
    } catch (error) {
      console.warn("Failed to persist in-person orders:", error);
    }
  }, [inPersonOrders]);

  // ── Bootstrap from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    async function loadFromDB() {
      try {
        const [inv, rx, logs, cat, orders, sales, staff, uploadedRx] = await Promise.all([
          fetchInventory(),
          fetchPrescriptions(),
          fetchAuditLogs(),
          fetchCatalog(),
          fetchCustomerOrders(),
          fetchCompletedSales(),
          fetchStaffProfiles(),
          fetchUploadedPrescriptions(),
        ]);
        setInventory(inv);
        setPrescriptions(rx);
        setAuditLogs(logs);
        setCatalog(cat);
        setCustomerOrders(orders);
        setCompletedSales(sales);
        setStaffProfiles(staff);
        setUploadedPrescriptions(uploadedRx);
      } catch (e) {
        console.warn("Supabase load failed:", e);
      } finally {
        setDbReady(true);
      }
    }
    loadFromDB();

    // Restore current user from Supabase auth session
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("id, name, role, status, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && profile.status !== "suspended") {
        setCurrentUser({
          id: profile.id,
          name: profile.name,
          role: profile.role,
        });
      }
    }).catch((e) => console.warn("Failed to restore session:", e));

    // Live Real-Time Subscriptions
    const channel = supabase
      .channel("realtime-pms-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, () => {
        fetchInventory().then(setInventory).catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "catalog_items" }, () => {
        fetchCatalog().then(setCatalog).catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_orders" }, () => {
        fetchCustomerOrders().then(setCustomerOrders).catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "completed_sales" }, () => {
        fetchCompletedSales().then(setCompletedSales).catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "uploaded_prescriptions" }, () => {
        fetchUploadedPrescriptions().then(setUploadedPrescriptions).catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Real-Time Online/Offline Presence Tracking ────────────────────────────
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const presenceKey = currentUser?.id || `guest-${Math.random().toString(36).substring(2, 9)}`;

    const presenceChannel = supabase.channel("online-presence-room", {
      config: {
        presence: { key: presenceKey },
      },
    });

    const syncPresenceState = () => {
      const state = presenceChannel.presenceState();
      const activeIds = new Set<string>();
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.userId) activeIds.add(p.userId);
        });
      });
      setOnlineUserIds(activeIds);
    };

    presenceChannel
      .on("presence", { event: "sync" }, syncPresenceState)
      .on("presence", { event: "join" }, syncPresenceState)
      .on("presence", { event: "leave" }, syncPresenceState)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUser?.id) {
          await presenceChannel.track({
            userId: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser]);

  const staffProfilesWithPresence = useMemo(() => {
    return staffProfiles.map((staff) => ({
      ...staff,
      isOnline: onlineUserIds.has(staff.id) || (currentUser ? currentUser.id === staff.id : false),
    }));
  }, [staffProfiles, onlineUserIds, currentUser]);

  // ── Unified Customer Catalog (Merges Catalog & Registered Stock Inventory) ─────
  const unifiedCatalog = useMemo(() => {
    const map = new Map<string, CatalogItem>();

    // 1. Add all explicit catalog items
    catalog.forEach((item) => {
      map.set(item.drugName.trim().toLowerCase(), item);
    });

    // 2. Merge in all registered stock items from inventory so they appear on customer portal
    inventory.forEach((batch) => {
      if (batch.quantity <= 0 || batch.quarantined) return;
      const key = batch.drugName.trim().toLowerCase();
      const existing = map.get(key);

      if (existing) {
        const totalQty = Math.max(existing.quantity, batch.quantity);
        map.set(key, {
          ...existing,
          category: batch.category || existing.category,
          quantity: totalQty,
          unitPrice: batch.unitPrice > 0 ? batch.unitPrice : existing.unitPrice,
          inStock: totalQty > 0,
        });
      } else {
        map.set(key, {
          id: `cat_inv_${batch.id}`,
          drugName: batch.drugName,
          genericName: batch.drugName,
          dosage: "",
          category: batch.category || "anti_biotic",
          isRx: batch.category ? batch.category !== "cosmetics" : true,
          unitPrice: batch.unitPrice || 0,
          quantity: batch.quantity || 0,
          inStock: batch.quantity > 0,
        });
      }
    });

    return Array.from(map.values());
  }, [catalog, inventory]);

  // ── Audit log helper ────────────────────────────────────────────────────
  const addLog = useCallback((action_type: string, payload_delta: string) => {
    const entry: AuditLogEntry = {
      id: newId("log"),
      timestamp: new Date().toISOString(),
      action_type,
      user_id: currentUser?.id || "system",
      user_role: currentUser?.role || "customer",
      payload_delta,
    };
    setAuditLogs(prev => [entry, ...prev]);
    // Persist to Supabase (fire-and-forget)
    appendAuditLog(entry).catch(console.error);
  }, [currentUser]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const login = useCallback((user: CurrentUser) => {
    setCurrentUser(user);
    addLog("USER_LOGIN", `User ${user.name} logged in as ${user.role}`);
  }, [addLog]);

  const updateUserProfile = useCallback((patch: { name?: string; avatarUrl?: string }) => {
    setCurrentUser((prev) => prev ? { ...prev, ...patch } : prev);
    if (currentUser) {
      updateStaffProfile(currentUser.id, {
        name: patch.name,
        avatar_url: patch.avatarUrl,
      }).catch(console.error);
    }
  }, [currentUser]);

  const logout = useCallback(async () => {
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase signOut failed:", error.message);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }

    addLog("USER_LOGOUT", `User ${currentUser?.name ?? "unknown"} logged out`);
    setCurrentUser(null);
  }, [addLog, currentUser]);

  // ── Staff ───────────────────────────────────────────────────────────────
  const addStaff = useCallback(({ name, email, role }: { name: string; email: string; role: Role }) => {
    const newStaff: StaffProfile = {
      id: newId("staff"),
      name,
      email,
      role,
      status: "active",
      joinedAt: new Date().toISOString(),
    };
    setStaffProfiles(prev => [...prev, newStaff]);
    insertStaffProfile(newStaff).catch(console.error);
    addLog("ADD_STAFF", `Added staff ${name} as ${role}`);
  }, [addLog]);

  const exportAuditLogs = useCallback(() => {
    addLog("EXPORT_AUDIT_LOGS", "Exported audit logs");
  }, [addLog]);

  const changeRole = useCallback((id: string, role: Role) => {
    setStaffProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p));
    updateStaffRole(id, role).catch(console.error);
    addLog("CHANGE_ROLE", `Changed role for staff ${id} to ${role}`);
  }, [addLog]);

  const toggleStaffStatus = useCallback((id: string) => {
    setStaffProfiles(prev => {
      const target = prev.find(p => p.id === id);
      const nextStatus = target?.status === "active" ? "suspended" : "active";
      updateStaffStatus(id, nextStatus).catch(console.error);
      return prev.map(p => p.id === id ? { ...p, status: nextStatus } : p);
    });
    addLog("TOGGLE_STAFF_STATUS", `Toggled status for staff ${id}`);
  }, [addLog]);

  const removeStaff = useCallback((id: string) => {
    setStaffProfiles(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        addLog("REMOVE_STAFF", `Removed user ${target.name} (${target.email}) from database`);
      }
      return prev.filter(p => p.id !== id);
    });
    deleteStaffProfile(id).catch(console.error);
  }, [addLog]);

  // ── Inventory ───────────────────────────────────────────────────────────
  const receiveShipment = useCallback((form: any) => {
    const newBatch: StockBatch = { ...form, id: newId("batch") };
    setInventory(prev => [...prev, newBatch]);
    insertInventoryBatch(newBatch).catch(console.error);
    addLog("RECEIVE_SHIPMENT", `Received shipment of ${form.drugName} — ${form.quantity} units`);

    // Also sync to catalog so it appears on the customer portal
    setCatalog(prev => {
      const existing = prev.find(c => c.drugName.trim().toLowerCase() === (form.drugName || "").trim().toLowerCase());
      if (existing) {
        const newPrice = Number(form.unitPrice);
        const updatedCat = form.category || existing.category;
        const newQty = existing.quantity + (Number(form.quantity) || 0);
        const finalPrice = !isNaN(newPrice) && newPrice > 0 ? newPrice : existing.unitPrice;

        const updated: CatalogItem = {
          ...existing,
          category: updatedCat,
          quantity: newQty,
          unitPrice: finalPrice,
          inStock: newQty > 0,
        };

        updateCatalogItem(existing.id, {
          category: updatedCat,
          unitPrice: finalPrice,
          quantity: newQty,
          inStock: newQty > 0,
        }).catch(console.error);

        return prev.map(c => c.id === existing.id ? updated : c);
      }
      // Create a new catalog entry from the stock batch
      const newCatalogItem: CatalogItem = {
        id: newId("cat"),
        drugName: form.drugName,
        genericName: form.genericName || form.drugName,
        dosage: form.dosage || "",
        category: form.category || "anti_biotic",
        isRx: form.category ? form.category !== "cosmetics" : true,
        unitPrice: Number(form.unitPrice) || 0,
        quantity: Number(form.quantity) || 0,
        inStock: Number(form.quantity) > 0,
      };
      insertCatalogItem(newCatalogItem).catch(console.error);
      return [newCatalogItem, ...prev];
    });
  }, [addLog]);

  const disposeStock = useCallback((batchId: string) => {
    setInventory(prev => prev.map(b => b.id === batchId ? { ...b, quantity: 0 } : b));
    updateInventoryBatch(batchId, { quantity: 0 }).catch(console.error);
    addLog("DISPOSE_STOCK", `Disposed all remaining stock of batch ${batchId}`);
  }, [addLog]);

  const quarantineBatch = useCallback((batchId: string) => {
    setInventory(prev => prev.map(b => b.id === batchId ? { ...b, quarantined: true } : b));
    updateInventoryBatch(batchId, { quarantined: true }).catch(console.error);
    addLog("QUARANTINE_BATCH", `Quarantined batch ${batchId}`);
  }, [addLog]);

  // ── Prescriptions ────────────────────────────────────────────────────────
  const verifyPrescription = useCallback((id: string) => {
    const now = new Date().toISOString();
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: "verified", verifiedAt: now } : p));
    updatePrescriptionStatus(id, "verified", { verified_at: now }).catch(console.error);
    addLog("VERIFY_PRESCRIPTION", `Verified prescription ${id}`);
  }, [addLog]);

  const rejectPrescription = useCallback((id: string, reason: string) => {
    const now = new Date().toISOString();
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: "rejected", rejectionReason: reason, rejectedAt: now } : p));
    updatePrescriptionStatus(id, "rejected", { rejection_reason: reason, rejected_at: now }).catch(console.error);
    addLog("REJECT_PRESCRIPTION", `Rejected prescription ${id}: ${reason}`);
  }, [addLog]);

  // ── POS Cart ─────────────────────────────────────────────────────────────
  const addToCart = useCallback((batchId: string) => {
    const batch = inventory.find(b => b.id === batchId);
    if (!batch) return;
    setCart(prev => {
      const existing = prev.find(i => i.batchId === batchId);
      if (existing) return prev.map(i => i.batchId === batchId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { batchId: batch.id, drugName: batch.drugName, unitPrice: batch.unitPrice, quantity: 1 }];
    });
  }, [inventory]);

  const updateCartQty = useCallback((batchId: string, delta: number) => {
    setCart(prev => prev.map(i => i.batchId === batchId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  }, []);

  const removeFromCart = useCallback((batchId: string) => {
    setCart(prev => prev.filter(i => i.batchId !== batchId));
  }, []);

  const parkCart = useCallback((label: string) => {
    setParkedCarts(prev => [...prev, { id: newId("park"), label, items: cart, parkedAt: new Date().toISOString() }]);
    setCart([]);
    addLog("PARK_CART", `Parked cart "${label}"`);
  }, [cart, addLog]);

  const resumeCart = useCallback((cartId: string) => {
    const parked = parkedCarts.find(p => p.id === cartId);
    if (parked) {
      setCart(parked.items);
      setParkedCarts(prev => prev.filter(p => p.id !== cartId));
      addLog("RESUME_CART", `Resumed cart "${parked.label}"`);
    }
  }, [parkedCarts, addLog]);

  const applyDiscount = useCallback((discount: DiscountInfo) => {
    setActiveDiscount(discount);
    addLog("APPLY_DISCOUNT", `Applied ${discount.percent}% discount: ${discount.reason}`);
  }, [addLog]);

  const completeSale = useCallback((sale: Omit<SaleRecord, "id" | "timestamp">) => {
    const record: SaleRecord = {
      ...sale,
      id: newId("sale"),
      timestamp: new Date().toISOString(),
      salespersonId: currentUser?.id,
    };
    setCompletedSales(prev => [...prev, record]);
    setCart([]);
    setActiveDiscount(null);

    // Deduct stock from inventory
    setInventory(prev =>
      prev.map(batch => {
        const soldItem = sale.items.find(item => item.batchId === batch.id);
        if (soldItem) {
          return { ...batch, quantity: Math.max(0, batch.quantity - soldItem.quantity) };
        }
        return batch;
      })
    );
    // Also update catalog quantities in sync
    setCatalog(prev =>
      prev.map(cat => {
        const soldItem = sale.items.find(item =>
          item.drugName.toLowerCase() === cat.drugName.toLowerCase()
        );
        if (soldItem) {
          const newQty = Math.max(0, cat.quantity - soldItem.quantity);
          return { ...cat, quantity: newQty, inStock: newQty > 0 };
        }
        return cat;
      })
    );

    insertCompletedSale(record).catch(console.error);
    addLog("COMPLETE_SALE", `Completed sale ${record.id} — ${currency(sale.total)} via ${sale.paymentMethod}`);
  }, [addLog, currentUser]);

  const cancelSale = useCallback(() => {
    setCart([]);
    setActiveDiscount(null);
    addLog("CANCEL_SALE", "Sale cancelled");
  }, [addLog]);

  const importRxToCart = useCallback((rxId: string) => {
    const rx = prescriptions.find(p => p.id === rxId);
    if (!rx) return;
    const batch = inventory.find(b => b.id === rx.batchId);
    if (!batch) return;
    addToCart(batch.id);
    addLog("IMPORT_RX", `Imported Rx ${rxId} to POS cart`);
  }, [prescriptions, inventory, addToCart, addLog]);

  const closeShift = useCallback((closingCash: number) => {
    setShiftOpenFloat(closingCash);
    setCompletedSales([]);
    addLog("CLOSE_SHIFT", `Closed shift with ${currency(closingCash)} cash`);
  }, [addLog]);

  const checkout = useCallback(() => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const record: SaleRecord = {
      id: newId("sale"), items: cart, subtotal: total, discount: activeDiscount,
      discountAmount: 0, tax: 0, total, paymentMethod: "cash",
      amountTendered: total, changeDue: 0, timestamp: new Date().toISOString(),
      salespersonId: currentUser?.id,
    };
    setCompletedSales(prev => [...prev, record]);
    setCart([]);
    insertCompletedSale(record).catch(console.error);

    // Deduct stock
    setInventory(prev =>
      prev.map(batch => {
        const soldItem = cart.find(item => item.batchId === batch.id);
        if (soldItem) {
          return { ...batch, quantity: Math.max(0, batch.quantity - soldItem.quantity) };
        }
        return batch;
      })
    );
    setCatalog(prev =>
      prev.map(cat => {
        const soldItem = cart.find(item =>
          item.drugName.toLowerCase() === cat.drugName.toLowerCase()
        );
        if (soldItem) {
          const newQty = Math.max(0, cat.quantity - soldItem.quantity);
          return { ...cat, quantity: newQty, inStock: newQty > 0 };
        }
        return cat;
      })
    );

    addLog("CHECKOUT", `Quick checkout — ${currency(total)}`);
  }, [cart, activeDiscount, addLog, currentUser]);

  // ── Customer / Portal ────────────────────────────────────────────────────
  const addToCustomerCart = useCallback((catalogId: string, quantityToAdd: number = 1, ignoreRxCheck: boolean = false) => {
    const item = unifiedCatalog.find(c => c.id === catalogId || c.drugName.trim().toLowerCase() === catalogId.trim().toLowerCase());
    if (!item || (!ignoreRxCheck && item.isRx) || !item.inStock || item.quantity <= 0) return;

    const addQty = Math.min(item.quantity, Math.max(1, quantityToAdd));

    // Real-time stock reduction in catalog state
    setCatalog(prev => {
      const idx = prev.findIndex(c => c.id === catalogId || c.drugName.trim().toLowerCase() === item.drugName.trim().toLowerCase());
      if (idx !== -1) {
        const updated = [...prev];
        const newQty = Math.max(0, updated[idx].quantity - addQty);
        updated[idx] = { ...updated[idx], quantity: newQty, inStock: newQty > 0 };
        return updated;
      }
      return prev;
    });

    // Real-time stock reduction in inventory state
    setInventory(prev => {
      const idx = prev.findIndex(b => b.drugName.trim().toLowerCase() === item.drugName.trim().toLowerCase() && b.quantity > 0 && !b.quarantined);
      if (idx !== -1) {
        const updated = [...prev];
        const newQty = Math.max(0, updated[idx].quantity - addQty);
        updated[idx] = { ...updated[idx], quantity: newQty };
        deductInventoryStock(updated[idx].id, addQty).catch(console.error);
        return updated;
      }
      return prev;
    });

    if (!catalogId.startsWith("cat_inv_")) {
      deductCatalogStock(catalogId, addQty).catch(console.error);
    }

    setCustomerCart(prev => {
      const existing = prev.find(i => i.batchId === catalogId);
      if (existing) {
        return prev.map(i => i.batchId === catalogId ? { ...i, quantity: i.quantity + addQty } : i);
      }
      return [...prev, { batchId: catalogId, drugName: item.drugName, unitPrice: item.unitPrice, quantity: addQty }];
    });
    addLog("CUSTOMER_CART_UPDATED", `Customer added ${item.drugName} (qty: ${addQty}) to cart — stock reduced by ${addQty} unit(s)`);
  }, [unifiedCatalog, addLog]);

  const removeFromCustomerCart = useCallback((catalogId: string) => {
    // 1. Locate current cart item outside nested state updaters
    const cartItem = customerCart.find(i => i.batchId === catalogId);
    if (!cartItem) return;

    const qtyToRestore = cartItem.quantity;
    if (qtyToRestore <= 0) return;

    // 2. Remove item from customer cart
    setCustomerCart(prev => prev.filter(i => i.batchId !== catalogId));

    // 3. Restore stock in catalog state
    setCatalog(prev => prev.map(c => {
      if (c.id === catalogId) {
        const newQty = c.quantity + qtyToRestore;
        return { ...c, quantity: newQty, inStock: newQty > 0 };
      }
      return c;
    }));

    // 4. Restore stock in inventory state
    setInventory(prev => {
      const idx = prev.findIndex(b => b.drugName.toLowerCase() === cartItem.drugName.toLowerCase());
      if (idx !== -1) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + qtyToRestore;
        updated[idx] = { ...updated[idx], quantity: newQty };
        restoreInventoryStock(updated[idx].id, qtyToRestore).catch(console.error);
        return updated;
      }
      return prev;
    });

    // 5. Restore stock in Supabase database atomically by exact qtyToRestore
    restoreCatalogStock(catalogId, qtyToRestore).catch(console.error);

    addLog("CUSTOMER_CART_UPDATED", `Customer removed ${cartItem.drugName} (qty: ${qtyToRestore}) from cart — stock restored`);
  }, [customerCart, addLog]);

  const updateCustomerCartQty = useCallback((catalogId: string, delta: number) => {
    const cartItem = customerCart.find(i => i.batchId === catalogId);
    if (!cartItem) return;

    const newQty = cartItem.quantity + delta;

    if (newQty <= 0) {
      removeFromCustomerCart(catalogId);
      return;
    }

    if (delta > 0) {
      const catItem = catalog.find(c => c.id === catalogId);
      if (!catItem || catItem.quantity < delta) return;

      setCustomerCart(prev => prev.map(i => i.batchId === catalogId ? { ...i, quantity: newQty } : i));

      setCatalog(prev => prev.map(c => {
        if (c.id === catalogId) {
          const q = Math.max(0, c.quantity - delta);
          return { ...c, quantity: q, inStock: q > 0 };
        }
        return c;
      }));

      setInventory(prev => {
        const idx = prev.findIndex(b => b.drugName.toLowerCase() === cartItem.drugName.toLowerCase() && b.quantity >= delta);
        if (idx !== -1) {
          const updated = [...prev];
          const q = Math.max(0, updated[idx].quantity - delta);
          updated[idx] = { ...updated[idx], quantity: q };
          deductInventoryStock(updated[idx].id, delta).catch(console.error);
          return updated;
        }
        return prev;
      });

      deductCatalogStock(catalogId, delta).catch(console.error);
    } else if (delta < 0) {
      const amountToRestore = Math.abs(delta);

      setCustomerCart(prev => prev.map(i => i.batchId === catalogId ? { ...i, quantity: newQty } : i));

      setCatalog(prev => prev.map(c => {
        if (c.id === catalogId) {
          const q = c.quantity + amountToRestore;
          return { ...c, quantity: q, inStock: q > 0 };
        }
        return c;
      }));

      setInventory(prev => {
        const idx = prev.findIndex(b => b.drugName.toLowerCase() === cartItem.drugName.toLowerCase());
        if (idx !== -1) {
          const updated = [...prev];
          const q = updated[idx].quantity + amountToRestore;
          updated[idx] = { ...updated[idx], quantity: q };
          restoreInventoryStock(updated[idx].id, amountToRestore).catch(console.error);
          return updated;
        }
        return prev;
      });

      restoreCatalogStock(catalogId, amountToRestore).catch(console.error);
    }
  }, [customerCart, catalog, removeFromCustomerCart]);

  const placeCustomerOrder = useCallback((contactInfo: CustomerContactInfo, prescriptionFile?: { fileName: string; notes: string }) => {
    if (customerCart.length === 0) return;
    const orderId = newId("ord");
    const now = new Date().toISOString();
    const itemNames = customerCart.map(i => i.drugName);
    const hasRx = customerCart.some(i => catalog.find(c => c.id === i.batchId)?.isRx);
    const order: CustomerOrder = {
      id: orderId,
      patientName: contactInfo.fullName || currentUser?.name || "Guest",
      items: itemNames,
      isRx: hasRx,
      status: hasRx ? "pharmacist_review" : "placed",
      createdAt: now,
      updatedAt: now,
      pickupReady: false,
      contactInfo,
      prescriptionFileName: prescriptionFile?.fileName,
      prescriptionNotes: prescriptionFile?.notes,
    };
    setCustomerOrders(prev => [order, ...prev]);
    setCustomerCart([]);
    insertCustomerOrder(order).catch(console.error);
    addLog("CUSTOMER_ORDER_PLACED", `Order ${orderId} placed by ${contactInfo.fullName} (${contactInfo.phone}) — items: ${itemNames.join(", ")}`);
  }, [customerCart, currentUser, catalog, addLog]);

  const updateCustomerOrderStatus = useCallback((orderId: string, status: string) => {
    setCustomerOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o));
    dbUpdateOrderStatus(orderId, status).catch(console.error);
    addLog("ORDER_STATUS_UPDATED", `Order ${orderId} → ${status}`);
  }, [addLog]);

  const uploadCustomerPrescription = useCallback(
    (upload: Omit<CustomerPrescriptionUpload, "id" | "status" | "uploadedAt">) => {
      const newUpload: CustomerPrescriptionUpload = {
        ...upload,
        id: newId("rxup"),
        status: "pending_review",
        uploadedAt: new Date().toISOString(),
      };
      setUploadedPrescriptions(prev => [newUpload, ...prev]);
      insertUploadedPrescription({
        id: newUpload.id,
        fileName: newUpload.fileName,
        fileUrl: newUpload.fileUrl,
        doctorName: newUpload.doctorName,
        targetDrugName: newUpload.targetDrugName,
        patientNotes: newUpload.patientNotes,
        userId: currentUser?.id,
        requestedQuantity: newUpload.requestedQuantity || 1,
      }).catch(console.error);
      addLog("PRESCRIPTION_UPLOADED", `Customer uploaded Rx: ${upload.fileName} (Qty: ${upload.requestedQuantity || 1}) — Dr. ${upload.doctorName}`);

      const reqQty = upload.requestedQuantity || 1;
      const targetName = upload.targetDrugName;

      // Find matching item in catalog and add directly to customerCart
      let matchingItem = targetName ? catalog.find(c => c.drugName.toLowerCase() === targetName.toLowerCase()) : undefined;
      if (!matchingItem && targetName) {
        matchingItem = catalog.find(c => c.drugName.toLowerCase().includes(targetName.toLowerCase()));
      }

      if (matchingItem) {
        addToCustomerCart(matchingItem.id, reqQty, true);
      } else if (targetName) {
        // Fallback item entry for customer cart if catalog item not found by exact name
        setCustomerCart(prev => {
          const existing = prev.find(i => i.drugName.toLowerCase() === targetName.toLowerCase());
          if (existing) {
            return prev.map(i => i.drugName.toLowerCase() === targetName.toLowerCase() ? { ...i, quantity: i.quantity + reqQty } : i);
          }
          return [...prev, { batchId: `rx_${Date.now()}`, drugName: targetName, unitPrice: 5.0, quantity: reqQty }];
        });
      }

      // Auto-create a customer order for pharmacist review when prescription is submitted
      const orderId = newId("ord");
      const now = new Date().toISOString();
      const order: CustomerOrder = {
        id: orderId,
        patientName: currentUser?.name || "Patient",
        items: targetName ? [targetName] : ["Uploaded Prescription Medication"],
        isRx: true,
        status: "pharmacist_review",
        createdAt: now,
        updatedAt: now,
        prescriptionFileName: newUpload.fileName,
        prescriptionNotes: newUpload.patientNotes,
        contactInfo: {
          fullName: currentUser?.name || "",
          phone: "",
          email: "",
          address: "",
          notes: newUpload.patientNotes || "",
        },
      };
      setCustomerOrders(prev => [order, ...prev]);
      insertCustomerOrder(order).catch(console.error);
      addLog("CUSTOMER_ORDER_PLACED", `Order ${orderId} auto-created from prescription upload for pharmacist review`);
    },
    [addLog, currentUser, catalog, addToCustomerCart]
  );

  const addCatalogItem = useCallback((item: Omit<CatalogItem, "id">) => {
    const newItem: CatalogItem = { ...item, id: newId("cat") };
    setCatalog(prev => [newItem, ...prev]);
    insertCatalogItem(newItem).catch(console.error);
    addLog("CATALOG_ITEM_ADDED", `Admin added new medicine: ${item.drugName} (${item.category})`);

    // Also create a stock batch so it appears in inventory (Stock & Batch Control table)
    const newBatch: StockBatch = {
      id: newId("batch"),
      drugName: item.drugName,
      category: item.category,
      batchNumber: `BATCH-${Date.now()}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      safetyThreshold: 10,
      unitPrice: item.unitPrice || 0,
      quantity: Number(item.quantity) || 0,
      quarantined: false,
    };
    setInventory(prev => [...prev, newBatch]);
    insertInventoryBatch(newBatch).catch(console.error);
  }, [addLog]);

  const removeStock = useCallback((batchId: string) => {
    // Capture batch info before removing from state
    const batch = inventory.find(b => b.id === batchId);
    // Remove from inventory
    setInventory(prev => prev.filter(b => b.id !== batchId));
    // Also remove the corresponding catalog item(s) by matching drug name
    if (batch) {
      setCatalog(prev => prev.filter(c =>
        c.drugName.toLowerCase() !== batch.drugName.toLowerCase()
      ));
    }
    // Delete from database so it does not reappear after refresh
    deleteInventoryBatch(batchId).catch(console.error);
    addLog("REMOVE_STOCK", `Permanently removed batch ${batchId} from stock`);
  }, [addLog, inventory]);

  const updateMedicine = useCallback((batchId: string, patch: any) => {
    let targetDrugName = patch.oldDrugName;
    setInventory(prev => prev.map(b => {
      if (b.id === batchId) {
        if (!targetDrugName) targetDrugName = b.drugName;
        return {
          ...b,
          drugName: patch.drugName !== undefined ? patch.drugName : b.drugName,
          category: patch.category !== undefined ? patch.category : b.category,
          batchNumber: patch.batchNumber !== undefined ? patch.batchNumber : b.batchNumber,
          expiryDate: patch.expiryDate !== undefined ? patch.expiryDate : b.expiryDate,
          safetyThreshold: patch.safetyThreshold !== undefined ? Number(patch.safetyThreshold) : b.safetyThreshold,
          unitPrice: patch.unitPrice !== undefined ? Number(patch.unitPrice) : b.unitPrice,
          quantity: patch.quantity !== undefined ? Number(patch.quantity) : b.quantity,
        };
      }
      return b;
    }));

    setCatalog(prev => prev.map(c => {
      const matchName = targetDrugName || patch.drugName;
      if (c.id === batchId || (matchName && c.drugName.toLowerCase() === matchName.toLowerCase())) {
        const newQty = patch.quantity !== undefined ? Number(patch.quantity) : c.quantity;
        return {
          ...c,
          drugName: patch.drugName !== undefined ? patch.drugName : c.drugName,
          genericName: patch.genericName !== undefined ? patch.genericName : c.genericName,
          dosage: patch.dosage !== undefined ? patch.dosage : c.dosage,
          category: patch.category !== undefined ? patch.category : c.category,
          isRx: patch.isRx !== undefined ? patch.isRx : c.isRx,
          unitPrice: patch.unitPrice !== undefined ? Number(patch.unitPrice) : c.unitPrice,
          quantity: newQty,
          inStock: newQty > 0,
        };
      }
      return c;
    }));

    updateMedicineRecord(batchId, patch).catch(console.error);
    addLog("UPDATE_MEDICINE", `Updated medicine details for ${patch.drugName || batchId}`);
  }, [addLog]);

  // ── In-Person Orders (Pharmacist → Cashier) ──────────────────────────────
  const createInPersonOrder = useCallback((patientName: string, items: (InPersonOrderItem & { category?: string })[]) => {
    if (items.length === 0 || !currentUser) return;
    const orderId = newId("ipo");
    const now = new Date().toISOString();
    const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const tax = items.reduce((acc, item) => {
      const taxRes = calculateTaxStatus(item.category, item.drugName);
      return acc + (item.unitPrice * item.quantity * taxRes.taxRate);
    }, 0);
    const order: InPersonOrder = {
      id: orderId,
      patientName,
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      status: "pending_cashier",
      createdBy: currentUser.id,
      createdAt: now,
    };
    setInPersonOrders(prev => [order, ...prev]);
    addLog("IN_PERSON_ORDER_CREATED", `Pharmacist created order ${orderId} for ${patientName} — ${items.length} items, ${currency(order.total)}`);
  }, [currentUser, addLog]);

  const receiveInPersonOrder = useCallback((orderId: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    setInPersonOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: "ready_for_checkout",
      receivedBy: currentUser.id,
      receivedAt: now,
    } : o));
    addLog("IN_PERSON_ORDER_RECEIVED", `Cashier received order ${orderId}`);
  }, [currentUser, addLog]);

  const completeInPersonOrder = useCallback((orderId: string) => {
    const now = new Date().toISOString();
    const order = inPersonOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Mark order as completed
    setInPersonOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "completed", completedAt: now } : o));
    
    // Create a receipt/sale record for the order
    const saleRecord: SaleRecord = {
      id: newId("sale"),
      items: order.items.map(item => ({
        batchId: item.id,
        drugName: item.drugName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      subtotal: order.subtotal,
      discount: null,
      discountAmount: 0,
      tax: order.tax,
      total: order.total,
      paymentMethod: "cash",
      amountTendered: order.total,
      changeDue: 0,
      timestamp: now,
      salespersonId: currentUser?.id,
    };
    setCompletedSales(prev => [...prev, saleRecord]);
    insertCompletedSale(saleRecord).catch(console.error);
    
    // Deduct stock for the in-person order items
    setInventory(prev =>
      prev.map(batch => {
        const soldItem = order.items.find(item =>
          item.drugName.toLowerCase() === batch.drugName.toLowerCase()
        );
        if (soldItem) {
          return { ...batch, quantity: Math.max(0, batch.quantity - soldItem.quantity) };
        }
        return batch;
      })
    );
    setCatalog(prev =>
      prev.map(cat => {
        const soldItem = order.items.find(item =>
          item.drugName.toLowerCase() === cat.drugName.toLowerCase()
        );
        if (soldItem) {
          const newQty = Math.max(0, cat.quantity - soldItem.quantity);
          return { ...cat, quantity: newQty, inStock: newQty > 0 };
        }
        return cat;
      })
    );

    addLog("IN_PERSON_ORDER_COMPLETED", `Order ${orderId} completed and paid — Receipt ${saleRecord.id} created`);
  }, [inPersonOrders, addLog, currentUser]);

  const cancelInPersonOrder = useCallback((orderId: string) => {
    setInPersonOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    addLog("IN_PERSON_ORDER_CANCELLED", `Order ${orderId} was cancelled`);
  }, [addLog]);

  const approveUploadedPrescription = useCallback(
    (uploadId: string, selectedCatalogId?: string) => {
      setUploadedPrescriptions(prev =>
        prev.map(u => u.id === uploadId ? { ...u, status: "approved" } : u)
      );
      updateUploadedPrescriptionStatus(uploadId, "approved").catch(console.error);

      const upload = uploadedPrescriptions.find(u => u.id === uploadId);
      const qtyToDeduct = upload?.requestedQuantity || 1;
      const targetName = upload?.targetDrugName || upload?.fileName || "Prescription Item";

      if (selectedCatalogId) {
        const item = catalog.find(c => c.id === selectedCatalogId);
        if (item && item.quantity > 0) {
          const deductAmt = Math.min(item.quantity, qtyToDeduct);
          setCatalog(prev => prev.map(c => c.id === selectedCatalogId ? { ...c, quantity: Math.max(0, c.quantity - deductAmt), inStock: c.quantity - deductAmt > 0 } : c));
          deductCatalogStock(selectedCatalogId, deductAmt).catch(console.error);
          setInventory(prev => {
            const idx = prev.findIndex(b => b.drugName.toLowerCase() === item.drugName.toLowerCase() && b.quantity > 0);
            if (idx !== -1) {
              const updated = [...prev];
              const q = Math.max(0, updated[idx].quantity - deductAmt);
              updated[idx] = { ...updated[idx], quantity: q };
              deductInventoryStock(updated[idx].id, deductAmt).catch(console.error);
              return updated;
            }
            return prev;
          });
        }
      }

      addLog("PRESCRIPTION_APPROVED", `Pharmacist approved prescription upload ${uploadId} for ${targetName} (Qty: ${qtyToDeduct})`);
    },
    [uploadedPrescriptions, catalog, addLog]
  );

  const rejectUploadedPrescription = useCallback(
    (uploadId: string, reason?: string) => {
      setUploadedPrescriptions(prev =>
        prev.map(u => u.id === uploadId ? { ...u, status: "rejected" } : u)
      );
      updateUploadedPrescriptionStatus(uploadId, "rejected").catch(console.error);
      addLog("PRESCRIPTION_REJECTED", `Pharmacist rejected prescription upload ${uploadId}${reason ? `: ${reason}` : ""}`);
    },
    [addLog]
  );

  // ── Dashboard Refresh ────────────────────────────────────────────────────
  const refreshDashboardData = useCallback(async () => {
    try {
      const [inv, rx, logs, cat, orders, sales, staff, uploadedRx] = await Promise.all([
        fetchInventory(),
        fetchPrescriptions(),
        fetchAuditLogs(),
        fetchCatalog(),
        fetchCustomerOrders(),
        fetchCompletedSales(),
        fetchStaffProfiles(),
        fetchUploadedPrescriptions(),
      ]);
      setInventory(inv);
      setPrescriptions(rx);
      setAuditLogs(logs);
      setCatalog(cat);
      setCustomerOrders(orders);
      setCompletedSales(sales);
      setStaffProfiles(staff);
      setUploadedPrescriptions(uploadedRx);
    } catch (e) {
      console.warn("Dashboard refresh failed:", e);
    }
  }, []);

  const value = useMemo(() => ({
    dbReady, currentUser, staffProfiles: staffProfilesWithPresence, inventory, prescriptions, cart, auditLogs,
    completedSales, parkedCarts, activeDiscount, shiftOpenFloat, catalog: unifiedCatalog,
    customerOrders, customerCart, uploadedPrescriptions, inPersonOrders,
    login, logout, updateUserProfile, addStaff, removeStaff, exportAuditLogs, changeRole, toggleStaffStatus,
    receiveShipment, removeStock, updateMedicine, disposeStock, verifyPrescription, quarantineBatch,
    rejectPrescription, removeFromCart, checkout, addToCart, updateCartQty,
    parkCart, resumeCart, applyDiscount, completeSale, cancelSale,
    importRxToCart, closeShift, addToCustomerCart, removeFromCustomerCart,
    updateCustomerCartQty, placeCustomerOrder, uploadCustomerPrescription,
    addCatalogItem, updateCustomerOrderStatus, approveUploadedPrescription, rejectUploadedPrescription,
    createInPersonOrder, receiveInPersonOrder, completeInPersonOrder, cancelInPersonOrder,
    refreshDashboardData,
  }), [
    dbReady, currentUser, staffProfilesWithPresence, inventory, prescriptions, cart, auditLogs,
    completedSales, parkedCarts, activeDiscount, shiftOpenFloat, unifiedCatalog,
    customerOrders, customerCart, uploadedPrescriptions, inPersonOrders,
    login, logout, updateUserProfile, addStaff, removeStaff, exportAuditLogs, changeRole, toggleStaffStatus,
    receiveShipment, removeStock, updateMedicine, disposeStock, verifyPrescription, quarantineBatch,
    rejectPrescription, removeFromCart, checkout, addToCart, updateCartQty,
    parkCart, resumeCart, applyDiscount, completeSale, cancelSale,
    importRxToCart, closeShift, addToCustomerCart, removeFromCustomerCart,
    updateCustomerCartQty, placeCustomerOrder, uploadCustomerPrescription,
    addCatalogItem, updateCustomerOrderStatus, approveUploadedPrescription, rejectUploadedPrescription,
    createInPersonOrder, receiveInPersonOrder, completeInPersonOrder, cancelInPersonOrder,
    refreshDashboardData,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useStore must be used within a StoreProvider");
  return context;
}
