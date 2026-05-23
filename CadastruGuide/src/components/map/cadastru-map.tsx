"use client";

import { useCallback, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CLUJ_BBOX, CLUJ_CENTER } from "@/lib/constants";
import { getCadastralRef } from "@/lib/ancpi";
import { useAppStore } from "@/store/app-store";
import type { AncpiFeature } from "@/types";
import { MapDisclaimer } from "./map-disclaimer";

const PARCELS_SOURCE = "ancpi-parcels";
const PARCELS_LAYER = "ancpi-parcels-fill";
const SELECTED_SOURCE = "selected-parcel";
const SELECTED_LAYER = "selected-parcel-fill";
const CLICK_MARKER_SOURCE = "click-marker";

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
            "fill-opacity": 0.2,
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
            "line-opacity": 0.6,
          },
        });
        if (!parcelHoverBoundRef.current) {
          bindParcelHoverHandlers(map);
          parcelHoverBoundRef.current = true;
        }
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
          "circle-color": "#3b6fa0",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
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
          "fill-color": "#3b6fa0",
          "fill-opacity": 0.4,
        },
      });
      map.addLayer({
        id: "selected-parcel-line",
        type: "line",
        source: SELECTED_SOURCE,
        paint: {
          "line-color": "#3b6fa0",
          "line-width": 3,
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

        if (map) {
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

        const property = await fetchMockProperty(lng, lat, cadastralRef, areaSqm);
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxzoom: 19,
          },
        },
        layers: [{ id: "basemap", type: "raster", source: "basemap" }],
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

    map.on("load", () => loadParcelsForBounds(map));

    map.on("moveend", () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => loadParcelsForBounds(map), 400);
    });

    map.on("click", (e) => {
      handleMapClick(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      parcelHoverBoundRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [handleMapClick, loadParcelsForBounds]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapDisclaimer />
    </div>
  );
}
