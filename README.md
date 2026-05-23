# eAvizat (sau nu?)

Platformă web pentru antreprenori din **Cluj-Napoca** care ajută la evaluarea unui spațiu în funcție de codul **CAEN**, documentele disponibile și contextul urbanistic. Aplicația include hartă interactivă, recomandări de spații demo, roadmap de autorizare și autentificare cu verificare prin email.

## Stack

- Next.js 16 App Router + TypeScript
- React 19
- Tailwind CSS + shadcn/ui
- MapLibre GL JS
- Zustand
- PostgreSQL pentru useri și coduri de verificare
- Resend pentru email 2FA
- ROeID OIDC, cu `MOCK_ROEID=true` pentru dezvoltare locală

## Funcționalități

- Landing page pentru prezentarea produsului.
- Hartă dark/light cu parcele demo selectabile, legendă și căutare după adresă, activitate curentă sau număr CF.
- Pagină `Roadmap CAEN` unde utilizatorul introduce codul CAEN și poate analiza un spațiu după cartea funciară sau primi recomandări de spații demo.
- Checklist-ul din roadmap este disponibil doar pentru utilizatori autentificați.
- Login ROeID cu pagină intermediară de verificare email.
- Mock mode pentru ROeID, util până la configurarea credențialelor oficiale.

## Pornire Locală

Instalează dependențele:

```bash
npm install
```

Pornește baza de date PostgreSQL locală în Docker:

```powershell
docker run -d --name eavizat-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -v eavizat-postgres-data:/var/lib/postgresql/data postgres:16
```

Dacă ai creat deja containerul și este oprit:

```powershell
docker start eavizat-postgres
```

Rulează scriptul SQL pentru baza de date:

```powershell
Get-Content "scripts\setup-local-db.sql" | docker exec -i eavizat-postgres psql -U postgres
```

Creează `.env.local` pornind de la `.env.example`, apoi pornește aplicația:

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

## Variabile De Mediu

Pentru dezvoltare locală, valorile importante sunt:

```env
MOCK_ROEID=true
DATABASE_URL=postgresql://eavizat:eavizat@localhost:5432/eavizat
DATABASE_SSL=false
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_VERIFICATION_TO_EMAIL=
EMAIL_VERIFICATION_SECRET=change-me-for-email-codes
APP_SESSION_SECRET=change-me-in-production
```

`RESEND_VERIFICATION_TO_EMAIL` este opțional. Dacă este setat, orice cod de verificare se livrează către acel email, dar aplicația verifică în continuare emailul introdus în formular. Este util pentru sandbox-ul Resend.

Când `MOCK_ROEID=false`, trebuie completate și variabilele ROeID:

```env
ROEID_ISSUER=
ROEID_CLIENT_ID=
ROEID_CLIENT_SECRET=
ROEID_SCOPE=openid profile email
ROEID_REDIRECT_URI=http://localhost:3000/api/auth/roeid/callback
ROEID_LOGOUT_URL=
```

## Rute Principale

- `/` - landing page
- `/harta` - hartă + panou proprietate
- `/roadmap-caen` - analiză și recomandări după cod CAEN
- `/login` - autentificare
- `/login/verify-email` - verificare email înainte de ROeID

## API Intern

- `GET /api/ancpi/parcels?bbox=` - parcele în viewport
- `GET /api/properties/[ref]` - detalii mock imobil
- `GET /api/properties/resolve?cf=` - rezolvare proprietate după CF
- `GET /api/caen/search?q=` - căutare CAEN
- `GET /api/roadmap/[caen]` - pași autorizare
- `GET /api/auth/me` - sesiunea curentă
- `GET /api/auth/roeid/login` - intrare în flow-ul de login
- `GET /api/auth/roeid/start` - ROeID real sau mock mode
- `GET /api/auth/roeid/callback` - callback OIDC
- `POST /api/auth/email/send-code` - trimite cod verificare
- `POST /api/auth/email/verify` - verifică codul
- `GET /api/auth/logout` - logout

## Date Demo

- Geometrie parcele: ANCPI Geoportal (`geoportal.ancpi.ro`)
- Proprietăți, cărți funciare, urbanism și autorizații: mock pentru demo în `data/mock/properties.json`
- Coduri CAEN și roadmap: date locale/API intern din proiect

## Comenzi Utile

```bash
npm run dev
npm run build
npm run lint
```

## CoffeeOverflow

This repository belongs to the Coffee Overflow team, developing a full stack web app targeting bureaucracy issues encountered by juridical entities when gathering authorizations for their economical activity.
