/** Cluj-Napoca bounding box (EPSG:4326) */
export const CLUJ_BBOX = {
  west: 23.52,
  south: 46.72,
  east: 23.68,
  north: 46.82,
} as const;

export const CLUJ_CENTER: [number, number] = [23.588, 46.771];

export const ANCPI_LAYER_URL =
  "https://geoportal.ancpi.ro/inspireview/rest/services/CP/CP_View/MapServer/1";

export const ANCPI_MAP_SERVER_URL =
  "https://geoportal.ancpi.ro/inspireview/rest/services/CP/CP_View/MapServer";

export const DISCLAIMER_RO =
  "Datele de carte funciară, urbanism și autorizații sunt demonstrative. Geometria parcelelor provine din ANCPI.";

export const MAP_SIDEBAR_RESIZE_START = "eavizat-sidebar-resize-start";
export const MAP_SIDEBAR_RESIZE_END = "eavizat-sidebar-resize-end";
