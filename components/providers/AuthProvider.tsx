"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/lib/roles";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { googleLogout } from "@react-oauth/google";

// Servicios del API real (los que definimos en services/api/auth.service.ts)
import {
  loginWithCredentials as loginApi,
  loginWithGoogleAuthCode,
  getCurrentUser,
  logout as logoutApi,
} from "@/services/api/auth.service";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  login: (email: string, password: string, returnTo?: string) => Promise<void>;
  // login con proveedor Google (authorization code)
  loginWithGoogle: (code: string, returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Al montar, restaurar sesión desde /auth/me si existe cookie
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (!mounted) return;
        if (data?.user) {
          setUser(data.user);
        }
      } catch (e) {
        // ignorar: no autenticado o error de red
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // LOGIN CON CREDENCIALES (usuario + contraseña)
  const login = async (email: string, password: string, returnTo?: string) => {
    setLoading(true);
    try {
      const { user: apiUser } = await loginApi(email, password);
      setUser(apiUser);
      toast.success("Sesión iniciada");
      router.push(returnTo || "/dashboard");
    } catch (err) {
      toast.destructive("Credenciales inválidas");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // LOGIN CON GOOGLE (authorization code flow)
  const loginWithGoogle = async (code: string, returnTo?: string) => {
    setLoading(true);
    try {
      const { user: apiUser } = await loginWithGoogleAuthCode(code);
      setUser(apiUser);
      toast.success("Sesión iniciada con Google");
      router.push(returnTo || "/dashboard");
    } catch (err) {
      toast.destructive("Ocurrió un error al iniciar sesión con Google");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi(); // limpia cookies en el backend
      setUser(null);
      toast.info("Sesión cerrada");
      router.push("/login");

      // Importante para cerrar la sesión de Google One Tap / SDK
      googleLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
