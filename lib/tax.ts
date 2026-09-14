/**
 * lib/tax.ts
 * Medication Tax Calculation Logic
 *
 * Strict Tax Rules:
 * 1. By default, no medication has tax (tax rate = 0 or hasTax = false).
 * 2. For the category 'Vitamins and Minerals' (or 'vitamins_minerals'), check the specific medication name.
 * 3. If it is a Vitamin (e.g., name contains 'Vitamin', 'Vit', 'C', 'B12', etc.), apply tax (15%).
 * 4. If it is a Mineral (e.g., name contains 'Zinc', 'Iron', 'Calcium', 'Magnesium', etc.), do NOT apply tax.
 * 5. All other categories are tax-free.
 */

export interface TaxCalculationResult {
  hasTax: boolean;
  taxRate: number; // e.g. 0.15 for 15%, 0 for 0%
  badgeLabel: "No Tax" | "Tax Applied";
  reason: string;
}

export const MINERAL_KEYWORDS = [
  "ZINC",
  "IRON",
  "CALCIUM",
  "MAGNESIUM",
  "POTASSIUM",
  "SELENIUM",
  "COPPER",
  "MANGANESE",
  "IODINE",
  "CHROMIUM",
  "SODIUM",
  "PHOSPHORUS",
];

export const VITAMIN_KEYWORDS = [
  "VITAMIN",
  "VIT",
  "B12",
  "B6",
  "B1",
  "B2",
  "B3",
  "B5",
  "B7",
  "B9",
  "D3",
  "FOLIC",
  "ASCORBIC",
  "MULTIVITAMIN",
  "MULTIVIT",
];

/**
 * Calculates tax status based on medication category and drug name.
 */
export function calculateTaxStatus(category?: string, drugName?: string): TaxCalculationResult {
  const normCategory = (category || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  const isVitaminsAndMinerals =
    normCategory === "vitaminsminerals" ||
    normCategory.includes("vitamin") ||
    normCategory.includes("mineral");

  // Rule 1 & 5: Default & all other categories are tax-free
  if (!isVitaminsAndMinerals) {
    return {
      hasTax: false,
      taxRate: 0,
      badgeLabel: "No Tax",
      reason: "Tax-free category",
    };
  }

  const normName = (drugName || "").trim().toUpperCase();

  if (!normName) {
    return {
      hasTax: false,
      taxRate: 0,
      badgeLabel: "No Tax",
      reason: "Vitamins & Minerals (Select or type medication name)",
    };
  }

  // Rule 4: Check if it is a Mineral (Minerals take precedence as tax-free)
  const isMineral = MINERAL_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(normName) || normName.includes(kw);
  });

  if (isMineral) {
    return {
      hasTax: false,
      taxRate: 0,
      badgeLabel: "No Tax",
      reason: "Mineral — Exempt from tax",
    };
  }

  // Rule 3: Check if it is a Vitamin
  const isExplicitVitaminWord = /\bVITAMIN\b|\bVIT\b|\bMULTIVITAMIN\b|\bMULTIVIT\b/i.test(normName);
  const isVitaminCode = /\b(B12|B6|B1|B2|B3|B5|B7|B9|D3|C|D|E|K|A)\b/i.test(normName) ||
    VITAMIN_KEYWORDS.some((kw) => normName.includes(kw));

  if (isExplicitVitaminWord || isVitaminCode) {
    return {
      hasTax: true,
      taxRate: 0.15,
      badgeLabel: "Tax Applied",
      reason: "Vitamin — 15% Tax Applied",
    };
  }

  // If in Vitamins & Minerals category but neither explicitly a mineral nor vitamin, default to tax-free
  return {
    hasTax: false,
    taxRate: 0,
    badgeLabel: "No Tax",
    reason: "Tax-free",
  };
}
