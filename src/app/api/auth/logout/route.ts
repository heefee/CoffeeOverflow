import { NextRequest, NextResponse } from "next/server";
import { clearAuthSession } from "@/lib/auth/session";

function logoutRedirect(request: NextRequest) {
  const target = new URL("/", request.nextUrl.origin);
  const roeidLogoutUrl = process.env.ROEID_LOGOUT_URL;

  if (!roeidLogoutUrl) return target;

  const url = new URL(roeidLogoutUrl);
  url.searchParams.set("target", target.toString());
  return url;
}

export async function POST(request: NextRequest) {
  await clearAuthSession();
  return NextResponse.redirect(logoutRedirect(request), { status: 303 });
}
