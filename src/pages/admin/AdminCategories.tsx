import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { slugify } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal, Spinner, Toggle } from "../../components/ui";
import type { Category, Product } from "../../lib/types";

type FormState = {
  id?: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  emoji: "🛍️",
  description: "",
  image_url: "",
  sort_order: "0",
  is_active: true,
};

export function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [categoryRows, productRows] = await Promise.all([
        api.adminListCategories(),
        api.listProducts({ includeInactive: true }),
      ]);
      setCategories(categoryRows);
      setProducts(productRows);
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't load categories"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  const openNew = () => {
    setForm({ ...emptyForm, sort_order: String(categories.length + 1) });
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      emoji: category.emoji ?? "",
      description: category.description ?? "",
      image_url: category.image_url ?? "",
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast("Add a category name", "error");
    setSaving(true);
    try {
      await api.saveCategory({
        id: form.id,
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        emoji: form.emoji.trim() || null,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      });
      toast(form.id ? "Category updated" : "Category added");
      setOpen(false);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't save this category"), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await api.deleteCategory(target.id);
      toast(`${target.name} removed`);
      setTarget(null);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't remove this category"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Aisles"
        title="Categories"
        description="The aisles of your shop, in the order customers see them."
        action={
          <button type="button" onClick={openNew} className="btn btn-primary btn-sm">
            <Plus className="size-3.5" /> Add category
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-forest" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {categories.map((category) => {
            const count = products.filter((product) => product.category_id === category.id).length;
            return (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-[1.1rem] border border-line bg-card px-4 py-3"
              >
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-cream-2">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-lg">
                      {category.emoji ?? "🛍️"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-medium text-ink">{category.name}</p>
                    {!category.is_active && (
                      <span className="rounded bg-clay/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-clay">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10.5px] text-ink-soft">
                    /{category.slug} · {count} product{count === 1 ? "" : "s"} · position{" "}
                    {category.sort_order}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-forest/30 hover:text-forest"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget(category)}
                    aria-label={`Delete ${category.name}`}
                    className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-clay/30 hover:text-clay"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit category" : "Add a category"}
        description="Categories organise the shop navigation and filters."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm px-5">
              {saving ? <Spinner /> : "Save category"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Name</span>
            <input
              value={form.name}
              onChange={(event) =>
                patch({
                  name: event.target.value,
                  slug: form.id ? form.slug : slugify(event.target.value),
                })
              }
              placeholder="Fruits & Vegetables"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Slug</span>
            <input
              value={form.slug}
              onChange={(event) => patch({ slug: event.target.value })}
              className="input font-mono text-[12px]"
            />
          </label>
          <label className="block">
            <span className="label">Emoji</span>
            <input
              value={form.emoji}
              onChange={(event) => patch({ emoji: event.target.value })}
              placeholder="🥬"
              maxLength={4}
              className="input"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Short description</span>
            <input
              value={form.description}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="Picked fresh this morning"
              className="input"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Cover image URL</span>
            <input
              value={form.image_url}
              onChange={(event) => patch({ image_url: event.target.value })}
              placeholder="https://…"
              className="input text-[12px]"
            />
          </label>
          <label className="block">
            <span className="label">Sort position</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(event) => patch({ sort_order: event.target.value })}
              className="input"
            />
          </label>
          <div className="rounded-xl border border-line bg-cream/50 px-4 py-3">
            <Toggle
              checked={form.is_active}
              onChange={(value) => patch({ is_active: value })}
              label="Visible in the shop"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Remove ${target?.name ?? "category"}?`}
        description="Products in this category stay in the catalogue but become uncategorised."
        busy={deleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
