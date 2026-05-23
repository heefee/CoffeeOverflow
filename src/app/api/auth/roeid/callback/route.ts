import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildUserFromTokens,
  exchangeCodeForTokens,
  ROEID_NONCE_COOKIE,
  ROEID_STATE_COOKIE,
} from "@/lib/auth/roeid";
import { setAuthSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(ROEID_STATE_COOKIE)?.value;
  const expectedNonce = cookieStore.get(ROEID_NONCE_COOKIE)?.value;

  cookieStore.delete(ROEID_STATE_COOKIE);
  cookieStore.delete(ROEID_NONCE_COOKIE);

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=callback", request.nextUrl.origin));
  }

  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(new URL("/login?error=state", request.nextUrl.origin));
  }

  try {
    const tokens = await exchangeCodeForTokens(request, code);
    const user = await buildUserFromTokens(tokens, expectedNonce);
    await setAuthSession(user);
    return NextResponse.redirect(new URL("/harta", request.nextUrl.origin));
  } catch (error) {
    console.error("ROeID callback error:", error);
    return NextResponse.redirect(new URL("/login?error=roeid", request.nextUrl.origin));
  }
}
