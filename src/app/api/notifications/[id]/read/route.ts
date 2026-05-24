import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  }

  const { id } = await params;
  await markNotificationRead(session.user.sub, id);
  return NextResponse.json({ ok: true });
}
