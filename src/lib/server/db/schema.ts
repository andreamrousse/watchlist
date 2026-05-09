import { relations } from 'drizzle-orm';
import { pgTable, serial, integer, real, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const movie = pgTable(
	'movie',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		tmdbId: integer('tmdb_id'),
		posterPath: text('poster_path'),
		status: text('status').notNull().default('want_to_watch'),
		/** Legacy personal score column (no longer used in the app). */
		rating: integer('rating'),
		/** TMDB community score (typically 0–10); fetched from /movie/{id}. */
		tmdbVoteAverage: real('tmdb_vote_average'),
		tmdbVoteCount: integer('tmdb_vote_count'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('movie_userId_idx').on(table.userId)]
);

export const movieRelations = relations(movie, ({ one }) => ({
	user: one(user, {
		fields: [movie.userId],
		references: [user.id]
	})
}));

export * from './auth.schema';
