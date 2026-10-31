import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('employee documents ignore late responses from another selected employee', () => {
 const page = read('src/pages/modules/rh/EmployeeFiles.tsx');
 assert.match(page, /documentRequestId = useRef\(0\)/);
 assert.match(page, /const requestId = \+\+documentRequestId\.current/);
 assert.match(page, /if \(requestId !== documentRequestId\.current\) return/);
 assert.match(page, /if \(requestId === documentRequestId\.current\) setIsLoadingDocuments\(false\)/);
});
test('directory read failures do not reset selected employee', () => {
 const page = read('src/pages/modules/rh/EmployeeFiles.tsx');
 assert.match(page, /!isLoadingEmployees &&\s*!isEmployeesError &&\s*!selectedEmployee/);
});
