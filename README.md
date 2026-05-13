# OSUT Backend

Backend NestJS pentru aplicatia organizatiei studentesti OSUT Cluj.

## Stack

- NestJS
- Prisma ORM
- PostgreSQL
- Docker
- Better Auth
- Swagger/OpenAPI

## Model de date curent

Schema Prisma defineste in acest moment:

- `User` cu rol global de sistem prin `systemRole`: `USER` sau `ADMIN`
- `User.profileRole` pentru rolul principal vizibil in profil
- `Department` pentru departamentele organizatiei
- `Membership` pentru legatura dintre user si departament, cu rol pe departament
- `Announcement` pentru anunturi globale sau pe departament
- `Account`, `Session` si `Verification` pentru Better Auth

Rolurile pe departament sunt:

- `INACTIVE_VOLUNTEER`
- `VOLUNTEER`
- `MEMBER`
- `ACTIVE_MEMBER`
- `CO_COORDINATOR`
- `COORDINATOR`

Rolurile principale din profil sunt:

- `INACTIVE_VOLUNTEER`
- `VOLUNTEER`
- `MEMBER`
- `ACTIVE_MEMBER`

`ADMIN` este rol global pe `User`, separat de rolurile operationale pe departament.

Pentru autentificare:

- `displayName` este numele principal al utilizatorului
- credentialele email/parola sunt stocate in `Account.password`
- login-ul social Google foloseste legarea automata a conturilor pe acelasi email

## Reguli de autorizare modelate in schema

- Un user poate avea roluri diferite in departamente diferite prin `Membership`.
- Un anunt poate fi global sau legat de un departament:
  - `departmentId = null`: anunt global
  - `departmentId != null`: anunt de departament
- Conform modelului curent, anunturile de departament vor putea fi publicate de `CO_COORDINATOR`, `COORDINATOR` sau `ADMIN`.
- Anunturile globale vor putea fi publicate doar de `ADMIN`.

## Configurare mediu

Aplicatia foloseste variabilele de mediu din `.env`.

Exemplu:

```env
DATABASE_URL="postgresql://osut_user:osut_password@localhost:5433/osut_db?schema=public"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Ce reprezinta fiecare variabila

- `DATABASE_URL`
  - conexiunea PostgreSQL folosita de Prisma si Better Auth
  - pentru proiectul tau local poate ramane exact cum este acum, daca folosesti containerul Docker din proiect

- `BETTER_AUTH_SECRET`
  - cheia secreta folosita de Better Auth pentru semnare, criptare si cookie-uri
  - trebuie sa fie lunga si random; nu folosi textul placeholder din exemplu
  - o poti genera cu:

```bash
openssl rand -base64 32
```

- `BETTER_AUTH_URL`
  - URL-ul backend-ului unde ruleaza Better Auth
  - local, daca backend-ul Nest ruleaza pe portul 3000, valoarea corecta este:

```env
BETTER_AUTH_URL="http://localhost:3000"
```

- `FRONTEND_URL`
  - URL-ul frontend-ului care are voie sa apeleze backend-ul si flow-urile de auth
  - daca frontend-ul tau ruleaza pe Vite local, de obicei este:

```env
FRONTEND_URL="http://localhost:5173"
```

- `GOOGLE_CLIENT_ID`
  - acesta este OAuth Client ID din Google Cloud Console
  - se obtine dintr-un credential OAuth 2.0 de tip Web application

- `GOOGLE_CLIENT_SECRET`
  - acesta este OAuth Client Secret din acelasi credential Google OAuth
  - nu trebuie comis niciodata in git

### De unde iei valorile

#### 1. `BETTER_AUTH_SECRET`

Il generezi local, nu il iei de pe un site:

```bash
openssl rand -base64 32
```

Copiaza rezultatul in `.env`, de exemplu:

```env
BETTER_AUTH_SECRET="pune-aici-secretul-generat"
```

#### 2. `BETTER_AUTH_URL`

Este adresa backend-ului tau.

- local: `http://localhost:3000`
- pe server: domeniul real al backend-ului, de exemplu `https://api.osut.ro`

#### 3. `FRONTEND_URL`

Este adresa frontend-ului care consuma backend-ul.

- local cu Vite: `http://localhost:5173`
- local cu alt port: inlocuiesti cu portul real
- productie: domeniul real al frontend-ului

#### 4. `GOOGLE_CLIENT_ID` si `GOOGLE_CLIENT_SECRET`

Le iei din Google Cloud Console:

1. Intra pe `https://console.cloud.google.com/`
2. Creeaza sau selecteaza un proiect
3. Mergi la `APIs & Services`
4. Configureaza `OAuth consent screen`
5. Creeaza un `OAuth Client ID` de tip `Web application`
6. Din acel credential copiezi:
   - `Client ID` -> il pui in `GOOGLE_CLIENT_ID`
   - `Client Secret` -> il pui in `GOOGLE_CLIENT_SECRET`
7. La `Authorized redirect URIs` adauga URI-ul de redirect valid pentru backend-ul tau

Pentru implementarea curenta din acest proiect, redirect-ul important local este:

```text
http://localhost:3000/api/auth/callback/google
```

Daca vei avea productie, va trebui sa adaugi si varianta de productie, de exemplu:

```text
https://api.exemplu.ro/api/auth/callback/google
```

### Ce trebuie sa schimbi acum in `.env`

Dintre valorile din screenshot:

- `DATABASE_URL`
  - o poti lasa asa daca folosesti baza de date locala din Docker
- `BETTER_AUTH_URL`
  - o poti lasa asa daca backend-ul porneste pe `localhost:3000`
- `FRONTEND_URL`
  - o poti lasa asa doar daca frontend-ul ruleaza pe `localhost:5173`
- `BETTER_AUTH_SECRET`
  - trebuie schimbat obligatoriu
- `GOOGLE_CLIENT_ID`
  - trebuie schimbat daca vrei login cu Google functional
- `GOOGLE_CLIENT_SECRET`
  - trebuie schimbat daca vrei login cu Google functional

Exemplu minim corect pentru local:

```env
DATABASE_URL="postgresql://osut_user:osut_password@localhost:5433/osut_db?schema=public"
BETTER_AUTH_SECRET="secret-generat-cu-openssl"
BETTER_AUTH_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="Client-ID-din-Google"
GOOGLE_CLIENT_SECRET="Client-Secret-din-Google"
```

## Pornire baza de date

```bash
npm install
docker compose up -d
```

## Migrari Prisma

```bash
npx prisma migrate dev
npx prisma generate
```

## Pornire aplicatie

```bash
npm run start:dev
```

## Documentatie API

Swagger este disponibil la:

```text
http://localhost:3000/api/docs
```

## Endpointuri auth

- `POST /auth/register` pentru creare cont cu email, `displayName` si parola
- `POST /auth/login` pentru autentificare cu email si parola
- `POST /auth/logout` pentru inchiderea sesiunii curente
- `GET /auth/session` pentru sesiunea curenta
- `GET /auth/google` pentru pornirea login-ului Google
  - optional: `?redirectTo=http://localhost:5173/dashboard`
  - frontend-ul poate decide pagina finala de aterizare dupa login
- `GET /api/auth/token` pentru obtinerea JWT-ului emis de Better Auth
- `GET /api/auth/jwks` pentru verificarea semnaturii JWT

## Endpointuri users

- `GET /users/me/profile` pentru profilul userului autentificat
- `GET /users/:id/profile` pentru profilul unui user dupa ID

Profilul returneaza:

- `displayName`
- `firstName`
- `lastName`
- `email`
- `role`
- `coordinatorTeams`
- `coordinatorTeamsDisplay`

Regula pentru coordonare:

- daca userul nu este `CO_COORDINATOR` sau `COORDINATOR` in niciun departament, `coordinatorTeamsDisplay` va fi `-`

## Endpointuri announcements

- `POST /announcements`
  - creeaza un anunt nou cu `title`, `description`, `imageUrl`, `departmentId`
  - daca `departmentId` lipseste, anuntul este general
  - daca `departmentId` exista, anuntul este pe departament
- `GET /announcements/general`
  - returneaza anunturile generale in format minimal
- `GET /announcements/departments/:departmentId`
  - returneaza anunturile unui departament in format minimal
- `GET /announcements/:id`
  - returneaza varianta extinsa a unui anunt
- `PATCH /announcements/:id`
  - permite editarea unui anunt doar de catre autorul lui

Formatul minimal de listare include:

- `id`
- `title`
- `imageUrl`
- `createdAt`

Formatul extins include:

- `id`
- `title`
- `description`
- `imageUrl`
- `author`
- `department`
- `createdAt`
- `updatedAt`

Reguli de creare:

- anunt general: doar `ADMIN`
- anunt pe departament: `ADMIN`, `CO_COORDINATOR` sau `COORDINATOR` pentru acel departament

## Teste si verificare

```bash
npm run build
npm run test -- --runInBand
```

## Observatii

- Schema bazei de date este definita in `prisma/schema.prisma`.
- Migrarile Prisma trebuie comise in repository.
- Dupa orice schimbare importanta in schema sau setup, actualizeaza acest README.
