import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Goal } from "@/models/Goal";
import { verifyUserToken } from "@/lib/jwt";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const doc = await Goal.findById(id);
  if (!doc) {
    return NextResponse.json({ message: "Meta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(
    {
      goal: {
        id: (doc as any)._id.toString(),
        title: doc.title as string,
        progress: typeof doc.progress === "number" ? (doc.progress as number) : 0,
        projectId: typeof doc.projectId === "string" ? (doc.projectId as string) : undefined,
        ownerId: typeof doc.ownerId === "string" ? (doc.ownerId as string) : undefined,
      },
    },
    { status: 200 }
  );
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const patch = await req.json();

    const allowed: Record<string, any> = {};
    if (typeof patch.title === "string") allowed.title = patch.title.trim();
    if (typeof patch.progress === "number") {
      allowed.progress = Math.max(0, Math.min(100, patch.progress));
    }
    if (typeof patch.projectId === "string") allowed.projectId = patch.projectId;
    if (typeof patch.ownerId === "string") allowed.ownerId = patch.ownerId;

    const updated = await Goal.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ message: "Meta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(
      {
        goal: {
          id: (updated as any)._id.toString(),
          title: updated.title,
          progress: updated.progress,
          projectId: updated.projectId,
          ownerId: updated.ownerId,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error actualizando meta:", err);
    return NextResponse.json(
      { message: "Error interno al actualizar meta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await Goal.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Meta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando meta:", err);
    return NextResponse.json(
      { message: "Error interno al eliminar meta" },
      { status: 500 }
    );
  }
}
