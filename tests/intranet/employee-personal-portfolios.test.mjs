import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const file = (path) => readFileSync(new URL('../../' + path,import.meta.url),'utf8');

test('personal portfolios render inside the existing protected dashboard routes', () => {
 const layout = file('src/components/layout/MainLayout.tsx');
 const home = file('src/pages/Dashboard.tsx');
 const pole = file('src/components/operations/OperationsOverview.tsx');
 const widget = file('src/components/dashboard/MyAssignedPortfolios.tsx');
 assert.ok(layout.includes('<RouteAccessGate><Outlet /></RouteAccessGate>'));
 assert.ok(home.includes('<MyAssignedPortfolios />'));
 assert.ok(pole.includes('<MyAssignedPortfolios />'));
 assert.ok(widget.includes('Mes portefeuilles'));
 assert.ok(widget.includes('profile?.id === user.id'));
 assert.ok(widget.includes('enabled: identityReady'));
 assert.ok(widget.includes("queryKey: ['my-assigned-portfolios', user?.id]"));
});

test('queries are constrained to the authenticated identity, not to all employees', () => {
 const widget = file('src/components/dashboard/MyAssignedPortfolios.tsx');
 assert.match(widget, /\.eq\('employee_id', userId\)/);
 assert.match(widget, /\.eq\('owner_id', userId\)/);
 assert.match(widget, /responsible_id\.eq\.\$\{userId\}/);
 assert.match(widget, /backup_id\.eq\.\$\{userId\}/);
 assert.match(widget, /assignment_status', 'active'/);
 assert.match(widget, /\.eq\('status', 'active'\)/);
 assert.match(widget, /if \(failure\?\.error\) throw failure\.error/);
 assert.match(widget, /aucune liste partielle/);
 assert.doesNotMatch(widget, /\.from\('profiles'\)/);
});
