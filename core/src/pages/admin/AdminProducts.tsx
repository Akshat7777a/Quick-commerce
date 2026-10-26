import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { cn, inr, slugify } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal, ProductImage, Spinner, Toggle } from "../../components/ui";
import type { Category, Product } from "../../lib/types";

type FormState = {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  price: string;
  mrp: string;
  unit: string;
  stock: string;
  description: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  category_id: "",
  price: "",
  mrp: "",
  unit: "1 pc",
  stock: "0",
  description: "",
  image_url: "",
  is_active: true,
  is_featured: false,
};

export function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [target, setTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [productRows, categoryRows] = await Promise.all([
        api.listProducts({ includeInactive: true }),
        api.adminListCategories(),
      ]);
      setProducts(productRows);
      setCategories(categoryRows);
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't load the catalogue"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (term && !`${product.name} ${product.slug}`.toLowerCase().includes(term)) return false;
      if (categoryFilter !== "all" && product.category_id !== categoryFilter) return false;
      if (statusFilter === "active" && !product.is_active) return false;
      if (statusFilter === "hidden" && product.is_active) return false;
      return true;
    });
  }, [products, query, categoryFilter, statusFilter]);

  const openNew = () => {
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? "" });
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category_id: product.category_id ?? "",
      price: String(product.price),
      mrp: product.mrp === null ? "" : String(product.mrp),
      unit: product.unit,
      stock: String(product.stock),
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setFormOpen(true);
  };

  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  const handleName = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.id ? current.slug : slugify(value),
    }));
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      patch({ image_url: url });
      toast("Image uploaded");
    } catch (caught) {
      toast(errorMessage(caught, "Upload failed"), "error");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return toast("Add a product name", "error");
    if (!form.slug.trim()) return toast("Add a URL slug", "error");
    if (!form.price || Number(form.price) <= 0) return toast("Add a valid price", "error");

    setSaving(true);
    try {
      await api.saveProduct({
        id: form.id,
        name: form.name.trim(),
        slug: slugify(form.slug),
        category_id: form.category_id || null,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : null,
        unit: form.unit.trim() || "1 pc",
        stock: Number(form.stock) || 0,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
      });
      toast(form.id ? "Product updated" : "Product added to the shelf");
      setFormOpen(false);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't save this product"), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await api.deleteProduct(target.id);
      toast(`${target.name} removed`);
      setTarget(null);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't remove this product"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Add new stock, adjust prices and keep the shelves honest."
        action={
          <button type="button" onClick={openNew} className="btn btn-primary btn-sm">
            <Plus className="size-3.5" /> Add product
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            className="input h-10 pl-9 text-[12px]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="input h-10 w-full text-[12px] sm:w-44"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(["all", "active", "hidden"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "chip h-10 px-3.5 text-[11px] capitalize",
                statusFilter === status && "chip-active",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.35rem] border border-line bg-card">
        <div className="hidden grid-cols-[1fr_6rem_5rem_8rem] gap-3 border-b border-line px-5 py-2.5 text-[9.5px] uppercase tracking-[0.14em] text-ink-soft sm:grid">
          <span>Product</span>
          <span className="text-right">Price</span>
          <span className="text-right">Stock</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-forest" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-[12px] text-ink-soft">
            No products match this view. Try clearing the filters.
          </p>
        ) : (
          <ul className="divide-y divide-line/80">
            {filtered.map((product) => {
              const category = categories.find((item) => item.id === product.category_id);
              return (
                <li
                  key={product.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_6rem_5rem_8rem] sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-cream-2">
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12.5px] font-medium text-ink">{product.name}</p>
                        {product.is_featured && (
                          <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-[#7a5a14]">
                            Pick
                          </span>
                        )}
                        {!product.is_active && (
                          <span className="shrink-0 rounded bg-clay/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-clay">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10.5px] text-ink-soft">
                        {category?.name ?? "Uncategorised"} · {product.unit}
                      </p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-ink-soft sm:hidden">
                        {inr(product.price)} · {product.stock} in stock
                      </p>
                    </div>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="price text-[12px] font-medium">{inr(product.price)}</p>
                    {product.mrp && product.mrp > product.price && (
                      <p className="price text-[10px] text-ink-soft line-through">{inr(product.mrp)}</p>
                    )}
                  </div>

                  <p
                    className={cn(
                      "hidden text-right text-[12px] tabular-nums sm:block",
                      product.stock === 0 ? "text-clay" : product.stock <= 8 ? "text-[#8a6415]" : "text-ink",
                    )}
                  >
                    {product.stock}
                  </p>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-forest/30 hover:text-forest"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarget(product)}
                      aria-label={`Delete ${product.name}`}
                      className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-clay/30 hover:text-clay"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-[10.5px] text-ink-soft">
        Showing {filtered.length} of {products.length} products
      </p>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit product" : "Add a product"}
        description="Everything here is visible on the storefront once you save."
        wide
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm px-5">
              {saving ? <Spinner /> : form.id ? "Save changes" : "Add product"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Product name</span>
            <input
              value={form.name}
              onChange={(event) => handleName(event.target.value)}
              placeholder="Seasonal Fruit Box"
              className="input"
            />
          </label>

          <label className="block">
            <span className="label">URL slug</span>
            <input
              value={form.slug}
              onChange={(event) => patch({ slug: event.target.value })}
              placeholder="alphonso-mangoes-1kg"
              className="input font-mono text-[12px]"
            />
          </label>

          <label className="block">
            <span className="label">Category</span>
            <select
              value={form.category_id}
              onChange={(event) => patch({ category_id: event.target.value })}
              className="input"
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Price (₹)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(event) => patch({ price: event.target.value })}
              placeholder="149"
              className="input"
            />
          </label>

          <label className="block">
            <span className="label">MRP (₹, optional)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.mrp}
              onChange={(event) => patch({ mrp: event.target.value })}
              placeholder="180"
              className="input"
            />
          </label>

          <label className="block">
            <span className="label">Unit / pack size</span>
            <input
              value={form.unit}
              onChange={(event) => patch({ unit: event.target.value })}
              placeholder="500 g, 1 L, 6 pcs"
              className="input"
            />
          </label>

          <label className="block">
            <span className="label">Stock on hand</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) => patch({ stock: event.target.value })}
              className="input"
            />
          </label>

          <div className="sm:col-span-2">
            <span className="label">Product image</span>
            <div className="flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-2">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-ink-soft">
                    <ImagePlus className="size-5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="btn btn-secondary btn-sm cursor-pointer">
                  {uploading ? <Spinner /> : <ImagePlus className="size-3.5" />}
                  {uploading ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={upload}
                    disabled={uploading}
                  />
                </label>
                <input
                  value={form.image_url}
                  onChange={(event) => patch({ image_url: event.target.value })}
                  placeholder="…or paste an image URL"
                  className="input mt-2 text-[11px]"
                />
              </div>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <span className="label">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="A short, honest line about this product."
              className="input resize-none leading-relaxed"
            />
          </label>

          <div className="rounded-xl border border-line bg-cream/50 px-4 py-3.5 sm:col-span-2">
            <Toggle
              checked={form.is_active}
              onChange={(value) => patch({ is_active: value })}
              label="Visible in the store"
              description="Turn off to hide this product without deleting it."
            />
          </div>
          <div className="rounded-xl border border-line bg-cream/50 px-4 py-3.5 sm:col-span-2">
            <Toggle
              checked={form.is_featured}
              onChange={(value) => patch({ is_featured: value })}
              label="Feature on the homepage"
              description="Featured products appear in the picks section."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Remove ${target?.name ?? "product"}?`}
        description="The product will disappear from the storefront. Past orders keep their record."
        busy={deleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
