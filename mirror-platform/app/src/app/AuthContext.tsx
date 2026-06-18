import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Role } from "../gates";

/* ----------------------------------------------------------------------------
   Auth. Three sign-in methods (magic link · email+password · OAuth), one
   session. The role is DERIVED from the account — is_architect, then the
   subscription tier — never from the client (§0 rule 9; the dev switcher is
   dev-only). Raw identity is PERSON-class (erasable); attribution runs to the
   handle (Permanence §0).
   -------------------------------------------------------------------------- */

export type OAuthProvider = "google" | "github";

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** the account-derived role; 'free' when signed out. */
  accountRole: Role;
  /** the account's chosen handle (PII-free attribution); null when signed out. */
  accountHandle: string | null;
  signInMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Map account state -> register + handle. Architect is highest trust; then tier. */
async function deriveProfile(): Promise<{ role: Role; handle: string | null }> {
  if (!supabase) return { role: "free", handle: null };
  const [{ data: arch }, { data: tier }, { data: hrow }] = await Promise.all([
    supabase.rpc("is_architect"),
    supabase.rpc("current_tier"),
    supabase.from("app_user").select("handle").maybeSingle(),
  ]);
  const handle = (hrow as { handle: string | null } | null)?.handle ?? null;
  const role: Role = arch === true ? "arch"
    : tier === "builder" || tier === "patron" ? "build"
    : tier === "continuations" ? "cont" : "free";
  return { role, handle };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accountRole, setAccountRole] = useState<Role>("free");
  const [accountHandle, setAccountHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const apply = async (s: Session | null) => {
      setSession(s); setUser(s?.user ?? null);
      const p = s ? await deriveProfile() : { role: "free" as Role, handle: null };
      setAccountRole(p.role); setAccountHandle(p.handle);
    };
    supabase.auth.getSession().then(async ({ data }) => { await apply(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { apply(s); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const wrap = (p: Promise<{ error: { message: string } | null }>) =>
    p.then(({ error }) => ({ error: error?.message ?? null }));

  const value: AuthValue = {
    user, session, loading, accountRole, accountHandle,
    signInMagicLink: (email) =>
      wrap(supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })),
    signInPassword: (email, password) => wrap(supabase!.auth.signInWithPassword({ email, password })),
    signUpPassword: (email, password) =>
      wrap(supabase!.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })),
    signInOAuth: (provider) =>
      wrap(supabase!.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })),
    signOut: async () => { await supabase?.auth.signOut(); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
