-- Row level security never applies to a superuser, and the role the runtime
-- connects as is the one the container bootstrapped — superuser, with
-- BYPASSRLS. Declaring the policy without this role is decoration: every query
-- would read every organization and the isolation tests would agree.
--
-- The workspace transaction drops into this role with SET LOCAL ROLE, so the
-- connection keeps its ownership privileges for migrations and seeds while
-- every tenant-aware statement runs under a role the policy applies to. The
-- role never logs in, so it adds no credential to configure or rotate.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'twincam_workspace') THEN
    CREATE ROLE twincam_workspace NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint
GRANT twincam_workspace TO CURRENT_USER;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO twincam_workspace;
--> statement-breakpoint
-- Granted table by table, on purpose: a default privilege would hand every
-- future table to the workspace role, including the identity tables that are
-- not tenant-owned. A new tenant-owned table grants itself here.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "projects" TO twincam_workspace;
