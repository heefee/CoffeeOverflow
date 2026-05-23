import locationsGeojson from "../../data/mock/my-locations.json";

export type MockLocationKind = "owned" | "competitor" | "neutral";

export interface MockLocationProperties {
  id: string;
  label: string;
  kind: MockLocationKind;
  isPlanB?: boolean;
  isBelvedere?: boolean;
  fill?: string;
}

export type MockLocationFeature = GeoJSON.Feature<
  GeoJSON.Polygon,
  MockLocationProperties
>;

export type MockLocationsCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  MockLocationProperties
>;

const collection = locationsGeojson as MockLocationsCollection;

function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(
  lng: number,
  lat: number,
  coordinates: GeoJSON.Polygon["coordinates"],
): boolean {
  const [outer, ...holes] = coordinates;
  if (!outer?.length) return false;
  if (!pointInRing([lng, lat], outer)) return false;
  return !holes.some((hole) => pointInRing([lng, lat], hole));
}

export function getMockLocations(): MockLocationsCollection {
  return collection;
}

export function findMockLocationAt(
  lng: number,
  lat: number,
): MockLocationFeature | null {
  for (const feature of collection.features) {
    if (feature.geometry.type !== "Polygon") continue;
    if (pointInPolygon(lng, lat, feature.geometry.coordinates)) {
      return feature as MockLocationFeature;
    }
  }
  return null;
}

export function findMockLocationById(id: string): MockLocationFeature | null {
  const feature = collection.features.find((f) => f.properties?.id === id);
  return (feature as MockLocationFeature) ?? null;
}

export function getPlanBLocation(): MockLocationFeature | null {
  return (
    (collection.features.find((f) => f.properties?.isPlanB) as MockLocationFeature) ??
    null
  );
}

export function polygonCentroid(feature: MockLocationFeature): {
  lng: number;
  lat: number;
} {
  const ring = feature.geometry.coordinates[0];
  let lng = 0;
  let lat = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return { lng: lng / n, lat: lat / n };
}
