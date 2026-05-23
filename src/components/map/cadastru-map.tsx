"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CLUJ_BBOX, CLUJ_CENTER } from "@/lib/constants";
import { getCadastralRef } from "@/lib/ancpi";
import { getPropertyFromClick } from "@/lib/properties";
import {
  findMockLocationAt,
  getMockLocations,
  polygonCentroid,
  type MockLocationFeature,
} from "@/lib/mock-locations";
import { useAppStore } from "@/store/app-store";
import type { AncpiFeature, PropertyRecord } from "@/types";
import { Input } from "@/components/ui/input";
import { MapDisclaimer } from "./map-disclaimer";

const PARCELS_SOURCE = "ancpi-parcels";
const PARCELS_LAYER = "ancpi-parcels-fill";
const MOCK_LOCATIONS_SOURCE = "mock-locations";
const MOCK_LOCATIONS_FILL = "mock-locations-fill";
const MOCK_LOCATIONS_LINE = "mock-locations-line";
const SELECTED_SOURCE = "selected-parcel";
const SELECTED_LAYER = "selected-parcel-fill";
const CLICK_MARKER_SOURCE = "click-marker";
const LIGHT_BASEMAP_SOURCE = "basemap-light";
const LIGHT_BASEMAP_LAYER = "basemap-light";
const DARK_BASEMAP_SOURCE = "basemap-dark";
const DARK_BASEMAP_LAYER = "basemap-dark";

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains("dark");
}

function syncBasemapTheme(map: maplibregl.Map) {
  if (!map.getLayer(LIGHT_BASEMAP_LAYER) || !map.getLayer(DARK_BASEMAP_LAYER)) return;
  const dark = isDarkTheme();
  map.setLayoutProperty(LIGHT_BASEMAP_LAYER, "visibility", dark ? "none" : "visible");
  map.setLayoutProperty(DARK_BASEMAP_LAYER, "visibility", dark ? "visible" : "none");
}

function hasParcelLayer(map: maplibregl.Map): boolean {
  return Boolean(map.getLayer(PARCELS_LAYER));
}

function queryParcelHits(
  map: maplibregl.Map,
  lng: number,
  lat: number,
): maplibregl.MapGeoJSONFeature[] {
  if (!hasParcelLayer(map)) return [];
  const point = map.project([lng, lat]);
  return map.queryRenderedFeatures(point, { layers: [PARCELS_LAYER] });
}

function hasMockLocationLayer(map: maplibregl.Map): boolean {
  return Boolean(map.getLayer(MOCK_LOCATIONS_FILL));
}

function queryMockLocationHits(
  map: maplibregl.Map,
  lng: number,
  lat: number,
): maplibregl.MapGeoJSONFeature[] {
  if (!hasMockLocationLayer(map)) return [];
  const point = map.project([lng, lat]);
  return map.queryRenderedFeatures(point, { layers: [MOCK_LOCATIONS_FILL] });
}

function mockFeatureToAncpi(feature: MockLocationFeature): AncpiFeature {
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      nationalCadastralRef: feature.properties.id,
      id_localId: feature.properties.label,
    },
  };
}

function loadMockLocations(map: maplibregl.Map) {
  const data = getMockLocations();
  const source = map.getSource(MOCK_LOCATIONS_SOURCE) as maplibregl.GeoJSONSource;
  if (source) {
    source.setData(data);
    return;
  }

  map.addSource(MOCK_LOCATIONS_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: MOCK_LOCATIONS_FILL,
    type: "fill",
    source: MOCK_LOCATIONS_SOURCE,
    paint: {
      "fill-color": [
        "match",
        ["get", "kind"],
        "owned",
        "#22c55e",
        "competitor",
        "#ef4444",
        "#94a3b8",
      ],
      "fill-opacity": [
        "case",
        ["any", ["==", ["get", "isPlanB"], true], ["==", ["get", "isBelvedere"], true]],
        0.62,
        0.42,
      ],
    },
  });
  map.addLayer({
    id: MOCK_LOCATIONS_LINE,
    type: "line",
    source: MOCK_LOCATIONS_SOURCE,
    paint: {
      "line-color": [
        "match",
        ["get", "kind"],
        "owned",
        "#22c55e",
        "competitor",
        "#f87171",
        "#cbd5e1",
      ],
      "line-width": [
        "case",
        ["any", ["==", ["get", "isPlanB"], true], ["==", ["get", "isBelvedere"], true]],
        4,
        2.75,
      ],
    },
  });

  map.on("mouseenter", MOCK_LOCATIONS_FILL, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", MOCK_LOCATIONS_FILL, () => {
    map.getCanvas().style.cursor = "crosshair";
  });
  ensureMockLocationsOnTop(map);
}

function ensureMockLocationsOnTop(map: maplibregl.Map) {
  if (!hasMockLocationLayer(map)) return;
  if (!hasParcelLayer(map)) return;
  map.moveLayer(MOCK_LOCATIONS_FILL);
  map.moveLayer(MOCK_LOCATIONS_LINE);
}

interface PropertySearchResult {
  feature: MockLocationFeature;
  property: PropertyRecord;
  queryText: string;
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildSearchResults(): PropertySearchResult[] {
  return getMockLocations().features.map((feature) => {
    const center = polygonCentroid(feature);
    const property = getPropertyFromClick(center.lng, center.lat);
    const activityText = [
      ...property.authorizations.existing.map((authorization) => authorization.type),
      ...property.authorizations.possible.map((authorization) => authorization.type),
      property.urbanism.purpose ?? "",
      property.urbanism.allowedDestinations.join(" "),
    ].join(" ");

    return {
      feature,
      property,
      queryText: normalizeSearch(
        [
          feature.properties.label,
          feature.properties.id,
          property.address,
          property.cadastralRef,
          property.landBook.number,
          property.cadastre.localCadastralNumber,
          activityText,
        ].join(" "),
      ),
    };
  });
}

function MapSearch({
  onSelect,
}: {
  onSelect: (result: PropertySearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchResults = useMemo(() => buildSearchResults(), []);
  const normalizedQuery = normalizeSearch(query.trim());
  const filteredResults = normalizedQuery
    ? searchResults
        .filter((result) => result.queryText.includes(normalizedQuery))
        .slice(0, 6)
    : [];

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (filteredResults[0]) {
      onSelect(filteredResults[0]);
      setIsFocused(false);
    }
  }

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[min(560px,calc(100%-2rem))] -translate-x-1/2">
      <form onSubmit={submitSearch} className="relative">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Caută după adresă, activitate sau nr. CF"
          className="h-11 rounded-xl bg-card/95 px-4 pr-24 text-sm shadow-lg backdrop-blur-md dark:bg-card/85"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 h-8 cursor-pointer rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Caută
        </button>
      </form>

      {isFocused && query.trim() ? (
        <div className="mt-2 overflow-hidden rounded-xl bg-card/95 text-sm text-card-foreground shadow-xl backdrop-blur-md dark:bg-card/90">
          {filteredResults.length ? (
            <ul className="max-h-72 overflow-y-auto py-1">
              {filteredResults.map((result) => (
                <li key={result.feature.properties.id}>
                  <button
                    type="button"
                    className="w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-secondary"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onSelect(result);
                      setQuery(result.property.address);
                      setIsFocused(false);
                    }}
                  >
                    <span className="block font-medium text-foreground">
                      {result.feature.properties.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {result.property.address} · {result.property.landBook.number}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-muted-foreground">Nicio proprietate găsită.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MapLegend() {
  return (
    <div className="pointer-events-none absolute bottom-9 right-[36px] z-10 rounded-xl bg-card/90 px-4 py-3 text-xs text-card-foreground shadow-lg backdrop-blur-md dark:bg-card/80">
      <p className="mb-2 font-semibold uppercase tracking-wide text-primary">Legendă</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-6 rounded-sm border-2 border-[#f87171] bg-[#ef4444]/35"
            aria-hidden
          />
          <span>Spațiu comercial</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-6 rounded-sm border-2 border-[#22c55e] bg-[#22c55e]/35"
            aria-hidden
          />
          <span>Teren agricol</span>
        </div>
      </div>
    </div>
  );
}

function bindParcelHoverHandlers(map: maplibregl.Map) {
  if (!hasParcelLayer(map)) return;
  map.on("mouseenter", PARCELS_LAYER, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", PARCELS_LAYER, () => {
    map.getCanvas().style.cursor = "crosshair";
  });
}

async function fetchAncpiIdentify(
  lng: number,
  lat: number,
): Promise<{ feature: AncpiFeature | null; cadastralRef?: string }> {
  try {
    const res = await fetch("/api/ancpi/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lng, lat }),
    });
    if (!res.ok) return { feature: null };
    const data = await res.json();
    return {
      feature: data.feature ?? null,
      cadastralRef: data.cadastralRef,
    };
  } catch {
    return { feature: null };
  }
}

async function fetchMockProperty(
  lng: number,
  lat: number,
  cadastralRef?: string,
  areaSqm?: number,
) {
  const res = await fetch("/api/properties/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lng, lat, cadastralRef, areaSqm }),
  });
  if (!res.ok) throw new Error("resolve failed");
  return res.json();
}

export function CadastruMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parcelHoverBoundRef = useRef(false);

  const {
    setSelectedFeature,
    setSelectedProperty,
    setLoadingParcel,
    setLoadingProperty,
  } = useAppStore();

  const loadParcelsForBounds = useCallback(async (map: maplibregl.Map) => {
    const b = map.getBounds();
    const params = new URLSearchParams({
      west: String(b.getWest()),
      south: String(b.getSouth()),
      east: String(b.getEast()),
      north: String(b.getNorth()),
      limit: "80",
    });

    try {
      const res = await fetch(`/api/ancpi/parcels?${params}`);
      if (!res.ok) return;
      const geojson = (await res.json()) as GeoJSON.FeatureCollection;

      const source = map.getSource(PARCELS_SOURCE) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(PARCELS_SOURCE, { type: "geojson", data: geojson });
        map.addLayer({
          id: PARCELS_LAYER,
          type: "fill",
          source: PARCELS_SOURCE,
          paint: {
            "fill-color": "#1e3a5f",
            "fill-opacity": 0.26,
            "fill-outline-color": "#1e3a5f",
          },
        });
        map.addLayer({
          id: "ancpi-parcels-line",
          type: "line",
          source: PARCELS_SOURCE,
          paint: {
            "line-color": "#1e3a5f",
            "line-width": 1,
            "line-opacity": 0.78,
          },
        });
        if (!parcelHoverBoundRef.current) {
          bindParcelHoverHandlers(map);
          parcelHoverBoundRef.current = true;
        }
        ensureMockLocationsOnTop(map);
      }
    } catch {
      /* overlay optional */
    }
  }, []);

  const showClickMarker = useCallback((map: maplibregl.Map, lng: number, lat: number) => {
    const point: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {},
        },
      ],
    };

    const source = map.getSource(CLICK_MARKER_SOURCE) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(point);
    } else {
      map.addSource(CLICK_MARKER_SOURCE, { type: "geojson", data: point });
      map.addLayer({
        id: "click-marker-circle",
        type: "circle",
        source: CLICK_MARKER_SOURCE,
        paint: {
          "circle-radius": 10,
          "circle-color": "#f2ca50",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#0f141a",
        },
      });
    }
  }, []);

  const highlightFeature = useCallback((map: maplibregl.Map, feature: AncpiFeature) => {
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: feature.geometry,
          properties: feature.properties,
        },
      ],
    };

    const source = map.getSource(SELECTED_SOURCE) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(fc);
    } else {
      map.addSource(SELECTED_SOURCE, { type: "geojson", data: fc });
      map.addLayer({
        id: SELECTED_LAYER,
        type: "fill",
        source: SELECTED_SOURCE,
        paint: {
          "fill-color": "#f2ca50",
          "fill-opacity": 0.36,
        },
      });
      map.addLayer({
        id: "selected-parcel-line",
        type: "line",
        source: SELECTED_SOURCE,
        paint: {
          "line-color": "#f2ca50",
          "line-width": 4,
        },
      });
    }
  }, []);

  const handleMapClick = useCallback(
    async (lng: number, lat: number) => {
      setLoadingParcel(true);
      setLoadingProperty(true);
      setSelectedProperty(null);

      const map = mapRef.current;
      if (map) showClickMarker(map, lng, lat);

      try {
        let feature: AncpiFeature | null = null;
        let cadastralRef: string | undefined;
        let areaSqm: number | undefined;
        let resolveLng = lng;
        let resolveLat = lat;

        const mockAtPoint = findMockLocationAt(lng, lat);
        if (mockAtPoint) {
          feature = mockFeatureToAncpi(mockAtPoint);
          const center = polygonCentroid(mockAtPoint);
          resolveLng = center.lng;
          resolveLat = center.lat;
        } else if (map) {
          const mockHits = queryMockLocationHits(map, lng, lat);
          if (mockHits.length > 0 && mockHits[0].geometry) {
            const geom = mockHits[0].geometry;
            if (geom.type === "Polygon") {
              const mockFeature = {
                type: "Feature" as const,
                geometry: geom,
                properties: mockHits[0].properties as MockLocationFeature["properties"],
              };
              feature = mockFeatureToAncpi(mockFeature);
              const center = polygonCentroid(mockFeature);
              resolveLng = center.lng;
              resolveLat = center.lat;
            }
          }
        }

        if (!feature && map) {
          const hits = queryParcelHits(map, lng, lat);
          if (hits.length > 0 && hits[0].geometry) {
            const geom = hits[0].geometry;
            if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
              feature = {
                type: "Feature",
                geometry: geom,
                properties: hits[0].properties as AncpiFeature["properties"],
              };
              cadastralRef = getCadastralRef(feature.properties);
              areaSqm = feature.properties.SHAPE_Area;
            }
          }
        }

        if (!feature) {
          const ancpi = await fetchAncpiIdentify(lng, lat);
          feature = ancpi.feature;
          cadastralRef = ancpi.cadastralRef;
          areaSqm = feature?.properties.SHAPE_Area;
        }

        if (feature && map) {
          highlightFeature(map, feature);
          setSelectedFeature(feature);
        } else {
          setSelectedFeature(null);
        }

        const property = await fetchMockProperty(
          resolveLng,
          resolveLat,
          cadastralRef,
          areaSqm,
        );
        setSelectedProperty(property);
      } catch {
        setSelectedFeature(null);
        setSelectedProperty(null);
      } finally {
        setLoadingParcel(false);
        setLoadingProperty(false);
      }
    },
    [
      highlightFeature,
      setLoadingParcel,
      setLoadingProperty,
      setSelectedFeature,
      setSelectedProperty,
      showClickMarker,
    ],
  );

  const handleSearchSelect = useCallback(
    (result: PropertySearchResult) => {
      const map = mapRef.current;
      const center = polygonCentroid(result.feature);
      const feature = mockFeatureToAncpi(result.feature);

      setSelectedProperty(result.property);
      setSelectedFeature(feature);

      if (!map) return;
      map.flyTo({ center: [center.lng, center.lat], zoom: 16, duration: 900 });
      showClickMarker(map, center.lng, center.lat);
      highlightFeature(map, feature);
    },
    [highlightFeature, setSelectedFeature, setSelectedProperty, showClickMarker],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const darkMode = isDarkTheme();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          [LIGHT_BASEMAP_SOURCE]: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxzoom: 19,
          },
          [DARK_BASEMAP_SOURCE]: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: LIGHT_BASEMAP_LAYER,
            type: "raster",
            source: LIGHT_BASEMAP_SOURCE,
            layout: { visibility: darkMode ? "none" : "visible" },
            paint: {
              "raster-contrast": 0.14,
              "raster-saturation": 0.08,
              "raster-brightness-min": 0.03,
              "raster-brightness-max": 0.98,
            },
          },
          {
            id: DARK_BASEMAP_LAYER,
            type: "raster",
            source: DARK_BASEMAP_SOURCE,
            layout: { visibility: darkMode ? "visible" : "none" },
            paint: {
              "raster-contrast": 0.18,
              "raster-saturation": 0.05,
              "raster-brightness-min": 0.24,
              "raster-brightness-max": 1,
            },
          },
        ],
      },
      center: CLUJ_CENTER,
      zoom: 14,
      maxBounds: [
        [CLUJ_BBOX.west - 0.05, CLUJ_BBOX.south - 0.05],
        [CLUJ_BBOX.east + 0.05, CLUJ_BBOX.north + 0.05],
      ],
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;
    const syncTheme = () => syncBasemapTheme(map);
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("eavizat-theme-change", syncTheme);

    map.on("load", () => {
      syncTheme();
      loadMockLocations(map);
      loadParcelsForBounds(map);
    });

    map.on("moveend", () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => loadParcelsForBounds(map), 400);
    });

    map.on("click", (e) => {
      handleMapClick(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      themeObserver.disconnect();
      window.removeEventListener("eavizat-theme-change", syncTheme);
      parcelHoverBoundRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [handleMapClick, loadParcelsForBounds]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapSearch onSelect={handleSearchSelect} />
      <MapLegend />
      <MapDisclaimer />
    </div>
  );
}
