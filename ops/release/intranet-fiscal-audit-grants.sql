-- Preproduction restore supplement for reviewed fiscal and Audit entry points.
-- Verify the independent staging target before applying. Canonical migrations
-- 0098-0103 enforce staff status, stored permissions and legal-entity isolation.
-- No anonymous access or privileges on the private fiscal implementation RPCs.
GRANT EXECUTE ON FUNCTION public.can_intranet_action(text, text),
  public.is_intranet_staff(uuid), public.bib_fiscal_is_canonical_ceo(),
  public.create_bib_fiscal_legal_entity(text, text, text, text),
  public.list_bib_fiscal_legal_entities()
TO authenticated;
