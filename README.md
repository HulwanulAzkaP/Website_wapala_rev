# WAPALA — Next.js production application

Independent Next.js/PostgreSQL application for WAPALA Telkom University: public site, admin CMS, member/recruitment workflows, and EPUB reader. Replaces the old Laravel app and the `revision/` design preview.

## Features
- Public site: home, tentang (visi/misi/divisi/cohort gallery), divisi detail, album, kontak, pendaftaran (recruitment application with photo upload, shown only while recruitment is open).
- Admin CMS (Better Auth login, ADMIN/EDITOR roles): content editor, divisions, cohorts, categories, albums/photos, activities, references, members (XLSX import/export/replace), applicants review, recruitment schedule, EPUB books.
- EPUB reader: admin uploads an EPUB, it is parsed/sanitized server-side and served read-only in-browser (no download link) at `/divisi/[slug]/buku/[book]/baca`.
- Media pipeline: PNG/JPG/JPEG/WebP only, re-encoded and metadata-stripped, private-by-default storage with publication-gated public reads.
- First-run `/setup` route creates the initial administrator (guarded, single-use).

## Requirements
- Node.js 22 LTS
- PostgreSQL 14+ reachable via `DATABASE_URL`

## Install & run on a server
```bash
npm ci
cp .env.example .env        # fill DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET (32+ chars), STORAGE_DIR
npm run db:migrate          # apply Prisma migrations against your database
npm run build
npm start                   # binds 127.0.0.1:3100; put a reverse proxy (nginx/caddy) with TLS in front
```
Open `https://your-domain/setup` once to create the first administrator, then log in at `/login`.

`scripts/start.mjs` (invoked by `npm start`) copies static assets into the standalone build and resolves storage paths before launch. It requires a already-migrated database — run `npm run db:migrate` first on a fresh database.

## Development / verification
```bash
npm ci
npx tsx scripts/test-db.ts        # starts an isolated local PostgreSQL for tests (keep running)
```
In a second terminal:
```bash
npx tsx scripts/migrate-dev.ts
npm run typecheck
npm test                          # unit tests
npm run test:integration          # integration tests (needs the isolated test DB above)
npm run build
PLAYWRIGHT_PRODUCTION=1 npx playwright test   # full browser E2E against a production build
```

## Security
- No credentials are committed; `.env` is git-ignored (`.env.example` documents the required keys).
- `npm audit --omit=dev` is clean.
- Never expose the isolated test database (`scripts/test-db.ts`) or test credentials outside development.

See `VERIFICATION.md` for the latest test run record and `NEXT-STEPS.md` for known follow-ups.
