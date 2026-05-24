import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, notifications: [] });
  }

  const notifications = await listNotifications(session.user.sub);
  return NextResponse.json({ authenticated: true, notifications });
}
