CREATE TABLE IF NOT EXISTS public.direction_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  impact text,
  recommendation text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'refused', 'deferred')),
  decision_notes text,
  defer_until date,
  submitted_by uuid NOT NULL DEFAULT auth.uid(),
  submitted_by_name text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direction_decision_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL
    REFERENCES public.direction_decisions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  notes text,
  actor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS direction_decisions_status_created_idx
  ON public.direction_decisions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS direction_decision_history_decision_created_idx
  ON public.direction_decision_history(decision_id, created_at DESC);

ALTER TABLE public.direction_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direction_decision_history ENABLE ROW LEVEL SECURITY;

-- Un collaborateur peut consulter ses propres demandes.
-- La Direction peut consulter toutes les demandes.
CREATE POLICY "direction_decisions_read"
ON public.direction_decisions
FOR SELECT TO authenticated
USING (
  submitted_by = auth.uid()
  OR public.is_leadership(auth.uid())
);

CREATE POLICY "direction_decisions_create"
ON public.direction_decisions
FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  OR public.is_leadership(auth.uid())
);

-- Les arbitrages sont réservés aux membres de la Direction habilités.
CREATE POLICY "direction_decisions_update"
ON public.direction_decisions
FOR UPDATE TO authenticated
USING (public.is_leadership(auth.uid()))
WITH CHECK (public.is_leadership(auth.uid()));

CREATE POLICY "direction_decision_history_read"
ON public.direction_decision_history
FOR SELECT TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.direction_decisions d
    WHERE d.id = decision_id
      AND d.submitted_by = auth.uid()
  )
);

-- L'historique est alimenté par les triggers ci-dessous.
-- Aucune insertion directe de l'historique n'est accordée au client.

CREATE OR REPLACE FUNCTION public.log_direction_decision_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.direction_decision_history (
    decision_id, event_type, new_status, notes, actor_id
  )
  VALUES (
    NEW.id, 'created', NEW.status, NEW.decision_notes, auth.uid()
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_direction_decision_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('approved', 'refused') THEN
      NEW.decided_by := auth.uid();
      NEW.decided_at := now();
    ELSE
      NEW.decided_by := NULL;
      NEW.decided_at := NULL;
    END IF;

    INSERT INTO public.direction_decision_history (
      decision_id, event_type, old_status, new_status, notes, actor_id
    )
    VALUES (
      NEW.id,
      'status_changed',
      OLD.status,
      NEW.status,
      NEW.decision_notes,
      auth.uid()
    );
  ELSIF NEW.decision_notes IS DISTINCT FROM OLD.decision_notes
     OR NEW.defer_until IS DISTINCT FROM OLD.defer_until THEN
    INSERT INTO public.direction_decision_history (
      decision_id, event_type, old_status, new_status, notes, actor_id
    )
    VALUES (
      NEW.id,
      'details_updated',
      OLD.status,
      NEW.status,
      NEW.decision_notes,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS direction_decision_created_log
  ON public.direction_decisions;

CREATE TRIGGER direction_decision_created_log
AFTER INSERT ON public.direction_decisions
FOR EACH ROW
EXECUTE FUNCTION public.log_direction_decision_created();

DROP TRIGGER IF EXISTS direction_decision_updated_log
  ON public.direction_decisions;

CREATE TRIGGER direction_decision_updated_log
BEFORE UPDATE ON public.direction_decisions
FOR EACH ROW
EXECUTE FUNCTION public.log_direction_decision_updated();
