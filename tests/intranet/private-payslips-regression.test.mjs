import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p,import.meta.url),'utf8');

test('payroll document policy is restrictive for every operation and forbids declassification',()=>{
 const sql=read('drizzle/migrations/0077_private_payslips.sql');
 for(const op of ['SELECT','INSERT','UPDATE','DELETE'])
   assert.match(sql,new RegExp('AS RESTRICTIVE FOR '+op+' TO authenticated'));
 assert.match(sql,/document_type <> 'payroll' OR public\.can_read_bib_payslip\(employee_id\)/);
 assert.match(sql,/document_type <> 'payroll' OR public\.can_manage_bib_payslip\(employee_id\)/);
 assert.match(sql,/p_employee_id=auth\.uid\(\)/);
 assert.match(sql,/public\.is_canonical_bib_ceo\(auth\.uid\(\)\)/);
 assert.match(sql,/public\.can_intranet_action\('finance\.salaries','read'\)/);
 assert.match(sql,/coalesce\(recipient\.test_account,false\)=false/);
 assert.match(sql,/NEW\.document_type IS DISTINCT FROM OLD\.document_type/);
 assert.match(sql,/NEW\.employee_id IS DISTINCT FROM OLD\.employee_id/);
});
test('personal menu serves only logged-in employee documents without exposing arbitrary URLs',()=>{
 const dialog=read('src/components/rh/MyPayslipsDialog.tsx');
 const topbar=read('src/components/layout/TopBar.tsx');
 assert.match(dialog,/queryKey: \['my-payslips', user\?\.id\]/);
 assert.match(dialog,/\.eq\('employee_id', user\.id\)/);
 assert.match(dialog,/\.eq\('document_type', 'payroll'\)/);
 assert.match(dialog,/\.protocol !== 'https:'/);
 assert.match(dialog,/drive\.google\.com/);
 assert.match(dialog,/docs\.google\.com/);
 assert.match(topbar,/Mes bulletins de paie/);
 assert.match(topbar,/MyPayslipsDialog/);
});
