\set ON_ERROR_STOP on
-- Independent transaction: authentic enum-backed profiles and profile/Auth foreign keys.
BEGIN;
\ir fixture.sql
\ir ../../drizzle/migrations/0036_hr_onboarding_invitation_claims.sql

-- GoTrue invokes the profile trigger during auth.users INSERT, before invited_at is set.
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE FUNCTION pg_temp.assert_true(condition boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM true THEN RAISE EXCEPTION 'assertion failed: %', message; END IF;
END;
$$;
CREATE FUNCTION pg_temp.expect_error(statement text, expected_state text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE actual_state text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual_state = RETURNED_SQLSTATE;
  END;
  IF actual_state IS DISTINCT FROM expected_state THEN
    RAISE EXCEPTION 'expected SQLSTATE %, got % for %', expected_state, coalesce(actual_state,'success'), statement;
  END IF;
END;
$$;
CREATE FUNCTION pg_temp.actor(actor_id text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub',actor_id,true);
  PERFORM set_config('request.jwt.claim.role',CASE WHEN actor_id='' THEN '' ELSE 'authenticated' END,true);
END;
$$;

INSERT INTO public.hr_employee_requests(
  id,first_name,last_name,work_email,position,position_key,poles,primary_pole,
  requested_role,seniority,status,created_by,hr_validated_by,hr_validated_at,manager_id
)
SELECT ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  'Nouveau','Collaborateur','claim'||n||'@bib.test','ops_logistics_manager','ops_logistics_manager',
  ARRAY['ops'],'ops','new_ops','mid','hr_validated',
  '20000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000001',clock_timestamp(),
  '20000000-0000-4000-8000-000000000001'
FROM generate_series(1,14) n;

UPDATE public.hr_employee_requests SET status='submitted' WHERE id='50000000-0000-4000-8000-000000000002';
UPDATE public.hr_employee_requests SET hr_validated_by=NULL WHERE id='50000000-0000-4000-8000-000000000003';
UPDATE public.hr_employee_requests SET created_user_id='20000000-0000-4000-8000-000000000005' WHERE id='50000000-0000-4000-8000-000000000004';
UPDATE public.hr_employee_requests SET request_kind='mutation',target_user_id='20000000-0000-4000-8000-000000000004' WHERE id='50000000-0000-4000-8000-000000000005';
UPDATE public.hr_employee_requests SET work_email='person3@bib.test' WHERE id='50000000-0000-4000-8000-000000000006';
UPDATE public.hr_employee_requests SET work_email='person10@bib.test' WHERE id='50000000-0000-4000-8000-000000000007';

-- Only the caller's real RH apply rights can issue an invitation proof.
SET LOCAL ROLE authenticated;
SELECT pg_temp.actor('');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001')$q$,'42501');
SELECT pg_temp.actor('20000000-0000-4000-8000-000000000003');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001')$q$,'42501');
SELECT pg_temp.actor('20000000-0000-4000-8000-000000000002');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001')$q$,'42501');
SELECT pg_temp.actor('20000000-0000-4000-8000-000000000009');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001')$q$,'42501');
SELECT pg_temp.actor('20000000-0000-4000-8000-000000000001');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation(NULL,'70000000-0000-4000-8000-000000000001')$q$,'22023');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-000000000001',NULL)$q$,'22023');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-999999999999','70000000-0000-4000-8000-000000000001')$q$,'40001');
SELECT pg_temp.expect_error(format('SELECT public.reserve_hr_onboarding_invitation(%L,%L)',
  '50000000-0000-4000-8000-'||lpad(n::text,12,'0'),'70000000-0000-4000-8000-'||lpad(n::text,12,'0')),'40001')
FROM generate_series(2,7) n;
SELECT pg_temp.assert_true(public.reserve_hr_onboarding_invitation(
  '50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001'),'authorized reservation');
SELECT pg_temp.assert_true(public.reserve_hr_onboarding_invitation(
  '50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001'),'identical unconsumed retry');
SELECT pg_temp.expect_error($q$SELECT public.reserve_hr_onboarding_invitation('50000000-0000-4000-8000-000000000008','70000000-0000-4000-8000-000000000001')$q$,'40001');

-- An ordinary authenticated caller cannot read, manufacture, alter, or delete a proof.
SELECT pg_temp.expect_error($q$SELECT nonce FROM public.hr_onboarding_invitation_claims$q$,'42501');
SELECT pg_temp.expect_error($q$INSERT INTO public.hr_onboarding_invitation_claims(nonce,request_id,email,issued_by,expires_at)
 VALUES('70000000-0000-4000-8000-000000000099','50000000-0000-4000-8000-000000000001','forged@bib.test','20000000-0000-4000-8000-000000000001',clock_timestamp()+interval '5 minutes')$q$,'42501');
SELECT pg_temp.expect_error($q$UPDATE public.hr_onboarding_invitation_claims SET expires_at=clock_timestamp()+interval '1 day'$q$,'42501');
SELECT pg_temp.expect_error($q$DELETE FROM public.hr_onboarding_invitation_claims$q$,'42501');
RESET ROLE;
SELECT pg_temp.actor('');
SELECT pg_temp.assert_true((SELECT count(*)=1 AND bool_and(
  issued_by='20000000-0000-4000-8000-000000000001'::uuid
  AND expires_at-issued_at=interval '5 minutes' AND consumed_at IS NULL)
 FROM public.hr_onboarding_invitation_claims),'one private short-lived proof bound to the real issuer');

-- Publicly writable request metadata, even for a valid RH dossier, grants no identity.
SELECT pg_temp.expect_error($q$INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('60000000-0000-4000-8000-000000000001','spoof@bib.test',
 '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000001","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-999999999999"}')$q$,'42501');
SELECT pg_temp.expect_error($q$INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('60000000-0000-4000-8000-000000000001','claim1@bib.test',
 '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000001"}')$q$,'42501');
SELECT pg_temp.expect_error($q$INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('60000000-0000-4000-8000-000000000001','wrong@bib.test',
 '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000001","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-000000000001"}')$q$,'42501');
SELECT pg_temp.expect_error($q$INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('60000000-0000-4000-8000-000000000001','claim1@bib.test',
 '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000008","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-000000000001"}')$q$,'42501');
SELECT pg_temp.assert_true((SELECT consumed_at IS NULL FROM public.hr_onboarding_invitation_claims WHERE nonce='70000000-0000-4000-8000-000000000001'),'failed spoof attempts do not consume the proof');

-- A legitimate GoTrue-style INSERT succeeds with invited_at and confirmed_at still NULL.
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES('60000000-0000-4000-8000-000000000001','claim1@bib.test',
 '{"app_origin":"connect","first_name":"Nouvelle","last_name":"Personne","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000001","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-000000000001"}');
SELECT pg_temp.assert_true((SELECT invited_at IS NULL AND email_confirmed_at IS NULL FROM auth.users WHERE id='60000000-0000-4000-8000-000000000001'),'Auth insert precedes invite timestamps');
SELECT pg_temp.assert_true((SELECT consumed_user_id='60000000-0000-4000-8000-000000000001'::uuid AND consumed_at IS NOT NULL FROM public.hr_onboarding_invitation_claims WHERE nonce='70000000-0000-4000-8000-000000000001'),'proof consumed for the inserted UUID');
SELECT pg_temp.assert_true((SELECT first_name='Nouvelle' AND last_name='Personne' AND email='claim1@bib.test' FROM public.profiles WHERE id='60000000-0000-4000-8000-000000000001'),'real trigger creates the matching profile');
SELECT pg_temp.assert_true((SELECT count(*)=1 AND bool_and(role='viewer'::public.app_role) FROM public.user_roles WHERE user_id='60000000-0000-4000-8000-000000000001'),'Auth trigger grants only baseline viewer');
SELECT pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id='60000000-0000-4000-8000-000000000001'),'trigger does not grant business authority');
SELECT pg_temp.expect_error($q$INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('60000000-0000-4000-8000-000000000002','claim1@bib.test',
 '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000001","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-000000000001"}')$q$,'42501');
SELECT pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM auth.users WHERE id='60000000-0000-4000-8000-000000000002'),'replayed proof cannot create a second identity');

-- Reserve independent cases: expiry, rejection, email change, completed linkage and transaction rollback.
SET LOCAL ROLE authenticated;
SELECT pg_temp.actor('20000000-0000-4000-8000-000000000001');
SELECT pg_temp.assert_true(public.reserve_hr_onboarding_invitation(
  ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  ('70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid),'reserve boundary case')
FROM generate_series(8,14) n;
RESET ROLE;
SELECT pg_temp.actor('');
UPDATE public.hr_onboarding_invitation_claims SET issued_at=clock_timestamp()-interval '10 minutes',expires_at=clock_timestamp()-interval '5 minutes'
 WHERE nonce='70000000-0000-4000-8000-000000000008';
UPDATE public.hr_employee_requests SET status='rejected' WHERE id='50000000-0000-4000-8000-000000000009';
UPDATE public.hr_employee_requests SET work_email='changed@bib.test' WHERE id='50000000-0000-4000-8000-000000000010';
UPDATE public.hr_employee_requests SET created_user_id='20000000-0000-4000-8000-000000000005' WHERE id='50000000-0000-4000-8000-000000000011';
UPDATE public.hr_employee_requests SET hr_validated_by=NULL WHERE id='50000000-0000-4000-8000-000000000014';
SELECT pg_temp.expect_error(format($q$INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES(%L,%L,%L::jsonb)$q$,
 '60000000-0000-4000-8000-'||lpad(n::text,12,'0'),'claim'||n||'@bib.test',
 jsonb_build_object('app_origin','connect','hr_onboarding_request_id','50000000-0000-4000-8000-'||lpad(n::text,12,'0'),
 'hr_onboarding_attempt_nonce','70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::text),'42501')
FROM unnest(ARRAY[8,9,10,11,14]) n;
SELECT pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.hr_onboarding_invitation_claims WHERE consumed_at IS NOT NULL
 AND nonce<>'70000000-0000-4000-8000-000000000001'),'failed expiry/rejection/change cases remain unconsumed');

-- Simulate a mailer failure AFTER the Auth INSERT in the same transaction/subtransaction.
DO $$
BEGIN
  BEGIN
    INSERT INTO auth.users(id,email,raw_user_meta_data)
    VALUES('60000000-0000-4000-8000-000000000012','claim12@bib.test',
     '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000012","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-000000000012"}');
    RAISE EXCEPTION 'simulated sendInvite failure' USING ERRCODE='P0001';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM auth.users WHERE id='60000000-0000-4000-8000-000000000012'),'mailer failure rolls back Auth identity');
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='60000000-0000-4000-8000-000000000012'),'mailer failure rolls back profile');
  PERFORM pg_temp.assert_true(NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id='60000000-0000-4000-8000-000000000012'),'mailer failure rolls back baseline role');
  PERFORM pg_temp.assert_true((SELECT consumed_at IS NULL AND consumed_user_id IS NULL FROM public.hr_onboarding_invitation_claims WHERE nonce='70000000-0000-4000-8000-000000000012'),'mailer failure rolls back proof consumption');
END;
$$;
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES('60000000-0000-4000-8000-000000000013','claim12@bib.test',
 '{"app_origin":"connect","hr_onboarding_request_id":"50000000-0000-4000-8000-000000000012","hr_onboarding_attempt_nonce":"70000000-0000-4000-8000-000000000012"}');
SELECT pg_temp.assert_true((SELECT consumed_user_id='60000000-0000-4000-8000-000000000013'::uuid FROM public.hr_onboarding_invitation_claims WHERE nonce='70000000-0000-4000-8000-000000000012'),'rollback allows a clean retry with a new Auth UUID');

-- Preserve the pre-existing trusted invitation/confirmed-admin paths.
INSERT INTO auth.users(id,email,invited_at,raw_user_meta_data)
VALUES('60000000-0000-4000-8000-000000000020','trusted-invited@bib.test',clock_timestamp(),'{"app_origin":"connect"}');
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
VALUES('60000000-0000-4000-8000-000000000021','trusted-confirmed@bib.test',clock_timestamp(),'{"app_origin":"connect"}');
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.profiles WHERE id IN(
 '60000000-0000-4000-8000-000000000020','60000000-0000-4000-8000-000000000021')),'trusted paths remain compatible');
SELECT pg_temp.assert_true((SELECT consumed_at IS NULL FROM public.hr_onboarding_invitation_claims WHERE nonce='70000000-0000-4000-8000-000000000013'),'unrelated claims remain untouched');

ROLLBACK;
