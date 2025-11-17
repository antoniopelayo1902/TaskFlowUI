import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { UserModel } from "@/models/User";
import { readTokensFromRequest, verifyAccessToken } from "@/lib/jwt";

// GET /api/auth/me
export async function GET(req: Request) {
  try {
    const { accessToken } = readTokensFromRequest(req);
    if (!accessToken) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload?.sub) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    await dbConnect();

    const userDoc = await UserModel.findById(payload.sub);
    if (!userDoc) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    const json = userDoc.toJSON() as any;
    const user = {
      id: json.id ?? userDoc._id.toString(),
      name: json.name,
      email: json.email,
      role: json.role,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error en /api/auth/me:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
