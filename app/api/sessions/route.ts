import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db, userSessions } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await db.query.userSessions.findMany({
    where: eq(userSessions.userId, userId),
    orderBy: [desc(userSessions.lastActive)],
  });

  return Response.json(sessions);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { deviceName, ipAddress, userAgent } = await req.json();

  const [session] = await db
    .insert(userSessions)
    .values({ userId, deviceName, ipAddress, userAgent })
    .returning();

  return Response.json(session, { status: 201 });
}
