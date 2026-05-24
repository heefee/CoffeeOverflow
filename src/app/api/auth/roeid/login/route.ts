import { NextRequest, NextResponse } from "next/server";
import { getSafeReturnTo } from "@/lib/auth/roeid";

export async function GET(request: NextRequest) {
  const returnTo = getSafeReturnTo(request);
  const verificationUrl = new URL("/login/verify-email", request.nextUrl.origin);
  verificationUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(verificationUrl);
}
