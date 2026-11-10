-- 0098 — CEO-only draft legal-entity registry for fiscal governance.
-- Project records are planning objects. This migration does NOT activate tax obligations,
-- create a legal person, broaden finance.fiscal privileges or backfill existing fiscal data.
CREATE TABLE public.bib_fiscal_legal_entities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 legal_name text NOT NULL CHECK (length(btrim(legal_name)) BETWEEN 3 AND 200),
 country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
 legal_form text NOT NULL CHECK (length(btrim(legal_form)) BETWEEN 2 AND 80),
 status text NOT NULL DEFAULT 'project' CHECK (status='project'),
 notes text NOT NULL DEFAULT '' CHECK (length(notes)<=2000),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 updated_by uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bib_fiscal_legal_entities_created_idx ON public.bib_fiscal_legal_entities(created_at DESC);
ALTER TABLE public.bib_fiscal_legal_entities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_fiscal_legal_entities FROM PUBLIC,anon,authenticated;
-- No direct writes or reads: all operations pass through explicitly gated RPCs.

CREATE OR REPLACE FUNCTION public.bib_fiscal_is_canonical_ceo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.profiles p
  WHERE p.id=auth.uid() AND p.app_origin='connect' AND p.hr_status='active'
    AND p.position='ceo' AND p.test_account IS FALSE
    AND public.is_intranet_staff(p.id)
    AND EXISTS(
      SELECT 1 FROM public.access_assignments aa
      JOIN public.access_roles ar ON ar.id=aa.role_id
      WHERE aa.employee_id=p.id AND aa.status='active'
        AND ar.role_key='ceo' AND ar.status='active'
        AND (aa.starts_at IS NULL OR aa.starts_at<=now())
        AND (aa.ends_at IS NULL OR aa.ends_at>=now())
    )
 );
$$;
REVOKE ALL ON FUNCTION public.bib_fiscal_is_canonical_ceo() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_fiscal_is_canonical_ceo() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_bib_fiscal_legal_entities()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() THEN
  RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'legal_name',e.legal_name,'country_code',e.country_code,
  'legal_form',e.legal_form,'status',e.status,'notes',e.notes,
  'created_at',e.created_at) ORDER BY e.created_at DESC),'[]'::jsonb)
 INTO result FROM public.bib_fiscal_legal_entities e;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.list_bib_fiscal_legal_entities() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_bib_fiscal_legal_entities() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_bib_fiscal_legal_entity(
 p_legal_name text,p_country_code text,p_legal_form text,p_notes text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); entity_id uuid;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() THEN
  RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501';
 END IF;
 IF length(btrim(coalesce(p_legal_name,''))) NOT BETWEEN 3 AND 200
   OR length(btrim(coalesce(p_legal_form,''))) NOT BETWEEN 2 AND 80
   OR coalesce(p_country_code,'') !~ '^[A-Z]{2}$'
   OR length(coalesce(p_notes,''))>2000 THEN
  RAISE EXCEPTION 'invalid_fiscal_entity_draft' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.bib_fiscal_legal_entities
 (legal_name,country_code,legal_form,notes,created_by,updated_by)
 VALUES(btrim(p_legal_name),p_country_code,btrim(p_legal_form),coalesce(p_notes,''),actor,actor)
 RETURNING id INTO entity_id;
 RETURN entity_id;
END $$;
REVOKE ALL ON FUNCTION public.create_bib_fiscal_legal_entity(text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_bib_fiscal_legal_entity(text,text,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
