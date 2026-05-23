import { ANCPI_LAYER_URL, ANCPI_MAP_SERVER_URL, CLUJ_BBOX } from "./constants";
import type { AncpiFeature, AncpiParcelAttributes } from "@/types";

export function getCadastralRef(attrs: AncpiParcelAttributes): string {
  return (
    attrs.nationalCadastralRef ??
    attrs.nationalCadastralReference ??
    attrs.id_localId ??
    `OBJ-${attrs.OBJECTID ?? "unknown"}`
  );
}

export async function queryParcelAtPoint(
  lng: number,
  lat: number,
): Promise<AncpiFeature | null> {
  const geometry = JSON.stringify({
    x: lng,
    y: lat,
    spatialReference: { wkid: 4326 },
  });

  const params = new URLSearchParams({
    f: "geojson",
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: "1",
  });

  const url = `${ANCPI_LAYER_URL}/query?${params}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`ANCPI query failed: ${res.status}`);
  }

  const data = (await res.json()) as GeoJSON.FeatureCollection;
  const feature = data.features?.[0];
  if (!feature || feature.geometry.type === "Point") return null;

  return {
    type: "Feature",
    geometry: feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
    properties: (feature.properties ?? {}) as AncpiParcelAttributes,
  };
}

export async function queryParcelsInBbox(
  west: number,
  south: number,
  east: number,
  north: number,
  limit = 100,
): Promise<GeoJSON.FeatureCollection> {
  const geometry = JSON.stringify({
    xmin: west,
    ymin: south,
    xmax: east,
    ymax: north,
    spatialReference: { wkid: 4326 },
  });

  const params = new URLSearchParams({
    f: "geojson",
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "nationalCadastralRef,nationalCadastralReference,OBJECTID,zoning,SHAPE_Area",
    returnGeometry: "true",
    resultRecordCount: String(Math.min(limit, 100)),
  });

  const url = `${ANCPI_LAYER_URL}/query?${params}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`ANCPI bbox query failed: ${res.status}`);
  }

  return (await res.json()) as GeoJSON.FeatureCollection;
}

export async function identifyParcel(
  lng: number,
  lat: number,
  mapExtent = CLUJ_BBOX,
): Promise<AncpiFeature | null> {
  const geometry = JSON.stringify({
    x: lng,
    y: lat,
    spatialReference: { wkid: 4326 },
  });

  const extent = `${mapExtent.west},${mapExtent.south},${mapExtent.east},${mapExtent.north}`;
  const params = new URLSearchParams({
    f: "json",
    geometry,
    geometryType: "esriGeometryPoint",
    sr: "4326",
    layers: "all",
    tolerance: "5",
    mapExtent: extent,
    imageDisplay: "800,600,96",
  });

  const url = `${ANCPI_MAP_SERVER_URL}/identify?${params}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    return queryParcelAtPoint(lng, lat);
  }

  const data = (await res.json()) as {
    results?: Array<{
      layerId: number;
      attributes: AncpiParcelAttributes;
      geometry?: { rings?: number[][][] };
    }>;
  };

  const hit = data.results?.find((r) => r.layerId === 1) ?? data.results?.[0];
  if (!hit?.attributes) {
    return queryParcelAtPoint(lng, lat);
  }

  if (hit.geometry?.rings) {
    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: hit.geometry.rings },
      properties: hit.attributes,
    };
  }

  return queryParcelAtPoint(lng, lat);
}
