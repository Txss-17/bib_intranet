ALTER TABLE public.work_escalations ADD COLUMN IF NOT EXISTS resolution_note text;

CREATE TABLE public.direction_roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'milestone' CHECK (kind IN ('milestone','priority')),
  phase text, title text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  weight int NOT NULL DEFAULT 0,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direction_roadmap_items TO authenticated;
GRANT ALL ON public.direction_roadmap_items TO service_role;
ALTER TABLE public.direction_roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY roadmap_select ON public.direction_roadmap_items FOR SELECT TO authenticated USING (true);
CREATE POLICY roadmap_write ON public.direction_roadmap_items FOR ALL TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));

CREATE TABLE public.direction_roadmap_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid, action text NOT NULL, item_title text,
  old_value jsonb, new_value jsonb, performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.direction_roadmap_history TO authenticated;
GRANT ALL ON public.direction_roadmap_history TO service_role;
ALTER TABLE public.direction_roadmap_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY roadmap_hist_select ON public.direction_roadmap_history FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_roadmap_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO direction_roadmap_history(item_id, action, item_title, old_value, performed_by) VALUES (OLD.id,'delete',OLD.title,to_jsonb(OLD),auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now(); NEW.updated_by := auth.uid();
    INSERT INTO direction_roadmap_history(item_id, action, item_title, old_value, new_value, performed_by) VALUES (NEW.id,'update',NEW.title,to_jsonb(OLD),to_jsonb(NEW),auth.uid());
    RETURN NEW;
  ELSE
    NEW.created_by := coalesce(NEW.created_by, auth.uid());
    INSERT INTO direction_roadmap_history(item_id, action, item_title, new_value, performed_by) VALUES (NEW.id,'create',NEW.title,to_jsonb(NEW),auth.uid());
    RETURN NEW;
  END IF;
END $$;
CREATE TRIGGER trg_roadmap_log_ins BEFORE INSERT OR UPDATE ON public.direction_roadmap_items FOR EACH ROW EXECUTE FUNCTION public.log_roadmap_change();
CREATE TRIGGER trg_roadmap_log_del AFTER DELETE ON public.direction_roadmap_items FOR EACH ROW EXECUTE FUNCTION public.log_roadmap_change();

CREATE TABLE public.governance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, version text, file_path text NOT NULL, file_type text, file_size bigint,
  uploaded_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.governance_documents TO authenticated;
GRANT ALL ON public.governance_documents TO service_role;
ALTER TABLE public.governance_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY gov_docs_select ON public.governance_documents FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));
CREATE POLICY gov_docs_insert ON public.governance_documents FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY gov_docs_delete ON public.governance_documents FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

CREATE POLICY gov_files_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'governance-documents' AND public.is_leadership(auth.uid()));
CREATE POLICY gov_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'governance-documents' AND public.is_leadership(auth.uid()));
CREATE POLICY gov_files_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'governance-documents' AND public.is_leadership(auth.uid()));