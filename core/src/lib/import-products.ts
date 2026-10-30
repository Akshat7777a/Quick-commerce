import { csvToRecords } from "./csv";
import { slugify } from "./format";
import type { Category, Product } from "./types";

/**
 * Validates a products CSV (from the owner's billing/inventory software or an
 * export of this store) into rows ready for insert/update.
 *
 * Matching: a row updates an existing product when its `slug` (or name, when
 * no slug is given) matches one; otherwise it creates a new product.
 * Required columns: name, price. Everything else is optional.
 */

export type ProductImportPayload = {
  id?: string;
  name: string;
  slug: string;
  category_id: string | null;
  price: number;
  mrp: number | null;
  unit: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  image_url: string | null;
};

export type ProductImportRow = {
  row: number; // 1-based data row (header is not counted)
  action: "create" | "update";
  errors: string[];
  /** Original category cell, resolved to a category_id by the caller. */
  category_ref: string | null;
  payload: ProductImportPayload;
};

export type ProductImport = {
  fileErrors: string[];
  rows: ProductImportRow[];
  /** Case-insensitive category references no existing category matched. */
  missingCategories: string[];
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, "_");

const parseNumber = (value: string): number | null => {
  const cleaned = value.replace(/[₹,\s]/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value: string, fallback: boolean): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "") return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
};

export function parseProductImport(
  csvText: string,
  opts: { existing: Product[]; categories: Category[]; createMissingCategories: boolean },
): ProductImport {
  const { headers, records } = csvToRecords(csvText);
  const fileErrors: string[] = [];
  const rows: ProductImportRow[] = [];
  const missingCategories = new Set<string>();

  if (records.length === 0 && headers.length === 0) {
    return { fileErrors: ["That file is empty."], rows, missingCategories: [] };
  }

  const known = new Set(headers.map(normalizeKey));
  for (const required of ["name", "price"]) {
    if (!known.has(required)) fileErrors.push(`Missing required column: ${required}`);
  }
  if (fileErrors.length > 0) {
    fileErrors.push(`Found: ${headers.join(", ") || "(no header row)"}`);
    return { fileErrors, rows, missingCategories: [] };
  }

  const byKey = (record: Record<string, string>, ...keys: string[]): string => {
    for (const key of keys) {
      const match = headers.find((header) => normalizeKey(header) === key);
      if (match && record[match] !== undefined) return record[match].trim();
    }
    return "";
  };

  const existingBySlug = new Map<string, Product>();
  const existingByName = new Map<string, Product>();
  for (const product of opts.existing) {
    existingBySlug.set(product.slug.toLowerCase(), product);
    existingByName.set(product.name.toLowerCase(), product);
  }
  const categoryByRef = new Map<string, Category>();
  for (const category of opts.categories) {
    categoryByRef.set(category.slug.toLowerCase(), category);
    categoryByRef.set(category.name.toLowerCase(), category);
  }

  const seenSlugs = new Set<string>();

  records.forEach((record, index) => {
    const row = index + 1;
    const errors: string[] = [];

    const name = byKey(record, "name");
    const rawPrice = byKey(record, "price");
    const rawMrp = byKey(record, "mrp");
    const rawStock = byKey(record, "stock");
    const rawCategory = byKey(record, "category", "category_slug");
    const rawImage = byKey(record, "image_url", "image");
    const rawActive = byKey(record, "is_active", "active");
    const rawFeatured = byKey(record, "is_featured", "featured");

    if (!name) errors.push("name is required");
    if (name.length > 160) errors.push("name is too long (max 160 characters)");

    const price = parseNumber(rawPrice);
    if (rawPrice === "") errors.push("price is required");
    else if (price === null || price < 0) errors.push(`price "${rawPrice}" is not a valid amount`);

    let mrp: number | null = null;
    if (rawMrp !== "") {
      mrp = parseNumber(rawMrp);
      if (mrp === null || mrp < 0) errors.push(`mrp "${rawMrp}" is not a valid amount`);
      else if (price !== null && mrp < price) errors.push("mrp cannot be lower than the price");
    }

    let stock = 0;
    if (rawStock !== "") {
      const parsedStock = parseNumber(rawStock);
      if (parsedStock === null || !Number.isInteger(parsedStock) || parsedStock < 0) {
        errors.push(`stock "${rawStock}" must be a whole number of 0 or more`);
      } else {
        stock = parsedStock;
      }
    }

    if (rawActive !== "" && !["true", "false", "1", "0", "yes", "no", "y", "n"].includes(rawActive.toLowerCase())) {
      errors.push(`is_active "${rawActive}" must be true or false`);
    }
    if (rawFeatured !== "" && !["true", "false", "1", "0", "yes", "no", "y", "n"].includes(rawFeatured.toLowerCase())) {
      errors.push(`is_featured "${rawFeatured}" must be true or false`);
    }

    if (rawImage && !/^(https?:\/\/|\/|data:image\/)/i.test(rawImage)) {
      errors.push("image_url must start with http://, https:// or /");
    }

    let slug = byKey(record, "slug") || slugify(name);
    if (!slug) slug = `product-${row}`;
    if (seenSlugs.has(slug)) errors.push(`duplicate slug "${slug}" in this file`);
    seenSlugs.add(slug);

    const match = existingBySlug.get(slug.toLowerCase()) ?? (name ? existingByName.get(name.toLowerCase()) : undefined);

    let category_ref: string | null = null;
    if (rawCategory) {
      const found = categoryByRef.get(rawCategory.toLowerCase());
      if (found) category_ref = found.slug;
      else if (opts.createMissingCategories) {
        category_ref = rawCategory;
        missingCategories.add(rawCategory);
      } else {
        errors.push(`unknown category "${rawCategory}". Create it first or enable auto-create`);
      }
    }

    rows.push({
      row,
      errors,
      action: match ? "update" : "create",
      category_ref,
      payload: {
        id: match?.id,
        name: name || match?.name || "",
        slug,
        category_id: foundCategoryId(rawCategory, categoryByRef),
        price: price ?? 0,
        mrp,
        unit: byKey(record, "unit") || match?.unit || "1 pc",
        stock,
        is_active: parseBoolean(rawActive, match?.is_active ?? true),
        is_featured: parseBoolean(rawFeatured, match?.is_featured ?? false),
        description: byKey(record, "description") || match?.description || null,
        image_url: rawImage || match?.image_url || null,
      },
    });
  });

  return { fileErrors, rows, missingCategories: [...missingCategories] };
}

function foundCategoryId(rawCategory: string, categoryByRef: Map<string, Category>): string | null {
  if (!rawCategory) return null;
  return categoryByRef.get(rawCategory.toLowerCase())?.id ?? null;
}

export const PRODUCT_IMPORT_HEADERS = [
  "name",
  "slug",
  "category",
  "price",
  "mrp",
  "unit",
  "stock",
  "is_active",
  "is_featured",
  "description",
  "image_url",
];

/** A ready-to-edit example file so the owner sees the expected shape. */
export const PRODUCT_IMPORT_TEMPLATE = [
  PRODUCT_IMPORT_HEADERS.join(","),
  [
    "Fresh Bananas",
    "fresh-bananas-6pc",
    "fruits-vegetables",
    "48",
    "60",
    "6 pc",
    "120",
    "true",
    "false",
    '"Fresh farm bananas, 6 piece bunch"',
    "https://example.com/bananas.jpg",
  ].join(","),
  ["Toor Dal 1kg", "toor-dal-1kg", "staples", "142", "", "1 kg", "40", "true", "false", "", ""].join(","),
].join("\r\n") + "\r\n";
