import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { verifyUserToken } from "@/lib/jwt";
import { getIO } from "@/lib/socket-server";

type JwtPayload = {
  sub: string;
  email: string;
  role: "admin" | "manager" | "developer";
  iat: number;
  exp: number;
};

function requireAuth(req: Request): JwtPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  try {
    return verifyUserToken(token) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET() {
  await connectDB();

  const docs = await Project.find().sort({ createdAt: -1 });
  const projects = docs.map((d: any) => ({
    id: d._id.toString(),
    name: d.name as string,
    key: d.key as string,
    ownerId: d.ownerId as string,
    members: (d.members ?? []) as string[],
  }));

  return NextResponse.json({ projects }, { status: 200 });
}

export async function POST(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { name, key, ownerId, members } = await req.json();

    if (!name || !key || !ownerId) {
      return NextResponse.json(
        { message: "Faltan campos requeridos (name, key, ownerId)" },
        { status: 400 }
      );
    }

    const created = await Project.create({
      name: String(name).trim(),
      key: String(key).toUpperCase(),
      ownerId: String(ownerId),
      members: Array.isArray(members) ? members.map(String) : [],
    });

    // Realtime: global activity feed on project creation
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Project created: ${String(created.name)} [${String(created.key)}]`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (project:created):", e);
    }

    return NextResponse.json(
      {
        project: {
          id: (created as any)._id.toString(),
          name: created.name,
          key: created.key,
          ownerId: created.ownerId,
          members: created.members ?? [],
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando proyecto:", err);
    return NextResponse.json(
      { message: "Error interno al crear proyecto" },
      { status: 500 }
    );
  }
}
