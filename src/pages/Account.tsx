import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { Spinner } from "../components/ui";

export function Account() {
  const { user, profile, isAdmin, loading, previewSession, updateProfile, signOut } = useAuth();
  const { settings } = useStoreSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  if (loading) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/account" replace />;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() });
      toast("Your details are saved");
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : "Couldn't save your details", "error");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await signOut();
    toast("Signed out");
    navigate("/");
  };

  const initial = (profile?.full_name || profile?.email || "L").slice(0, 1).toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="container-page pt-8 sm:pt-12">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-forest text-xl font-medium text-cream">
          {initial}
        </span>
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-1 text-3xl leading-tight text-ink sm:text-4xl">
            {profile?.full_name || "Welcome back"}
          </h1>
          {memberSince && <p className="mt-0.5 text-[11.5px] text-ink-soft">A member since {memberSince}</p>}
        </div>
      </div>

      {previewSession && (
        <div className="mt-6 rounded-2xl border border-dashed border-forest/25 bg-forest/[0.035] px-4 py-3.5 text-[11.5px] leading-relaxed text-ink-soft">
          <strong className="font-medium text-forest">Preview session.</strong> You&apos;re browsing
          with sample data because the Supabase migration hasn&apos;t been applied yet. Details and
          orders stay in this browser. Once the SQL is run, create a real account here.
        </div>
      )}

      <div className="mt-8 grid gap-6 pb-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={save} className="card p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl text-ink">Your details</h2>
            <span className="rounded-full bg-cream-2 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              {profile?.role ?? "customer"}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
            We use these to prefill your deliveries — nothing else.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="label">Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="input"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                className="input"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                <input value={profile?.email ?? user.email ?? ""} disabled className="input pl-9" />
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? <Spinner /> : "Save changes"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft transition hover:text-clay"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <Link
            to="/orders"
            className="group flex items-center justify-between gap-4 rounded-[1.35rem] border border-line bg-card p-5 transition hover:border-forest/30"
          >
            <div className="flex items-center gap-3.5">
              <span className="grid size-10 place-items-center rounded-full bg-cream-2 text-forest">
                <Package className="size-4" />
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-ink">Order history</p>
                <p className="text-[11px] text-ink-soft">Track and repeat your baskets</p>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-ink-soft transition group-hover:text-ink" />
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="group flex items-center justify-between gap-4 rounded-[1.35rem] border border-forest/20 bg-forest/[0.04] p-5 transition hover:bg-forest/[0.07]"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-10 place-items-center rounded-full bg-forest text-cream">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-ink">Admin panel</p>
                  <p className="text-[11px] text-ink-soft">Products, orders and store settings</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-forest" />
            </Link>
          )}

          <div className="rounded-[1.35rem] border border-line bg-card p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
              The store
            </p>
            <ul className="mt-3 space-y-2.5 text-[12px] text-ink-soft">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-forest" />
                {settings.address ?? "Add the store address in admin"}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-forest" />
                {settings.phone ?? "Add a contact number"}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3.5 shrink-0 text-gold" />
                {settings.delivery_estimate ?? "Same-day delivery"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
