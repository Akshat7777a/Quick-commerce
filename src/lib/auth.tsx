import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import { api, errorMessage } from "./api";
import { DEMO_PROFILE, DEMO_USER_ID } from "./demo";
import { demoMode, useDemoStatus } from "./demo-mode";
import type { Profile } from "./types";

const DEMO_SESSION_KEY = "lmart.preview.session";

type AuthUser = { id: string; email: string | null };

type AuthContextValue = {
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  previewSession: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { full_name?: string; phone?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  continueAsPreview: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackProfile(user: AuthUser): Profile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.email?.split("@")[0] ?? "Friend",
    phone: null,
    role: "customer",
  };
}

/**
 * Same user identity must be the same object: token refreshes fire
 * onAuthStateChange with a fresh session every few minutes, and a new user
 * object here would re-fetch the profile and re-render every consumer. Only a
 * real sign-in/out (id or email change) produces a new value.
 */
function sameUser(a: AuthUser | null, b: AuthUser | null): boolean {
  return a?.id === b?.id && a?.email === b?.email;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [previewSession, setPreviewSession] = useState(
    () => localStorage.getItem(DEMO_SESSION_KEY) === "1",
  );
  const demoStatus = useDemoStatus();
  // Preview accounts only exist while the database schema is missing.
  const previewActive = previewSession && demoStatus === "demo";
  const waitingForProbe = previewSession && demoStatus === "checking";

  useEffect(() => {
    let mounted = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const next = session?.user
        ? { id: session.user.id, email: session.user.email ?? null }
        : null;
      setUser((current) => (sameUser(current, next) ? current : next)); // stable through token refresh
      setAuthReady(true);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const next = data.session?.user
        ? { id: data.session.user.id, email: data.session.user.email ?? null }
        : null;
      setUser((current) => (sameUser(current, next) ? current : next));
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (previewActive) {
      setProfile(DEMO_PROFILE);
      return;
    }
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    api
      .getProfile(user.id)
      .then((fresh) => {
        if (!cancelled) setProfile(fresh ?? fallbackProfile(user));
      })
      .catch(() => {
        if (!cancelled) setProfile(fallbackProfile(user));
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, previewActive]);

  const refreshProfile = useCallback(async () => {
    if (previewActive) {
      setProfile(DEMO_PROFILE);
      return;
    }
    if (!user) return;
    const fresh = await api.getProfile(user.id);
    setProfile(fresh ?? fallbackProfile(user));
  }, [previewActive, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(errorMessage(error, "We couldn't sign you in."));
  }, []);

  const signUp = useCallback(
    async (fullName: string, email: string, password: string, phone: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone: phone.trim() || null },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw new Error(errorMessage(error, "We couldn't create your account."));
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (previewActive) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setPreviewSession(false);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
  }, [previewActive]);

  const updateProfile = useCallback(
    async (patch: { full_name?: string; phone?: string }) => {
      if (previewActive) {
        setProfile((current) => (current ? { ...current, ...patch } : current));
        return;
      }
      if (!user) throw new Error("Please sign in first.");
      await api.updateProfile(user.id, patch);
      await refreshProfile();
    },
    [previewActive, refreshProfile, user],
  );

  const continueAsPreview = useCallback(() => {
    if (!demoMode.isEnabled()) return;
    localStorage.setItem(DEMO_SESSION_KEY, "1");
    setPreviewSession(true);
    setProfile(DEMO_PROFILE);
  }, []);

  const effectiveUser = previewActive
    ? { id: DEMO_USER_ID, email: DEMO_PROFILE.email }
    : user;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      profile,
      isAdmin: profile?.role === "admin",
      loading: !authReady || profileLoading || waitingForProbe,
      previewSession: previewActive,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile,
      continueAsPreview,
    }),
    [
      effectiveUser,
      profile,
      authReady,
      profileLoading,
      waitingForProbe,
      previewActive,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile,
      continueAsPreview,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
