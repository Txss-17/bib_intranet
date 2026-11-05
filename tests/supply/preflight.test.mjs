import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
for(const target of ["platform","intranet"]){
 test(`${target} release gate refuses a missing schema with its controlled readiness error`,async()=>{
  const db=new PGlite();
  try{
   const sql=(await readFile(new URL(`../../ops/release/${target}-preflight.sql`,import.meta.url),"utf8")).replace(/^\\.*$/gm,"");
   await assert.rejects(()=>db.exec(sql),error=>{
    delete error.query;
    assert.equal(error.code,"55000");assert.match(error.message,new RegExp(`BIB_${target.toUpperCase()}_STAGING_NOT_READY`));
    return true;
   });
  }finally{await db.close();}
 });
}
