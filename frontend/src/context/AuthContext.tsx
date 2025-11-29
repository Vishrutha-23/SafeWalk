import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "@/services/supabase/client";

type User = { id: string; email?: string | null; name?: string | null } | null;

type AuthContextValue = {
  user: User;
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem("safewalk.guest") === "1";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    // fetch current session user from Supabase
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ? { id: data.user.id, email: data.user.email, name: (data.user.user_metadata as any)?.name } : null);
      } catch (e) {
        console.warn("Auth init failed", e);
      } finally {
        setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email, name: (session.user.user_metadata as any)?.name });
        setIsGuest(false);
        try { localStorage.removeItem("safewalk.guest"); } catch(e){}
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const resp = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (resp.error) throw resp.error;
    const u = resp.data.user;
    setUser(u ? { id: u.id, email: u.email, name: (u.user_metadata as any)?.name } : null);
    setIsGuest(false);
    try { localStorage.removeItem("safewalk.guest"); } catch(e){}
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const resp = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (resp.error) throw resp.error;
    // After signUp, Supabase may require email confirmation; we don't auto-set user here
  };

  const sendMagicLink = async (email: string) => {
    setLoading(true);
    const resp = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (resp.error) throw resp.error;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    setUser(null);
    try { localStorage.removeItem("safewalk.guest"); } catch(e){}
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    try { localStorage.setItem("safewalk.guest", "1"); } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, signIn, signUp, sendMagicLink, signOut, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
