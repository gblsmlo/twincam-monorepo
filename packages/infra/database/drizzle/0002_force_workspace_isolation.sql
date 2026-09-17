-- Row level security does not apply to the role that owns the table, and the
-- runtime connects as the owner in the local and Compose setups. Without FORCE,
-- `projects_workspace_isolation` is declared, reported as enabled, and bypassed
-- on every query the application makes — the isolation tests would pass while
-- proving nothing. Drizzle Kit does not express FORCE, so it lives here.
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;
