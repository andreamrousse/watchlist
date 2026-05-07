import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { searchMovies } from '$lib/server/tmdb';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Sign in required.', results: [] }, { status: 401 });
	}
	const q = event.url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) {
		return json({ results: [] });
	}
	if (!env.TMDB_API_KEY?.trim()) {
		return json(
			{ error: 'Movie search is unavailable (TMDB is not configured).', results: [] },
			{
				status: 503
			}
		);
	}
	const results = await searchMovies(q);
	return json({ results });
};
