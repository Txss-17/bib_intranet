-- Additive policy design storage. NOT an RLS grant. Drafts are explicitly
-- non-effective until each resource endpoint/RLS enforces intersection rules.
CREATE TABLE IF NOT EXISTS public.access_role_scope_policy_drafts (
  role_id uuid PRIMARY KEY REFERENCES public.access_roles(id) ON DELETE CASCADE,
  policy jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status = 'draft'),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hierarchical_scope_draft_shape CHECK (
    jsonb_typeof(policy)='object'
    AND jsonb_typeof(policy->'subsidiaries')='array'
    AND jsonb_typeof(policy->'poles')='array'
    AND jsonb_typeof(policy->'regions')='array'
    AND jsonb_typeof(policy->'portfolios')='array'
    AND jsonb_typeof(policy->'ownRecords')='boolean'
  )
);
ALTER TABLE public.access_role_scope_policy_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_role_scope_policy_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.access_role_scope_policy_drafts TO authenticated;
CREATE POLICY hierarchical_policy_drafts_admin_read ON public.access_role_scope_policy_drafts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.save_hierarchical_scope_policy_draft(
  p_role_id uuid,
  p_policy jsonb,
  p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_prior jsonb;
  v_subs text;
  v_pole text;
  v_dimension text;
  v_values jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.has_role(v_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator permission required' USING ERRCODE='42501';
  END IF;
  IF length(btrim(coalesce(p_reason,''))) < 8
     OR p_policy IS NULL OR jsonb_typeof(p_policy) <> 'object'
     OR NOT EXISTS (SELECT 1 FROM public.access_roles WHERE id=p_role_id AND status='active') THEN
    RAISE EXCEPTION 'Invalid policy request or inactive role' USING ERRCODE='22023';
  END IF;
  IF jsonb_typeof(p_policy->'ownRecords') IS DISTINCT FROM 'boolean'
     OR jsonb_typeof(p_policy->'subsidiaries') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_policy->'poles') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_policy->'regions') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_policy->'portfolios') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_policy->'subsidiaries') NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Invalid hierarchical policy structure' USING ERRCODE='22023';
  END IF;
  FOREACH v_dimension IN ARRAY ARRAY['subsidiaries','poles','regions','portfolios'] LOOP
    v_values := p_policy->v_dimension;
    IF jsonb_array_length(v_values) > 100 OR EXISTS(
      SELECT 1 FROM jsonb_array_elements(v_values) x(v)
      WHERE jsonb_typeof(x.v)<>'string' OR length(btrim(x.v#>>'{}'))=0
    ) THEN
      RAISE EXCEPTION 'Invalid or excessive scope values for %',v_dimension USING ERRCODE='22023';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements_text(v_values)) <>
       (SELECT count(DISTINCT x) FROM jsonb_array_elements_text(v_values) AS x) THEN
       RAISE EXCEPTION 'Duplicate values in %',v_dimension USING ERRCODE='22023';
    END IF;
  END LOOP;

  FOR v_subs IN SELECT jsonb_array_elements_text(p_policy->'subsidiaries') LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.subsidiary=v_subs AND p.test_account IS FALSE) THEN
      RAISE EXCEPTION 'Unknown verified BIB subsidiary: %',v_subs USING ERRCODE='22023';
    END IF;
    FOR v_pole IN SELECT jsonb_array_elements_text(p_policy->'poles') LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.subsidiary=v_subs
        AND p.test_account IS FALSE AND v_pole=ANY(p.poles::text[])
      ) THEN
        RAISE EXCEPTION 'Pole % is not verified for subsidiary %',v_pole,v_subs USING ERRCODE='22023';
      END IF;
    END LOOP;
  END LOOP;

  SELECT policy INTO v_prior FROM public.access_role_scope_policy_drafts
    WHERE role_id=p_role_id FOR UPDATE;
  INSERT INTO public.access_role_scope_policy_drafts(role_id,policy,updated_by,updated_at)
  VALUES (p_role_id,p_policy,v_actor,now())
  ON CONFLICT(role_id) DO UPDATE
    SET policy=excluded.policy,updated_by=v_actor,updated_at=now(),status='draft';

  INSERT INTO public.access_change_history(actor_id,role_id,change_type,previous_value,new_value,reason)
  VALUES(v_actor,p_role_id,'hierarchical_scope_draft',v_prior,p_policy,btrim(p_reason));
END;
$function$;
REVOKE ALL ON FUNCTION public.save_hierarchical_scope_policy_draft(uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_hierarchical_scope_policy_draft(uuid,jsonb,text) TO authenticated;
