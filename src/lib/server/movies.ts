import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';

const MAX_TITLE_LENGTH = 500;

export type MovieRow = {
	id: number;
	title: string;
	createdAt: Date;
};

function parseMovieId(raw: FormDataEntryValue | null): number | null {
	if (raw === null || typeof raw !== 'string') return null;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0) return null;
	return n;
}

function normalizeTitle(raw: string): string | null {
	const t = raw.trim();
	if (!t) return null;
	if (t.length > MAX_TITLE_LENGTH) return null;
	return t;
}

export function listMoviesForUser(userId: string): Promise<MovieRow[]> {
	return db
		.select({
			id: movie.id,
			title: movie.title,
			createdAt: movie.createdAt
		})
		.from(movie)
		.where(eq(movie.userId, userId))
		.orderBy(desc(movie.createdAt));
}

export async function createMovie(
	userId: string,
	rawTitle: string
): Promise<{ ok: true; row: MovieRow } | { ok: false; error: string }> {
	const title = normalizeTitle(rawTitle);
	if (!title) {
		return { ok: false, error: 'Title is required (max 500 characters).' };
	}
	const [row] = await db.insert(movie).values({ userId, title }).returning({
		id: movie.id,
		title: movie.title,
		createdAt: movie.createdAt
	});
	if (!row) {
		return { ok: false, error: 'Could not add movie.' };
	}
	return { ok: true, row };
}

export async function deleteMovieForUser(
	userId: string,
	rawId: FormDataEntryValue | null
): Promise<{ ok: true } | { ok: false; error: string }> {
	const movieId = parseMovieId(rawId);

	if (!movieId) {
		return { ok: false, error: 'Invalid movie id.' };
	}

	const [removed] = await db
		.delete(movie)
		.where(and(eq(movie.id, movieId), eq(movie.userId, userId)))
		.returning({ id: movie.id });

	if (!removed) {
		return { ok: false, error: 'Movie not found or already removed.' };
	}
	return { ok: true };
}
