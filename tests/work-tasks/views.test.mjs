import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../../src/lib/workTasks.ts',import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
const matches=exports.matchesTaskView;
const tasks=[{id:1,task_poles:[],assignee_id:null},{id:2,task_poles:['ops'],assignee_id:'me'},{id:3,task_poles:['ops','finance'],assignee_id:'other'},{id:4,task_poles:['finance'],assignee_id:'me'}];
const select=(view,pole='all')=>tasks.filter(t=>matches(t,view,'me',['ops'],pole)).map(t=>t.id);
test('general, personal, pole and multi-pole views are distinct',()=>{
 assert.deepEqual(select('general'),[1]);assert.deepEqual(select('mine'),[2,4]);assert.deepEqual(select('pole'),[2,3]);assert.deepEqual(select('multi'),[3]);assert.deepEqual(select('all'),[1,2,3,4]);
});
test('a pole filter intersects the selected view',()=>{
 assert.deepEqual(select('mine','ops'),[2]);assert.deepEqual(select('multi','finance'),[3]);assert.deepEqual(select('general','ops'),[]);
 assert.equal(matches(tasks[0],'mine',undefined,[]),false);assert.deepEqual(select('unknown'),[]);
});
