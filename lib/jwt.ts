import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = process.env.ACCESS_TOKEN_COOKIE || "access_token";
const REFRESH_COOKIE = process.env.REFRESH_TOKEN_COOKIE || "refresh_token";

const ACCESS_TTL: SignOptions["expiresIn"] =
  (process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m") as any;
const REFRESH_TTL: SignOptions["expiresIn"] =
  (process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d") as any;

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_SECRET) {
  // No arrojamos error aquí para permitir arrancar sin .env completo durante el desarrollo.
  // Las rutas que firman tokens deben validar y fallar si no hay secret.
  console.warn("[jwt] Falta ACCESS_TOKEN_SECRET");
}
if (!REFRESH_SECRET) {
  console.warn("[jwt] Falta REFRESH_TOKEN_SECRET");
}

export type JwtPayload = {
  sub: string; // userId
  email?: string;
  role?: string;
};

/**
 * Firma un Access Token (corto plazo).
 */
export function signAccessToken(payload: JwtPayload) {
  if (!ACCESS_SECRET) throw new Error("ACCESS_TOKEN_SECRET no configurado");
  return jwt.sign(payload, ACCESS_SECRET as Secret, { expiresIn: ACCESS_TTL });
}

/**
 * Firma un Refresh Token (largo plazo).
 */
export function signRefreshToken(payload: JwtPayload) {
  if (!REFRESH_SECRET) throw new Error("REFRESH_TOKEN_SECRET no configurado");
  return jwt.sign(payload, REFRESH_SECRET as Secret, { expiresIn: REFRESH_TTL });
}

/**
 * Verifica Access Token.
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  if (!ACCESS_SECRET) throw new Error("ACCESS_TOKEN_SECRET no configurado");
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verifica Refresh Token.
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  if (!REFRESH_SECRET) throw new Error("REFRESH_TOKEN_SECRET no configurado");
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Setea cookies HTTP-only de auth en la respuesta.
 * - secure: true en producción
 * - sameSite: lax por defecto
 */
export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken?: string }
) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
  if (tokens.refreshToken) {
    res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

/**
 * Limpia cookies de autenticación.
 */
export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

/**
 * Helper para leer tokens desde cookies (en App Router).
 */
export function readTokensFromRequest(req: Request) {
  // En rutas App Router, se usa request.headers.get("cookie")
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((c) => {
    const [k, ...v] = c.trim().split("=");
    if (!k) return;
    cookies[k] = decodeURIComponent(v.join("="));
  });

  const accessToken = cookies[ACCESS_COOKIE];
  const refreshToken = cookies[REFRESH_COOKIE];
  return { accessToken, refreshToken };
}
