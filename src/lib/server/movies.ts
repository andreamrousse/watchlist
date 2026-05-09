import { and, asc, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { fetchMovieVoteStats, firstSearchHit } from '$lib/server/tmdb';
import { isMovieStatus, type MovieStatus } from '$lib/movie-status';

const MAX_TITLE_LENGTH = 500;
const MAX_POSTER_PATH_LENGTH = 255;
const BACKFILL_BATCH = 8;

export type MovieRow = {
	id: number;
	title: string;
	tmdbId: number | null;
	posterPath: string | null;
	status: MovieStatus;
	tmdbVoteAverage: number | null;
	tmdbVoteCount: number | null;
	createdAt: Date;
};

function parseMovieId(raw: FormDataEntryValue | null): number | null {
	if (raw === null || typeof raw !== 'string') return null;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0) return null;
	return n;
}

function parseTmdbIdFromForm(raw: FormDataEntryValue | null): number | null {
	if (raw === null) return null;
	if (typeof raw !== 'string') return null;
	const t = raw.trim();
	if (!t) return null;
	const n = Number(t);
	if (!Number.isInteger(n) || n <= 0) return null;
	return n;
}

function parsePosterPathFromForm(raw: FormDataEntryValue | null): string | null {
	if (raw === null || raw === '') return null;
	if (typeof raw !== 'string') return null;
	const p = raw.trim();
	if (!p) return null;
	if (p.length > MAX_POSTER_PATH_LENGTH) return null;
	if (!p.startsWith('/')) return null;
	return p;
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
			tmdbId: movie.tmdbId,
			posterPath: movie.posterPath,
			status: movie.status,
			tmdbVoteAverage: movie.tmdbVoteAverage,
			tmdbVoteCount: movie.tmdbVoteCount,
			createdAt: movie.createdAt
		})
		.from(movie)
		.where(eq(movie.userId, userId))
		.orderBy(desc(movie.createdAt))
		.then((rows): MovieRow[] =>
			rows.map((r) => ({
				...r,
				status: r.status as MovieStatus,
				tmdbVoteAverage: r.tmdbVoteAverage == null ? null : Number(r.tmdbVoteAverage),
				tmdbVoteCount: r.tmdbVoteCount == null ? null : r.tmdbVoteCount
			}))
		);
}

export async function createMovie(
	userId: string,
	rawTitle: string,
	tmdb: { tmdbId: number | null; posterPath: string | null }
): Promise<{ ok: true; row: MovieRow } | { ok: false; error: string }> {
	const title = normalizeTitle(rawTitle);
	if (!title) {
		return { ok: false, error: 'Title is required (max 500 characters).' };
	}

	if (tmdb.tmdbId === null) {
		return { ok: false, error: 'Choose a movie from the search results.' };
	}

	const voteStats = await fetchMovieVoteStats(tmdb.tmdbId);

	const [row] = await db
		.insert(movie)
		.values({
			userId,
			title,
			tmdbId: tmdb.tmdbId,
			posterPath: tmdb.posterPath,
			tmdbVoteAverage: voteStats?.voteAverage ?? null,
			tmdbVoteCount: voteStats?.voteCount ?? null
		})
		.returning({
			id: movie.id,
			title: movie.title,
			tmdbId: movie.tmdbId,
			posterPath: movie.posterPath,
			status: movie.status,
			tmdbVoteAverage: movie.tmdbVoteAverage,
			tmdbVoteCount: movie.tmdbVoteCount,
			createdAt: movie.createdAt
		});
	if (!row) {
		return { ok: false, error: 'Could not add movie.' };
	}
	return { ok: true, row: normalizeMovieRow(row) };
}

function normalizeMovieRow(row: {
	id: number;
	title: string;
	tmdbId: number | null;
	posterPath: string | null;
	status: string;
	tmdbVoteAverage: number | null;
	tmdbVoteCount: number | null;
	createdAt: Date;
}): MovieRow {
	return {
		...row,
		status: row.status as MovieStatus,
		tmdbVoteAverage: row.tmdbVoteAverage == null ? null : Number(row.tmdbVoteAverage),
		tmdbVoteCount: row.tmdbVoteCount == null ? null : row.tmdbVoteCount
	};
}

export function parseTmdbPayloadFromForm(formData: FormData):
	| {
			tmdbId: number | null;
			posterPath: string | null;
			ok: true;
	  }
	| { ok: false; error: string } {
	const tmdbId = parseTmdbIdFromForm(formData.get('tmdbId'));
	const posterPath = parsePosterPathFromForm(formData.get('posterPath'));
	if (tmdbId === null) {
		return { ok: false, error: 'Choose a movie from the search results.' };
	}
	return { ok: true, tmdbId, posterPath };
}

export function parseStatusFromForm(raw: FormDataEntryValue | null): MovieStatus | null {
	if (raw === null || typeof raw !== 'string') return null;
	const t = raw.trim();
	return isMovieStatus(t) ? t : null;
}

export async function updateMovieStatusForUser(
	userId: string,
	rawMovieId: FormDataEntryValue | null,
	rawStatus: FormDataEntryValue | null
): Promise<{ ok: true } | { ok: false; error: string }> {
	const movieId = parseMovieId(rawMovieId);
	if (!movieId) {
		return { ok: false, error: 'Invalid movie id.' };
	}
	const status = parseStatusFromForm(rawStatus);
	if (status === null) {
		return { ok: false, error: 'Invalid status.' };
	}

	const [updated] = await db
		.update(movie)
		.set({ status })
		.where(and(eq(movie.id, movieId), eq(movie.userId, userId)))
		.returning({ id: movie.id });

	if (!updated) {
		return { ok: false, error: 'Movie not found.' };
	}
	return { ok: true };
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

/**
 * Fills TMDB fields for up to `BACKFILL_BATCH` movies per call (oldest missing data first).
 */
export async function backfillTmdbForUser(userId: string): Promise<void> {
	const stale = await db
		.select({
			id: movie.id,
			title: movie.title
		})
		.from(movie)
		.where(and(eq(movie.userId, userId), isNull(movie.tmdbId)))
		.orderBy(asc(movie.createdAt))
		.limit(BACKFILL_BATCH);

	for (const row of stale) {
		const hit = await firstSearchHit(row.title);
		if (!hit) continue;
		const voteStats = await fetchMovieVoteStats(hit.tmdbId);
		await db
			.update(movie)
			.set({
				tmdbId: hit.tmdbId,
				posterPath: hit.posterPath,
				tmdbVoteAverage: voteStats?.voteAverage ?? null,
				tmdbVoteCount: voteStats?.voteCount ?? null
			})
			.where(eq(movie.id, row.id));
	}
}

/**
 * Pulls TMDB vote_average / vote_count for rows that already have tmdbId but no cached stats.
 */
export async function backfillTmdbVotesForUser(userId: string): Promise<void> {
	const stale = await db
		.select({
			id: movie.id,
			tmdbId: movie.tmdbId
		})
		.from(movie)
		.where(and(eq(movie.userId, userId), isNotNull(movie.tmdbId), isNull(movie.tmdbVoteAverage)))
		.orderBy(asc(movie.createdAt))
		.limit(BACKFILL_BATCH);

	for (const row of stale) {
		if (row.tmdbId === null) continue;
		const voteStats = await fetchMovieVoteStats(row.tmdbId);
		if (!voteStats) continue;
		await db
			.update(movie)
			.set({
				tmdbVoteAverage: voteStats.voteAverage,
				tmdbVoteCount: voteStats.voteCount
			})
			.where(eq(movie.id, row.id));
	}
}
