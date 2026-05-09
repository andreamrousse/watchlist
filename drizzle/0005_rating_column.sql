ALTER TABLE "movie" ADD COLUMN "rating" integer;
--> statement-breakpoint
ALTER TABLE "movie" ADD CONSTRAINT "movie_rating_chk" CHECK ("rating" IS NULL OR ("rating" BETWEEN 1 AND 5));