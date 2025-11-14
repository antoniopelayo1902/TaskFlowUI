// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Validación básica
  if (!email || !password) {
    return NextResponse.json(
      { message: "Correo o contraseña vacíos" },
      { status: 400 }
    );
  }

  // Usuario simulado
  const user = {
    id: "user-1",
    name: "Usuario Demo",
    email,
    role: "developer",
  };

  return NextResponse.json({ user, token: "fake-token-login" });
}
