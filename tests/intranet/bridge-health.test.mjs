import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync(new URL('../../src/lib/bridgeHealth.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const output={};vm.runInNewContext(js,{exports:output,Date,Number,Error});
const {assessBridgeHealth}=output;
const now=Date.parse('2026-10-30T12:00:00Z');
const r=(status,at='2026-10-30T11:00:00Z',action='pull')=>({status,started_at:at,action});
test('no runs cannot imply a healthy bridge',()=>{
 assert.equal(assessBridgeHealth([],now).level,'unknown');
 assert.equal(assessBridgeHealth([r('success',undefined,'push_shop_status')],now).level,'unknown');
});
test('latest failed pull overrides an earlier success',()=>{
 const result=assessBridgeHealth([r('success','2026-10-28T12:00:00Z'),r('error')],now);
 assert.equal(result.level,'critical');
 assert.equal(result.lastPullAt,'2026-10-30T11:00:00Z');
});
test('partial and running pulls do not claim completed success',()=>{
 assert.equal(assessBridgeHealth([r('partial')],now).level,'critical');
 assert.equal(assessBridgeHealth([r('running')],now).level,'warning');
});
test('old success is an advisory warning, not fictitious uptime',()=>{
 assert.equal(assessBridgeHealth([r('success','2026-10-28T11:00:00Z')],now).level,'warning');
 assert.equal(assessBridgeHealth([r('success')],now).level,'ok');
});
test('invalid timestamps and future clocks never signal success',()=>{
 assert.equal(assessBridgeHealth([r('success','n/a')],now).level,'unknown');
 assert.equal(assessBridgeHealth([r('success','2026-10-31T11:00:00Z')],now).level,'warning');
});
