# eAvizat (sau nu?) — Foaie de parcurs produs

## MVP (Hackathon) — livrat

- Hartă Cluj-Napoca cu parcele ANCPI (geoportal REST)
- Panou detalii imobil (date mock: CF, urbanism, autorizații)
- Selector CAEN + roadmap pași autorizare
- Landing public, fără autentificare

## Faza 2 — Autentificare ROeID

- OIDC / NextAuth cu furnizor ROeID
- Profil utilizator, parcele salvate, istoric roadmap
- Rute protejate doar pentru acțiuni care necesită identitate (comenzi documente)

## Faza 3 — Integrări date reale

- **epay.ancpi.ro** — extrase carte funciară (API/parteneriat instituțional)
- **eDirect / primărie** — status certificat urbanism, depunere cereri
- **Registru autorizații locale** — unde există API sau feed deschis
- Abstractizare `PropertyDataProvider` (mock → live)

## Faza 4 — Notificări

- Model `Authorization.expiresAt` + preferințe user
- Cron zilnic: email (Resend) + notificări in-app
- Alertă instituții (webhook / email B2G) pentru expirări pe proprietăți monitorizate
- Feed modificări legislative (legislatie.just.ro) mapat pe tipuri CAEN

## Faza 5 — Extindere geografică

- Config per județ/UAT (bbox, primărie, DSP, ISU)
- Tile caching / CDN pentru performanță națională

## Arhitectură țintă

```
ROeID → Auth → User → SavedParcel → NotificationJob
                    ↓
              PropertyDataProvider → ANCPI | epay | eDirect
```
