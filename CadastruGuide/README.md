# CadastruGuide

Platformă web pentru antreprenori din **Cluj-Napoca**: hartă cu parcele ANCPI, detalii imobil (demo), roadmap autorizări după cod **CAEN**.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- MapLibre GL JS
- Zustand
- Design system: [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

## Pornire locală

```bash
npm install
npm run dev
```

Deschideți [http://localhost:3000](http://localhost:3000).

- `/` — landing
- `/harta` — hartă + panou proprietate + roadmap CAEN

## Date

- **Geometrie parcele:** ANCPI Geoportal (`geoportal.ancpi.ro`)
- **Carte funciară / urbanism / autorizații:** mock pentru demo (vezi `data/mock/properties.json`)

## API intern

| Endpoint | Descriere |
|----------|-----------|
| `POST /api/ancpi/identify` | Parcelă la click |
| `GET /api/ancpi/parcels?bbox=` | Parcele în viewport |
| `GET /api/properties/[ref]` | Detalii mock imobil |
| `GET /api/caen/search?q=` | Căutare CAEN |
| `GET /api/roadmap/[caen]` | Pași autorizare |

## Viitor

Vezi [docs/ROADMAP.md](docs/ROADMAP.md) — ROeID, notificări expirări, integrări epay.ancpi.
