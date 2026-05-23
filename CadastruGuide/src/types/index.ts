export type CertificateStatus = "valid" | "missing" | "expired";

export interface Authorization {
  id: string;
  type: string;
  authority: string;
  status: "active" | "expired" | "possible";
  issuedAt?: string;
  expiresAt?: string;
  number?: string;
  notes?: string;
}

export interface CadastreInfo {
  nationalCadastralRef: string;
  localCadastralNumber: string;
  uat: string;
  sector: string;
  landCategory: string;
  usageCategory: string;
  intravilan: boolean;
  coordinates: { lat: number; lng: number };
  registeredAt: string;
  dataSource: string;
}

export interface LandBookDetails {
  number: string;
  volume: string;
  sheet: string;
  ownersMasked: string;
  propertyRight: string;
  encumbrances: string[];
  annotations: string[];
  lastUpdate: string;
}

export interface UrbanismDetails {
  certificateStatus: CertificateStatus;
  certificateNumber?: string;
  issuedAt?: string;
  validUntil?: string;
  purpose?: string;
  pugZone: string;
  restrictions: string[];
  existingBuildings: string[];
  allowedDestinations: string[];
}

export interface PropertyRecord {
  cadastralRef: string;
  address: string;
  areaSqm: number;
  pugZone: string;
  cadastre: CadastreInfo;
  landBook: LandBookDetails;
  urbanism: UrbanismDetails;
  authorizations: {
    existing: Authorization[];
    possible: Authorization[];
  };
}

export interface AncpiParcelAttributes {
  nationalCadastralRef?: string;
  nationalCadastralReference?: string;
  OBJECTID?: number;
  zoning?: number;
  SHAPE_Area?: number;
  id_localId?: string;
}

export interface AncpiFeature {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: AncpiParcelAttributes;
}

export interface RoadmapStep {
  id: string;
  title: string;
  authority: string;
  description: string;
  docs: string[];
  estimatedDays: number;
  legalRef?: string;
  edirectUrl?: string;
  dependsOn?: string[];
}

export interface CaenRoadmap {
  caen: string;
  label: string;
  category: string;
  steps: RoadmapStep[];
}

export interface CaenOption {
  code: string;
  label: string;
  category: string;
}
