import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { UserModel } from "@/models/User";
import bcrypt from "bcryptjs";
import { setAuthCookies, signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Faltan datos para el registro" },
        { status: 400 }
      );
    }

    await dbConnect();

    const exists = await UserModel.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userDoc = await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "developer",
    });

    const json = userDoc.toJSON() as any;
    const user = {
      id: json.id ?? userDoc._id.toString(),
      name: json.name,
      email: json.email,
      role: json.role,
    };

    // Firmar tokens y setear cookies HTTP-only
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Opcional: refresh token
    let refreshToken: string | undefined;
    try {
      refreshToken = signRefreshToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    } catch {
      // Si no está configurado REFRESH_TOKEN_SECRET, seguimos sin refresh
    }

    const res = NextResponse.json({ user });
    setAuthCookies(res, { accessToken, refreshToken });

    return res;
  } catch (error) {
    console.error("Error en /api/auth/register:", error);
    return NextResponse.json(
      { message: "Error interno al registrar" },
      { status: 500 }
    );
  }
}
