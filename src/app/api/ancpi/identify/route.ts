import { NextResponse } from "next/server";
import { getCadastralRef, identifyParcel } from "@/lib/ancpi";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { lng?: number; lat?: number };
    const { lng, lat } = body;

    if (typeof lng !== "number" || typeof lat !== "number") {
      return NextResponse.json(
        { error: "lng și lat sunt obligatorii" },
        { status: 400 },
      );
    }

    const feature = await identifyParcel(lng, lat);
    if (!feature) {
      return NextResponse.json({ feature: null, message: "Nicio parcelă găsită" });
    }

    return NextResponse.json({
      feature,
      cadastralRef: getCadastralRef(feature.properties),
    });
  } catch (error) {
    console.error("ANCPI identify error:", error);
    return NextResponse.json(
      { error: "Eroare la interogarea ANCPI" },
      { status: 502 },
    );
  }
}
