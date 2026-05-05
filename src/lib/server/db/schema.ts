import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const movie = pgTable(
	'movie',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
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
