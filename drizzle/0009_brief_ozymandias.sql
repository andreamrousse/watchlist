CREATE UNIQUE INDEX "movie_user_tmdb_uidx" ON "movie" USING btree ("user_id","tmdb_id") WHERE "movie"."tmdb_id" is not null;
