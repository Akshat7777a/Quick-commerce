import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Layers,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Ticket,
  Upload,
  Users,
  X,
} from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { cn, slugify } from "../../lib/format";
import { downloadCsv, recordsToCsv, todayStamp } from "../../lib/csv";
import { EXPORT_DATASETS, type ExportDataset } from "../../lib/exports";
import {
  PRODUCT_IMPORT_HEADERS,
  PRODUCT_IMPORT_TEMPLATE,
  parseProductImport,
  type ProductImportPayload,
} from "../../lib/import-products";
import { AdminPageHeader } from "./AdminLayout";
import { Spinner } from "../../components/ui";
import type { Category, Product } from "../../lib/types";

const DATASET_ICONS: Record<string, typeof Package> = {
  products: Package,
  sales: ReceiptText,
  orders: ShoppingBag,
  customers: Users,
  categories: Layers,
  coupons: Ticket,
  banners: ImageIcon,
  settings: Settings,
};

const PREVIEW_LIMIT = 12;

export function AdminData() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [autoCategories, setAutoCategories] = useState(true);
  const [importing, setImporting] = useState(false);

  const refreshCatalogue = async () => {
    const [productRows, categoryRows] = await Promise.all([
      api.listProducts({ includeInactive: true }),
      api.adminListCategories(),
    ]);
    setProducts(productRows);
    setCategories(categoryRows);
  };

  useEffect(() => {
    let mounted = true;
    refreshCatalogue()
      .catch((caught) => {
        toast(errorMessage(caught, "Couldn't load the catalogue"), "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = useMemo(
    () =>
      fileText
        ? parseProductImport(fileText, {
            existing: products,
            categories,
            createMissingCategories: autoCategories,
          })
        : null,
    [fileText, products, categories, autoCategories],
  );

  const validRows = useMemo(
    () => parsed?.rows.filter((row) => row.errors.length === 0) ?? [],
    [parsed],
  );
  const errorRows = useMemo(
    () => parsed?.rows.filter((row) => row.errors.length > 0) ?? [],
    [parsed],
  );
  const createCount = validRows.filter((row) => row.action === "create").length;
  const updateCount = validRows.length - createCount;

  const handleExport = async (dataset: ExportDataset) => {
    setWorking(dataset.id);
    try {
      const records = await dataset.load();
      downloadCsv(`${dataset.file}-${todayStamp()}.csv`, recordsToCsv(dataset.columns, records));
      toast(`Downloaded ${records.length} row${records.length === 1 ? "" : "s"} as CSV`, "success");
    } catch (caught) {
      toast(errorMessage(caught, `Couldn't export ${dataset.label}`), "error");
    } finally {
      setWorking(null);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Please keep CSV files under 5 MB.", "error");
      return;
    }
    try {
      const text = await file.text();
      setFileText(text);
      setFileName(file.name);
    } catch {
      toast("Couldn't read that file. Please choose a .csv file.", "error");
    }
  };

  const clearFile = () => {
    setFileText(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = async () => {
    if (!parsed || validRows.length === 0) return;
    setImporting(true);
    try {
      // 1. Create any categories the file references but the store lacks.
      let allCategories = categories;
      if (autoCategories && parsed.missingCategories.length > 0) {
        const created: Category[] = [];
        for (const name of parsed.missingCategories) {
          try {
            created.push(await api.saveCategory({ name, slug: slugify(name) || `category-${created.length + 1}` }));
          } catch (caught) {
            toast(`Category "${name}": ${errorMessage(caught)}`, "error");
          }
        }
        if (created.length > 0) allCategories = [...categories, ...created];
      }

      // 2. Resolve each row's category and split create vs update.
      const categoryIds = new Map<string, string>();
      for (const category of allCategories) {
        categoryIds.set(category.slug.toLowerCase(), category.id);
        categoryIds.set(category.name.toLowerCase(), category.id);
      }
      const create: ProductImportPayload[] = [];
      const update: ProductImportPayload[] = [];
      for (const row of validRows) {
        const payload: ProductImportPayload = { ...row.payload };
        if (!payload.category_id && row.category_ref) {
          payload.category_id = categoryIds.get(row.category_ref.toLowerCase()) ?? null;
        }
        (row.action === "create" ? create : update).push(payload);
      }

      await api.adminImportProducts(create, update);
      toast(
        `Imported ${createCount} new product${createCount === 1 ? "" : "s"}` +
          `${updateCount > 0 ? ` and updated ${updateCount}` : ""}.`,
        "success",
      );
      clearFile();
      await refreshCatalogue();
    } catch (caught) {
      toast(errorMessage(caught, "Import failed: nothing was partially applied"), "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Data"
        title="Import & export"
        description="Move your catalogue and sales data in and out as CSV: import products straight from your billing software, export anything to Excel."
      />

      {/* ------------------------------------------------------------- import */}
      <section className="rounded-[1.35rem] border border-line bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl text-ink">Import products from CSV</h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-ink-soft">
              Export a product list from your existing software as CSV (or use a file exported from
              this store) and upload it here. Matching happens on{" "}
              <span className="font-medium text-ink">slug</span>: matching rows are updated, new
              rows are created. Only <span className="font-medium text-ink">name</span> and{" "}
              <span className="font-medium text-ink">price</span> are required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv("lmart-products-template.csv", PRODUCT_IMPORT_TEMPLATE)}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <Download className="size-3.5" /> Download template
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="btn btn-primary btn-sm cursor-pointer">
            <Upload className="size-3.5" /> {fileName ? "Choose a different file" : "Choose CSV file"}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Product CSV file"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
          {fileName && (
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-cream-2 px-3 py-1.5 text-[11px] text-ink">
              <FileText className="size-3.5" /> {fileName}
              <button type="button" onClick={clearFile} className="text-ink-soft hover:text-clay" aria-label="Remove file">
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          )}

          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[11.5px] text-ink-soft">
            <input
              type="checkbox"
              checked={autoCategories}
              onChange={(event) => setAutoCategories(event.target.checked)}
              className="size-3.5 accent-[#2f8a58]"
            />
            Create missing categories automatically
          </label>
        </div>

        <p className="mt-3 rounded-xl border border-dashed border-line bg-cream/50 px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-soft">
          Accepted columns:{" "}
          {PRODUCT_IMPORT_HEADERS.map((header) => (
            <code key={header} className="mr-1.5 rounded bg-white px-1.5 py-0.5 text-[10.5px] text-ink">
              {header}
            </code>
          ))}
          <span className="mt-1.5 block">
            Excel users: File → Save As → “CSV (Comma delimited)”. Extra columns are ignored.
          </span>
        </p>

        {loading && !parsed && (
          <div className="flex justify-center py-8">
            <Spinner className="text-forest" />
          </div>
        )}

        {parsed && (
          <div className="mt-5 space-y-4">
            {parsed.fileErrors.length > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-clay/25 bg-clay/[0.06] px-4 py-3 text-[12px] leading-relaxed text-clay">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  {parsed.fileErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              </div>
            )}

            {parsed.fileErrors.length === 0 && (
              <>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#1c6b3f]/20 bg-[#e8f4ec] px-3 py-1 text-[11px] font-medium text-[#1c6b3f]">
                    {createCount} new
                  </span>
                  <span className="rounded-full border border-gold/30 bg-gold/15 px-3 py-1 text-[11px] font-medium text-[#8a6415]">
                    {updateCount} update{updateCount === 1 ? "" : "s"}
                  </span>
                  {errorRows.length > 0 && (
                    <span className="rounded-full border border-clay/25 bg-clay/[0.07] px-3 py-1 text-[11px] font-medium text-clay">
                      {errorRows.length} need{errorRows.length === 1 ? "s" : ""} attention
                    </span>
                  )}
                  {parsed.missingCategories.length > 0 && autoCategories && (
                    <span className="rounded-full border border-line bg-cream-2 px-3 py-1 text-[11px] text-ink-soft">
                      +{parsed.missingCategories.length} categor
                      {parsed.missingCategories.length === 1 ? "y" : "ies"} to create
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[34rem] text-left text-[11.5px]">
                    <thead className="bg-cream/70 text-[9.5px] uppercase tracking-[0.12em] text-ink-soft">
                      <tr>
                        <th className="px-3 py-2 font-medium">Row</th>
                        <th className="px-3 py-2 font-medium">Action</th>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 text-right font-medium">Price</th>
                        <th className="px-3 py-2 text-right font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {parsed.rows.slice(0, PREVIEW_LIMIT).map((row) => {
                        const hasError = row.errors.length > 0;
                        return (
                          <tr key={row.row} className={cn(hasError && "bg-clay/[0.04]")}>
                            <td className="px-3 py-2 text-ink-soft">{row.row}</td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-wide",
                                  hasError
                                    ? "border-clay/25 bg-clay/[0.07] text-clay"
                                    : row.action === "create"
                                      ? "border-[#1c6b3f]/20 bg-[#e8f4ec] text-[#1c6b3f]"
                                      : "border-gold/30 bg-gold/15 text-[#8a6415]",
                                )}
                              >
                                {hasError ? "error" : row.action}
                              </span>
                            </td>
                            <td className="max-w-[14rem] px-3 py-2">
                              <span className="block truncate text-ink">{row.payload.name || "-"}</span>
                              {hasError && (
                                <span className="mt-0.5 block text-[10px] leading-snug text-clay">
                                  {row.errors.join(" · ")}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-ink-soft">{row.category_ref ?? "-"}</td>
                            <td className="px-3 py-2 text-right text-ink">₹{row.payload.price}</td>
                            <td className="px-3 py-2 text-right text-ink-soft">{row.payload.stock}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {parsed.rows.length > PREVIEW_LIMIT && (
                  <p className="text-[11px] text-ink-soft">
                    Showing first {PREVIEW_LIMIT} of {parsed.rows.length} rows.
                    {errorRows.length > 0 && ` All ${errorRows.length} problem rows are listed below and will be skipped.`}
                  </p>
                )}

                {errorRows.length > 0 && (
                  <div className="rounded-xl border border-clay/25 bg-clay/[0.05] px-4 py-3">
                    <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-clay">
                      <AlertTriangle className="size-3.5" /> Rows that will be skipped
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-clay/90">
                      {errorRows.slice(0, 8).map((row) => (
                        <li key={row.row}>
                          Row {row.row}
                          {row.payload.name ? ` (${row.payload.name})` : ""}: {row.errors.join(" · ")}
                        </li>
                      ))}
                      {errorRows.length > 8 && <li>…and {errorRows.length - 8} more.</li>}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void runImport()}
                    disabled={importing || validRows.length === 0}
                    className="btn btn-primary"
                  >
                    {importing ? <Spinner /> : <CheckCircle2 className="size-4" />}
                    Import {validRows.length} row{validRows.length === 1 ? "" : "s"}
                  </button>
                  <button type="button" onClick={clearFile} disabled={importing} className="btn btn-secondary">
                    Cancel
                  </button>
                  {validRows.length === 0 && errorRows.length > 0 && (
                    <p className="text-[11.5px] text-clay">No valid rows to import. Fix the file and re-upload.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- export */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Export</p>
            <h2 className="mt-1 text-2xl text-ink">Download anything as CSV</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              Standard CSV files: open them in Excel, Google Sheets or your own software.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EXPORT_DATASETS.map((dataset) => {
            const Icon = DATASET_ICONS[dataset.id] ?? FileText;
            const busy = working === dataset.id;
            return (
              <div
                key={dataset.id}
                className="flex flex-col rounded-[1.1rem] border border-line bg-card p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-2 text-forest">
                    <Icon className="size-4" strokeWidth={1.7} />
                  </span>
                  <h3 className="text-[13.5px] font-semibold text-ink">{dataset.label}</h3>
                </div>
                <p className="mt-2 flex-1 text-[11px] leading-relaxed text-ink-soft">
                  {dataset.description}
                </p>
                <button
                  type="button"
                  onClick={() => void handleExport(dataset)}
                  disabled={Boolean(working)}
                  className="btn btn-secondary btn-sm mt-3.5 w-full"
                >
                  {busy ? <Spinner /> : <Download className="size-3.5" />}
                  {busy ? "Exporting…" : "Download CSV"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
