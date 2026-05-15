ALTER TABLE "games" ADD COLUMN "chosen_question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "current_question_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "question_timings" jsonb DEFAULT '[]'::jsonb NOT NULL;