CREATE TABLE "email_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" integer NOT NULL,
	"addressee_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"difficulty" text NOT NULL,
	"section" text NOT NULL,
	"correct_answers" integer NOT NULL,
	"wrong_answers" integer NOT NULL,
	"total_time" integer NOT NULL,
	"final_score" integer NOT NULL,
	"date_created" text NOT NULL,
	"mode" text DEFAULT 'competitive' NOT NULL,
	"status" text DEFAULT 'abandoned' NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"total_questions_answered" integer DEFAULT 0 NOT NULL,
	"accuracy_rate" real DEFAULT 0 NOT NULL,
	"avg_time_per_question" real DEFAULT 0 NOT NULL,
	"category_performance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"category" text NOT NULL,
	"section" text,
	"difficulty" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"university" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_friendships_requester_addressee" ON "friendships" USING btree ("requester_id","addressee_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_requester_status" ON "friendships" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "idx_friendships_addressee_status" ON "friendships" USING btree ("addressee_id","status");--> statement-breakpoint
CREATE INDEX "idx_games_user_status_score" ON "games" USING btree ("user_id","status","final_score");