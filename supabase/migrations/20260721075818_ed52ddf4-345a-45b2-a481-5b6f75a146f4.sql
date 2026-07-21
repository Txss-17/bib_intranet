-- Phase 4: business trips + corporate cards
CREATE TABLE public.business_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users,
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  estimated_budget NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'draft',
  transport_mode TEXT,
  accommodation TEXT,
  notes TEXT,
  mission_report TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_trips TO authenticated;
GRANT ALL ON public.business_trips TO service_role;
ALTER TABLE public.business_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own trips" ON public.business_trips FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR manager_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "Users create own trips" ON public.business_trips FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own or manager" ON public.business_trips FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR manager_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete trips" ON public.business_trips FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_business_trips_updated BEFORE UPDATE ON public.business_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.corporate_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  card_number_masked TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'physical',
  status TEXT NOT NULL DEFAULT 'active',
  monthly_limit NUMERIC(10,2) NOT NULL DEFAULT 0,
  allowed_categories TEXT[] NOT NULL DEFAULT '{}',
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_cards TO authenticated;
GRANT ALL ON public.corporate_cards TO service_role;
ALTER TABLE public.corporate_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own card" ON public.corporate_cards FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "Finance manages cards" ON public.corporate_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive'));
CREATE TRIGGER trg_corporate_cards_updated BEFORE UPDATE ON public.corporate_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.corporate_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.corporate_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT,
  merchant TEXT NOT NULL,
  description TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_card_transactions TO authenticated;
GRANT ALL ON public.corporate_card_transactions TO service_role;
ALTER TABLE public.corporate_card_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User sees own tx" ON public.corporate_card_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive'));
CREATE POLICY "User inserts own tx" ON public.corporate_card_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Finance updates tx" ON public.corporate_card_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive'));
CREATE TRIGGER trg_card_tx_updated BEFORE UPDATE ON public.corporate_card_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();