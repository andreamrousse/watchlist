import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import * as movies from '$lib/server/movies';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return redirect(302, '/login');
	}
	await movies.backfillTmdbForUser(user.id);
	const list = await movies.listMoviesForUser(user.id);
	return { user, movies: list };
};

export const actions: Actions = {
	addMovie: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return fail(401, { message: 'Sign in required.' });
		}
		const formData = await event.request.formData();
		const title = formData.get('title')?.toString() ?? '';
		const tmdbParts = movies.parseTmdbPayloadFromForm(formData);
		if (!tmdbParts.ok) {
			return fail(400, { message: tmdbParts.error });
		}
		const result = await movies.createMovie(user.id, title, {
			tmdbId: tmdbParts.tmdbId,
			posterPath: tmdbParts.posterPath
		});
		if (!result.ok) {
			return fail(400, { message: result.error });
		}
		return { ok: true as const };
	},
	deleteMovie: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return fail(401, { message: 'Sign in required.' });
		}
		const formData = await event.request.formData();
		const rawId = formData.get('movieId');
		const result = await movies.deleteMovieForUser(user.id, rawId);
		if (!result.ok) {
			return fail(400, { message: result.error });
		}
		return { ok: true as const };
	},
	signOut: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/login');
	}
};
