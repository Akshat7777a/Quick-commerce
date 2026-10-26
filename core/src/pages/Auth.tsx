import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useDemoMode } from "../lib/demo-mode";
import { useToast } from "../lib/toast";
import { Spinner } from "../components/ui";

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="container-page py-8 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-soft lg:grid-cols-[1.02fr_1fr]">
        <div className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b241b] via-[#0b241b]/85 to-[#0b241b]/30" />
          <div className="relative flex h-full min-h-[34rem] flex-col justify-between p-10 text-cream">
            <Link to="/" className="inline-flex items-baseline gap-2">
              <span className="font-display text-2xl leading-none">
                L MART<span className="text-gold">.</span>
              </span>
              <span className="text-[8px] uppercase tracking-[0.32em] text-cream/50">Online</span>
            </Link>
            <div>
              <p className="font-display text-[2.75rem] leading-[1.02]">
                “The shop down the road,
                <br />
                now a tap away.”
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] text-cream/70">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5">
                  <ShieldCheck className="size-3" /> Cash on delivery
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5">
                  <Sparkles className="size-3" /> Stocked daily
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <h1 className="text-[2rem] leading-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 border-t border-line pt-5 text-[12px] text-ink-soft">{footer}</div>
        </div>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-clay/20 bg-clay/[0.06] px-3.5 py-2.5 text-[12px] leading-relaxed text-clay"
    >
      {message}
    </p>
  );
}

function PasswordField({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required
        minLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder="At least 6 characters"
        className="input pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-soft transition hover:text-ink"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function PreviewAccess({ next = "/admin" }: { next?: string }) {
  const isDemo = useDemoMode();
  const { continueAsPreview } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!isDemo) return null;

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-forest/25 bg-forest/[0.035] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-forest">Preview mode</p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">
        The database migration hasn&apos;t been applied yet, so the store is running on sample data.
        Use a preview account to try checkout and the admin panel — nothing leaves this browser.
      </p>
      <button
        type="button"
        onClick={() => {
          continueAsPreview();
          toast("Signed in as a preview shopper");
          navigate(next, { replace: true });
        }}
        className="btn btn-secondary btn-sm mt-3 w-full"
      >
        Continue as preview admin
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}

export function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(next, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't sign you in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to reorder your usuals and track what's on its way."
      footer={
        <p>
          New to L MART?{" "}
          <Link
            to={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-forest underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNote message={error} />}
        <label className="block">
          <span className="label">Email address</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        </label>
        <button type="submit" disabled={busy} className="btn btn-primary h-11 w-full">
          {busy ? <Spinner /> : "Sign in"}
          {!busy && <ArrowRight className="size-4" />}
        </button>
      </form>
      <PreviewAccess next={next} />
    </AuthShell>
  );
}

export function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/account";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid phone number — we need it to confirm your order.");
      return;
    }
    setBusy(true);
    try {
      const result = await signUp(fullName.trim(), email.trim(), password, phone.trim());
      if (result.needsConfirmation) setNeedsConfirmation(true);
      else navigate(next, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't create your account.");
    } finally {
      setBusy(false);
    }
  };

  if (needsConfirmation) {
    return (
      <AuthShell
        title="One last step."
        subtitle={`We've sent a confirmation link to ${email}.`}
        footer={
          <p>
            Already confirmed?{" "}
            <Link to="/login" className="font-medium text-forest underline underline-offset-2">
              Sign in
            </Link>
          </p>
        }
      >
        <div className="rounded-2xl border border-forest/15 bg-forest/[0.04] p-5">
          <MailCheck className="size-6 text-forest" />
          <h2 className="mt-3 text-2xl text-ink">Check your inbox</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            Click the link in the email to activate your account. Then sign in and your basket will
            be waiting.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-card px-3.5 py-3 text-[11px] leading-relaxed text-ink-soft">
            <Mail className="mt-0.5 size-3.5 shrink-0 text-forest" />
            <span>
              Running this yourself? Turn off <strong className="font-medium text-ink">Confirm email</strong>{" "}
              in Supabase → Authentication → Providers → Email to sign in instantly.
            </span>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="A basket of your own."
      subtitle="Create an account to save your details, reorder in a tap, and keep your history tidy."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-forest underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNote message={error} />}
        <label className="block">
          <span className="label">Full name</span>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ananya Rao"
            className="input"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Phone number</span>
            <input
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              className="input"
            />
            <span className="mt-1.5 block text-[10.5px] leading-relaxed text-ink-soft">
              Required — we call or text this number to confirm orders.
            </span>
          </label>
        </div>
        <label className="block">
          <span className="label">Password</span>
          <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
        </label>
        <button type="submit" disabled={busy} className="btn btn-primary h-11 w-full">
          {busy ? <Spinner /> : "Create account"}
          {!busy && <ArrowRight className="size-4" />}
        </button>
        <p className="text-center text-[10.5px] leading-relaxed text-ink-soft">
          By continuing you agree to pay in cash on delivery. No card details, ever.
        </p>
      </form>
      <PreviewAccess next={next} />
    </AuthShell>
  );
}
