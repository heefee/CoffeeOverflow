import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildRoeidAuthorizationUrl,
  createMockRoeidUser,
  createOidcState,
  getSafeReturnTo,
  isMockRoeidEnabled,
  ROEID_NONCE_COOKIE,
  ROEID_STATE_COOKIE,
} from "@/lib/auth/roeid";
import { setAuthSession } from "@/lib/auth/session";
import { upsertAuthUser } from "@/lib/auth/users";

const STATE_MAX_AGE_SECONDS = 10 * 60;

export async function GET(request: NextRequest) {
  const returnTo = getSafeReturnTo(request);

  if (isMockRoeidEnabled()) {
    const user = await upsertAuthUser(createMockRoeidUser());
    await setAuthSession(user);
    return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
  }

  try {
    const { state, nonce } = createOidcState();
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: STATE_MAX_AGE_SECONDS,
    };

    cookieStore.set(ROEID_STATE_COOKIE, state, cookieOptions);
    cookieStore.set(ROEID_NONCE_COOKIE, nonce, cookieOptions);

    const authorizationUrl = await buildRoeidAuthorizationUrl(request, state, nonce);
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("ROeID start error:", error);
    return NextResponse.redirect(new URL("/login?error=config", request.nextUrl.origin));
  }
}
