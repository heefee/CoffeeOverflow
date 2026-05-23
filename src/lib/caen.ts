import roadmapsData from "../../data/rules/caen-roadmaps.json";
import type { CaenOption, CaenRoadmap } from "@/types";

const roadmaps = roadmapsData as CaenRoadmap[];

export const CAEN_OPTIONS: CaenOption[] = roadmaps.map((r) => ({
  code: r.caen,
  label: r.label,
  category: r.category,
}));

export function searchCaen(query: string): CaenOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return CAEN_OPTIONS;
  return CAEN_OPTIONS.filter(
    (o) =>
      o.code.includes(q) ||
      o.label.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q),
  );
}

export function getRoadmapByCaen(caen: string): CaenRoadmap | null {
  return roadmaps.find((r) => r.caen === caen) ?? null;
}
