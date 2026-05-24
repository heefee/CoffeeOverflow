import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/auth/email-verification";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    if (!body.email) {
      return NextResponse.json({ error: "Emailul este obligatoriu." }, { status: 400 });
    }

    await sendVerificationCode(body.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email verification send error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut trimite codul de verificare.",
      },
      { status: 500 },
    );
  }
}
