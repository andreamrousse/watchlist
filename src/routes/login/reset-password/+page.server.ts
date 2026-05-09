import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		throw redirect(302, '/');
	}

	const token = event.url.searchParams.get('token') ?? '';
	const err = event.url.searchParams.get('error');
	return { token, err };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token')?.toString() ?? '';
		const pw = formData.get('password')?.toString() ?? '';
		const pw2 = formData.get('passwordConfirm')?.toString() ?? '';

		if (!token) {
			return fail(400, { message: 'Use the reset link from your email to reach this screen.' });
		}
		if (pw !== pw2) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		try {
			await auth.api.resetPassword({
				body: {
					token,
					newPassword: pw
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Invalid or expired reset link.' });
			}
			console.error('resetPassword:', error);
			return fail(500, { message: 'Unexpected error.' });
		}

		throw redirect(303, '/login');
	}
};
