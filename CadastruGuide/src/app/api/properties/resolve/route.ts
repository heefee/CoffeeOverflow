import { NextResponse } from "next/server";
import { getPropertyFromClick } from "@/lib/properties";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lng?: number;
      lat?: number;
      cadastralRef?: string;
      areaSqm?: number;
    };

    const { lng, lat, cadastralRef, areaSqm } = body;

    if (typeof lng !== "number" || typeof lat !== "number") {
      return NextResponse.json(
        { error: "lng și lat sunt obligatorii" },
        { status: 400 },
      );
    }

    const property = getPropertyFromClick(lng, lat, cadastralRef, areaSqm);
    return NextResponse.json(property);
  } catch (error) {
    console.error("Property resolve error:", error);
    return NextResponse.json({ error: "Eroare la generarea datelor" }, { status: 500 });
  }
}
