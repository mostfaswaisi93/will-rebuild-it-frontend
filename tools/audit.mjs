/**
 * Consistency audit — five checks the compiler, linter and unit tests cannot
 * make, because each one spans files that never import each other.
 *
 * Every check here exists because it caught a real bug in this codebase:
 *
 *  1. dead links      — the header menu linked three routes that did not exist,
 *                       so every role hit "not found" from the user menu.
 *  2. nav vs guards   — beneficiaries were shown /app/estimates and contractors
 *                       /app/pricebook, both guarded against them: the link
 *                       silently bounced the very role that could see it.
 *  3. layout links    — the shared header linked /app/support for all seven
 *                       roles while the route allowed only two. Check 2 could
 *                       not catch this: it only reads the sidebar's *_NAV.
 *  4. status-pill     — `shared.statusPill.workOrderPriority.*` was missing
 *                       entirely; the key is built at runtime, so the pill
 *                       rendered the raw key instead of a label.
 *  5. uncalled API    — 14 endpoints had no caller. They were not dead code but
 *                       unbuilt write-flows (the donor could not donate, the
 *                       beneficiary could not report damage) whose APIs and
 *                       translations had been ported and whose pages never were.
 *
 * Run with `npm run audit`. Exits non-zero on any finding.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const APP = join(SRC, 'app');

const ROLES = ['beneficiary', 'donor', 'team', 'admin', 'contractor', 'staff', 'supplier'];

/** Public routes that live outside `/app` and are reached by direct link. */
const PUBLIC_PREFIXES = ['pub/contractor', 'pub/project'];

/** Role homes are reached through `homeRouteForRole`, not a literal link. */
const ROLE_HOMES = [
  'dashboard',
  'donations',
  'team-dashboard',
  'admin-dashboard',
  'contractor-dashboard',
  'staff-dashboard',
  'supplier-dashboard',
];

const read = (f) => readFileSync(f, 'utf8');

function walk(dir, test, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, test, out);
    else if (test(entry.name)) out.push(full);
  }
  return out;
}

const routesSrc = read(join(APP, 'app.routes.ts'));
const sidebarSrc = read(join(APP, 'layout', 'sidebar', 'sidebar.ts'));
const allFiles = walk(APP, (n) => n.endsWith('.ts') || n.endsWith('.html'));
const templates = allFiles.filter((f) => f.endsWith('.html'));

/**
 * route path -> allowed roles, or null when the route has no `roleGuard`.
 *
 * Parsed by slicing the text between one `path:` and the next rather than with
 * a single regex: an earlier version required `canActivate` to follow `path:`
 * immediately, so any route carrying an explanatory comment between the two
 * parsed as *unguarded* and was silently skipped by the checks below. That is a
 * false negative — the audit reported "ok" while inspecting nothing — so the
 * window approach is deliberate, not incidental.
 */
const guards = {};
const pathHits = [...routesSrc.matchAll(/path: '([a-z0-9-]+(?:\/[a-z0-9:-]+)*)'/g)];
for (const [i, hit] of pathHits.entries()) {
  const from = hit.index + hit[0].length;
  const to = i + 1 < pathHits.length ? pathHits[i + 1].index : routesSrc.length;
  const block = routesSrc.slice(from, to);
  if (guards[hit[1]] !== undefined) continue;
  const guard = block.match(/canActivate: \[roleGuard\(\[([^\]]*)\]\)\]/);
  guards[hit[1]] = guard ? [...guard[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1]) : null;
}
const declaredPaths = new Set([...Object.keys(guards), ...PUBLIC_PREFIXES]);

const findings = [];
const report = (check, message) => findings.push({ check, message });

// --- 1. dead links ----------------------------------------------------------
// Every /app or /pub target referenced anywhere must resolve to a declared route.
const linkTargets = new Set();
for (const file of allFiles) {
  const src = read(file);
  for (const m of src.matchAll(/['"]\/(app|pub)\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)/g)) {
    linkTargets.add(m[1] === 'pub' ? `pub/${m[2]}` : m[2]);
  }
  for (const m of src.matchAll(/routerLink="\/(app|pub)\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)"/g)) {
    linkTargets.add(m[1] === 'pub' ? `pub/${m[2]}` : m[2]);
  }
}
for (const target of [...linkTargets].sort()) {
  // A link to `a/b` is satisfied by a route for `a/b` or a parent `a`.
  const segments = target.split('/');
  const resolves = segments.some((_, i) => declaredPaths.has(segments.slice(0, i + 1).join('/')));
  if (!resolves) report('dead-link', `nothing routes /${target}`);
}

// --- 2. sidebar nav vs route guards ----------------------------------------
for (const m of sidebarSrc.matchAll(/const (\w+)_NAV: NavGroup\[\] = \[([\s\S]*?)\n\];/g)) {
  const role = ROLES.find((r) => m[1].toLowerCase() === r);
  if (!role) continue;
  for (const link of m[2].matchAll(/path: '\/app\/([a-z0-9-]+)'/g)) {
    const allowed = guards[link[1]];
    if (allowed === undefined) {
      report('nav-guard', `${role} nav links /app/${link[1]}, which has no route`);
    } else if (allowed !== null && !allowed.includes(role)) {
      report(
        'nav-guard',
        `${role} is shown /app/${link[1]} but its guard allows only [${allowed.join(', ')}]`,
      );
    }
  }
}

// --- 3. shared-layout links -------------------------------------------------
// Anything statically linked in the shared chrome is shown to every role, so a
// guard narrower than all seven bounces the rest.
for (const file of walk(join(APP, 'layout'), (n) => n.endsWith('.html'))) {
  if (file.includes('sidebar')) continue; // covered by check 2
  for (const m of read(file).matchAll(/routerLink="\/app\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)"/g)) {
    const allowed = guards[m[1]] ?? guards[m[1].split('/')[0]];
    if (allowed === undefined) {
      report('layout-link', `${relative(ROOT, file)} links /app/${m[1]}, which has no route`);
    } else if (allowed !== null && allowed.length < ROLES.length) {
      const bounced = ROLES.filter((r) => !allowed.includes(r));
      report(
        'layout-link',
        `${relative(ROOT, file)} shows /app/${m[1]} to every role but bounces: ${bounced.join(', ')}`,
      );
    }
  }
}

// --- 4. status-pill labels --------------------------------------------------
// The label key is assembled at runtime, so a gap renders the raw key on screen.
const ar = JSON.parse(read(join(ROOT, 'public', 'i18n', 'ar.json')));
const en = JSON.parse(read(join(ROOT, 'public', 'i18n', 'en.json')));
const lookup = (dict, key) =>
  key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);
const translated = (key) => typeof lookup(ar, key) === 'string' && typeof lookup(en, key) === 'string';

const toneSrc = read(join(APP, 'shared', 'ui', 'status-pill', 'status-tone.util.ts'));
const toneBody = toneSrc.slice(toneSrc.indexOf('CONTEXT_TONES'));
const contexts = {};
for (const m of toneBody.matchAll(/^ {2}([a-zA-Z]+): \{([^}]*)\}/gm)) {
  contexts[m[1]] = [...m[2].matchAll(/^\s*([a-zA-Z]+):/gm)].map((x) => x[1]);
}
const usedContexts = new Set();
for (const file of templates) {
  for (const m of read(file).matchAll(/context="([a-zA-Z]+)"/g)) usedContexts.add(m[1]);
}
for (const context of [...usedContexts].sort()) {
  const statuses = contexts[context];
  if (!statuses) {
    report('status-pill', `context "${context}" is used but absent from CONTEXT_TONES`);
    continue;
  }
  const missing = statuses.filter((s) => !translated(`shared.statusPill.${context}.${s}`));
  if (missing.length) {
    report('status-pill', `shared.statusPill.${context}.{${missing.join(', ')}} missing from ar/en`);
  }
}

// --- 5. API methods with no caller -----------------------------------------
const apiDir = join(APP, 'core', 'api');
const callers = allFiles
  .filter((f) => !f.includes(`${sep}api${sep}`) && !f.endsWith('.spec.ts'))
  .map(read)
  .join('\n');
for (const file of readdirSync(apiDir).filter((f) => f.endsWith('-api.service.ts'))) {
  const src = read(join(apiDir, file));
  const cls = src.match(/export class (\w+)/)?.[1] ?? file;
  for (const m of src.matchAll(/^ {2}([a-zA-Z]\w*)\(/gm)) {
    const method = m[1];
    if (method === 'constructor') continue;
    if (!new RegExp(`\\.${method}\\s*\\(`).test(callers)) {
      report('uncalled-api', `${cls}.${method}() has no caller — unbuilt feature or dead code`);
    }
  }
}

// --- report -----------------------------------------------------------------
const CHECKS = ['dead-link', 'nav-guard', 'layout-link', 'status-pill', 'uncalled-api'];
for (const check of CHECKS) {
  const hits = findings.filter((f) => f.check === check);
  if (hits.length === 0) {
    console.log(`  ok    ${check}`);
  } else {
    console.log(`  FAIL  ${check}`);
    for (const hit of hits) console.log(`          ${hit.message}`);
  }
}

const routeCount = (routesSrc.match(/loadComponent:/g) ?? []).length;
console.log(
  `\n${routeCount} routes · ${usedContexts.size} status-pill contexts · ${ROLE_HOMES.length} role homes`,
);

if (findings.length > 0) {
  console.error(`\n${findings.length} finding(s).`);
  process.exit(1);
}
console.log('\nAll consistency checks passed.');
