import { env } from '$env/dynamic/private';

const TMDB_API = 'https://api.themoviedb.org/3';

export type TmdbSearchHit = {
	tmdbId: number;
	title: string;
	posterPath: string | null;
	releaseYear: string | null;
};

type TmdbSearchMovie = {
	id: number;
	title?: string;
	original_title?: string;
	poster_path?: string | null;
	release_date?: string | null;
};

export async function searchMovies(query: string): Promise<TmdbSearchHit[]> {
	const token = env.TMDB_API_KEY;
	if (!token?.trim()) return [];

	const q = query.trim();
	if (!q) return [];

	const url = new URL(`${TMDB_API}/search/movie`);
	url.searchParams.set('query', q);
	url.searchParams.set('page', '1');

	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token.trim()}` }
	});
	if (!res.ok) return [];

	const data = (await res.json()) as { results?: TmdbSearchMovie[] };
	const results = data.results;
	if (!Array.isArray(results)) return [];

	return results.map((r) => {
		const releaseDate = r.release_date;
		let releaseYear: string | null = null;
		if (releaseDate && typeof releaseDate === 'string' && releaseDate.length >= 4) {
			releaseYear = releaseDate.slice(0, 4);
		}
		const title = String(r.title || r.original_title || '').trim() || 'Untitled';
		return {
			tmdbId: r.id,
			title,
			posterPath: r.poster_path ?? null,
			releaseYear
		};
	});
}

/** Best-effort first match for backfilling legacy rows by title. */
export async function firstSearchHit(query: string): Promise<TmdbSearchHit | null> {
	const hits = await searchMovies(query);
	return hits[0] ?? null;
}

type TmdbMovieDetailsPayload = {
	vote_average?: unknown;
	vote_count?: unknown;
	release_date?: string | null;
};

/** TMDB aggregates (not logged-in user scores). Cached in our DB beside each row. */
export async function fetchMovieVoteStats(tmdbId: number): Promise<{
	voteAverage: number;
	voteCount: number;
	releaseYear: string | null;
} | null> {
	const token = env.TMDB_API_KEY;
	if (!token?.trim()) return null;
	if (!Number.isInteger(tmdbId) || tmdbId <= 0) return null;

	const res = await fetch(`${TMDB_API}/movie/${tmdbId}`, {
		headers: { Authorization: `Bearer ${token.trim()}` }
	});
	if (!res.ok) return null;

	const data = (await res.json()) as TmdbMovieDetailsPayload;
	const va = data.vote_average;
	const vc = data.vote_count;
	if (typeof va !== 'number' || !Number.isFinite(va)) return null;
	let voteCount = 0;
	if (typeof vc === 'number' && Number.isFinite(vc) && vc >= 0) {
		voteCount = Math.round(vc);
	}

	const rd = data.release_date;
	let releaseYear: string | null = null;
	if (typeof rd === 'string' && rd.length >= 4 && /^\d{4}/.test(rd.slice(0, 4))) {
		releaseYear = rd.slice(0, 4);
	}
	return { voteAverage: va, voteCount, releaseYear };
}
