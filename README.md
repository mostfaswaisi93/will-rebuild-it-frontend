<div align="center">

# Gaza Reconstruction Platform

**Rebuilding, together, with transparency**

A digital platform that coordinates the reconstruction of Gaza — connecting **beneficiaries** whose homes and property were damaged with vetted **reconstruction teams**, and enabling **donors** to fund specific projects and follow their impact transparently, from damage assessment through handover.

*The platform's Arabic brand name is حنعمرها (Han-Amerha). The application UI is fully bilingual; this document is maintained in English.*

</div>

---

## Overview

The platform serves three roles:

- **Beneficiaries** — property owners who register damage, submit reconstruction requests, and track their projects through every phase.
- **Reconstruction teams** — contractors and engineers who carry out the projects.
- **Donors** — supporters who fund specific projects or the general fund and track the impact of their contributions.

The application is **fully bilingual** (English is the default locale, Arabic RTL is secondary with a runtime toggle), **mobile-first**, and currently runs against a **mock backend** seeded with realistic Gaza-context data until it is connected to a real server.

> This project is a full reimagining of an existing Angular 11 customer portal (`topproz-customer-web`), rebuilt in a modern Angular 20 stack, re-skinned to the **"Reconstruction & Resilience"** design system, and renamed end-to-end to the Gaza reconstruction domain.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | **Angular 20** — standalone components, signals, new control flow (`@if`/`@for`/`@switch`), `inject()`, lazy routes |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens), RTL via logical properties |
| Rendering | **SSR** (`@angular/ssr`) for public pages; the `/app/*` shell is client-rendered |
| PWA | `@angular/service-worker` (offline-tolerant caching) |
| i18n | Hand-rolled runtime translation service (signals + `httpResource`), single build, no locale split, CLDR plurals via `Intl.PluralRules` |
| State | Angular signals + `providedIn: 'root'` services (no NgRx) |
| HTTP | `HttpClient` + functional interceptors (`auth`, `error`, `mock-api`) + typed DTO/mapper layer |
| Icons | `@lucide/angular` (per-icon attribute directives) |
| Maps | `leaflet` (lazy, SSR-guarded) |
| Fonts | `@fontsource/ibm-plex-sans-arabic` (self-hosted, no CDN) |
| Quality | ESLint (angular-eslint, flat config) + Prettier, `strict: true`, no `any` |

---

## Design system — "Reconstruction & Resilience"

Colors come from **`DESIGN.md`'s authoritative front-matter** (a Material-3 token set), applied via one `@theme` block in `src/styles.css` so the whole app re-skins from a single file.

| Token | Value | Use |
|---|---|---|
| `brand-500` (primary) | `#006a45` | Primary actions, active states |
| `brand-600` | `#005c3b` | Hover |
| `sand-300` / `sand-700` | `#fdc170` / `#81550b` | Warm "construction" accent |
| `ink-900 / 700 / 500 / 300` | `#191c1b` … `#bdcabf` | Headings / body / secondary / borders |
| `canvas` | `#f8faf8` | Page background |
| `nav-bg` | `#0f3a29` | Sidebar (deep emerald) |
| `success / warning / danger / info` | `#006a45 / #9a6a05 / #ba1a1a / #2563eb` | Semantic |
| radius `rounded-card` | `0.875rem` (14px) | Cards, buttons, inputs |

Principles: **trauma-informed, calm, dignified** tone; mobile-first (360px baseline, responsive upward); RTL-first discipline (logical properties only); touch targets ≥44px; typography in **IBM Plex Sans Arabic** for both scripts.

---

## Architecture

```
src/app/
├─ core/
│  ├─ models/         # typed domain models (all domains)
│  ├─ api/            # per-domain API services + dto/ mappers
│  ├─ session/        # SessionStore (signal-based single source of truth)
│  ├─ interceptors/   # auth, error, mock-api
│  ├─ guards/         # authGuard, roleGuard
│  ├─ i18n/           # TranslationService + TranslatePipe
│  ├─ toast/          # ToastService
│  └─ mock/           # in-memory mock backend: fixtures/ + handlers/
├─ shared/ui/         # 27 reusable components (design-system building blocks)
├─ layout/            # AppShell, Sidebar (role-aware), Header
├─ features/
│  ├─ public/         # landing, public project, public team profile, public nav
│  ├─ auth/           # email-check sign-in, auth callback
│  ├─ requests/ projects/ teams/
│  ├─ estimates/ funding/ donations/         # (building)
│  ├─ support/ complaints/ account/          # (building)
│  ├─ notifications/ dashboard/ content/ wizards/  # (building)
│  └─ coming-soon/    # placeholder (being retired as real pages land)
└─ app.routes.ts / app.config.ts
```

### Mock backend
There is no real server yet. `mock-api.interceptor.ts` intercepts every request to `environment.apiUrl`, routes it by method + path to a per-domain handler (`core/mock/handlers/*`), and serves an in-memory store seeded from `core/mock/fixtures/*` with realistic Gaza-context data (teams, projects across all five governorates, requests, estimates, funding, donations, support, complaints, notifications). It short-circuits before any network/SSR call, so it is SSR-safe by construction. Swapping to a real backend is just pointing `environment.apiUrl` at it — the typed service/DTO layer stays the same.

### Demo accounts
The sign-in page lists these; all use password **`Demo@1234`**:

| Role | Email |
|---|---|
| Beneficiary | `youssef@example.com` |
| Donor | `amina@example.com` |
| Team | `team@example.com` |

---

## Page-parity audit against the original app

Every route in the original `topproz-customer-web` (`app-routing.module.ts` + `customer-routing.module.ts`) was mapped to this app. Nothing was dropped silently — the intentional replacements are listed with their reason.

| Original route | Here | Note |
|---|---|---|
| `biz/pro-public-profile/:id` | `/pub/team/:teamId` | |
| `biz/email-check/:id` | `/pub/email-check/:ctx` | |
| `biz/password-check/:id` | *(folded into email-check)* | One sign-in flow instead of two public pages |
| `biz/new-customer-book-apro/:id` | `/pub/new-beneficiary/:teamId` | |
| `biz/new-customer-get-a-quotes/:id` | `/pub/new-beneficiary` | Same wizard without a pre-chosen team |
| `dashboard/:emailId/:id/:token` | `/auth/callback` → `/app/dashboard` | **Token no longer travels in the URL** |
| `lead-list` · `lead-view/:id` | `/app/requests` · `/app/requests/:id` | |
| `project-list` · `project-view/:id` | `/app/projects` · `/app/projects/:id` | |
| `my-pros` · `my-pros-view/:id` | `/app/teams` · `/app/teams/:id` | |
| `estimate-list` · `estimates-view/:id` | `/app/estimates` · `/app/estimates/:id` | |
| `invoice-list` · `invoice-view` | `/app/funding` · `/app/funding/:id` | Invoices → funding & disbursements |
| `signature` | `/app/funding/:id/sign` | |
| `payment` · `voidedpayment` | `/app/funding/:id/txn/:txnId` | One transaction page with normal/voided/refunded modes |
| `pay-deposit/:id` · `invoicepayment` | *(replaced)* | Beneficiaries don't pay; funding comes from donors |
| `writeoff` · `voidedwriteoff` | *(dropped)* | Static mock screens with no live data |
| `book-pro/:id` | `/app/request/to-team/:teamId` | |
| `get-quotes/:id` | `/app/request/new` | Assessment wizard |
| `lead-generate-zipcode` | **`/pub/start`** | Rebuilt as an area-first funnel (zip codes don't apply) |
| `report-pro-list` · `report-pro/:id` · `report-a-pro-view/:id` | `/app/complaints` · `/complaints/new/:teamId` · `/complaints/:id` | |
| `pro-review` | `/app/reviews` | |
| `customer-support` · `support-list` · `support-request-view/:id` | `/app/support/new` · `/app/support` · `/app/support/:id` | |
| `notifications` | `/app/notifications` | |
| `customer-profile` · `account` | `/app/profile` · `/app/account` | |
| `emailpreferences` | `/app/email-preferences` | Also a tab inside Account |
| `privacy` · `privacy-page` · `terms-and-conditions-page` · `help` | `/app/privacy` · `/app/terms` · `/app/help` | Two privacy routes merged into one |
| `twilio-call` | *(out of scope)* | Voice/telephony not part of this phase |
| `*-new` / `*1` duplicate screens | *(deduplicated)* | The original carried old/new copies of profile, book-pro, get-quotes, estimate-view, pro-public-profile, report-view |

## Domain rename (topproz → Gaza reconstruction)

The original home-services vocabulary was renamed end-to-end (code, routes, and UI):

| Original | Gaza domain | Route |
|---|---|---|
| Customer | Beneficiary | — |
| Pro / My Pros | Team | `/app/teams` |
| Lead / Call | Request | `/app/requests` |
| Invoice | Funding & disbursement | `/app/funding` |
| Estimate (quote) | Estimate / BOQ | `/app/estimates` |
| Book a Pro / Get Quotes | Request wizards | `/app/request/*` |
| Pay deposit / card payment | Donor funding (Stripe, deferred) | `/app/donations` |

---

## Running the project

```bash
npm install          # install dependencies
npm start            # dev server → http://localhost:4200
npm run build        # production build (SSR)
npm run lint         # ESLint
npm test             # unit tests (Karma, watch mode)
npm run test:ci      # unit tests, single headless run
```

If Karma cannot find Chrome, point it at your install first:
`export CHROME_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe"` (Git Bash on Windows).

The language toggle is in the header (globe icon); the choice persists in `localStorage`.

---

## Build status

| Domain | Pages | Status |
|---|---|---|
| Design tokens (DESIGN.md palette) | — | ✅ Applied |
| Core (models, session, interceptors, guards, i18n, mock backend) | — | ✅ Done |
| Shared UI components | 27 | ✅ Done |
| App shell (sidebar, header, footer) | — | ✅ Done |
| Public site + Auth | landing, public project, public team, email sign-in, callback | ✅ Done |
| Dashboard | beneficiary overview | ✅ Done |
| Requests | list, detail | ✅ Done |
| Projects | list, detail (phase stepper, team review) | ✅ Done |
| Teams | list, profile (dual public/authenticated) | ✅ Done |
| Estimates | list, BOQ view (approve/reject/sign) | ✅ Done |
| Funding & disbursements | list, details, signature, transaction | ✅ Done |
| Donations | list, donate, detail (+ public donate) | ✅ Done |
| Support | list, form, view | ✅ Done |
| Complaints | list, form, view | ✅ Done |
| Profile / Account / Notification prefs | 3 | ✅ Done |
| Notifications | list | ✅ Done |
| Content (privacy / terms / help) | 3 | ✅ Done |
| Request wizards (to-team / assessment / new beneficiary) | 3 | ✅ Done |
| My reviews | list | ✅ Done |
| Team workspace (team role) | dashboard | ✅ Done |
| Route wiring, i18n merge, build + lint | — | ✅ Done |

Legend: ✅ done · 🚧 in progress · ⏳ pending

**Every route now loads a real page — there are no "coming soon" placeholders left**, and all three roles (beneficiary, donor, team) have a complete experience. The project passes a clean production build and lint.

### Internationalization notes
- UI chrome lives in `public/i18n/{en,ar}.json`. **Backend content** (e.g. the damage-assessment questionnaire) is *not* in those dictionaries — the API serves it per-locale (`?lang=`), the way a real localized backend would.
- Counted strings use **CLDR plural forms**, not string interpolation. This is load-bearing for Arabic, which has six categories: `تقييم واحد` (one), `تقييمان` (two), `3 تقييمات` (few), `11 تقييمًا` (many), `100 تقييم` (other).

### Testing

Unit tests cover the logic most likely to break silently, per the spec's requirement for service/guard/mapper coverage:

| Area | What it guards |
|---|---|
| `mock-api.interceptor.spec.ts` | That query params (filters, paging, `lang`) actually reach the handlers — a **regression guard** for a real bug (see changelog) |
| `i18n-format.util.spec.ts` | Plural selection across all six Arabic CLDR categories, interpolation, key fallback |
| `translation.service.spec.ts` | Locale state, RTL flag, missing-key contract |
| `auth.guard` / `role.guard` | Redirect targets per role, including the exact `returnUrl` |
| `session-store.service` | Persistence, rehydration, and rejection of malformed stored sessions |
| `status-tone.util` | The status→tone map, with a completeness guard so a new status can't go unmapped |
| `mock/handlers` | Approve/reject, receipt confirmation, review averaging, follow toggling, and fall-through |

The interceptor spec was verified to be a *real* guard by reinstating the original bug and confirming exactly the expected specs failed.

### Known deferrals
- **Stripe / card capture** for donations is intentionally deferred; the donation flow is functional against the mock backend without real payment.
- **Admin console** is out of scope for this phase.
- The mock's project/estimate **list** endpoints are not team-scoped, so the team role navigates to its records via its workspace rather than those lists.
- `isAuthenticated()` is a null-check on session state; there is no token-expiry concept yet (there is no real auth server to expire against).

---

## Changelog

- **Closed the last two page-parity gaps** found by auditing the original app's route tables (see the parity table above). The original's zip-code lead funnel had no counterpart and is now **`/pub/start`** — an area-first entry point where a visitor picks their governorate and district, immediately sees which teams cover that area and how many rebuilds they've completed, then continues into the damage report with the area already filled in. Also restored the dedicated **`/app/email-preferences`** route.
- **Added a unit test suite (143 tests)** covering the interceptor, i18n formatting, guards, session store, status tones, and mock handlers — the spec's service/guard/mapper coverage requirement. Writing it surfaced three real defects, now fixed:
  - `SessionStore` accepted *structurally* invalid persisted sessions (`{"token":"x"}` with no user) — it reported "signed in", then threw on `role()`. Now shape-checked, with a regression spec.
  - `resolveStatusTone` used `?? 'neutral'`, so a status named `toString`/`constructor` resolved to an inherited `Object.prototype` function instead of falling back. Now an own-property check.
  - Posting a team review recomputed the rating aggregate from only the in-memory reviews, making a team's displayed count collapse (21 → 3). Now folded in incrementally, as a real backend maintains a running total.
- **Branded PWA icons** — the icon set was still the Angular CLI default. With no image toolchain available, generated the full set from the brand-mark geometry via a small pure-Node rasterizer (supersampled point-in-shape tests + `zlib` PNG encoding), plus an SVG manifest entry for crisp scaling.
- **Fixed: mock API ignored every query parameter.** The mock interceptor read `HttpRequest.url`, which excludes serialized `HttpParams` — so filters, paging, and `lang` never reached the handlers and silently served unfiltered defaults (masked by small datasets). Now reads `urlWithParams`; server-side filtering and pagination genuinely work.
- **Brand mark** — replaced the placeholder with a real `BrandMark` component (four archway tiles, emerald + sand, built from the platform logo's motif), reused by the sidebar and public nav and shipped as an SVG favicon.
- **Real pluralization** — the translation service now selects CLDR plural forms via `Intl.PluralRules`, with all six Arabic categories authored for every counted string (previously "1 reviews" / wrong Arabic forms).
- **Localized backend content** — the assessment questionnaire is stored bilingually and served per-locale, instead of being English-only.
- **Team workspace + My reviews** — the last two placeholder routes are now real, data-backed pages; the team role is properly scoped to its own projects, estimates, requests, and reviews.
- **Full page parity reached** — built and wired all remaining feature areas (Estimates, Funding, Donations, Support, Complaints, Profile/Account, Notifications, Dashboard, content pages, and the three request wizards); every route now loads a real page. Clean production build + lint, and browser-verified across both the beneficiary and donor roles (sign-in, dashboard, BOQ estimate view, funding, wizards, donor donations) with the DESIGN.md palette (`#006a45`) confirmed live and the Arabic RTL toggle working.
- **Tooling** — removed the deprecated `baseUrl` compiler option (path aliases now resolve without it).
- **Reconstruction & Resilience re-skin** — adopted DESIGN.md's authoritative Material-3 palette (primary `#006a45`).
- **Full data layer** for estimates, funding, donations, support, complaints, notifications, profile, assessment questions, and request creation.
- **Foundation + first verticals** — Angular 20 scaffold, Tailwind v4 tokens, i18n (en/ar RTL), PWA/SSR, mock backend, 27 shared components, app shell, and the Public / Auth / Requests / Projects / Teams pages.

*This README is maintained continuously in English as the project progresses.*
