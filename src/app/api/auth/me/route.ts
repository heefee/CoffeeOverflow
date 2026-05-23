import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAuthSession();
  return NextResponse.json({
    authenticated: Boolean(session),
    user: session?.user
      ? {
          name: session.user.name,
          email: session.user.email,
          provider: session.user.provider,
          isMock: session.user.isMock ?? false,
        }
      : null,
  });
}
