CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_organization_id_created_at_idx" ON "projects" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_organization_id_name_unique" ON "projects" USING btree ("organization_id","name");--> statement-breakpoint
CREATE POLICY "projects_workspace_isolation" ON "projects" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.workspace_id', true)) WITH CHECK (organization_id = current_setting('app.workspace_id', true));