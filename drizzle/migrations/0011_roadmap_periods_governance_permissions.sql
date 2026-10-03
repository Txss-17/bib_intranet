ALTER TABLE public.direction_roadmap_items ADD COLUMN IF NOT EXISTS start_date date, ADD COLUMN IF NOT EXISTS end_date date;

CREATE TABLE public.governance_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('entity','board_member')),
  name text NOT NULL,
  subtitle text,
  description text,
  detail text,
  status text NOT NULL DEFAULT 'active',
  sort_order int NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_blocks TO authenticated;
GRANT ALL ON public.governance_blocks TO service_role;
ALTER TABLE public.governance_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY gov_blocks_select ON public.governance_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY gov_blocks_write ON public.governance_blocks FOR ALL TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));

CREATE TABLE public.permission_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.permission_settings TO authenticated;
GRANT ALL ON public.permission_settings TO service_role;
ALTER TABLE public.permission_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY perm_settings_select ON public.permission_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY perm_settings_insert ON public.permission_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY perm_settings_update ON public.permission_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.permission_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  old_value jsonb, new_value jsonb,
  performed_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.permission_change_log TO authenticated;
GRANT ALL ON public.permission_change_log TO service_role;
ALTER TABLE public.permission_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY perm_log_select ON public.permission_change_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.is_leadership(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_permission_setting() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now(); NEW.updated_by := auth.uid();
  INSERT INTO permission_change_log(setting_key, old_value, new_value, performed_by)
  VALUES (NEW.key, CASE WHEN TG_OP='UPDATE' THEN OLD.value END, NEW.value, auth.uid());
  RETURN NEW;
END $$;
CREATE TRIGGER trg_permission_settings_log BEFORE INSERT OR UPDATE ON public.permission_settings FOR EACH ROW EXECUTE FUNCTION public.log_permission_setting();

CREATE OR REPLACE FUNCTION public.touch_governance_block() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); NEW.updated_by := auth.uid(); RETURN NEW; END $$;
CREATE TRIGGER trg_gov_blocks_touch BEFORE UPDATE ON public.governance_blocks FOR EACH ROW EXECUTE FUNCTION public.touch_governance_block();

ALTER PUBLICATION supabase_realtime ADD TABLE public.permission_settings;