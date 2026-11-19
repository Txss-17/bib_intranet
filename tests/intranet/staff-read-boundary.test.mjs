import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const tables=['access_role_scopes','access_scopes','permission_settings','documents'];
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let db;
before(async()=>{
 db=new PGlite();
 await db.exec(`CREATE ROLE authenticated; CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT (coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'sub')::uuid; $$;
 CREATE TABLE public.profiles(id uuid PRIMARY KEY,app_origin text,hr_status text,poles text[]);
 CREATE TABLE public.user_roles(user_id uuid,role text);
 CREATE FUNCTION public.has_role(p_id uuid,p_role text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_id AND role=p_role); $$;
 CREATE TABLE public.access_roles(id uuid PRIMARY KEY,status text,role_key text,is_external boolean);
 CREATE TABLE public.access_assignments(employee_id uuid,role_id uuid,status text,starts_at timestamptz,ends_at timestamptz);
 INSERT INTO public.profiles VALUES('${id(1)}','connect','active','{direction}'),('${id(2)}','connect','active','{rh}'),
 ('${id(3)}','connect','inactive','{rh}'),('${id(4)}','connect','active','{}');
 INSERT INTO public.access_roles VALUES('${id(10)}','active','ext_auditor',true);
 INSERT INTO public.access_assignments VALUES('${id(4)}','${id(10)}','active',NULL,NULL);`);
 const staff=read('drizzle/migrations/0052_restore_existing_account_access.sql')
  .match(/CREATE OR REPLACE FUNCTION public\.is_intranet_staff\(_uid uuid\)[\s\S]*?\$\$;/)?.[0];
 assert.ok(staff,'Replay the canonical staff authorization function');
 await db.exec(staff);
 for(const table of tables){
  await db.exec(`CREATE TABLE public.${table}(id integer PRIMARY KEY,body text);
  INSERT INTO public.${table} VALUES(1,'internal'),(2,'private');
  ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
  GRANT SELECT ON public.${table} TO authenticated;
  CREATE POLICY existing_visibility ON public.${table} FOR SELECT TO authenticated USING(${table==='documents'?'id=1':'true'});`);
 }
 await db.exec(read('drizzle/migrations/0105_restrict_staff_catalog_reads.sql'));
});
after(async()=>{await db?.close();});
async function actor(n){
 await db.exec('RESET ROLE');
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[
  JSON.stringify({sub:id(n),role:'authenticated',user_metadata:{position:'ceo',role:'admin',hr_status:'active',poles:['direction']}}),
 ]);
 await db.exec('SET ROLE authenticated');
}
test('active CEO and RH keep their reads while prior document visibility is preserved',async()=>{
 for(const n of [1,2]){
  await actor(n);
  for(const table of tables)assert.equal((await db.query(`SELECT id FROM public.${table}`)).rows.length,table==='documents'?1:2);
 }
});
test('missing, inactive and external profiles cannot use forged metadata to read internal records',async()=>{
 for(const n of [99,3,4]){
  await actor(n);
  for(const table of tables)assert.equal((await db.query(`SELECT id FROM public.${table}`)).rows.length,0);
 }
});
test('HR status revocation takes effect with the same existing JWT claims',async()=>{
 await actor(2);
 assert.equal((await db.query('SELECT id FROM public.documents')).rows.length,1);
 await db.exec(`RESET ROLE; UPDATE public.profiles SET hr_status='inactive' WHERE id='${id(2)}';SET ROLE authenticated;`);
 for(const table of tables)assert.equal((await db.query(`SELECT id FROM public.${table}`)).rows.length,0);
});
