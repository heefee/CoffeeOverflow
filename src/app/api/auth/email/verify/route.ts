import { NextResponse } from "next/server";
import { verifyEmailCode } from "@/lib/auth/email-verification";
import { isMockRoeidEnabled } from "@/lib/auth/roeid";
import { setAuthSession } from "@/lib/auth/session";
import { createMockUserFromEmail } from "@/lib/auth/users";

function safeReturnTo(value?: string) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return "/harta";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      code?: string;
      returnTo?: string;
    };

    if (!body.email || !body.code) {
      return NextResponse.json(
        { error: "Emailul și codul sunt obligatorii." },
        { status: 400 },
      );
    }

    const isValid = await verifyEmailCode(body.email, body.code);
    if (!isValid) {
      return NextResponse.json(
        { error: "Codul este invalid sau a expirat." },
        { status: 400 },
      );
    }

    if (isMockRoeidEnabled()) {
      const user = await createMockUserFromEmail(body.email.trim().toLowerCase());
      await setAuthSession(user);
      return NextResponse.json({ ok: true, redirectTo: safeReturnTo(body.returnTo) });
    }

    return NextResponse.json({
      ok: true,
      redirectTo: `/api/auth/roeid/start?returnTo=${encodeURIComponent(safeReturnTo(body.returnTo))}`,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut verifica emailul.",
      },
      { status: 500 },
    );
  }
}
