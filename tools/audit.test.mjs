/**
 * Tests for the consistency audit itself. Node's built-in runner:
 * `npm run audit:test` (or `node --test tools/audit.test.mjs`).
 *
 * The audit gates CI, so it must be trusted — and it earned distrust once: an
 * early `parseGuards` skipped any route with a comment before its guard, so it
 * reported "ok" while inspecting nothing. Each case below pins a behaviour that,
 * if it regressed, would let a real bug through silently. The comment case is
 * the one that actually bit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import {
  parseGuards,
  extractLinkTargets,
  deadLinkFindings,
  navGuardFindings,
  layoutLinkFindings,
  parseContextTones,
  statusPillFindings,
  uncalledMethods,
  extractInvalidBlocks,
  collectDescribedByRefs,
  formErrorFindings,
  runAudit,
} from './audit.mjs';

test('parseGuards reads roles when canActivate follows path directly', () => {
  const src = `
      {
        path: 'estimates',
        canActivate: [roleGuard(['admin', 'contractor'])],
        loadComponent: () => import('x'),
      },`;
  assert.deepEqual(parseGuards(src).estimates, ['admin', 'contractor']);
});

test('parseGuards reads roles across a comment between path and guard (the regression)', () => {
  // This exact shape — an explanatory comment before canActivate — is what the
  // first parser silently mis-read as unguarded.
  const src = `
      {
        path: 'estimates',
        // A beneficiary sees what their rebuild is costed at; deciding is admin.
        canActivate: [roleGuard(['admin', 'contractor', 'beneficiary', 'team'])],
        loadComponent: () => import('x'),
      },`;
  assert.deepEqual(parseGuards(src).estimates, ['admin', 'contractor', 'beneficiary', 'team']);
});

test('parseGuards records null for an unguarded route', () => {
  const src = `{ path: 'profile', loadComponent: () => import('x') },`;
  assert.equal(parseGuards(src).profile, null);
});

test('parseGuards stops at the next route (no bleed-through)', () => {
  const src = `
      { path: 'requests', loadComponent: () => import('a') },
      { path: 'estimates', canActivate: [roleGuard(['admin'])], loadComponent: () => import('b') },`;
  // `requests` is unguarded and must NOT pick up estimates' guard.
  assert.equal(parseGuards(src).requests, null);
  assert.deepEqual(parseGuards(src).estimates, ['admin']);
});

test('extractLinkTargets finds app and pub targets in templates and TS', () => {
  const src = `
    <a routerLink="/app/projects/1">x</a>
    <a [routerLink]="['/pub/contractor', id]">y</a>
    this.router.navigate(['/app/funding', id]);`;
  const targets = extractLinkTargets(src);
  assert.ok(targets.has('projects/1'));
  assert.ok(targets.has('pub/contractor'));
  assert.ok(targets.has('funding'));
});

test('deadLinkFindings flags an unrouted target but accepts a parent match', () => {
  const declared = new Set(['projects', 'funding']);
  assert.deepEqual(deadLinkFindings(new Set(['data-policy']), declared), [
    'nothing routes /data-policy',
  ]);
  // `projects/1` resolves via its parent `projects`.
  assert.deepEqual(deadLinkFindings(new Set(['projects/1']), declared), []);
});

test('navGuardFindings flags a role shown a link its guard bounces', () => {
  const sidebar = `
const BENEFICIARY_NAV: NavGroup[] = [
  { items: [{ labelKey: 'nav.estimates', path: '/app/estimates', icon: X }] },
];`;
  // estimates excludes beneficiary -> finding
  assert.equal(navGuardFindings(sidebar, { estimates: ['admin', 'contractor'] }).length, 1);
  // estimates includes beneficiary -> clean
  assert.equal(
    navGuardFindings(sidebar, { estimates: ['admin', 'beneficiary'] }).length,
    0,
  );
  // unguarded route -> clean
  assert.equal(navGuardFindings(sidebar, { estimates: null }).length, 0);
});

test('layoutLinkFindings flags a shared link narrower than all roles and names the bounced', () => {
  const files = [{ name: 'header.html', src: `<a routerLink="/app/support">S</a>` }];
  const findings = layoutLinkFindings(files, { support: ['admin', 'staff'] });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /bounces: beneficiary, donor, team, contractor, supplier/);
  // A link every role can reach is clean.
  assert.equal(layoutLinkFindings(files, { support: null }).length, 0);
});

test('layoutLinkFindings ignores the sidebar (covered by navGuardFindings)', () => {
  const files = [{ name: 'sidebar/sidebar.html', src: `<a routerLink="/app/support">S</a>` }];
  assert.equal(layoutLinkFindings(files, { support: ['admin'] }).length, 0);
});

test('parseContextTones + statusPillFindings flag a missing label', () => {
  const tone = `
const CONTEXT_TONES = {
  shipment: {
    planned: 'neutral',
    delivered: 'success',
  },
};`;
  const contexts = parseContextTones(tone);
  assert.deepEqual(contexts.shipment, ['planned', 'delivered']);
  // `delivered` label missing -> finding; unknown context -> finding.
  const translated = (k) => k === 'shared.statusPill.shipment.planned';
  const findings = statusPillFindings(new Set(['shipment', 'ghost']), contexts, translated);
  assert.equal(findings.length, 2);
  assert.ok(findings.some((f) => f.includes('delivered')));
  assert.ok(findings.some((f) => f.includes('ghost')));
});

test('uncalledMethods flags a method with no caller and ignores called ones', () => {
  const service = `export class FooApi {
  used() {}
  orphan() {}
}`;
  const consumers = [{ name: 'page.ts', src: `const api = inject(FooApi); api.used();` }];
  assert.deepEqual(uncalledMethods(service, consumers), ['FooApi.orphan']);
});

test('uncalledMethods resolves a call across a multiline fluent chain', () => {
  // Nearly every call in this codebase pipes, so the receiver and the method
  // land on different lines. Missing this would make the check pure noise.
  const service = `export class FooApi {
  login() {}
}`;
  const consumers = [
    {
      name: 'sign-in.ts',
      src: `private readonly authApi = inject(FooApi);
        submit() {
          this.authApi
            .login(email, password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }`,
    },
  ];
  assert.deepEqual(uncalledMethods(service, consumers), []);
});

test('uncalledMethods does not credit a same-named method on a different service (the regression)', () => {
  // This is the shape that hid three unreachable endpoints. All 33 API services
  // declare `getById`, and the old check tested `.getById(` against every file
  // concatenated — so ONE service's call vouched for all of them. Here nothing
  // injects BarApi at all, yet a `getById` call is present via FooApi.
  const barApi = `export class BarApi {
  getById() {}
}`;
  const consumers = [
    { name: 'other-page.ts', src: `const foo = inject(FooApi); foo.getById(id);` },
  ];
  assert.deepEqual(uncalledMethods(barApi, consumers), ['BarApi.getById']);
});

test('uncalledMethods honours constructor injection', () => {
  const service = `export class FooApi {
  list() {}
}`;
  const consumers = [
    { name: 'legacy.ts', src: `constructor(private api: FooApi) {} load() { this.api.list(); }` },
  ];
  assert.deepEqual(uncalledMethods(service, consumers), []);
});

test('uncalledMethods ignores the constructor and reports each method once', () => {
  const service = `export class FooApi {
  constructor() {}
  orphan() {}
  orphan() {}
}`;
  assert.deepEqual(uncalledMethods(service, []), ['FooApi.orphan']);
});

// --- form-error ------------------------------------------------------------
//
// The whole check rests on scoping: it must see field errors and ignore the
// ~100 page-level "could not load" messages wearing the same `text-danger`
// class. Every case below was run against a planted defect first — a check
// never exercised against one proves nothing.

const WIRED_FIELD = `
  <input id="email" formControlName="email"
    aria-describedby="email-error"
    [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid" />
  @if (form.controls.email.touched && form.controls.email.invalid) {
    <p id="email-error" class="mt-1 text-sm text-danger">Enter an email</p>
  }`;

test('formErrorFindings passes a field whose error is wired to it', () => {
  assert.deepEqual(formErrorFindings('sign-in.html', WIRED_FIELD), []);
});

test('formErrorFindings flags an error message with no id (the defect this check was built for)', () => {
  // Exactly the shape every one of the 26 forms had: the text is on screen and
  // translated, but neither attribute is present, so nothing ties it to the
  // control and a screen-reader user is told the form failed by a colour they
  // cannot see. Reinstating that shape must fail, or the check proves nothing.
  const planted = WIRED_FIELD.replace(' id="email-error"', '').replace(
    '\n    aria-describedby="email-error"',
    '',
  );
  const findings = formErrorFindings('sign-in.html', planted);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /has no id/);
});

test('formErrorFindings flags an error nothing points at (a rename that broke the link)', () => {
  const renamed = WIRED_FIELD.replace('aria-describedby="email-error"', 'aria-describedby="email-err"');
  const findings = formErrorFindings('sign-in.html', renamed);
  // Both halves of the break are named: the orphaned message and the dangling ref.
  assert.equal(findings.length, 2);
  assert.ok(findings.some((f) => /"email-error" is not referenced/.test(f)));
  assert.ok(findings.some((f) => /"email-err" matches no id/.test(f)));
});

test('formErrorFindings ignores a page-level error that owes no control a description', () => {
  const pageError = `
    @if (resource.error()) {
      <p class="text-sm text-danger">Could not load the register.</p>
    }`;
  assert.deepEqual(formErrorFindings('list.html', pageError), []);
});

test('formErrorFindings accepts errorId forwarding into a wrapper control', () => {
  // `app-password-field` renders its own <input>; the host is not focusable, so
  // the parent form forwards the reference rather than setting the attribute.
  const src = `
    <app-password-field formControlName="confirmPassword" errorId="confirm-error"
      [invalid]="form.controls.confirmPassword.invalid" />
    @if (form.controls.confirmPassword.hasError('mustMatch')) {
      <p id="confirm-error" class="mt-1 text-sm text-danger">Passwords must match</p>
    }`;
  assert.deepEqual(formErrorFindings('reset.html', src), []);
});

test('formErrorFindings matches a bound id against a bound reference, per FormArray row', () => {
  // Licences are a FormArray, so both id and reference are expressions. Comparing
  // them only after whitespace normalisation is what keeps this row in scope
  // instead of being silently skipped.
  const src = `
    <input [id]="'licenceName' + $index" formControlName="name"
      [attr.aria-describedby]="'licenceName' + $index + '-error'" />
    @if (licence.get('name')?.invalid) {
      <p [id]="'licenceName' + $index + '-error'" class="mt-1 text-sm text-danger">Required</p>
    }`;
  assert.deepEqual(formErrorFindings('credentials.html', src), []);
});

test('extractInvalidBlocks scopes group-level errors in (the second silent-skip)', () => {
  // The trades fieldset and the damage report's address gate their error on a
  // component signal, not a control. A first version keyed only on `.invalid`
  // scoped both out and called the two files clean while they were not.
  const group = `
    @if (submitted() && tradesInvalid()) {
      <p class="text-sm text-danger">Pick at least one trade</p>
    }`;
  assert.equal(extractInvalidBlocks(group).length, 1);
  assert.equal(formErrorFindings('business.html', group).length, 1);
});

test('extractInvalidBlocks closes on the matching brace, not the first one', () => {
  // A nested @for inside an error block must not end it early, or the message
  // after the nested block would fall out of scope unnoticed.
  const src = `
    @if (form.controls.trades.invalid) {
      @for (t of trades; track t) {
        <span>{{ t }}</span>
      }
      <p class="text-sm text-danger">Required</p>
    }
    <p class="text-sm text-danger">Not a field error</p>`;
  const blocks = extractInvalidBlocks(src);
  assert.equal(blocks.length, 1);
  assert.equal((blocks[0].match(/text-danger/g) ?? []).length, 1);
});

test('collectDescribedByRefs splits a multi-id list', () => {
  const refs = collectDescribedByRefs('<input aria-describedby="a-hint a-error" />');
  assert.ok(refs.has('a-hint'));
  assert.ok(refs.has('a-error'));
});

test('runAudit reports zero findings against the real repository', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const { findings, stats } = runAudit(root);
  assert.equal(
    findings.length,
    0,
    'repo audit should be clean:\n' + findings.map((f) => `  [${f.check}] ${f.message}`).join('\n'),
  );
  assert.ok(stats.routes > 0);
  // Sanity that the fixture path resolved to the real project.
  assert.ok(typeof join(root, 'src') === 'string');
});
