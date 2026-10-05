-- ============================================================================
-- BIB INTRANET — Gateway write permissions
-- ============================================================================
--
-- Purpose:
--   Allow authenticated BIB collaborators to operate the Gateway:
--   - route / attribute incoming messages
--   - mark messages as responded
--   - archive outbound messages
--   - create routing/audit entries
--
-- Gmail synchronization itself uses service_role and therefore does not
-- depend on these authenticated-user INSERT permissions.
-- ============================================================================


-- ============================================================================
-- 1. EXTERNAL MESSAGES — INSERT
-- ============================================================================
--
-- Gateway users may create an internal/outbound archive record.
--
-- Gmail inbound synchronization is performed with service_role and bypasses
-- this policy.
--

DROP POLICY IF EXISTS "Gateway staff can insert external messages"
ON public.external_messages;

CREATE POLICY "Gateway staff can insert external messages"
ON public.external_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'direction',
      'finance',
      'ops',
      'supplier',
      'marketplace',
      'support',
      'marketing',
      'rh',
      'audit',
      'compliance',
      'rse',
      'product',
      'data',
      'security'
    ]
  )
);


-- ============================================================================
-- 2. EXTERNAL MESSAGES — UPDATE
-- ============================================================================
--
-- Gateway collaborators can update:
--   - routing
--   - validation state
--   - response state
--   - response metadata
--
-- An unassigned message can be taken into treatment by any authorized
-- Gateway collaborator.
--
-- Once assigned to a pole, access is restricted to:
--   - leadership
--   - admin
--   - manager
--   - the assigned pole
--

DROP POLICY IF EXISTS "Gateway staff can update external messages"
ON public.external_messages;

CREATE POLICY "Gateway staff can update external messages"
ON public.external_messages
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    routed_to_pole IS NULL
    AND public.has_any_pole(
      auth.uid(),
      ARRAY[
        'direction',
        'finance',
        'ops',
        'supplier',
        'marketplace',
        'support',
        'marketing',
        'rh',
        'audit',
        'compliance',
        'rse',
        'product',
        'data',
        'security'
      ]
    )
  )
  OR (
    routed_to_pole IS NOT NULL
    AND public.has_pole(
      auth.uid(),
      routed_to_pole::text
    )
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    routed_to_pole IS NULL
    AND public.has_any_pole(
      auth.uid(),
      ARRAY[
        'direction',
        'finance',
        'ops',
        'supplier',
        'marketplace',
        'support',
        'marketing',
        'rh',
        'audit',
        'compliance',
        'rse',
        'product',
        'data',
        'security'
      ]
    )
  )
  OR (
    routed_to_pole IS NOT NULL
    AND public.has_pole(
      auth.uid(),
      routed_to_pole::text
    )
  )
);


-- ============================================================================
-- 3. MESSAGE ROUTING LOG — INSERT
-- ============================================================================
--
-- The existing project already has an authenticated INSERT policy.
-- We replace it with an explicit Gateway policy so the permission model is
-- tied to the message the collaborator is allowed to operate.
--

DROP POLICY IF EXISTS "Authenticated can create routing logs"
ON public.message_routing_log;

DROP POLICY IF EXISTS "System can create routing logs"
ON public.message_routing_log;

CREATE POLICY "Gateway staff can create routing logs"
ON public.message_routing_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1
    FROM public.external_messages m
    WHERE m.id = message_routing_log.message_id
      AND (
        (
          m.routed_to_pole IS NULL
          AND public.has_any_pole(
            auth.uid(),
            ARRAY[
              'direction',
              'finance',
              'ops',
              'supplier',
              'marketplace',
              'support',
              'marketing',
              'rh',
              'audit',
              'compliance',
              'rse',
              'product',
              'data',
              'security'
            ]
          )
        )
        OR (
          m.routed_to_pole IS NOT NULL
          AND public.has_pole(
            auth.uid(),
            m.routed_to_pole::text
          )
        )
      )
  )
);


-- ============================================================================
-- 4. EXPLICIT GRANTS
-- ============================================================================
--
-- RLS policies do not replace PostgreSQL table privileges.
--

GRANT SELECT, INSERT, UPDATE
ON public.external_messages
TO authenticated;

GRANT SELECT, INSERT
ON public.message_routing_log
TO authenticated;


-- ============================================================================
-- END
-- ============================================================================
