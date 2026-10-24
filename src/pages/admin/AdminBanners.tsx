import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { cn } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal, Spinner, Toggle } from "../../components/ui";
import type { Banner } from "../../lib/types";

type FormState = {
  id?: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_link: string;
  tone: Banner["tone"];
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  eyebrow: "",
  subtitle: "",
  image_url: "",
  cta_label: "Shop now",
  cta_link: "/shop",
  tone: "forest",
  sort_order: "0",
  is_active: true,
};

const toneStyles: Record<Banner["tone"], string> = {
  forest: "bg-forest text-cream",
  cream: "bg-cream-2 text-ink",
  gold: "bg-gold-soft text-ink",
  ink: "bg-ink text-cream",
};

export function AdminBanners() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setBanners(await api.listBanners(true));
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't load banners"), "error");
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
    setForm({ ...emptyForm, sort_order: String(banners.length + 1) });
    setOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setForm({
      id: banner.id,
      title: banner.title,
      eyebrow: banner.eyebrow ?? "",
      subtitle: banner.subtitle ?? "",
      image_url: banner.image_url ?? "",
      cta_label: banner.cta_label ?? "Shop now",
      cta_link: banner.cta_link ?? "/shop",
      tone: banner.tone,
      sort_order: String(banner.sort_order),
      is_active: banner.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast("Add a banner headline", "error");
    setSaving(true);
    try {
      await api.saveBanner({
        id: form.id,
        title: form.title.trim(),
        eyebrow: form.eyebrow.trim() || null,
        subtitle: form.subtitle.trim() || null,
        image_url: form.image_url.trim() || null,
        cta_label: form.cta_label.trim() || "Shop now",
        cta_link: form.cta_link.trim() || "/shop",
        tone: form.tone,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      });
      toast(form.id ? "Banner updated" : "Banner published");
      setOpen(false);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't save this banner"), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await api.deleteBanner(target.id);
      toast("Banner removed");
      setTarget(null);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't remove this banner"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Homepage"
        title="Banners"
        description="The first thing customers see. Keep it seasonal, short and warm."
        action={
          <button type="button" onClick={openNew} className="btn btn-primary btn-sm">
            <Plus className="size-3.5" /> Add banner
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-forest" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-[1.2rem] border border-line bg-card">
              <div className={cn("relative flex min-h-[9rem] flex-col justify-end p-4", toneStyles[banner.tone])}>
                {banner.image_url && (
                  <>
                    <img src={banner.image_url} alt="" className="absolute inset-0 size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/50 to-transparent" />
                  </>
                )}
                <div className="relative text-cream">
                  <p className="text-[8px] uppercase tracking-[0.22em] opacity-70">
                    {banner.eyebrow ?? "Banner"} · position {banner.sort_order}
                  </p>
                  <p className="mt-1 font-display text-2xl leading-tight">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed opacity-75">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide",
                      banner.is_active ? "bg-[#e8f4ec] text-[#1c6b3f]" : "bg-clay/10 text-clay",
                    )}
                  >
                    {banner.is_active ? "Live" : "Hidden"}
                  </span>
                  <span className="text-[10px] text-ink-soft">{banner.tone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(banner)}
                    aria-label="Edit banner"
                    className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-forest/30 hover:text-forest"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget(banner)}
                    aria-label="Delete banner"
                    className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-clay/30 hover:text-clay"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit banner" : "New banner"}
        description="Banners auto-rotate on the homepage. Keep copy to one short line."
        wide
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm px-5">
              {saving ? <Spinner /> : "Save banner"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Headline</span>
            <input
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="The everyday edit"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Eyebrow</span>
            <input
              value={form.eyebrow}
              onChange={(event) => patch({ eyebrow: event.target.value })}
              placeholder="This week"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Tone</span>
            <select
              value={form.tone}
              onChange={(event) => patch({ tone: event.target.value as Banner["tone"] })}
              className="input"
            >
              <option value="forest">Forest</option>
              <option value="cream">Cream</option>
              <option value="gold">Gold</option>
              <option value="ink">Ink</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Subtitle</span>
            <textarea
              rows={2}
              value={form.subtitle}
              onChange={(event) => patch({ subtitle: event.target.value })}
              placeholder="Fresh produce, pantry staples and small luxuries."
              className="input resize-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Background image URL</span>
            <input
              value={form.image_url}
              onChange={(event) => patch({ image_url: event.target.value })}
              placeholder="https://…"
              className="input text-[12px]"
            />
          </label>
          <label className="block">
            <span className="label">Button label</span>
            <input
              value={form.cta_label}
              onChange={(event) => patch({ cta_label: event.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Button link</span>
            <input
              value={form.cta_link}
              onChange={(event) => patch({ cta_link: event.target.value })}
              placeholder="/shop"
              className="input"
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
              label="Show on homepage"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title="Remove this banner?"
        description="It will disappear from the homepage carousel immediately."
        busy={deleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
