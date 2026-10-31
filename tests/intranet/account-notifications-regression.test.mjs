import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../'+p,import.meta.url),'utf8');

test('notification ownership is restricted by PostgreSQL row-level security',()=>{
 const sql=read('drizzle/migrations/0076_account_scoped_notifications.sql');
 for(const action of ['SELECT','UPDATE','DELETE']){
   assert.match(sql,new RegExp('AS RESTRICTIVE FOR '+action+' TO authenticated'));
 }
 assert.match(sql,/USING \(user_id = auth\.uid\(\)\)/);
 assert.match(sql,/WITH CHECK \(user_id = auth\.uid\(\)\)/);
 assert.match(sql,/guard_notification_owner/);
 assert.match(sql,/NEW\.user_id IS DISTINCT FROM OLD\.user_id/);
 assert.match(sql,/fanout_legacy_notification/);
 assert.match(sql,/AFTER INSERT ON public\.notifications/);
 assert.match(sql,/WHEN \(NEW\.user_id IS NULL\)/);
 assert.match(sql,/INSERT INTO public\.notifications\(user_id,pole_id/);
});
test('personal inbox and top bar only query and acknowledge owner rows',()=>{
 const page=read('src/pages/Notifications.tsx');
 const bar=read('src/components/layout/TopBar.tsx');
 assert.match(page,/enabled: !!user/);
 assert.match(page,/\.eq\('user_id', user\.id\)/);
 assert.match(page,/\.eq\('user_id', user!\.id\)/);
 assert.match(bar,/\.eq\('user_id', profile!\.id\)/);
});
test('critical panel never treats shared operational cases as private notifications',()=>{
 const hook=read('src/hooks/useCriticalAlerts.ts');
 assert.match(hook,/\.eq\('user_id', user!\.id\)/);
 assert.match(hook,/filter: `user_id=eq\.\$\{user\?\.id\}`/);
 assert.doesNotMatch(hook,/\.from\('quality_alerts'\)/);
 assert.doesNotMatch(hook,/\.from\('logistics_incidents'\)/);
 assert.match(hook,/\.eq\('user_id', user!\.id\)\s*\.then\(/);
});
test('executive notification widgets do not count a second user personal alerts',()=>{
 const hook=read('src/hooks/useExecutiveKPIs.ts');
 assert.match(hook,/queryKey: \['executive_kpis', user\?\.id\]/);
 assert.match(hook,/enabled: !!user/);
 assert.ok((hook.match(/\.eq\('user_id', user!\.id\)/g)||[]).length>=2);
});
