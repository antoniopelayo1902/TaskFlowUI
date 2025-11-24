import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Goal } from "@/models/Goal";
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

// GET /api/goals?projectId=...
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  const filter: Record<string, any> = {};
  if (projectId) filter.projectId = projectId;

  const docs = await Goal.find(filter).sort({ createdAt: -1 });

  const goals = docs.map((d: any) => ({
    id: d._id.toString(),
    title: d.title as string,
    progress: typeof d.progress === "number" ? (d.progress as number) : 0,
    projectId: typeof d.projectId === "string" ? (d.projectId as string) : undefined,
    ownerId: typeof d.ownerId === "string" ? (d.ownerId as string) : undefined,
  }));

  return NextResponse.json({ goals }, { status: 200 });
}

// POST /api/goals
export async function POST(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, progress, projectId, ownerId } = body ?? {};

    if (!title) {
      return NextResponse.json(
        { message: "Falta el campo requerido: title" },
        { status: 400 }
      );
    }

    const value =
      typeof progress === "number"
        ? Math.max(0, Math.min(100, progress))
        : 0;

    const doc = await Goal.create({
      title: String(title).trim(),
      progress: value,
      projectId: projectId ? String(projectId) : undefined,
      ownerId: ownerId ? String(ownerId) : undefined,
    });

    // Realtime: activity feed for goal creation
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Goal created: ${String(doc.title)}`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (goal:created):", e);
    }

    return NextResponse.json(
      {
        goal: {
          id: (doc as any)._id.toString(),
          title: doc.title,
          progress: doc.progress,
          projectId: doc.projectId,
          ownerId: doc.ownerId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando goal:", err);
    return NextResponse.json(
      { message: "Error interno al crear goal" },
      { status: 500 }
    );
  }
}
