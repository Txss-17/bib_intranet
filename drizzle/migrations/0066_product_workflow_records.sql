-- Product-only operational backend. Does not expose a generic company-wide
-- records RPC: other poles require their own security and document review.
CREATE TABLE IF NOT EXISTS public.product_work_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 page_id text NOT NULL CHECK(page_id IN (
  'product.product','product.roadmap','product.backlog','product.engineering',
  'product.studio','product.integrations','product.documentation','product.innovation')),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 255),
 payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload)='object'),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','reviewed','approved','rejected','archived')),
 priority text NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
 owner_id uuid REFERENCES auth.users(id),
 due_date date,
 visibility text NOT NULL DEFAULT 'pole' CHECK(visibility IN ('pole','restricted')),
 document_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
 created_by uuid NOT NULL REFERENCES auth.users(id),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 first_reviewer uuid REFERENCES auth.users(id),
 approved_by uuid REFERENCES auth.users(id),
 client_key text NOT NULL CHECK(length(client_key) BETWEEN 6 AND 100),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(created_by,client_key)
);
CREATE INDEX IF NOT EXISTS product_work_records_page_recent ON public.product_work_records(page_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS public.product_work_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 record_id uuid NOT NULL REFERENCES public.product_work_records(id) ON DELETE RESTRICT,
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 kind text NOT NULL,
 note text,
 before_state jsonb,
 after_state jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_work_events_record_recent ON public.product_work_events(record_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.product_work_member() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id=auth.uid()
  AND p.test_account IS FALSE AND p.app_origin='connect' AND p.hr_status='active'
 ) AND (public.has_pole(auth.uid(),'product')
   OR public.has_role(auth.uid(),'admin'::public.app_role)
   OR public.is_leadership(auth.uid()));
$fn$;
CREATE OR REPLACE FUNCTION public.product_record_visible(
 p_author uuid,p_owner uuid,p_visibility text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
 SELECT public.product_work_member() AND
  (p_visibility='pole' OR p_author=auth.uid() OR p_owner=auth.uid()
    OR public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.is_leadership(auth.uid()));
$fn$;
REVOKE ALL ON FUNCTION public.product_work_member() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_record_visible(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.product_work_member() TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_record_visible(uuid,uuid,text) TO authenticated;

ALTER TABLE public.product_work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_work_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_work_records,public.product_work_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.product_work_records,public.product_work_events TO authenticated;
DROP POLICY IF EXISTS product_work_read ON public.product_work_records;
CREATE POLICY product_work_read ON public.product_work_records
 FOR SELECT TO authenticated
 USING(public.product_record_visible(created_by,owner_id,visibility));
DROP POLICY IF EXISTS product_work_events_read ON public.product_work_events;
CREATE POLICY product_work_events_read ON public.product_work_events
 FOR SELECT TO authenticated USING(EXISTS(
 SELECT 1 FROM public.product_work_records r WHERE r.id=record_id
 ));

CREATE OR REPLACE FUNCTION public.product_list_records(
 p_page text,p_search text DEFAULT '',p_status text DEFAULT 'open',p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_count bigint; v_rows jsonb; v_stats jsonb;
BEGIN
 IF NOT public.product_work_member() THEN RAISE EXCEPTION 'Product role required' USING ERRCODE='42501'; END IF;
 IF p_page NOT IN (
 'product.product','product.roadmap','product.backlog','product.engineering',
 'product.studio','product.integrations','product.documentation','product.innovation')
 OR p_offset IS NULL OR p_offset<0 OR p_offset>100000
 OR length(coalesce(p_search,''))>200
 OR p_status NOT IN ('open','all','draft','submitted','reviewed','approved','rejected','archived')
 THEN RAISE EXCEPTION 'Invalid record query' USING ERRCODE='22023'; END IF;
 SELECT jsonb_build_object('total',count(*),
  'draft',count(*) FILTER(WHERE status='draft'),
  'submitted',count(*) FILTER(WHERE status='submitted'),
  'approved',count(*) FILTER(WHERE status='approved'))
 INTO v_stats FROM public.product_work_records r
 WHERE r.page_id=p_page AND public.product_record_visible(r.created_by,r.owner_id,r.visibility);
 SELECT count(*) INTO v_count FROM public.product_work_records r
 WHERE r.page_id=p_page AND public.product_record_visible(r.created_by,r.owner_id,r.visibility)
 AND (coalesce(p_search,'')='' OR r.title ILIKE '%'||replace(replace(p_search,'%','\%'),'_','\_')||'%' ESCAPE '\')
 AND (p_status='all' OR (p_status='open' AND r.status IN ('draft','submitted','reviewed'))
   OR r.status=p_status);
 SELECT coalesce(jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.updated_at DESC),'[]'::jsonb)
 INTO v_rows FROM (
   SELECT r.* FROM public.product_work_records r
   WHERE r.page_id=p_page AND public.product_record_visible(r.created_by,r.owner_id,r.visibility)
     AND (coalesce(p_search,'')='' OR r.title ILIKE '%'||replace(replace(p_search,'%','\%'),'_','\_')||'%' ESCAPE '\')
     AND (p_status='all' OR (p_status='open' AND r.status IN ('draft','submitted','reviewed')) OR r.status=p_status)
   ORDER BY r.updated_at DESC,r.id DESC OFFSET p_offset LIMIT 50
 ) page_rows;
 RETURN jsonb_build_object('rows',v_rows,'stats',v_stats,'has_more',v_count>p_offset+50);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_get_record(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_record public.product_work_records%ROWTYPE;
BEGIN
 IF NOT public.product_work_member() THEN RAISE EXCEPTION 'Product role required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_record FROM public.product_work_records WHERE id=p_id;
 IF NOT FOUND OR NOT public.product_record_visible(v_record.created_by,v_record.owner_id,v_record.visibility)
 THEN RAISE EXCEPTION 'Record unavailable' USING ERRCODE='42501'; END IF;
 RETURN to_jsonb(v_record);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_record_events(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
 PERFORM public.product_get_record(p_id);
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC),'[]'::jsonb)
  FROM (SELECT * FROM public.product_work_events WHERE record_id=p_id
    ORDER BY created_at DESC LIMIT 200) e);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_people() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
 IF NOT public.product_work_member() THEN RAISE EXCEPTION 'Product role required' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,
  'name',coalesce(nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'Collaborateur'))
   ORDER BY p.last_name,p.first_name),'[]'::jsonb)
 FROM public.profiles p
 WHERE p.test_account IS FALSE AND p.hr_status='active' AND p.app_origin='connect'
  AND 'product'=ANY(p.poles));
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_save_record(
 p_id uuid,p_page text,p_expected_revision integer,p_key text,p_title text,
 p_payload jsonb,p_owner uuid,p_due date,p_priority text,p_visibility text,p_documents text[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_actor uuid:=auth.uid(); v_old public.product_work_records%ROWTYPE;
v_next public.product_work_records%ROWTYPE;
BEGIN
 IF NOT public.product_work_member() OR NOT (
 public.has_pole(v_actor,'product') OR public.has_role(v_actor,'admin'::public.app_role))
 THEN RAISE EXCEPTION 'Product writer role required' USING ERRCODE='42501'; END IF;
 IF p_page NOT IN (
 'product.product','product.roadmap','product.backlog','product.engineering',
 'product.studio','product.integrations','product.documentation','product.innovation')
 OR p_title IS NULL OR length(trim(p_title)) NOT BETWEEN 1 AND 255
 OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object'
 OR nullif(trim(coalesce(p_payload->>'area','')),'') IS NULL
 OR nullif(trim(coalesce(p_payload->>'problem','')),'') IS NULL
 OR nullif(trim(coalesce(p_payload->>'acceptance','')),'') IS NULL
 OR p_priority NOT IN('low','medium','high','critical')
 OR p_visibility NOT IN('pole','restricted')
 OR p_key IS NULL OR length(trim(p_key)) NOT BETWEEN 6 AND 100
 OR coalesce(cardinality(p_documents),0)>50
 THEN RAISE EXCEPTION 'Invalid product record' USING ERRCODE='22023'; END IF;
 IF p_owner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles p
 WHERE p.id=p_owner AND p.test_account IS FALSE AND p.hr_status='active'
 AND 'product'=ANY(p.poles)) THEN
 RAISE EXCEPTION 'Owner must be an active Product employee' USING ERRCODE='22023'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.product_work_records(page_id,title,payload,priority,owner_id,due_date,
    visibility,document_ids,created_by,client_key)
  VALUES(p_page,btrim(p_title),p_payload,p_priority,p_owner,p_due,p_visibility,
    coalesce(p_documents,ARRAY[]::text[]),v_actor,p_key)
  ON CONFLICT(created_by,client_key) DO NOTHING RETURNING * INTO v_next;
  IF NOT FOUND THEN
   SELECT * INTO v_next FROM public.product_work_records WHERE created_by=v_actor AND client_key=p_key;
   IF v_next.page_id<>p_page THEN RAISE EXCEPTION 'Invalid request key reuse' USING ERRCODE='22023'; END IF;
   RETURN to_jsonb(v_next);
  END IF;
  INSERT INTO public.product_work_events(record_id,actor_id,kind,after_state)
  VALUES(v_next.id,v_actor,'created',to_jsonb(v_next));
 ELSE
  SELECT * INTO v_old FROM public.product_work_records WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR NOT public.product_record_visible(v_old.created_by,v_old.owner_id,v_old.visibility)
  OR v_old.page_id<>p_page THEN RAISE EXCEPTION 'Record inaccessible' USING ERRCODE='42501'; END IF;
  IF v_old.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Revision changed' USING ERRCODE='40001'; END IF;
  IF v_old.status NOT IN ('draft','rejected') OR NOT (
   v_old.created_by=v_actor OR v_old.owner_id=v_actor
   OR public.has_role(v_actor,'admin'::public.app_role)
  ) THEN RAISE EXCEPTION 'Record locked' USING ERRCODE='55000'; END IF;
  UPDATE public.product_work_records SET title=btrim(p_title),payload=p_payload,
   owner_id=p_owner,due_date=p_due,priority=p_priority,visibility=p_visibility,
   document_ids=coalesce(p_documents,ARRAY[]::text[]),revision=revision+1,updated_at=now()
  WHERE id=p_id RETURNING * INTO v_next;
  INSERT INTO public.product_work_events(record_id,actor_id,kind,before_state,after_state)
  VALUES(p_id,v_actor,'updated',to_jsonb(v_old),to_jsonb(v_next));
 END IF;
 RETURN to_jsonb(v_next);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_transition_record(
 p_id uuid,p_expected_revision integer,p_status text,p_note text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_actor uuid:=auth.uid(); v_old public.product_work_records%ROWTYPE;
 v_next public.product_work_records%ROWTYPE; v_reviewer boolean;
BEGIN
 IF NOT public.product_work_member() THEN RAISE EXCEPTION 'Product role required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_old FROM public.product_work_records WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT public.product_record_visible(v_old.created_by,v_old.owner_id,v_old.visibility)
 THEN RAISE EXCEPTION 'Record unavailable' USING ERRCODE='42501'; END IF;
 IF v_old.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Revision changed' USING ERRCODE='40001'; END IF;
 v_reviewer:=(public.has_pole(v_actor,'product') OR public.has_role(v_actor,'admin'::public.app_role))
   AND v_old.created_by<>v_actor AND v_old.owner_id IS DISTINCT FROM v_actor;
 IF p_status='submitted' THEN
  IF v_old.status NOT IN ('draft','rejected') OR NOT (
    v_old.created_by=v_actor OR v_old.owner_id=v_actor)
  THEN RAISE EXCEPTION 'Submission not authorized' USING ERRCODE='42501'; END IF;
 ELSIF p_status IN ('reviewed','approved','rejected') THEN
  IF NOT v_reviewer OR v_old.status NOT IN ('submitted','reviewed')
  THEN RAISE EXCEPTION 'Independent reviewer required' USING ERRCODE='42501'; END IF;
  IF p_status='rejected' AND length(trim(coalesce(p_note,'')))<8 THEN
   RAISE EXCEPTION 'Review justification required' USING ERRCODE='22023'; END IF;
 ELSIF p_status='draft' THEN
  IF NOT v_reviewer OR v_old.status NOT IN('submitted','reviewed','approved')
    OR length(trim(coalesce(p_note,'')))<8 THEN
   RAISE EXCEPTION 'Reopening requires reason and reviewer' USING ERRCODE='42501'; END IF;
 ELSIF p_status='archived' THEN
  IF NOT (v_reviewer AND v_old.status IN('approved','rejected','draft'))
   OR length(trim(coalesce(p_note,'')))<8 THEN
   RAISE EXCEPTION 'Archive not authorized' USING ERRCODE='42501'; END IF;
 ELSE RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023';
 END IF;
 UPDATE public.product_work_records SET
  status=p_status,revision=revision+1,updated_at=now(),
  first_reviewer=CASE WHEN p_status='reviewed' THEN v_actor ELSE first_reviewer END,
  approved_by=CASE WHEN p_status='approved' THEN v_actor ELSE approved_by END
 WHERE id=p_id RETURNING * INTO v_next;
 INSERT INTO public.product_work_events(record_id,actor_id,kind,note,before_state,after_state)
 VALUES(p_id,v_actor,p_status,nullif(trim(coalesce(p_note,'')),''),to_jsonb(v_old),to_jsonb(v_next));
 RETURN to_jsonb(v_next);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_comment_record(p_id uuid,p_note text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_record public.product_work_records%ROWTYPE;
BEGIN
 IF NOT public.product_work_member() THEN RAISE EXCEPTION 'Product role required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_record FROM public.product_work_records WHERE id=p_id;
 IF NOT FOUND OR NOT public.product_record_visible(v_record.created_by,v_record.owner_id,v_record.visibility)
 OR v_record.status='archived'
 OR p_note IS NULL OR length(trim(p_note)) NOT BETWEEN 1 AND 5000
 THEN RAISE EXCEPTION 'Comment not permitted' USING ERRCODE='42501'; END IF;
 INSERT INTO public.product_work_events(record_id,actor_id,kind,note)
 VALUES(p_id,auth.uid(),'comment',trim(p_note));
 RETURN 'ok';
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_module_summary(p_scope text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
 IF NOT public.product_work_member() OR p_scope<>'product'
 THEN RAISE EXCEPTION 'Product scope required' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object(
 'page_id',page_id,'total',total,'pending',pending,'late',late)),'[]'::jsonb)
 FROM(
 SELECT r.page_id,count(*) AS total,
 count(*) FILTER (WHERE r.status IN ('submitted','reviewed')) AS pending,
 count(*) FILTER (WHERE r.due_date<current_date AND r.status NOT IN('approved','archived')) AS late
 FROM public.product_work_records r WHERE
 public.product_record_visible(r.created_by,r.owner_id,r.visibility) GROUP BY r.page_id
 ) counts);
END;
$fn$;

REVOKE ALL ON FUNCTION public.product_list_records(text,text,text,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_get_record(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_record_events(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_people() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_save_record(uuid,text,integer,text,text,jsonb,uuid,date,text,text,text[]) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_transition_record(uuid,integer,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_comment_record(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.product_module_summary(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.product_list_records(text,text,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_get_record(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_record_events(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_people() TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_save_record(uuid,text,integer,text,text,jsonb,uuid,date,text,text,text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_transition_record(uuid,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_comment_record(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_module_summary(text) TO authenticated;
