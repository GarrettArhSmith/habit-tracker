import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ANON_STORAGE_KEY,
  IS_SUPABASE_CONFIGURED,
  STORAGE_KEY,
  SYNC_QUEUE_STORAGE_KEY,
} from "./config";
import { supabase } from "./supabaseClient";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setAuthError(error.message);
          setSession(null);
        } else {
          setSession(data.session ?? null);
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAuthError("Unable to initialize authentication session.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle(): Promise<void> {
    if (!supabase) {
      return;
    }

    setAuthError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  }

  async function signOut(): Promise<void> {
    if (!supabase) {
      return;
    }

    setAuthError(null);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      return;
    }

    try {
      localStorage.removeItem(ANON_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
    } catch {
      // Ignore localStorage cleanup failures.
    }
  }

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isConfigured: IS_SUPABASE_CONFIGURED,
      isLoading,
      authError,
      signInWithGoogle,
      signOut,
    }),
    [authError, isLoading, session],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
