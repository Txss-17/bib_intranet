
-- Add app_origin column to audit tables for multi-app isolation (Connect + Audit Hub)
ALTER TABLE public.ops_audits ADD COLUMN IF NOT EXISTS app_origin text NOT NULL DEFAULT 'connect';
ALTER TABLE public.supplier_audits ADD COLUMN IF NOT EXISTS app_origin text NOT NULL DEFAULT 'connect';
ALTER TABLE public.field_audits ADD COLUMN IF NOT EXISTS app_origin text NOT NULL DEFAULT 'connect';

CREATE INDEX IF NOT EXISTS idx_ops_audits_app_origin ON public.ops_audits(app_origin);
CREATE INDEX IF NOT EXISTS idx_supplier_audits_app_origin ON public.supplier_audits(app_origin);
CREATE INDEX IF NOT EXISTS idx_field_audits_app_origin ON public.field_audits(app_origin);

-- Add CHECK to restrict allowed values
ALTER TABLE public.ops_audits DROP CONSTRAINT IF EXISTS ops_audits_app_origin_check;
ALTER TABLE public.ops_audits ADD CONSTRAINT ops_audits_app_origin_check CHECK (app_origin IN ('connect','bos','audit_hub'));
ALTER TABLE public.supplier_audits DROP CONSTRAINT IF EXISTS supplier_audits_app_origin_check;
ALTER TABLE public.supplier_audits ADD CONSTRAINT supplier_audits_app_origin_check CHECK (app_origin IN ('connect','bos','audit_hub'));
ALTER TABLE public.field_audits DROP CONSTRAINT IF EXISTS field_audits_app_origin_check;
ALTER TABLE public.field_audits ADD CONSTRAINT field_audits_app_origin_check CHECK (app_origin IN ('connect','bos','audit_hub'));
