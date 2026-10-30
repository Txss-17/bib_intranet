-- There is no verified subsidiary-to-region or subsidiary-to-portfolio
-- relation yet. Fail closed: do not allow a stored policy draft to contain
-- unvalidated references that could later be interpreted as real grants.
ALTER TABLE public.access_role_scope_policy_drafts
  ADD CONSTRAINT hierarchical_policy_unmapped_dimensions_empty
  CHECK (
    jsonb_array_length(policy->'regions')=0
    AND jsonb_array_length(policy->'portfolios')=0
  );
