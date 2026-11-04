CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE test_grants(actor uuid,page text,action text);
 CREATE FUNCTION public.can_intranet_action(p text,a text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM test_grants WHERE actor=auth.uid() AND page=p AND action=a)$$;
 CREATE FUNCTION public.intranet_is_test_mode() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT coalesce(current_setting('test.sandbox',true),'false')='true'$$;
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
