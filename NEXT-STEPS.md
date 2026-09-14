# Continuation checkpoint — use a fresh short session

Task weight: HEAVY. Work directly using the current standard model, no delegation: both prior children failed HTTP 401 and produced no files. Limit each follow-up to one bounded feature and at most 20 steps. Inspect targeted files only; no need to reread the historical 530-line plan for every change.

## Current state
- Root: this dist directory; original Laravel/revision preserved. No Git repository metadata, no commits/pushes.
- Real PostgreSQL test service is started by `scripts/test-db.ts` on loopback 55439. Check health instead of assuming it remains running. Its private config is in ignored var/test; never print it.
- `prisma/schema.prisma` and checked-in initial migration define auth, references, divisions/cohorts/albums/photos/activities/books, media, members/import metadata, recruitment/applications/outbox/content/audit.
- Server: auth/security/operators/content/media/site-content. Auth now lazily initializes at request time: build requires no live auth secrets, runtime fails closed without configuration. Operators use user UUID as credential accountId as required by Better Auth 1.7.4.
- UI: login, admin shell/dashboard, generic record manager and module routes. These render real persisted data. Homepage and EPUB module are explicitly unfinished. `record-manager.tsx` is an emerging shared-file hotspot: use focused components per new workflow instead of continuing to grow one universal editor.
- Standalone start: scripts/start.mjs + test-server.mjs. Avoid next start for output:standalone; copy .next/static and public, resolve STORAGE_DIR before child cwd changes, and exclude runtime data from output tracing.
- Last verification: 2 unit + 3 integration tests plus typecheck/build passed. Admin category axe passed; no overflow at 320/390/768/1440 in the prior production-browser journey. `npm audit --omit=dev --audit-level=high` now reports 0 vulnerabilities following verified dependency overrides; details in `VERIFICATION.md`.

## Highest-priority next steps
1. Implement a single member XLSX vertical slice: versioned blank template + safe parse/export round-trip tests, then transactionally confirmed dataset replacement with backup/version/idempotency. No actual member ingestion before resolving source duplicate IDs. Do not put private workbook/data into a release archive.
2. Implement the secure EPUB processor/reader with bounded ZIP parsing and sanitized sandboxed chapters; there is no usable delegated output to integrate.
3. Complete public editorial design using real content/empty states, correct artilogo aspect ratio, exact official vision/mission, cohort gallery, dark/light/system and contact map. Add real CMS content editors.
4. Finish server-authoritative recruitment availability/public form, applicant access and exports/invitations/outbox; admin period configuration alone is NOT a functioning recruitment workflow.
5. Complete operations/setup/doctor/backup/restore, Linux/container and clean archive verification; only then produce and verify the GitHub ZIP.

## Known gaps to fix, not production claims
- Payload limits are partly content-length based; add bounded streamed parsing and common error boundaries for all mutations. Add concurrency/stale-edit, rate-limit, CSRF and direct endpoint tests beyond the current thin tests.
- Content listing/options need scalable entity-specific UX. Inline reference creation/reload, selected-album photo workflow, upload progress/multi-file and safe cleanup are incomplete.
- Site content validation needs fully tested URL userinfo/path policy, permissions and media-usage accounting; raw public links/assets need publication invariants and body/CSP hardening.
- Member photo/privacy classes must not rely only on uploader identity. Retention/cleanup and safe public/private reuse require explicit tests.
- Integration/browser tests must reliably clean their own fixtures after failures. Some earlier failed browser attempts left synthetic categories in the disposable database; no real records were imported.
- Real database persistence is tested across reads/browser reloads, not full service/container recreation or disaster recovery.
- No production-ready assertion or packaging until all requested capabilities and release gates are actually exercised.
