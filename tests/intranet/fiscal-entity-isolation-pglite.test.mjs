import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const CEO='10000000-0000-4000-8000-000000000001';
const FIN='10000000-0000-4000-8000-000000000002';
const OTHER='10000000-0000-4000-8000-000000000003';
const ENTITY='20000000-0000-4000-8000-000000000001';
const db=new PGlite();

const as=async(actor,fn)=>{
 await db.exec('SET ROLE authenticated');
 await db.query('SELECT set_config($1,$2,false),set_config($3,$4,false)',
  ['app.actor',actor,'app.test','false']);
 try{return await fn();}finally{await db.exec('RESET ROLE');}
};

test('PGlite: future mapping starts deny-by-default, and only entity grant unlocks access',async()=>{
 try{
  await db.exec(`
   CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
   CREATE SCHEMA auth;
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
    AS $ SELECT nullif(current_setting('app.actor',true),'')::uuid $;
   CREATE TABLE public.profiles(id uuid PRIMARY KEY);
   INSERT INTO public.profiles VALUES('${CEO}'),('${FIN}'),('${OTHER}');
   CREATE TABLE public.bib_fiscal_legal_entities(id uuid PRIMARY KEY,status text NOT NULL);
   INSERT INTO public.bib_fiscal_legal_entities VALUES('${ENTITY}','project');
   CREATE TABLE public.bib_fiscal_reference_catalog(record_id text PRIMARY KEY,body jsonb);
   CREATE TABLE public.bib_fiscal_records(record_id text,test_account boolean,body jsonb);
   CREATE TABLE public.bib_fiscal_events(id uuid PRIMARY KEY,record_id text,test_account boolean);
   INSERT INTO public.bib_fiscal_reference_catalog VALUES
    ('FL-01','{"id":"FL-01","entity":"BIB — intermédiation","revision":0}');
   CREATE FUNCTION public.intranet_is_test_mode() RETURNS boolean LANGUAGE sql STABLE
    AS $ SELECT coalesce(nullif(current_setting('app.test',true),''),'false')::boolean $;
   CREATE FUNCTION public.can_intranet_action(p text,a text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER AS $ SELECT auth.uid() IS NOT NULL AND p='finance.fiscal' $;
   CREATE FUNCTION public.bib_fiscal_is_canonical_ceo() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER AS $ SELECT auth.uid()='${CEO}'::uuid $;
   CREATE FUNCTION public.list_bib_fiscal_records() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER AS $$
      SELECT jsonb_build_object('records',jsonb_agg(body),'canWrite',true) FROM public.bib_fiscal_reference_catalog
    $$;
   CREATE FUNCTION public.save_bib_fiscal_record(p jsonb,rev bigint) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER AS $ SELECT p $;
   CREATE FUNCTION public.list_bib_fiscal_events(p text) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER AS $ SELECT '[]'::jsonb $;
   ALTER TABLE public.bib_fiscal_reference_catalog ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.bib_fiscal_records ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.bib_fiscal_events ENABLE ROW LEVEL SECURITY;
   CREATE POLICY bib_fiscal_catalog_read ON public.bib_fiscal_reference_catalog FOR SELECT TO authenticated USING(true);
   CREATE POLICY bib_fiscal_records_read ON public.bib_fiscal_records FOR SELECT TO authenticated USING(true);
   CREATE POLICY bib_fiscal_events_read ON public.bib_fiscal_events FOR SELECT TO authenticated USING(true);
   GRANT USAGE ON SCHEMA public,auth TO authenticated;
   GRANT SELECT ON public.bib_fiscal_reference_catalog,public.bib_fiscal_records,public.bib_fiscal_events TO authenticated;
   GRANT EXECUTE ON FUNCTION public.list_bib_fiscal_records(),public.save_bib_fiscal_record(jsonb,bigint),public.list_bib_fiscal_events(text) TO authenticated;
  `);
  const sql=await readFile(new URL('../../drizzle/migrations/0099_fiscal_entity_isolation.sql',import.meta.url),'utf8');
  await db.exec(sql);
  const read=()=>db.query("SELECT public.list_bib_fiscal_records() AS v");
  const notAuthorized=e=>e.code==='42501';

  let response=await as(FIN,read);
  assert.equal(response.rows[0].v.records.length,0,'unmapped legacy references must not leak');
  assert.equal((await as(FIN,()=>db.query('SELECT count(*)::int n FROM public.bib_fiscal_reference_catalog'))).rows[0].n,0);
  response=await as(CEO,read);
  assert.equal(response.rows[0].v.records.length,1,'CEO retains historical oversight');
  await assert.rejects(()=>as(FIN,()=>db.query("SELECT public.list_bib_fiscal_events('FL-01')")),notAuthorized);
  await assert.rejects(()=>as(FIN,()=>db.query("SELECT public.save_bib_fiscal_record('{\"id\":\"FL-01\"}'::jsonb,0)")),notAuthorized);
  await as(CEO,()=>db.query("SELECT public.bib_assign_fiscal_record_entity('FL-01',$1,false)",[ENTITY]));
  response=await as(FIN,read);
  assert.equal(response.rows[0].v.records.length,0,'project mapping alone grants no access');
  await assert.rejects(()=>as(FIN,()=>db.query("SELECT public.bib_assign_fiscal_record_entity('FL-01',$1,false)",[ENTITY])),notAuthorized);
  await db.query("UPDATE public.bib_fiscal_legal_entities SET status='active' WHERE id=$1",[ENTITY]);
  await db.query("INSERT INTO public.bib_fiscal_entity_grants(user_id,entity_id,can_read,can_update,granted_by) VALUES($1,$2,true,false,$3)",[FIN,ENTITY,CEO]);
  response=await as(FIN,read);
  assert.equal(response.rows[0].v.records.length,1,'active explicitly granted scope is readable');
  assert.equal(response.rows[0].v.canWrite,false,'read access does not give write access');
  assert.equal((await as(OTHER,read)).rows[0].v.records.length,0,'no cross-entity or cross-user access');
  await assert.rejects(()=>as(FIN,()=>db.query("SELECT public.save_bib_fiscal_record('{\"id\":\"FL-01\"}'::jsonb,0)")),notAuthorized);
  await db.query('DELETE FROM public.bib_fiscal_entity_grants WHERE user_id=$1',[FIN]);
  assert.equal((await as(FIN,read)).rows[0].v.records.length,0,'revocation is immediate');
 }finally{await db.close();}
});
