// app/api/auth/register/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "Faltan datos para el registro" },
      { status: 400 }
    );
  }

  // Usuario creado (simulado)
  const user = {
    id: "user-2",
    name,
    email,
    role: "developer",
  };

  return NextResponse.json({ user, token: "fake-token-register" });
}
