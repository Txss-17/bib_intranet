-- ============================================================================
-- BIB GATEWAY — INBOX VISIBILITY
-- ============================================================================
--
-- Incoming Gmail messages must be visible in the Gateway before attribution.
--
-- Workflow:
--
--   Gmail
--     ↓
--   external_messages
--     ↓
--   routed_to_pole = NULL
--     ↓
--   Gateway Inbox
--     ↓
--   Attribution / routing
--
-- This policy therefore gives Gateway staff access to incoming messages
-- that have not yet been assigned, while preserving pole-level scoping
-- for messages that have already been assigned.
-- ============================================================================

DROP POLICY IF EXISTS "Gateway staff can view external messages"
ON public.external_messages;

CREATE POLICY "Gateway staff can view external messages"
ON public.external_messages
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')

  -- Unassigned incoming messages must reach the Gateway inbox
  OR (
    routed_to_pole IS NULL
    AND status IN ('pending', 'validated')
  )

  -- Once assigned, the message remains visible to the assigned pole
  OR (
    routed_to_pole IS NOT NULL
    AND public.has_pole(auth.uid(), routed_to_pole::text)
  )
);
