-- Include expected_transfer_term so “next deadline” emails match the same intake filter as the app.
--
-- Adding a column changes the function's return type, which CREATE OR REPLACE cannot do
-- ("cannot change return type of existing function"). The function must be dropped first.
-- Dropping also resets its ACL to the default (EXECUTE to PUBLIC), so the REVOKE/GRANT
-- block from 20260521200000 is re-applied at the end of this migration.
DROP FUNCTION IF EXISTS public.deadline_reminder_recipients();

CREATE FUNCTION public.deadline_reminder_recipients()
RETURNS TABLE (
  user_id uuid,
  email text,
  target_university_id uuid,
  expected_transfer_term text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id AS user_id,
    u.email::text AS email,
    p.target_university_id,
    p.expected_transfer_term
  FROM public.user_profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE coalesce(p.notify_deadline_reminders, true) = true
    AND u.email IS NOT NULL
    AND btrim(u.email) <> '';
$$;

COMMENT ON FUNCTION public.deadline_reminder_recipients() IS
  'Weekly deadline emails: users opted in (coalesce(notify_deadline_reminders, true)) with auth email. Includes expected_transfer_term for intake-aligned deadline selection. Callable only by service_role.';

REVOKE ALL ON FUNCTION public.deadline_reminder_recipients() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deadline_reminder_recipients() FROM anon;
REVOKE ALL ON FUNCTION public.deadline_reminder_recipients() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deadline_reminder_recipients() TO service_role;
