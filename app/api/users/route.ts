import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyUserToken } from "@/lib/jwt";
import { userListFilterByRequester } from "@/lib/permissions";


export async function GET(req: Request) {
  await connectDB();

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  let requester: { sub: string; email: string; role: "admin" | "manager" | "developer"; iat: number; exp: number };
  try {
    requester = verifyUserToken(auth.slice("Bearer ".length)) as any;
  } catch {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const filterInfo = userListFilterByRequester(requester);
  if (!filterInfo.allowed) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const mongoFilter: Record<string, any> = {};
  if (filterInfo.role) mongoFilter.role = filterInfo.role;
  if (filterInfo.domain) {
    // emails que terminan con @domain
    mongoFilter.email = { $regex: new RegExp(`@${filterInfo.domain}$`, "i") };
  }

  const docs = await User.find(mongoFilter, { name: 1, email: 1, role: 1 })
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
