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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const doc = await Project.findById(id);
  if (!doc) {
    return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    {
      project: {
        id: (doc as any)._id.toString(),
        name: doc.name,
        key: doc.key,
        ownerId: doc.ownerId,
        members: doc.members ?? [],
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
    if (typeof patch.name === "string") allowed.name = patch.name.trim();
    if (typeof patch.key === "string") allowed.key = String(patch.key).toUpperCase();
    if (typeof patch.ownerId === "string") allowed.ownerId = String(patch.ownerId);
    if (Array.isArray(patch.members)) allowed.members = patch.members.map(String);

    const updated = await Project.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Realtime: activity feed for project update
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Project updated: ${String(updated.name)} [${String(updated.key)}]`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (project:updated):", e);
    }

    return NextResponse.json(
      {
        project: {
          id: (updated as any)._id.toString(),
          name: updated.name,
          key: updated.key,
          ownerId: updated.ownerId,
          members: updated.members ?? [],
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error actualizando proyecto:", err);
    return NextResponse.json(
      { message: "Error interno al actualizar proyecto" },
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
    const deleted = await Project.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Realtime: activity feed for project delete
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Project deleted: ${String((deleted as any)?.name || "")} [${String((deleted as any)?.key || "")}]`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (project:deleted):", e);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando proyecto:", err);
    return NextResponse.json(
      { message: "Error interno al eliminar proyecto" },
      { status: 500 }
    );
  }
}
