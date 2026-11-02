import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogOut, Mail, MapPin, Package, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Primitives";

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
      toast(caught instanceof Error ? caught.message : "Could not save your details", "error");
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
    <div className="container-page pt-4">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-primary-tint text-[18px] font-semibold text-forest">
          {initial}
        </span>
        <div>
          <h1 className="text-[20px] font-semibold leading-7 text-ink">
            {profile?.full_name || "Your account"}
          </h1>
          {memberSince && <p className="text-[12px] leading-4 text-ink-soft">Member since {memberSince}</p>}
        </div>
      </div>

      {previewSession && (
        <p className="mt-3 rounded-[var(--lm-radius-control)] border border-dashed border-line bg-white px-3 py-2 text-[12px] leading-4 text-ink-soft">
          Preview session: data stays in this browser until the database migration is applied.
        </p>
      )}

      <div className="mt-4 grid gap-4 pb-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={save} className="rounded-[var(--lm-radius-card)] border border-line bg-white p-4">
          <h2 className="text-[18px] font-semibold leading-6 text-ink">Your details</h2>
          <p className="mt-1 text-[12px] leading-4 text-ink-soft">
            We use these to prefill your deliveries.
          </p>
          <div className="mt-4 grid gap-3">
            <Field
              label="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
            <Field
              label="Phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
            <Field
              label="Email"
              value={profile?.email ?? user.email ?? ""}
              disabled
              autoComplete="email"
              hint="Email signs you in and cannot be changed here."
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : "Save changes"}
            </Button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[12px] leading-4 text-ink-soft transition hover:text-clay"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <Link
            to="/orders"
            className="flex items-center justify-between gap-3 rounded-[var(--lm-radius-card)] border border-line bg-white p-4 transition hover:border-forest"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary-tint text-forest">
                <Package className="size-4" />
              </span>
              <span>
                <span className="block text-[14px] font-medium leading-5 text-ink">Order history</span>
                <span className="block text-[12px] leading-4 text-ink-soft">Track and repeat baskets</span>
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-soft">→</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-between gap-3 rounded-[var(--lm-radius-card)] border border-forest/20 bg-forest/5 p-4 transition hover:bg-forest/10"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-forest text-white">
                  <ShieldCheck className="size-4" />
                </span>
                <span>
                  <span className="block text-[14px] font-medium leading-5 text-ink">Admin panel</span>
                  <span className="block text-[12px] leading-4 text-ink-soft">Products, orders and settings</span>
                </span>
              </span>
              <span aria-hidden="true" className="text-forest">→</span>
            </Link>
          )}

          <div className="rounded-[var(--lm-radius-card)] border border-line bg-white p-4">
            <h2 className="text-[14px] font-medium leading-5 text-ink">The store</h2>
            <ul className="mt-2 space-y-2 text-[12px] leading-4 text-ink-soft">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-forest" aria-hidden="true" />
                {settings.address ?? "Shop address to be added"}
              </li>
              {settings.phone ? (
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-forest" aria-hidden="true" />
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                    {settings.phone}
                  </a>
                </li>
              ) : (
                <li>Phone number to be added</li>
              )}
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-forest" aria-hidden="true" />
                <Link to="/terms" className="hover:text-ink">Help, terms and refunds</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
