import { NextResponse } from "next/server";
import { queryParcelsInBbox } from "@/lib/ancpi";
import { CLUJ_BBOX } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const west = parseFloat(searchParams.get("west") ?? String(CLUJ_BBOX.west));
    const south = parseFloat(searchParams.get("south") ?? String(CLUJ_BBOX.south));
    const east = parseFloat(searchParams.get("east") ?? String(CLUJ_BBOX.east));
    const north = parseFloat(searchParams.get("north") ?? String(CLUJ_BBOX.north));
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    const collection = await queryParcelsInBbox(west, south, east, north, limit);
    return NextResponse.json(collection);
  } catch (error) {
    console.error("ANCPI parcels error:", error);
    return NextResponse.json(
      { error: "Eroare la încărcarea parcelelor" },
      { status: 502 },
    );
  }
}
