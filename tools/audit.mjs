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
 * The parsing/logic is exported as pure functions (tested in `audit.test.mjs`)
 * and kept separate from the filesystem walk so the checks can be exercised
 * against crafted inputs — a defect this very audit's parser once had went
 * undetected until it was tested against a deliberate regression.
 *
 * Run with `npm run audit`. Exits non-zero on any finding.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROLES = ['beneficiary', 'donor', 'team', 'admin', 'contractor', 'staff', 'supplier'];

/** Public routes that live outside `/app` and are reached by direct link. */
export const PUBLIC_PREFIXES = ['pub/contractor', 'pub/project'];

export const CHECKS = ['dead-link', 'nav-guard', 'layout-link', 'status-pill', 'uncalled-api'];

// --- pure helpers -----------------------------------------------------------

/**
 * Maps each route path to the roles its `roleGuard` allows, or `null` when the
 * route has none.
 *
 * Parsed by slicing the text between one `path:` and the next rather than with a
 * single regex: an earlier version required `canActivate` to follow `path:`
 * immediately, so any route carrying an explanatory comment between the two
 * parsed as *unguarded* and was silently skipped by every check. That is a false
 * negative — the audit reporting "ok" while inspecting nothing — so the window
 * approach is deliberate. `audit.test.mjs` locks it in.
 */
export function parseGuards(routesSrc) {
  const guards = {};
  const pathHits = [...routesSrc.matchAll(/path: '([a-z0-9-]+(?:\/[a-z0-9:-]+)*)'/g)];
  for (const [i, hit] of pathHits.entries()) {
    if (guards[hit[1]] !== undefined) continue; // first declaration wins
    const from = hit.index + hit[0].length;
    const to = i + 1 < pathHits.length ? pathHits[i + 1].index : routesSrc.length;
    const guard = routesSrc.slice(from, to).match(/canActivate: \[roleGuard\(\[([^\]]*)\]\)\]/);
    guards[hit[1]] = guard ? [...guard[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1]) : null;
  }
  return guards;
}

/** Every `/app` and `/pub` route target referenced in one file's source. */
export function extractLinkTargets(src) {
  const targets = new Set();
  const patterns = [
    /['"]\/(app|pub)\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)/g,
    /routerLink="\/(app|pub)\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)"/g,
  ];
  for (const re of patterns) {
    for (const m of src.matchAll(re)) targets.add(m[1] === 'pub' ? `pub/${m[2]}` : m[2]);
  }
  return targets;
}

/** Targets that resolve to no declared route (a parent segment counts). */
export function deadLinkFindings(targets, declaredPaths) {
  const findings = [];
  for (const target of [...targets].sort()) {
    const segments = target.split('/');
    const resolves = segments.some((_, i) => declaredPaths.has(segments.slice(0, i + 1).join('/')));
    if (!resolves) findings.push(`nothing routes /${target}`);
  }
  return findings;
}

/** Sidebar links shown to a role its route guard would bounce. */
export function navGuardFindings(sidebarSrc, guards) {
  const findings = [];
  for (const m of sidebarSrc.matchAll(/const (\w+)_NAV: NavGroup\[\] = \[([\s\S]*?)\n\];/g)) {
    const role = ROLES.find((r) => m[1].toLowerCase() === r);
    if (!role) continue;
    for (const link of m[2].matchAll(/path: '\/app\/([a-z0-9-]+)'/g)) {
      const allowed = guards[link[1]];
      if (allowed === undefined) {
        findings.push(`${role} nav links /app/${link[1]}, which has no route`);
      } else if (allowed !== null && !allowed.includes(role)) {
        findings.push(
          `${role} is shown /app/${link[1]} but its guard allows only [${allowed.join(', ')}]`,
        );
      }
    }
  }
  return findings;
}

/**
 * Static links in the shared chrome are shown to every role, so a guard narrower
 * than all seven bounces the rest. `files` is `[{ name, src }]`.
 */
export function layoutLinkFindings(files, guards) {
  const findings = [];
  for (const { name, src } of files) {
    if (name.includes('sidebar')) continue; // covered by navGuardFindings
    for (const m of src.matchAll(/routerLink="\/app\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)"/g)) {
      const allowed = guards[m[1]] ?? guards[m[1].split('/')[0]];
      if (allowed === undefined) {
        findings.push(`${name} links /app/${m[1]}, which has no route`);
      } else if (allowed !== null && allowed.length < ROLES.length) {
        const bounced = ROLES.filter((r) => !allowed.includes(r));
        findings.push(`${name} shows /app/${m[1]} to every role but bounces: ${bounced.join(', ')}`);
      }
    }
  }
  return findings;
}

/** `{ context: statuses[] }` from the `CONTEXT_TONES` map in status-tone.util.ts. */
export function parseContextTones(toneSrc) {
  const body = toneSrc.slice(toneSrc.indexOf('CONTEXT_TONES'));
  const contexts = {};
  for (const m of body.matchAll(/^ {2}([a-zA-Z]+): \{([^}]*)\}/gm)) {
    contexts[m[1]] = [...m[2].matchAll(/^\s*([a-zA-Z]+):/gm)].map((x) => x[1]);
  }
  return contexts;
}

/** Status-pill contexts used in templates whose labels are missing. `translated`
 * answers whether a key exists in both dictionaries. */
export function statusPillFindings(usedContexts, contexts, translated) {
  const findings = [];
  for (const context of [...usedContexts].sort()) {
    const statuses = contexts[context];
    if (!statuses) {
      findings.push(`context "${context}" is used but absent from CONTEXT_TONES`);
      continue;
    }
    const missing = statuses.filter((s) => !translated(`shared.statusPill.${context}.${s}`));
    if (missing.length) {
      findings.push(`shared.statusPill.${context}.{${missing.join(', ')}} missing from ar/en`);
    }
  }
  return findings;
}

/** Public method names on an API service that appear nowhere in `callersText`. */
export function uncalledMethods(serviceSrc, callersText) {
  const cls = serviceSrc.match(/export class (\w+)/)?.[1] ?? 'service';
  const dead = [];
  for (const m of serviceSrc.matchAll(/^ {2}([a-zA-Z]\w*)\(/gm)) {
    const method = m[1];
    if (method === 'constructor') continue;
    if (!new RegExp(`\\.${method}\\s*\\(`).test(callersText)) dead.push(`${cls}.${method}`);
  }
  return dead;
}

/** Resolves a dotted key in a translation dictionary to its leaf value. */
export function lookup(dict, key) {
  return key
    .split('.')
    .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);
}

// --- filesystem runner ------------------------------------------------------

/** Runs every check against the repo at `root`, returning `{ findings, stats }`. */
export function runAudit(root) {
  const app = join(root, 'src', 'app');
  const read = (f) => readFileSync(f, 'utf8');
  const walk = (dir, test, out = []) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, test, out);
      else if (test(entry.name)) out.push(full);
    }
    return out;
  };

  const routesSrc = read(join(app, 'app.routes.ts'));
  const sidebarSrc = read(join(app, 'layout', 'sidebar', 'sidebar.ts'));
  const allFiles = walk(app, (n) => n.endsWith('.ts') || n.endsWith('.html'));
  const templates = allFiles.filter((f) => f.endsWith('.html'));

  const guards = parseGuards(routesSrc);
  const declaredPaths = new Set([...Object.keys(guards), ...PUBLIC_PREFIXES]);

  const findings = [];
  const add = (check, messages) => messages.forEach((m) => findings.push({ check, message: m }));

  // 1. dead links (union of targets across every file)
  const targets = new Set();
  for (const file of allFiles) {
    for (const t of extractLinkTargets(read(file))) targets.add(t);
  }
  add('dead-link', deadLinkFindings(targets, declaredPaths));

  // 2. sidebar nav vs guards
  add('nav-guard', navGuardFindings(sidebarSrc, guards));

  // 3. shared-layout links
  const layoutFiles = walk(join(app, 'layout'), (n) => n.endsWith('.html')).map((f) => ({
    name: relative(root, f),
    src: read(f),
  }));
  add('layout-link', layoutLinkFindings(layoutFiles, guards));

  // 4. status-pill labels
  const ar = JSON.parse(read(join(root, 'public', 'i18n', 'ar.json')));
  const en = JSON.parse(read(join(root, 'public', 'i18n', 'en.json')));
  const translated = (key) =>
    typeof lookup(ar, key) === 'string' && typeof lookup(en, key) === 'string';
  const contexts = parseContextTones(
    read(join(app, 'shared', 'ui', 'status-pill', 'status-tone.util.ts')),
  );
  const usedContexts = new Set();
  for (const file of templates) {
    for (const m of read(file).matchAll(/context="([a-zA-Z]+)"/g)) usedContexts.add(m[1]);
  }
  add('status-pill', statusPillFindings(usedContexts, contexts, translated));

  // 5. uncalled API methods
  const apiDir = join(app, 'core', 'api');
  const callers = allFiles
    .filter((f) => !f.includes(`${sep}api${sep}`) && !f.endsWith('.spec.ts'))
    .map(read)
    .join('\n');
  for (const file of readdirSync(apiDir).filter((f) => f.endsWith('-api.service.ts'))) {
    add(
      'uncalled-api',
      uncalledMethods(read(join(apiDir, file)), callers).map(
        (m) => `${m}() has no caller — unbuilt feature or dead code`,
      ),
    );
  }

  const stats = {
    routes: (routesSrc.match(/loadComponent:/g) ?? []).length,
    contexts: usedContexts.size,
  };
  return { findings, stats };
}

// --- CLI --------------------------------------------------------------------

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const { findings, stats } = runAudit(root);

  for (const check of CHECKS) {
    const hits = findings.filter((f) => f.check === check);
    if (hits.length === 0) {
      console.log(`  ok    ${check}`);
    } else {
      console.log(`  FAIL  ${check}`);
      for (const hit of hits) console.log(`          ${hit.message}`);
    }
  }
  console.log(`\n${stats.routes} routes · ${stats.contexts} status-pill contexts`);

  if (findings.length > 0) {
    console.error(`\n${findings.length} finding(s).`);
    process.exit(1);
  }
  console.log('\nAll consistency checks passed.');
}

// Run only when invoked directly, not when imported by the test file.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
