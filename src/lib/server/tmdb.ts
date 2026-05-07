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
