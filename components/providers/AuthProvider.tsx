"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Role } from "@/lib/roles";
import {
  getCurrentUser,
  login as loginSvc,
  logout as logoutSvc,
} from "@/services/mock/auth.service";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, roleOverride?: Role) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  const login = async (email: string, roleOverride?: Role) => {
    setLoading(true);
    try {
      const u = await loginSvc(email, roleOverride);
      setUser(u);
      toast.success("Sesión iniciada");
      router.push("/dashboard");
    } catch (err) {
      toast.destructive("Credenciales inválidas");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutSvc();
      setUser(null);
      toast.info("Sesión cerrada");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
