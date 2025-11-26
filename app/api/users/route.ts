import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// GET /api/users
// Lista pública de usuarios (solo campos seguros) para poblar selects y etiquetas en UI.
// Nota: No requiere token; si necesitas restringir, añade verificación JWT aquí.
export async function GET() {
  await connectDB();

  const docs = await User.find({}, { name: 1, email: 1, role: 1 })
    .sort({ createdAt: -1 })
    .lean();

  const users = docs.map((u: any) => ({
    id: u._id.toString(),
    name: u.name as string,
    email: u.email as string,
    role: u.role as "admin" | "manager" | "developer",
  }));

  return NextResponse.json({ users }, { status: 200 });
}
