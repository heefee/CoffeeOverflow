import type {
  Authorization,
  CadastreInfo,
  CertificateStatus,
  LandBookDetails,
  PropertyRecord,
  UrbanismDetails,
} from "@/types";
import mockProperties from "../../data/mock/properties.json";

const catalog = mockProperties as unknown as Record<string, Partial<PropertyRecord>>;

const ADDRESSES = [
  "Str. Memorandumului 28, Cluj-Napoca",
  "Bd. Eroilor 15, Cluj-Napoca",
  "Str. Napoca 12, Cluj-Napoca",
  "Piața Unirii 1, Cluj-Napoca",
  "Str. Republicii 42, Cluj-Napoca",
  "Calea Turzii 88, Cluj-Napoca",
  "Str. Observatorului 34, Cluj-Napoca",
  "Bd. Muncii 65, Cluj-Napoca",
  "Str. Horea 7, Cluj-Napoca",
  "Str. Fabricii 45, Cluj-Napoca",
];

const PUG_ZONES = [
  "Mixt central — M1",
  "Locuințe — L2",
  "Mixt cu linii comerciale — M2",
  "Servicii publice — SP",
  "Comercial — C1",
];

const LAND_CATEGORIES = [
  "Teren cu construcții",
  "Teren fără construcții",
  "Teren cu construcții și curți",
  "Teren din intravilan — curți construcții",
];

const USAGE_CATEGORIES = [
  "Construcții civile",
  "Construcții comerciale",
  "Construcții industriale",
  "Teren liber — intravilan",
];

function hashRef(ref: string): number {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = (h * 31 + ref.charCodeAt(i)) >>> 0;
  return h;
}

export function refFromCoordinates(lng: number, lat: number): string {
  const key = `${lng.toFixed(5)}_${lat.toFixed(5)}`;
  const h = hashRef(key);
  const sector = (h % 99) + 1;
  const parcel = (h % 9999) + 100;
  return `424500-${sector}-${parcel}`;
}

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildAuthorizations(
  h: number,
  cuStatus: CertificateStatus,
): PropertyRecord["authorizations"] {
  const existing: Authorization[] = [];

  if (cuStatus === "valid") {
    existing.push({
      id: "cu-1",
      type: "Certificat de urbanism",
      authority: "Primăria Cluj-Napoca",
      status: "active",
      number: `CU-${42000 + (h % 500)}`,
      issuedAt: formatDate(120),
      expiresAt: formatDate(-60),
      notes: "Act de informare — nu ține loc de autorizație de construire",
    });
  }

  if (h % 3 !== 0) {
    existing.push({
      id: "ac-1",
      type: "Autorizație de construire",
      authority: "Primăria Cluj-Napoca",
      status: h % 5 === 0 ? "expired" : "active",
      number: `AC-${31000 + (h % 800)}`,
      issuedAt: formatDate(800),
      expiresAt: h % 5 === 0 ? formatDate(30) : undefined,
      notes: "Lucrări aprobate conform documentației tehnice depuse",
    });
  }

  if (h % 2 === 0) {
    existing.push({
      id: "af-1",
      type: h % 4 === 0 ? "Autorizație de funcționare" : "Acord de funcționare",
      authority: "Primăria Cluj-Napoca",
      status: "active",
      number: `AF-${15000 + (h % 300)}`,
      issuedAt: formatDate(400),
      expiresAt: formatDate(-365),
    });
  }

  if (h % 3 === 1) {
    existing.push({
      id: "dsp-1",
      type: "Aviz sanitar / Autorizație DSP",
      authority: "DSP Cluj",
      status: "active",
      number: `DSP-${8000 + (h % 200)}`,
      issuedAt: formatDate(200),
      expiresAt: formatDate(-180),
    });
  }

  if (h % 4 === 2) {
    existing.push({
      id: "isu-1",
      type: "Aviz securitate la incendiu",
      authority: "ISU Cluj",
      status: "active",
      number: `ISU-${5000 + (h % 150)}`,
      issuedAt: formatDate(350),
      expiresAt: formatDate(-90),
      notes: "Scenariu de securitate la incendiu aprobat",
    });
  }

  const possible: Authorization[] = [
    {
      id: "pos-cu",
      type: "Certificat de urbanism (reemitere)",
      authority: "Primăria Cluj-Napoca",
      status: "possible",
      notes: cuStatus !== "valid" ? "Necesar înainte de orice autorizație" : undefined,
    },
    {
      id: "pos-af",
      type: "Autorizație de funcționare HoReCa / comercial",
      authority: "Primăria Cluj-Napoca",
      status: "possible",
      notes: "După avize DSP și ISU",
    },
    {
      id: "pos-mediu",
      type: "Acord de mediu (dacă e cazul)",
      authority: "APM Cluj",
      status: "possible",
      notes: "Pentru activități cu impact sau spații mari",
    },
  ];

  return { existing, possible };
}

export function generatePropertyFromRef(
  cadastralRef: string,
  areaSqm = 450,
  lng = 23.588,
  lat = 46.771,
): PropertyRecord {
  const h = hashRef(cadastralRef);
  const cuStatus = (["valid", "missing", "expired"] as const)[h % 3];
  const area = Math.round(areaSqm || 200 + (h % 800));
  const sector = (h % 48) + 1;

  const cadastre: CadastreInfo = {
    nationalCadastralRef: cadastralRef,
    localCadastralNumber: `${sector}/${(h % 999) + 1}`,
    uat: "Municipiul Cluj-Napoca",
    sector: `Sector cadastral ${sector}`,
    landCategory: LAND_CATEGORIES[h % LAND_CATEGORIES.length],
    usageCategory: USAGE_CATEGORIES[h % USAGE_CATEGORIES.length],
    intravilan: true,
    coordinates: { lat, lng },
    registeredAt: formatDate(2000 + (h % 500)),
    dataSource: "ANCPI / eTerra (demo)",
  };

  const landBook: LandBookDetails = {
    number: `CF ${42000 + (h % 9000)}`,
    volume: `${(h % 80) + 1}`,
    sheet: `${(h % 120) + 1}/${(h % 50) + 2}`,
    ownersMasked:
      h % 2 === 0
        ? "S.R.L. Proprietar Demo — CUI mascat"
        : "Popescu Ion și Popescu Maria — date mascate",
    propertyRight: h % 3 === 0 ? "Proprietate" : "Coproprietate",
    encumbrances:
      h % 4 === 0
        ? [
            "Ipotecă imobiliară — Bancă Demo S.A.",
            "Interdicție de înstrăinare (48 luni)",
          ]
        : ["Fără sarcini înregistrate la data consultării (demo)"],
    annotations:
      h % 5 === 0
        ? ["Notare antecontract vânzare-cumpărare", "Servitute de trecere utilități"]
        : ["Înscriere în sistemul integrat de cadastru și carte funciară"],
    lastUpdate: formatDate(5 + (h % 30)),
  };

  const urbanism: UrbanismDetails = {
    certificateStatus: cuStatus,
    certificateNumber:
      cuStatus === "valid" ? `CU-${2020 + (h % 5)}/${1000 + (h % 900)}` : undefined,
    issuedAt: cuStatus === "valid" ? formatDate(90) : undefined,
    validUntil:
      cuStatus === "valid"
        ? formatDate(-120)
        : cuStatus === "expired"
          ? formatDate(200)
          : undefined,
    purpose:
      cuStatus === "valid"
        ? "Informare regim juridic, economic și tehnic — deschidere activitate comercială"
        : undefined,
    pugZone: PUG_ZONES[h % PUG_ZONES.length],
    restrictions:
      h % 2 === 0
        ? [
            "Regim de înălțime P+2",
            "Retragere minimă față de aliniament: 3 m",
            "Coeficient de utilizare a terenului (CUT): 1,2",
          ]
        : [
            "Teren în intravilan",
            "Lățime minimă acces: 4 m",
            "Protecție zone verzi adiacente",
          ],
    existingBuildings:
      h % 3 === 0
        ? ["Construcție existentă P+1 — suprafață construită ~180 mp"]
        : ["Fără construcții înscrise — teren liber"],
    allowedDestinations: [
      "Locuințe",
      "Comerț",
      "Servicii",
      "Birouri (condiționat de PUG)",
    ],
  };

  return {
    cadastralRef,
    address: ADDRESSES[h % ADDRESSES.length],
    areaSqm: area,
    pugZone: PUG_ZONES[h % PUG_ZONES.length],
    cadastre,
    landBook,
    urbanism,
    authorizations: buildAuthorizations(h, cuStatus),
  };
}

function mergeProperty(
  base: PropertyRecord,
  overrides: Partial<PropertyRecord>,
): PropertyRecord {
  return {
    ...base,
    ...overrides,
    cadastre: { ...base.cadastre, ...overrides.cadastre },
    landBook: { ...base.landBook, ...overrides.landBook },
    urbanism: { ...base.urbanism, ...overrides.urbanism },
    authorizations: overrides.authorizations ?? base.authorizations,
  };
}

export function getPropertyByRef(
  cadastralRef: string,
  areaSqm?: number,
  lng?: number,
  lat?: number,
): PropertyRecord {
  const decoded = decodeURIComponent(cadastralRef);
  const generated = generatePropertyFromRef(
    decoded,
    areaSqm,
    lng ?? 23.588,
    lat ?? 46.771,
  );

  const stored = catalog[decoded] ?? catalog[cadastralRef];
  if (stored) {
    return mergeProperty(generated, {
      ...stored,
      cadastralRef: stored.cadastralRef ?? decoded,
      cadastre: {
        ...generated.cadastre,
        nationalCadastralRef: stored.cadastralRef ?? decoded,
        ...(stored.cadastre ?? {}),
      },
      landBook: stored.landBook
        ? { ...generated.landBook, ...stored.landBook }
        : generated.landBook,
      urbanism: stored.urbanism
        ? { ...generated.urbanism, ...stored.urbanism }
        : generated.urbanism,
    });
  }

  return generated;
}

export function getPropertyFromClick(
  lng: number,
  lat: number,
  cadastralRef?: string,
  areaSqm?: number,
): PropertyRecord {
  const ref = cadastralRef?.trim() || refFromCoordinates(lng, lat);
  return getPropertyByRef(ref, areaSqm, lng, lat);
}

export function listMockRefs(): string[] {
  return Object.keys(catalog);
}
