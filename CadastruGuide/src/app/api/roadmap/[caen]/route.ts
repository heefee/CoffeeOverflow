import { NextResponse } from "next/server";
import { getRoadmapByCaen } from "@/lib/caen";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caen: string }> },
) {
  const { caen } = await params;
  const roadmap = getRoadmapByCaen(caen);
  if (!roadmap) {
    return NextResponse.json({ error: "Cod CAEN necunoscut" }, { status: 404 });
  }
  return NextResponse.json(roadmap);
}
