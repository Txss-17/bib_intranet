import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const sync=read('src/lib/intranetSync.ts');
const rpc=read('src/lib/intranet.ts');
const app=read('src/App.tsx');
const hub=read('src/components/finance/fiscal/FiscalHub.tsx');
const coordinator=read('src/components/IntranetSyncCoordinator.tsx');

test('intranet queries automatically refresh while active, on focus and reconnect',()=>{
 assert.match(app,/refetchInterval: 30_000/);
 assert.match(app,/refetchIntervalInBackground: false/);
 assert.match(app,/refetchOnWindowFocus: true/);
 assert.match(app,/refetchOnReconnect: true/);
 assert.match(app,/new MutationCache\(\{/);
 assert.match(app,/<IntranetSyncCoordinator \/>/);
});
test('successful writes refresh connected screens and no failed writes broadcast',()=>{
 assert.match(rpc,/if\(isIntranetWriteRpc\(name\)\)publishIntranetChange\(\)/);
 assert.ok(rpc.indexOf('if (error)')<rpc.indexOf('publishIntranetChange()'));
 assert.match(sync,/INTRANET_CHANGE_CHANNEL/);
 assert.match(sync,/channel\.postMessage\(\{ type: 'invalidate', version: 1 \}\)/);
 assert.doesNotMatch(sync,/JSON\.stringify\(record\)|localStorage\.setItem/);
 assert.match(coordinator,/qc\.invalidateQueries\(\{type:'active'\}\)/);
 assert.match(coordinator,/channel\.addEventListener\('message',onMessage\)/);
});
test('fiscal forms refresh independently while drafts remain protected from automatic overwrite',()=>{
 assert.match(hub,/window\.addEventListener\(INTRANET_CHANGE_EVENT,onChange\)/);
 assert.match(hub,/window\.setInterval\(\(\)=>\{/);
 assert.match(hub,/document\.visibilityState==='visible'/);
 assert.match(hub,/window\.clearInterval\(timer\)/);
 assert.match(hub,/setRecords\(\[\]\);setSelected\(null\)/);
});
