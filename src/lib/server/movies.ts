import { dbErrorLooksLikeMissingMigration, dbErrorLooksLikeUniqueViolation } from '$lib/server/db-errors';
import { and, asc, desc, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { fetchMovieVoteStats, firstSearchHit } from '$lib/server/tmdb';
import { isMovieStatus, type MovieStatus } from '$lib/movie-status';

const DUPLICATE_MOVIE_ERROR = 'That title is already on your list.';
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
	/** Four-digit year from TMDB; null if unknown (legacy rows until backfill). */
	releaseYear: string | null;
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

function parseReleaseYearFromForm(raw: FormDataEntryValue | null): string | null {
	if (raw === null || typeof raw !== 'string') return null;
	const t = raw.trim();
	if (!t || !/^\d{4}$/.test(t)) return null;
	return t;
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

const baseListSelect = {
	id: movie.id,
	title: movie.title,
	tmdbId: movie.tmdbId,
	posterPath: movie.posterPath,
	status: movie.status,
	tmdbVoteAverage: movie.tmdbVoteAverage,
	tmdbVoteCount: movie.tmdbVoteCount,
	createdAt: movie.createdAt
} as const;

function mapRowsToMovieRow(
	rows: {
		id: number;
		title: string;
		tmdbId: number | null;
		posterPath: string | null;
		status: string;
		tmdbVoteAverage: number | null;
		tmdbVoteCount: number | null;
		createdAt: Date;
	}[],
	releaseYear: string | null
): MovieRow[] {
	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		tmdbId: r.tmdbId,
		posterPath: r.posterPath,
		status: r.status as MovieStatus,
		tmdbVoteAverage: r.tmdbVoteAverage == null ? null : Number(r.tmdbVoteAverage),
		tmdbVoteCount: r.tmdbVoteCount == null ? null : r.tmdbVoteCount,
		releaseYear,
		createdAt: r.createdAt
	}));
}

export async function listMoviesForUser(userId: string): Promise<MovieRow[]> {
	try {
		const rows = await db
			.select({
				...baseListSelect,
				releaseYear: movie.tmdbReleaseYear
			})
			.from(movie)
			.where(eq(movie.userId, userId))
			.orderBy(desc(movie.createdAt));
		return rows.map((r) => ({
			id: r.id,
			title: r.title,
			tmdbId: r.tmdbId,
			posterPath: r.posterPath,
			status: r.status as MovieStatus,
			tmdbVoteAverage: r.tmdbVoteAverage == null ? null : Number(r.tmdbVoteAverage),
			tmdbVoteCount: r.tmdbVoteCount == null ? null : r.tmdbVoteCount,
			releaseYear: r.releaseYear,
			createdAt: r.createdAt
		}));
	} catch (e) {
		if (!dbErrorLooksLikeMissingMigration(e)) throw e;
		console.warn(
			'listMoviesForUser: column tmdb_release_year missing; years hidden until you run `pnpm db:migrate`.'
		);
		const rows = await db
			.select(baseListSelect)
			.from(movie)
			.where(eq(movie.userId, userId))
			.orderBy(desc(movie.createdAt));
		return mapRowsToMovieRow(rows, null);
	}
}

export async function createMovie(
	userId: string,
	rawTitle: string,
	tmdb: { tmdbId: number | null; posterPath: string | null; releaseYear: string | null },
	insertOpts?: { status?: MovieStatus }
): Promise<{ ok: true; row: MovieRow } | { ok: false; error: string }> {
	const title = normalizeTitle(rawTitle);
	if (!title) {
		return { ok: false, error: 'Title is required (max 500 characters).' };
	}

	if (tmdb.tmdbId === null) {
		return { ok: false, error: 'Choose a movie from the search results.' };
	}

	const voteStats = await fetchMovieVoteStats(tmdb.tmdbId);
	const releaseYear = voteStats?.releaseYear ?? tmdb.releaseYear;
	const statusInsert = insertOpts?.status;

	const [existing] = await db
		.select({ id: movie.id })
		.from(movie)
		.where(and(eq(movie.userId, userId), eq(movie.tmdbId, tmdb.tmdbId)))
		.limit(1);
	if (existing) {
		return { ok: false, error: DUPLICATE_MOVIE_ERROR };
	}

	const returningFull = {
		id: movie.id,
		title: movie.title,
		tmdbId: movie.tmdbId,
		posterPath: movie.posterPath,
		status: movie.status,
		tmdbVoteAverage: movie.tmdbVoteAverage,
		tmdbVoteCount: movie.tmdbVoteCount,
		releaseYear: movie.tmdbReleaseYear,
		createdAt: movie.createdAt
	};

	const returningNoYear = {
		id: movie.id,
		title: movie.title,
		tmdbId: movie.tmdbId,
		posterPath: movie.posterPath,
		status: movie.status,
		tmdbVoteAverage: movie.tmdbVoteAverage,
		tmdbVoteCount: movie.tmdbVoteCount,
		createdAt: movie.createdAt
	};

	const insertValuesFull = {
		userId,
		title,
		tmdbId: tmdb.tmdbId,
		posterPath: tmdb.posterPath,
		tmdbVoteAverage: voteStats?.voteAverage ?? null,
		tmdbVoteCount: voteStats?.voteCount ?? null,
		tmdbReleaseYear: releaseYear,
		...(statusInsert !== undefined ? { status: statusInsert } : {})
	} as const;

	const insertValuesNoYear = {
		userId,
		title,
		tmdbId: tmdb.tmdbId,
		posterPath: tmdb.posterPath,
		tmdbVoteAverage: voteStats?.voteAverage ?? null,
		tmdbVoteCount: voteStats?.voteCount ?? null,
		...(statusInsert !== undefined ? { status: statusInsert } : {})
	} as const;

	try {
		const [row] = await db.insert(movie).values(insertValuesFull).returning(returningFull);
		if (!row) {
			return { ok: false, error: 'Could not add movie.' };
		}
		return { ok: true, row: normalizeMovieRow(row) };
	} catch (e) {
		if (dbErrorLooksLikeUniqueViolation(e)) {
			return { ok: false, error: DUPLICATE_MOVIE_ERROR };
		}
		if (!dbErrorLooksLikeMissingMigration(e)) throw e;
		console.warn(
			'createMovie: column tmdb_release_year missing; insert without year. Run `pnpm db:migrate` to add it.'
		);
		try {
			const [row] = await db.insert(movie).values(insertValuesNoYear).returning(returningNoYear);
			if (!row) {
				return { ok: false, error: 'Could not add movie.' };
			}
			return {
				ok: true,
				row: normalizeMovieRow({ ...row, releaseYear: null, status: row.status })
			};
		} catch (e2) {
			if (dbErrorLooksLikeUniqueViolation(e2)) {
				return { ok: false, error: DUPLICATE_MOVIE_ERROR };
			}
			throw e2;
		}
	}
}

function normalizeMovieRow(row: {
	id: number;
	title: string;
	tmdbId: number | null;
	posterPath: string | null;
	status: string;
	tmdbVoteAverage: number | null;
	tmdbVoteCount: number | null;
	releaseYear: string | null;
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
			releaseYear: string | null;
			ok: true;
	  }
	| { ok: false; error: string } {
	const tmdbId = parseTmdbIdFromForm(formData.get('tmdbId'));
	const posterPath = parsePosterPathFromForm(formData.get('posterPath'));
	const releaseYear = parseReleaseYearFromForm(formData.get('releaseYear'));
	if (tmdbId === null) {
		return { ok: false, error: 'Choose a movie from the search results.' };
	}
	return { ok: true, tmdbId, posterPath, releaseYear };
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

export type DeletedMovieUndo = {
	title: string;
	tmdbId: number;
	posterPath: string | null;
	releaseYear: string | null;
	status: MovieStatus;
};

export async function deleteMovieForUser(
	userId: string,
	rawId: FormDataEntryValue | null
): Promise<{ ok: true; removedTitle: string; undo?: DeletedMovieUndo } | { ok: false; error: string }> {
	const movieId = parseMovieId(rawId);

	if (!movieId) {
		return { ok: false, error: 'Invalid movie id.' };
	}

	const [removed] = await db
		.delete(movie)
		.where(and(eq(movie.id, movieId), eq(movie.userId, userId)))
		.returning({
			id: movie.id,
			title: movie.title,
			tmdbId: movie.tmdbId,
			posterPath: movie.posterPath,
			status: movie.status,
			tmdbReleaseYear: movie.tmdbReleaseYear
		});

	if (!removed) {
		return { ok: false, error: 'Movie not found or already removed.' };
	}

	const undo =
		removed.tmdbId != null &&
		isMovieStatus(removed.status) &&
		removed.title.trim().length > 0
			? ({
					title: removed.title,
					tmdbId: removed.tmdbId,
					posterPath: removed.posterPath,
					releaseYear:
						removed.tmdbReleaseYear != null &&
						/^\d{4}$/.test(removed.tmdbReleaseYear.trim())
							? removed.tmdbReleaseYear.trim()
							: null,
					status: removed.status as MovieStatus
				} satisfies DeletedMovieUndo)
			: undefined;

	return { ok: true, removedTitle: removed.title, undo };
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
		const patchWithYear = {
			tmdbId: hit.tmdbId,
			posterPath: hit.posterPath,
			tmdbVoteAverage: voteStats?.voteAverage ?? null,
			tmdbVoteCount: voteStats?.voteCount ?? null,
			tmdbReleaseYear: voteStats?.releaseYear ?? hit.releaseYear ?? null
		};
		const patchNoYear = {
			tmdbId: hit.tmdbId,
			posterPath: hit.posterPath,
			tmdbVoteAverage: voteStats?.voteAverage ?? null,
			tmdbVoteCount: voteStats?.voteCount ?? null
		};
		try {
			await db.update(movie).set(patchWithYear).where(eq(movie.id, row.id));
		} catch (e) {
			if (!dbErrorLooksLikeMissingMigration(e)) throw e;
			await db.update(movie).set(patchNoYear).where(eq(movie.id, row.id));
		}
	}
}

/**
 * Pulls TMDB vote_average / vote_count (and release year when the column exists).
 */
async function backfillTmdbVotesWithYearColumn(userId: string): Promise<void> {
	const stale = await db
		.select({
			id: movie.id,
			tmdbId: movie.tmdbId,
			tmdbVoteAverage: movie.tmdbVoteAverage,
			tmdbReleaseYear: movie.tmdbReleaseYear
		})
		.from(movie)
		.where(
			and(
				eq(movie.userId, userId),
				isNotNull(movie.tmdbId),
				or(isNull(movie.tmdbVoteAverage), isNull(movie.tmdbReleaseYear))
			)
		)
		.orderBy(asc(movie.createdAt))
		.limit(BACKFILL_BATCH);

	for (const row of stale) {
		if (row.tmdbId === null) continue;
		const voteStats = await fetchMovieVoteStats(row.tmdbId);
		if (!voteStats) continue;

		const patch: {
			tmdbVoteAverage?: number;
			tmdbVoteCount?: number;
			tmdbReleaseYear?: string;
		} = {};
		if (row.tmdbVoteAverage == null) {
			patch.tmdbVoteAverage = voteStats.voteAverage;
			patch.tmdbVoteCount = voteStats.voteCount;
		}
		if (row.tmdbReleaseYear == null && voteStats.releaseYear !== null) {
			patch.tmdbReleaseYear = voteStats.releaseYear;
		}
		if (Object.keys(patch).length === 0) continue;

		await db
			.update(movie)
			.set(patch)
			.where(eq(movie.id, row.id));
	}
}

/** Vote backfill only (for databases missing `tmdb_release_year`). */
async function backfillTmdbVotesVoteFieldsOnly(userId: string): Promise<void> {
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

export async function backfillTmdbVotesForUser(userId: string): Promise<void> {
	try {
		await backfillTmdbVotesWithYearColumn(userId);
	} catch (e) {
		if (!dbErrorLooksLikeMissingMigration(e)) throw e;
		console.warn(
			'backfillTmdbVotesForUser: column tmdb_release_year missing; running vote-stats backfill only. Run `pnpm db:migrate` after adding the migration.'
		);
		await backfillTmdbVotesVoteFieldsOnly(userId);
	}
}
