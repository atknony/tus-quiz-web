-- Iter 3+5 cutover: replace finalScore (duration-as-score) with the new score
-- column (higher = better). Drop dateCreated (write-only dead code). Re-point
-- the (user_id, status, score) index to the new column.

DROP INDEX IF EXISTS "idx_games_user_status_score";
--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN IF EXISTS "final_score";
--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN IF EXISTS "date_created";
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE INDEX "idx_games_user_status_score" ON "games" USING btree ("user_id","status","score");
