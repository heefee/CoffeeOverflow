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

/** Imobil înscris în carte funciară: teren (nr. cadastral bază) + construcție (bază-C1). */
export interface CadastralImobilePart {
  role: "teren" | "constructie";
  cadastralNumber: string;
  carteFunciara: string;
  areaSqm?: number;
  usage: string;
  buildingLabel?: string;
}

export interface PugZoneDetails {
  code: string;
  label: string;
  subzones?: string[];
  character?: string;
  potMax?: string;
  cutMax?: string;
  heightRegime?: string;
  keyRules: string[];
}

export interface UrbanismDetails {
  certificateStatus: CertificateStatus;
  certificateNumber?: string;
  issuedAt?: string;
  validUntil?: string;
  purpose?: string;
  pugZone: string;
  pug?: PugZoneDetails;
  restrictions: string[];
  existingBuildings: string[];
  allowedDestinations: string[];
  sourceUrl?: string;
  topographicNumber?: string;
  cadastralNumbers?: string[];
}

export interface PropertyRecord {
  cadastralRef: string;
  address: string;
  areaSqm: number;
  pugZone: string;
  /** Teren + construcție (cod construcție = cod teren + „-C1”). */
  immobile?: CadastralImobilePart[];
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
