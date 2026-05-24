import { NextResponse } from "next/server";
import { explainLegalTerm } from "@/lib/gemini";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corp JSON invalid." }, { status: 400 });
  }

  const term =
    typeof body === "object" && body !== null && "term" in body && typeof body.term === "string"
      ? body.term.trim()
      : "";
  const context =
    typeof body === "object" &&
    body !== null &&
    "context" in body &&
    typeof body.context === "string"
      ? body.context.trim()
      : "";

  if (!term || term.length < 2 || term.length > 120) {
    return NextResponse.json({ error: "Termen invalid." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Cheia Gemini nu este configurată. Adaugă GEMINI_API_KEY în fișierul .env.local." },
      { status: 503 },
    );
  }

  try {
    const definition = await explainLegalTerm(term, context || term);
    return NextResponse.json({ term, definition });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nu am putut obține definiția termenului.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
