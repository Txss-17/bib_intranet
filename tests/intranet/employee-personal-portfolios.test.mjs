import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const file = (path) => readFileSync(new URL('../../' + path,import.meta.url),'utf8');

test('personal portfolios appear automatically at login destinations', () => {
 const layout = file('src/components/layout/MainLayout.tsx');
 const widget = file('src/components/dashboard/MyAssignedPortfolios.tsx');
 assert.match(layout, /showOwnPortfolios && <MyAssignedPortfolios \/>/);
 assert.match(layout, /pathname === "\/"/);
 assert.match(layout, /pathname\.startsWith\("\/pole\/"\)/);
 assert.match(widget, /Mes portefeuilles/);
 assert.match(widget, /profile\?\.id === user\.id/);
 assert.match(widget, /enabled: identityReady/);
 assert.match(widget, /queryKey: \['my-assigned-portfolios', user\?\.id\]/);
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
