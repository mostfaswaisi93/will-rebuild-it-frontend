<div align="center">

# Gaza Reconstruction Platform — Operations Portal

**Rebuilding, together, with transparency**

The operations portal for coordinating the reconstruction of Gaza: platform operators triage damage reports, assign vetted contracting firms, review bills of quantity, run inspections, approve payment statements, and move materials and equipment — while beneficiaries, donors, and field teams work the same records from their own side of the platform.

*The platform's Arabic brand name is حنعمرها (Han-Amerha). The UI is bilingual and defaults to Arabic (RTL). This document is maintained in English; the authoritative port inventory, [`ROUTE-MAP.md`](ROUTE-MAP.md), is maintained in Arabic.*

</div>

---

## What this is

A ground-up rebuild of the legacy **TopProz** back office (`topproz-frontend` — Angular 10, 25 NgModules, 222 components) on a modern Angular 20 stack, with the entire domain vocabulary re-cast from US home-services to Gaza reconstruction: *leads* became **work requests**, *pros* became **contracting firms**, *invoices* became **payment statements** (claims flowing from contractor to platform, not the reverse), and *lead purchasing* became **contractor membership**.

Two rules govern the port, and both are load-bearing:

1. **No route enters `app.routes.ts` until its page actually exists.** The build never points at a stub, so "the route map is green" and "the app works" cannot drift apart. [`ROUTE-MAP.md`](ROUTE-MAP.md) is what tracks the remainder.
2. **Merge over transcribe.** The legacy app carried duplicate screens (`*-new`, `*1`, `*2`), split one record across several pages, and put role branches in separate route trees. Each of those collapses into one page here — and every collapse is recorded with its reason next to the row it affects. A literal 1:1 port would have reproduced a 16,000-line BOQ builder and sixteen near-identical subscription routes.

| | |
|---|---:|
| Declared routes | **106** |
| Feature areas | **39** |
| Shared UI components | **30** |
| API services / mock handlers | **33 / 33** |
| Unit tests | **496** (+ 12 for the audit tool) |
| Roles | **7**, one sign-in gate |

---

## The seven roles

One portal, one sign-in, seven role homes. `homeRouteForRole` is the single table that both `roleGuard` and sign-in read, so "where does this role land" cannot fork.

| Role | Home | Scope |
|---|---|---|
| `admin` | `/app/admin-dashboard` | Platform operator — full triage, approval, disbursement, settings |
| `contractor` | `/app/contractor-dashboard` | Contracting firm — its work orders, estimates, statements, crew, equipment |
| `staff` | `/app/staff-dashboard` | Field staff — inspections, beneficiary records, timecards |
| `supplier` | `/app/supplier-dashboard` | Material supplier — purchase orders and shipments |
| `beneficiary` | `/app/dashboard` | Household — damage reports, project progress, funding receipt |
| `donor` | `/app/donations` | Funder — donations and their traced impact |
| `team` | `/app/team-dashboard` | Reconstruction crew — its own projects and estimates |

One email can hold **several role accounts** (the seed data includes a contractor whose own home was damaged), each with its own status — which is why sign-in resolves an email to a list of accounts *before* asking for a password.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | **Angular 20** — standalone components, signals, `@if`/`@for`/`@switch`, `inject()`, lazy routes, `withComponentInputBinding` |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens), RTL via logical properties only |
| Rendering | **SSR** (`@angular/ssr`, `outputMode: server`) — public pages are server-rendered; the `/app/*` shell is client-rendered |
| PWA | `@angular/service-worker` (`ngsw-config.json`) |
| i18n | Hand-rolled runtime translation service (signals + `httpResource`); single build, no locale split; CLDR plurals via `Intl.PluralRules` |
| State | Angular signals + `providedIn: 'root'` services — no NgRx |
| HTTP | `HttpClient` + functional interceptors (`auth`, `error`, `mock-api`) over a typed DTO/mapper layer |
| UI primitives | `@angular/cdk` (overlay, drag-drop), `signature_pad`, `angularx-qrcode`, `date-fns` |
| Maps | `leaflet` (lazy, SSR-guarded) |
| Fonts | `@fontsource/ibm-plex-sans-arabic` (self-hosted, no CDN) |
| Quality | ESLint (angular-eslint flat config) + Prettier, `strict: true`, no `any` |

---

## Design system — "Reconstruction & Resilience"

All colour lives in **one `@theme` block in [`src/styles.css`](src/styles.css)**, so the whole app re-skins from a single file. The values come from the project's authoritative Material-3 token set (`DESIGN.md`, held outside this repo); the raw M3 tokens are exposed alongside the app's own utility names for components that reference them directly.

| Token | Value | Use |
|---|---|---|
| `brand-500` (primary) | `#006a45` | Primary actions, active states |
| `brand-600` | `#005c3b` | Hover |
| `sand-300` / `sand-700` | `#fdc170` / `#81550b` | Warm "construction" accent |
| `ink-900 / 700 / 500 / 300` | `#191c1b` … `#bdcabf` | Headings / body / secondary / borders |
| `canvas` / `surface` | `#f8faf8` / `#ffffff` | Page background / cards |
| `nav-bg` | `#0f3a29` | Sidebar (deep emerald) |
| `success / warning / danger / info` | `#006a45 / #9a6a05 / #ba1a1a / #2563eb` | Semantic |
| radius `rounded-card` | `0.875rem` (14px) | Cards, buttons, inputs |

Principles: **trauma-informed, calm, dignified** tone; mobile-first (360px baseline); RTL-first discipline — logical properties only, since Arabic is the default locale, not an afterthought; touch targets ≥44px; **IBM Plex Sans Arabic** for both scripts.

---

## Architecture

```
src/app/
├─ core/
│  ├─ models/         # typed domain models + domain.constants.ts (union types)
│  ├─ api/            # 33 per-domain API services + dto/ mappers
│  ├─ session/        # SessionStore (signals) + role-home.ts
│  ├─ interceptors/   # auth, error, mock-api
│  ├─ guards/         # authGuard, roleGuard
│  ├─ i18n/           # TranslationService + TranslatePipe + CLDR plural util
│  ├─ toast/          # ToastService
│  └─ mock/           # in-memory backend: 29 fixtures + 33 handlers
├─ shared/
│  ├─ ui/             # 30 design-system components (data-table, status-pill,
│  │                  #   phase-stepper, signature-pad, map, filter-bar, …)
│  └─ validators/     # date / identity / password validators
├─ layout/            # app-shell, auth-shell, header, sidebar (role-aware)
├─ features/          # 39 areas — see the route inventory below
└─ app.routes.ts      # 106 routes, every one backed by a real page
```

`shared/ui/data-table` is the in-house replacement for the legacy Syncfusion Grid; `shared/ui/status-pill` is the single renderer for every status label in the app, which is what makes the `status-pill` audit check possible.

### Route inventory

[`ROUTE-MAP.md`](ROUTE-MAP.md) is the authoritative row-by-row mapping of all ~130 legacy routes (ported, merged, or deliberately excluded, each with its reason). The grouping below is the shape of what exists today:

| Group | Routes (under `/app` unless shown) | `roleGuard` |
|---|---|---|
| Public (SSR) | `/` · `/pub/contractor/:id` · `/pub/project/:id` | — unauthenticated |
| Auth | `/auth/sign-in` · `register` · `registered` · `contractor-register` (6 guarded steps) · `forgot-password/*` · `activate/*` | — unauthenticated |
| Role homes | `admin-` · `contractor-` · `staff-` · `supplier-dashboard` · `dashboard` · `donations` · `team-dashboard` | one role each |
| Work intake | `work-requests` (+ `:id`) · `dispatch` | admin · contractor |
| ↳ operator only | `work-requests/new` | admin |
| Estimates | `estimates` (+ `:id`) | admin · contractor · beneficiary · team |
| Delivery | `work-orders` (+ `:id`, `:id/inspection/:kind`) | admin · contractor · staff |
| Inspections | `inspections` | admin · staff |
| Money | `statements` (+ `:id`) · `pricebook` | admin · contractor |
| ↳ operator only | `disbursements` (+ `:id`) · `price-lists` · `subscriptions` (+ `:id`) | admin |
| Parties | `beneficiaries` (+ `:id`) · `contractors` (+ `:id`) | admin · staff |
| ↳ crews | `staff` (+ `:id`) | admin · contractor |
| ↳ suppliers | `suppliers` (+ `:id`) | admin |
| Teams | `teams` (+ `:id`) | admin · contractor · beneficiary · team |
| Supply chain | `inventory` · `warehouses` · `equipment` (+ `schedule`, `:id`) | admin · contractor · staff |
| ↳ write actions | `equipment/new` · `equipment/:id/edit` · `equipment/reports` · `purchase-orders/new` | admin · contractor |
| ↳ procurement | `purchase-orders` (+ `:id`) | admin · contractor · supplier |
| ↳ logistics | `shipments` | admin · supplier |
| Ops & comms | `support` (+ `:id`) · `scorecards` (+ `:id`) · `questions` · `external-ratings` | admin · staff |
| ↳ operator only | `campaigns` (+ `:id`) · `logs` · `notifications/push` | admin |
| Settings | `global-settings` (+ `terms`, `geofencing`, `reference`) · `permissions` | admin |
| Every signed-in role | `notifications` · `profile` · `account-settings` · `complaints` (+ `new`, `:id`) · `support/new` · `privacy` | none — `authGuard` only |
| Beneficiary | `dashboard` · `requests` (+ `new`, `:id`) · `funding` (+ `:id`, `:fundingId/disbursements/:id`) · `reviews` | beneficiary |
| Projects | `projects` (+ `:id`) | beneficiary · admin · team |
| Donor | `donations` (+ `new`, `:id`) | donor |

Guards are transcribed from `app.routes.ts`, which stays authoritative; the `nav-guard` and `layout-link` audit checks exist to keep the sidebar and header from offering a link its own guard would reject.

---

## The mock backend

There is no real server yet. `mock-api.interceptor.ts` intercepts every request to `environment.apiUrl` (`/api`), routes it by method + path to one of 33 per-domain handlers, and serves an in-memory store seeded from 29 fixtures with realistic Gaza-context data across all five governorates. It short-circuits before any network or SSR call, so it is **SSR-safe by construction**.

The handlers behave like a server, not like a stub: they filter, page, and sort server-side; they compute money (a purchase order's line amounts and total are recalculated rather than trusted from the form); they guard state transitions; and they always create purchase orders as drafts. Swapping to a real backend is repointing `environment.apiUrl` — the typed service/DTO layer above it is unchanged.

### Demo accounts

Password for all of them: **`Demo@1234`**

| Email | Role | Status | What it exercises |
|---|---|---|---|
| `admin@example.com` | Platform operator | active | The default path |
| `contractor@example.com` | Contractor **and** beneficiary | active | Role picker — two accounts, one email |
| `staff@example.com` | Field staff | active | |
| `supplier@example.com` | Material supplier | active | |
| `youssef@example.com` | Beneficiary | active | Beneficiary experience |
| `amina@example.com` | Donor | active | Donor experience |
| `team@example.com` | Reconstruction crew | active | Team workspace |
| `pending@example.com` | Contractor | registration incomplete | Sign-in block |
| `suspended@example.com` | Contractor | suspended | Sign-in block |

---

## Running the project

```bash
npm install
```

```bash
npm start
```

Dev server on `http://localhost:4200`. Other tasks:

| Command | What it does |
|---|---|
| `npm run build` | Production build (SSR + service worker) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests, watch mode |
| `npm run test:ci` | Unit tests, single headless run |
| `npm run audit` | Cross-file consistency checks (below) |
| `npm run audit:test` | The audit tool's own tests |
| **`npm run verify`** | **The gate: lint + audit + audit:test + test:ci** |

`.github/workflows/ci.yml` runs the same gate plus `build` on every push and pull request to `main`, as named steps so a failure says which gate broke.

If Karma can't find Chrome, point it at your install first — on Git Bash for Windows:

```bash
export CHROME_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe"
```

The language toggle is in the header (globe icon); the choice persists in `localStorage`.

---

## The consistency audit

Five checks that neither the compiler, nor ESLint, nor unit tests can perform, because each one spans files that don't import one another. **Every check exists because it found a real defect in this repo:**

| Check | The defect it caught |
|---|---|
| `dead-link` | The header user menu pointed at three routes that didn't exist — every role hit "not found" |
| `nav-guard` | The sidebar offered `/app/estimates` to beneficiaries and `/app/pricebook` to contractors, both guarded against them: the link bounced the very role that could see it |
| `layout-link` | The shared header showed `/app/support` to all seven roles while the route admits two (invisible to `nav-guard`, which reads only the sidebar) |
| `status-pill` | `shared.statusPill.workOrderPriority.*` was missing entirely — the key is built at runtime, so the raw code rendered where the label belonged |
| `uncalled-api` | 14 API endpoints with no caller — not dead code but **write flows whose pages were never built**: the donor couldn't donate, the beneficiary couldn't report damage |

> **The lesson the audit taught about itself.** The first `nav-guard` required `canActivate` to appear immediately after `path:` — so any route with a comment between them was read as **unguarded and silently skipped**. The check reported "clean" while inspecting nothing, and specifically on `estimates` and `pricebook`: the two routes it was later fixed to catch. The parser now slices each route's full text up to the next route. **A check never exercised against a planted defect cannot be trusted.**

So the audit's own logic is exported as pure functions in [`tools/audit.mjs`](tools/audit.mjs) and covered by 12 tests in [`tools/audit.test.mjs`](tools/audit.test.mjs) (`node --test`) — one of which pins the comment-before-guard case above, verified by reinstating the bug and confirming it fails. `npm run verify` runs the audit's tests before trusting the audit's verdict.

Current state: 5/5 checks pass across **106 routes** and **22 status-pill contexts**.

---

## Testing

496 unit tests across 36 spec files, aimed at the logic most likely to break silently rather than at render assertions:

| Area | What it guards |
|---|---|
| `mock-api.interceptor` | That query params (filters, paging, `lang`) actually reach the handlers — a regression guard for a real bug (see changelog) |
| `mock/handlers/*` (19 specs) | Approve/reject transitions, receipt confirmation, server-side money arithmetic, review averaging, fall-through |
| `auth.guard` / `role.guard` | Redirect targets per role, including the exact `returnUrl` |
| `session-store` (+ `.malformed`) | Persistence, rehydration, and rejection of structurally invalid stored sessions |
| `i18n-format.util` | Plural selection across all six Arabic CLDR categories, interpolation, key fallback |
| `translation.service` | Locale state, RTL flag, missing-key contract |
| `status-tone.util` | The status→tone map, with a completeness guard so a new status can't go unmapped |
| `password-reset-flow` / `-step.guard` / `mask.util` | Step ordering, intent branching, email masking |
| `onboarding-flow` | The six-step contractor registration state machine |
| `shared/validators/*` | Date, identity, and password rules |

### Internationalization notes

- **Arabic is the default locale** (`DEFAULT_LOCALE = 'ar'`), English is the toggle. RTL is therefore the primary reading direction, not a retrofit.
- UI chrome lives in `public/i18n/{ar,en}.json`. **Backend content** (e.g. the damage-assessment questionnaire) is *not* in those dictionaries — the API serves it per-locale (`?lang=`), the way a real localized backend would.
- Counted strings use **CLDR plural forms**, not interpolation. This is load-bearing for Arabic's six categories: `تقييم واحد` (one), `تقييمان` (two), `3 تقييمات` (few), `11 تقييمًا` (many), `100 تقييم` (other).

---

## Deliberate exclusions

Recorded here and, row by row, in [`ROUTE-MAP.md`](ROUTE-MAP.md) — nothing was dropped silently.

- **Stripe card storage** (`pro/cards*`, 5 routes) — reconstruction money arrives from funders and leaves via bank transfer against approved statements (`/app/statements`, `/app/disbursements`). The platform has no reason to hold card data at all.
- **The VANLYNK funnel** and **lead purchasing** (`proregistration2`, `leadgeneration`, `welcome/leadgen`, `welcome/vanlynk`, `welcome/Pricing`) — a US subscription product with no counterpart here. The 16 duplicate subscription routes were re-cast as **contractor membership** (annual eligibility verification) instead.
- **The question-category tree** (`questions/categories-list` and siblings) — the damage assessment here is a *curated branching flow* (`nextQuestionId`) with reviewed Arabic and English text, not a category hierarchy: the next question is chosen by the answer, not by taxonomy. A category editor on top of it would break both the branching integrity and the two-language review, so `/app/questions` stays a read-only viewer.
- **Runtime-editable reference tables** — six legacy lookup-table editors are union types in `domain.constants.ts` here, and application types, `status-pill` contexts, and translation keys are derived from them. Editing them at runtime cannot change those types, so the editor would be theatre. They are shown live, read-only, in `/app/global-settings/reference`, with the reason documented in the page itself.
- **`registrations/map`** (1,760 lines) — dead code in the legacy app: never declared in `registrations.module.ts`, never imported. The live version is `map1`, which is merged into the contractor onboarding location step.
- **Admin console for the platform's own tenancy** and **Twilio voice** remain out of scope for this phase.
- Geofencing records coverage by **governorate/district, not a radius around an address** — a deliberate privacy choice about beneficiary locations, and the reason the public project page shows the governorate only.

---

## Privacy posture

Three decisions worth stating, because they cost features on purpose:

- A team's **public** profile shows its rating average and count but **no review text** — reviews carry the names of beneficiaries whose homes that team rebuilt, and they did not consent to that link being published.
- The **public project page** shows the governorate only (no district, no street) and **progress photos only** — never damage photos from inside a family's home.
- Sign-in tokens never travel in the URL. The legacy portal's `dashboard/:emailId/:id/:token` route is gone.

---

## Changelog

Newest first.

- **Verification gate + self-tested consistency audit.** Added `npm run verify` (lint · audit · audit:test · test:ci) and the matching GitHub Actions workflow. The audit's five checks each grew out of a real defect; its parser's own silent false negative is now pinned by a test, because a check that has never been exercised against a planted defect proves nothing.
- **Write flows completed.** An audit of endpoints with no caller found 14 — not dead code, but write flows whose pages were never built (a donor who couldn't donate, a beneficiary who couldn't report damage, funding that couldn't be confirmed received). Every endpoint now has a caller: `/app/donations/new`, `/app/requests/new`, funding receipt confirmation with signature, disbursement detail, team review, `/app/support/new`, profile editing, `/pub/project/:id`, and statement review.
- **Public-facing role experiences wired in.** `homeRouteForRole` routed beneficiary, donor, and team to three routes that **did not exist**, so every sign-in for those roles fell through to `**`. All seven role homes now resolve, and the beneficiary sidebar's seven dead links are live pages.
- **One gate for all seven roles.** Sign-in, password reset, and activation used to eject beneficiaries and donors to an external `customerPortalUrl` — a decision that predated building their in-app experience and had come to contradict `homeRouteForRole`, `roleGuard`, the sidebar, and the guard tests. A previously signed-in beneficiary worked fine; signing in again threw them out of the app. All three paths now go through `homeRouteForRole`, and the dead config key is gone.
- **Back-office port completed** across inventory, warehouses, purchase orders, shipments, equipment (list, detail, form, Gantt schedule, fleet reports), work orders and inspections, statements and disbursements, subscriptions, staff and timecards, campaigns, logs, monitoring, scorecards, permissions, and global settings. The legacy Syncfusion Schedule was rebuilt as a read-oriented Gantt on CDK primitives.
- **Estimates: review, not build.** The legacy `estimate-details` was ~16,000 lines because it was a full BOQ *builder*. The back office's job is narrower — read the submitted schedule and decide — so this is a review page: quantities grouped by category, totals, approve-with-signature or reject-with-reason. Also fixed a hole where the handler captured the signature and then **discarded** it; it is now persisted as `approvalSignatureUrl`, which is the entire point of capturing it.
- **Invoices became statements.** Direction reversed for the reconstruction domain (contractor claims, platform reviews and disburses), with **retention holdbacks** added — standard in construction contracting, absent from the original — and partial payment (`partiallyPaid`) supported, all transitions guarded server-side.
- **Work requests unified.** The legacy `lead-list` forked by role into `admin-list` and `pro-list`; both are one `/app/work-requests` now, with operator-only actions gated by `canDecide`. Lead-market fields (purchase price, purchase date, booking slot) were dropped — a reconstruction request is *assigned*, not bought. Direct booking became an `origin` field plus a source filter instead of a fourth list.
- **Complaints as one record, two sides.** "Report a team" and "my reports" were separate screens over the same row; now one `/app/complaints` where the beneficiary sees what they filed and the operator holds the reply box — and sending the reply closes the complaint.
- **Registration and recovery flows rebuilt.** One legacy component branched on a `slideMode` query param to serve six screens; each is now its own route. `/auth/forgot-password` and `/auth/activate` share four steps and differ only in `data.intent` and the last step, with state in a `PasswordResetFlow` provided **per route** rather than per component — the step guards resolve it before any component exists. Contractor onboarding is six guarded steps; the account stays pending and sign-in refuses it until the last one completes.
- **Fixed: the mock API ignored every query parameter.** The interceptor read `HttpRequest.url`, which excludes serialized `HttpParams`, so filters, paging, and `lang` never reached the handlers and silently served unfiltered defaults — masked by small datasets. It now reads `urlWithParams`, and a spec guards it.
- **Three defects surfaced by writing the test suite**, all fixed: `SessionStore` accepted structurally invalid persisted sessions (`{"token":"x"}` with no user), reporting "signed in" and then throwing on `role()`; `resolveStatusTone` used `?? 'neutral'`, so a status named `toString` or `constructor` resolved to an inherited `Object.prototype` function instead of falling back; and posting a team review recomputed the rating aggregate from in-memory reviews only, collapsing a team's displayed count from 21 to 3.
- **Real pluralization** — CLDR plural forms via `Intl.PluralRules`, with all six Arabic categories authored for every counted string (previously "1 reviews" and wrong Arabic forms).
- **Localized backend content** — the assessment questionnaire is stored bilingually and served per-locale, rather than English-only.
- **Branded PWA icons** — the icon set was still the Angular CLI default. With no image toolchain available, the full set was generated from the brand-mark geometry by a small pure-Node rasterizer (supersampled point-in-shape tests plus `zlib` PNG encoding), with an SVG manifest entry for crisp scaling.
- **Brand mark** — a real `BrandMark` component (four archway tiles, emerald and sand, from the platform logo's motif), reused by the sidebar and public nav and shipped as an SVG favicon.
- **Reconstruction & Resilience re-skin** — the authoritative Material-3 palette (primary `#006a45`) applied through one `@theme` block.
- **Foundation** — Angular 20 scaffold, Tailwind v4 tokens, i18n (Arabic RTL default), SSR + PWA, the mock backend, the shared UI kit, the app and auth shells, and the in-house `data-table` replacing Syncfusion Grid.
- **Tooling** — removed the deprecated `baseUrl` compiler option; path aliases resolve without it.

*This README is maintained continuously in English as the project progresses. For the route-by-route port status, see [`ROUTE-MAP.md`](ROUTE-MAP.md).*
