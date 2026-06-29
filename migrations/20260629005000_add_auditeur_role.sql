-- PostgreSQL ALTER TYPE ADD VALUE cannot be executed inside a transaction block easily.
-- So we use a little workaround to add the auditeur role if it doesn't exist.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'member_role' AND e.enumlabel = 'auditeur') THEN
    ALTER TYPE public.member_role ADD VALUE 'auditeur';
  END IF;
END
$$;
