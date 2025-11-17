import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { UserModel } from "@/models/User";
import bcrypt from "bcryptjs";
import { setAuthCookies, signAccessToken, signRefreshToken } from "@/lib/jwt";

// POST /api/auth/login
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Correo o contraseña vacíos" },
        { status: 400 }
      );
    }

    await dbConnect();

    const userDoc = await UserModel.findOne({ email: email.toLowerCase() });
    if (!userDoc || !userDoc.passwordHash) {
      // No existe o es cuenta solo de proveedor (sin password)
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, userDoc.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const json = userDoc.toJSON() as any;
    const user = {
      id: json.id ?? userDoc._id.toString(),
      name: json.name,
      email: json.email,
      role: json.role,
    };

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    let refreshToken: string | undefined;
    try {
      refreshToken = signRefreshToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    } catch {
      // si no hay refresh configurado, seguimos sin él
    }

    const res = NextResponse.json({ user });
    setAuthCookies(res, { accessToken, refreshToken });
    return res;
  } catch (error) {
    console.error("Error en /api/auth/login:", error);
    return NextResponse.json(
      { message: "Error interno al iniciar sesión" },
      { status: 500 }
    );
  }
}
