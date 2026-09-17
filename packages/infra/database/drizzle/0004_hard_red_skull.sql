ALTER TABLE "projects" ALTER COLUMN "name" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_check" CHECK (status in ('active', 'archived'));