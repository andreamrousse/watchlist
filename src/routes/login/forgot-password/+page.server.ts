import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		throw redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim() ?? '';
		if (!email) {
			return fail(400, { message: 'Enter the email your account uses.' });
		}

		const redirectTo = `${event.url.origin}/login/reset-password`;

		try {
			await auth.api.requestPasswordReset({
				body: {
					email,
					redirectTo
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: error.message || 'Something went wrong. Try again in a minute.'
				});
			}
			console.error('requestPasswordReset:', error);
			return fail(500, { message: 'Unexpected error.' });
		}

		return { success: true as const };
	}
};
