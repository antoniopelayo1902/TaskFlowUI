// services/api/auth.service.ts
import type { User } from "@/lib/roles";

export type LoginResponse = {
  user: User;
  token?: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Credenciales inválidas");
  }

  return res.json();
}

export async function registerAccount(
  name: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    throw new Error("No fue posible registrar la cuenta");
  }

  return res.json();
}

export async function loginWithGoogleAuthCode(
  code: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error("No fue posible iniciar sesión con Google");
  }

  return res.json();
}
