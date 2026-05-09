ALTER TABLE "movie" DROP CONSTRAINT IF EXISTS "movie_rating_chk";--> statement-breakpoint
UPDATE "movie" SET "rating" = "rating" * 2 WHERE "rating" IS NOT NULL AND "rating" BETWEEN 1 AND 5;--> statement-breakpoint
ALTER TABLE "movie" ADD CONSTRAINT "movie_rating_chk" CHECK ("rating" IS NULL OR ("rating" BETWEEN 1 AND 10));
