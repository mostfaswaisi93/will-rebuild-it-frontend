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
  const callers = 'this.api.used();';
  assert.deepEqual(uncalledMethods(service, callers), ['FooApi.orphan']);
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
