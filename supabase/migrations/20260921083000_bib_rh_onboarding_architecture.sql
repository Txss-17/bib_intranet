-- ============================================================
-- BIB — Migration préalable
-- Alignement des enums de l'architecture BIB
--
-- Cette migration ajoute uniquement les nouvelles valeurs d'enum.
-- Les données et politiques qui utilisent ces valeurs sont traitées
-- dans la migration suivante afin d'éviter l'utilisation d'une
-- nouvelle valeur d'enum dans la même transaction PostgreSQL.
-- ============================================================

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'marketplace';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'support';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'product';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'data';

ALTER TYPE public.pole_id
  ADD VALUE IF NOT EXISTS 'security';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'customer_success_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'rse_impact_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'product_engineering_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'marketing_communication_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'rh_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'data_bi_manager';

ALTER TYPE public.employee_position
  ADD VALUE IF NOT EXISTS 'security_it_manager';
