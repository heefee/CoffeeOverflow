import { NextResponse } from "next/server";
import { getPropertyByRef } from "@/lib/properties";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const { searchParams } = new URL(request.url);
  const areaSqm = searchParams.get("areaSqm");
  const lng = searchParams.get("lng");
  const lat = searchParams.get("lat");
  const area = areaSqm ? parseFloat(areaSqm) : undefined;
  const longitude = lng ? parseFloat(lng) : undefined;
  const latitude = lat ? parseFloat(lat) : undefined;

  const property = getPropertyByRef(ref, area, longitude, latitude);
  return NextResponse.json(property);
}
