/**
 * lib/ocr.ts
 * OCR & Intelligent Text Parsing for Medicine List Review & Import
 */
import { CATEGORIES } from "@/components/ui/CategorySelect";
import { DrugCategory } from "./types";

export interface ExtractedMedicine {
  tempId: string;
  category: DrugCategory;
  categoryLabel: string;
  drugName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM or YYYY-MM-DD
  quantity: number | "";
  unitPrice: number | "";
  needsReview: boolean;
  reviewReasons: string[];
  isExisting: boolean;
  existingBatchId?: string;
  existingOldQty?: number;
  existingOldPrice?: number;
  userDecision?: "update" | "new_batch" | "skip";
}

export interface ImportHistoryRecord {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  details?: { name: string; action: string; status: string; reason?: string }[];
}

/**
 * Category heading matcher helper
 */
function matchCategoryHeader(line: string): { category: DrugCategory; label: string } | null {
  const norm = line.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "");
  if (!norm) return null;

  for (const cat of CATEGORIES) {
    const catLabelUpper = cat.label.toUpperCase();
    const catValUpper = cat.value.toUpperCase().replace(/_/g, " ");

    if (norm === catLabelUpper || norm === catValUpper) {
      return { category: cat.value, label: cat.label };
    }
    // Check partial key words
    if (cat.value === "anti_biotic" && (norm.includes("ANTIBIOTIC") || norm.includes("ANTI BIOTIC"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "anti_diabetics" && (norm.includes("DIABETIC") || norm.includes("ANTI DIABETIC"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "anti_pain" && (norm.includes("PAIN") || norm.includes("ANALGESIC"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "anti_protozal" && norm.includes("PROTOZOAL")) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "vitamins_minerals" && (norm.includes("VITAMIN") || norm.includes("MINERAL") || norm.includes("SUPPLEMENT"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "dermatology" && (norm.includes("DERMATOLOGY") || norm.includes("SKIN"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "respiratory_drug" && norm.includes("RESPIRATORY")) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "cosmetics" && norm.includes("COSMETIC")) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "medical_equipment" && (norm.includes("EQUIPMENT") || norm.includes("MEDICAL SUPPLIES"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "eye_ear_nasal" && (norm.includes("EYE") || norm.includes("EAR") || norm.includes("NASAL"))) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "cns_drugs" && norm.includes("CNS")) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "cv" && (norm.includes("CARDIO") || norm === "CV")) {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "gi" && norm === "GI") {
      return { category: cat.value, label: cat.label };
    }
    if (cat.value === "hormonal_drug" && norm.includes("HORMON")) {
      return { category: cat.value, label: cat.label };
    }
  }

  return null;
}

/**
 * Standardize Expiry Date Format to YYYY-MM or YYYY-MM-DD
 */

export function normalizeExpiryDate(raw: string): { date: string; valid: boolean } {
  const cleaned = raw.trim();
  if (!cleaned) return { date: "", valid: false };

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return { date: cleaned, valid: true };
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(cleaned)) return { date: cleaned, valid: true };

  // MM/YYYY or MM-YYYY
  let m = cleaned.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const month = m[1].padStart(2, "0");
    const year = m[2];
    if (Number(month) >= 1 && Number(month) <= 12) {
      return { date: `${year}-${month}`, valid: true };
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  m = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year = m[3];
    if (Number(month) >= 1 && Number(month) <= 12) {
      return { date: `${year}-${month}-${day}`, valid: true };
    }
  }

  // MM/YY or MM-YY
  m = cleaned.match(/^(\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const month = m[1].padStart(2, "0");
    const year = "20" + m[2];
    if (Number(month) >= 1 && Number(month) <= 12) {
      return { date: `${year}-${month}`, valid: true };
    }
  }

  return { date: cleaned, valid: false };
}

/**
 * Parse raw extracted OCR text into structured ExtractedMedicine array
 */
export function parseOCRText(text: string): ExtractedMedicine[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ExtractedMedicine[] = [];

  let currentCategory: DrugCategory = "anti_biotic";
  let currentCategoryLabel = "Anti Biotic";

  let i = 0;
  let counter = 1;

  while (i < lines.length) {
    const line = lines[i];

    // Check if line is a Category Header
    const matchedCat = matchCategoryHeader(line);
    if (matchedCat) {
      currentCategory = matchedCat.category;
      currentCategoryLabel = matchedCat.label;
      i++;
      continue;
    }

    // Skip short noise or dividers
    if (line.length < 2 || /^[\=\-\_\*]+$/.test(line)) {
      i++;
      continue;
    }

    // Check if this line is part of a medicine record block or a single-line record
    // Let's parse multi-line or single-line
    let name = line;
    let batch = "";
    let expiry = "";
    let qty: number | "" = "";
    let price: number | "" = "";

    // Extract inline attributes if present on line (e.g. "Amoxicillin 500mg Batch: AB123 Exp: 2028-06 Qty: 50 Price: 25")
    const batchMatch = line.match(/(?:batch|b\/n|b\.n|lot|lot\s*no|b#)[\:\#\s]*([a-z0-9\-]+)/i);
    const expMatch = line.match(/(?:expiry|exp|exp\.?|exp\s*date)[\:\s]*([0-9\/\-]+)/i);
    const qtyMatch = line.match(/(?:qty|quantity|stock|units)[\:\s]*(\d+)/i);
    const priceMatch = line.match(/(?:price|unit\s*price|cost|etb|\$)[\:\s]*([\d\.]+)/i);

    if (batchMatch || expMatch || qtyMatch || priceMatch) {
      if (batchMatch) batch = batchMatch[1].trim();
      if (expMatch) expiry = expMatch[1].trim();
      if (qtyMatch) qty = parseInt(qtyMatch[1], 10);
      if (priceMatch) price = parseFloat(priceMatch[1]);

      // Remove the matched metadata parts from medicine name string
      name = line
        .replace(/(?:batch|b\/n|b\.n|lot|lot\s*no|b#)[\:\#\s]*[a-z0-9\-]+/gi, "")
        .replace(/(?:expiry|exp|exp\.?|exp\s*date)[\:\s]*[0-9\/\-]+/gi, "")
        .replace(/(?:qty|quantity|stock|units)[\:\s]*\d+/gi, "")
        .replace(/(?:price|unit\s*price|cost|etb|\$)[\:\s]*[\d\.]+/gi, "")
        .trim();
    }

    // Peek ahead up to 4 lines for key-value pairs if not all found
    let peekOffset = 1;
    while (i + peekOffset < lines.length && peekOffset <= 4) {
      const nextLine = lines[i + peekOffset];
      if (matchCategoryHeader(nextLine)) break;

      const nBatch = nextLine.match(/^(?:batch|b\/n|b\.n|lot|lot\s*no|b#)[\:\#\s]*([a-z0-9\-]+)$/i);
      const nExp = nextLine.match(/^(?:expiry|exp|exp\.?|exp\s*date)[\:\s]*([0-9\/\-]+)$/i);
      const nQty = nextLine.match(/^(?:qty|quantity|stock|units)[\:\s]*(\d+)$/i);
      const nPrice = nextLine.match(/^(?:price|unit\s*price|cost|etb|\$)[\:\s]*([\d\.]+)$/i);

      if (nBatch && !batch) {
        batch = nBatch[1].trim();
        peekOffset++;
        continue;
      }
      if (nExp && !expiry) {
        expiry = nExp[1].trim();
        peekOffset++;
        continue;
      }
      if (nQty && qty === "") {
        qty = parseInt(nQty[1], 10);
        peekOffset++;
        continue;
      }
      if (nPrice && price === "") {
        price = parseFloat(nPrice[1]);
        peekOffset++;
        continue;
      }

      break;
    }

    // Normalize Expiry
    const normalizedExp = normalizeExpiryDate(expiry);

    // Review flag detection
    const reviewReasons: string[] = [];
    if (!name.trim()) reviewReasons.push("Missing medicine name");
    if (!batch) reviewReasons.push("Batch number missing / needs review");
    if (!expiry || !normalizedExp.valid) reviewReasons.push("Expiry date format uncertain");
    if (qty === "" || isNaN(Number(qty))) reviewReasons.push("Quantity missing / needs review");
    if (price === "" || isNaN(Number(price))) reviewReasons.push("Unit price missing / needs review");

    items.push({
      tempId: `import-${Date.now()}-${counter++}`,
      category: currentCategory,
      categoryLabel: currentCategoryLabel,
      drugName: name.trim() || line,
      batchNumber: batch,
      expiryDate: normalizedExp.date || expiry,
      quantity: qty,
      unitPrice: price,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      isExisting: false,
    });

    i += peekOffset;
  }

  return items;
}
