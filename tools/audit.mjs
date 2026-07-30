/**
 * Consistency audit — six checks the compiler, linter and unit tests cannot
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
 *                       Then the check itself proved too loose: it matched
 *                       `.method(` by name across all files concatenated, so
 *                       `getById`/`list`/`create` — declared by every one of the
 *                       33 API services — counted as called as soon as any one
 *                       service's namesake was called. Three endpoints hid
 *                       behind that: a shipment detail page that did not exist,
 *                       and two status decisions with no control. Calls are now
 *                       resolved through the variable the service is injected
 *                       into.
 *  6. form errors     — every validation message in the app was a bare sibling
 *                       of its field: 0 `aria-describedby` and 1 `aria-invalid`
 *                       across 28 forms. The red text was on screen and had a
 *                       translation key, but nothing tied it to the control, so
 *                       a screen-reader user who submitted the damage report —
 *                       the beneficiary's way into the platform — was told the
 *                       form had failed by a colour they could not see. ESLint's
 *                       `templateAccessibility` set cannot see it: no rule pairs
 *                       a message with the field it describes.
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

export const CHECKS = [
  'dead-link',
  'nav-guard',
  'layout-link',
  'status-pill',
  'uncalled-api',
  'form-error',
];

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

/**
 * Collapses whitespace before a `.` so a multiline fluent chain
 * (`this.api\n  .login(...)`) binds the method to its receiver. Without this,
 * every chained call reads as uncalled — and since the codebase pipes almost
 * every request, that would make the check report nothing but noise.
 */
export function joinChains(src) {
  return src.replace(/\s+\./g, '.');
}

/**
 * Public method names on an API service with no *resolved* caller.
 *
 * Resolution goes through the variable the service was injected into, not the
 * bare method name. The first version of this check tested `.method(` against
 * the concatenation of every file, so `getById`/`list`/`create` — which 33 of
 * the 33 API services declare — counted as called the moment *any* service's
 * same-named method was called anywhere. That hid three genuinely unreachable
 * endpoints (`ShipmentsApi.getById`, `EquipmentApi.setStatus`,
 * `StaffApi.setStatus`): a shipment detail page that did not exist, and two
 * status decisions with no control. Only uniquely-named methods were ever
 * really covered.
 *
 * `consumers` is `[{ name, src }]` for every non-API, non-spec file.
 */
export function uncalledMethods(serviceSrc, consumers) {
  const cls = serviceSrc.match(/export class (\w+)/)?.[1] ?? 'service';
  const methods = [];
  for (const m of serviceSrc.matchAll(/^ {2}([a-zA-Z]\w*)\(/gm)) {
    if (m[1] !== 'constructor') methods.push(m[1]);
  }

  const called = new Set();
  const injects = new RegExp(`(\\w+)\\s*=\\s*inject\\(${cls}\\)`, 'g');
  const ctorParam = new RegExp(`(\\w+)\\s*:\\s*${cls}\\b`, 'g');

  for (const { src } of consumers) {
    const text = joinChains(src);
    const vars = new Set();
    for (const m of text.matchAll(injects)) vars.add(m[1]);
    for (const m of text.matchAll(ctorParam)) vars.add(m[1]);
    for (const v of vars) {
      for (const m of text.matchAll(new RegExp(`\\b${v}\\.(\\w+)\\s*\\(`, 'g'))) called.add(m[1]);
    }
  }

  return [...new Set(methods)].filter((m) => !called.has(m)).map((m) => `${cls}.${m}`);
}

/**
 * Bodies of every `@if` / `@else if` block whose condition tests a form
 * control's validity — i.e. the blocks that render a *field* error, as opposed
 * to the ~100 page-level "could not load" messages that share the same
 * `text-danger` style and owe no control anything.
 *
 * Scoping the check this way is the whole reason it can be strict: told to
 * inspect every `text-danger` element it would drown in false positives, and a
 * check whose findings are mostly noise gets muted rather than fixed.
 *
 * The second alternative is not decoration. Two group-level errors — the trades
 * fieldset on the contractor's business step, and the address on the damage
 * report — are gated on a component signal (`tradesInvalid()`,
 * `addressMissing()`) rather than on a control, because the rule spans several
 * controls. A first version keyed only on `.invalid`/`.hasError(`/`.errors`
 * scoped both of them out and reported the two files clean while they were not:
 * the same silent-skip shape that `parseGuards` and `uncalledMethods` each had
 * to be hardened against.
 *
 * What this deliberately does NOT cover: an error gated on a signal named
 * outside that vocabulary. The check reports how many forms it inspected so a
 * form silently dropping out of scope is visible in the output.
 *
 * Braces are counted rather than regex-matched so nested `@if`/`@for` blocks
 * close correctly. Interpolations and inline object literals nest evenly, so
 * they cancel out.
 */
export function extractInvalidBlocks(src) {
  const blocks = [];
  for (const m of src.matchAll(/@(?:else\s+)?if\s*\(/g)) {
    const condStart = m.index + m[0].length;
    let depth = 1;
    let i = condStart;
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
    }
    const condition = src.slice(condStart, i - 1);
    const testsControl = /\.invalid|\.hasError\(|\.errors\b/.test(condition);
    const testsGroup = /\b\w*(?:Invalid|Missing|Required)\(\)/.test(condition);
    if (!testsControl && !testsGroup) continue;

    const open = src.indexOf('{', i);
    if (open === -1) continue;
    let braces = 1;
    let j = open + 1;
    for (; j < src.length && braces > 0; j++) {
      if (src[j] === '{') braces++;
      else if (src[j] === '}') braces--;
    }
    blocks.push(src.slice(open + 1, j - 1));
  }
  return blocks;
}

/**
 * Normalises an id so a static attribute and a bound expression compare equal:
 * `id="email-error"` and `[id]="'licence-' + $index + '-name-error'"` both
 * reduce to a single token, letting the FormArray case be checked as strictly
 * as the plain one instead of being silently skipped.
 */
export function normaliseIdRef(value) {
  return value.replace(/\s+/g, '');
}

/** Every id an element in this template declares, static or bound. */
export function collectDeclaredIds(src) {
  const ids = new Set();
  for (const m of src.matchAll(/\bid="([^"]+)"/g)) ids.add(normaliseIdRef(m[1]));
  for (const m of src.matchAll(/\[id\]="([^"]+)"/g)) ids.add(normaliseIdRef(m[1]));
  return ids;
}

/**
 * Every id this template points an `aria-describedby` at, static or bound.
 *
 * `errorId` counts as one. Three form controls (`app-password-field`,
 * `app-phone-input`, `app-address-picker`) render their own `<input>`, so the
 * parent form cannot put `aria-describedby` on anything that a screen reader
 * would read — the host element is not focusable. `errorId` is the input that
 * forwards the reference to the real control inside, and each of those three
 * binds it straight to `[attr.aria-describedby]`. Treating it as anything less
 * than a reference would make this check reject correct markup, and a check
 * that fails on correct code gets deleted.
 */
export function collectDescribedByRefs(src) {
  const refs = new Set();
  for (const attr of [/\baria-describedby="([^"]+)"/g, /\berrorId="([^"]+)"/g]) {
    for (const m of src.matchAll(attr)) {
      for (const token of m[1].split(/\s+/).filter(Boolean)) refs.add(normaliseIdRef(token));
    }
  }
  for (const bound of [/\[attr\.aria-describedby\]="([^"]+)"/g, /\[errorId\]="([^"]+)"/g]) {
    for (const m of src.matchAll(bound)) refs.add(normaliseIdRef(m[1]));
  }
  return refs;
}

/**
 * Field-level validation messages that no control points at.
 *
 * Three findings, because the gap has three shapes and only catching the first
 * would let the other two through a rename:
 *   - a message with no id at all — nothing *can* reference it;
 *   - a message with an id that no `aria-describedby` uses — the wiring was
 *     never done, or was done on the wrong control;
 *   - an `aria-describedby` resolving to no id in its own template — a dangling
 *     reference, which reads to a screen reader exactly like no description.
 */
export function formErrorFindings(name, src) {
  const findings = [];
  const declared = collectDeclaredIds(src);
  const referenced = collectDescribedByRefs(src);

  const messageIds = new Set();
  for (const block of extractInvalidBlocks(src)) {
    for (const tag of block.matchAll(/<p\b([^>]*)>/g)) {
      if (!/text-danger/.test(tag[1])) continue;
      const id = tag[1].match(/\bid="([^"]+)"/) ?? tag[1].match(/\[id\]="([^"]+)"/);
      if (!id) {
        findings.push(`${name}: a field error message has no id, so no field can describe it`);
        continue;
      }
      messageIds.add(normaliseIdRef(id[1]));
    }
  }

  for (const id of [...messageIds].sort()) {
    if (!referenced.has(id)) {
      findings.push(`${name}: error "${id}" is not referenced by any aria-describedby`);
    }
  }
  for (const ref of [...referenced].sort()) {
    if (!declared.has(ref)) {
      findings.push(`${name}: aria-describedby "${ref}" matches no id in this template`);
    }
  }
  return findings;
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

  // 5. uncalled API methods — resolved per service, not by bare method name
  const apiDir = join(app, 'core', 'api');
  const consumers = allFiles
    .filter((f) => !f.includes(`${sep}api${sep}`) && !f.endsWith('.spec.ts'))
    .map((f) => ({ name: relative(root, f), src: read(f) }));
  for (const file of readdirSync(apiDir).filter((f) => f.endsWith('-api.service.ts'))) {
    add(
      'uncalled-api',
      uncalledMethods(read(join(apiDir, file)), consumers).map(
        (m) => `${m}() has no caller — unbuilt feature or dead code`,
      ),
    );
  }

  // 6. field errors reachable from the field they describe
  let formsChecked = 0;
  for (const file of templates) {
    const src = read(file);
    if (extractInvalidBlocks(src).length === 0) continue;
    formsChecked++;
    add('form-error', formErrorFindings(relative(root, file), src));
  }

  const stats = {
    routes: (routesSrc.match(/loadComponent:/g) ?? []).length,
    contexts: usedContexts.size,
    forms: formsChecked,
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
  console.log(
    `\n${stats.routes} routes · ${stats.contexts} status-pill contexts · ${stats.forms} validated forms`,
  );

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
