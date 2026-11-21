-- Follow-up migration for managed documents on staging and custom HTTPS domains.
CREATE OR REPLACE FUNCTION public.rh_extract_managed_drive_id(p_url text)
RETURNS uuid
LANGUAGE sql IMMUTABLE SET search_path=''
AS $parse$
 SELECT CASE
   WHEN p_url ~ '^(/documents[?]document=|https://[^/?#]+/documents[?]document=)[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(&.*)?$'
   THEN split_part(split_part(p_url,'document=',2),'&',1)::uuid
   ELSE NULL::uuid
 END;
$parse$;
