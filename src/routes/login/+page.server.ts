import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

type LoginBanner = { headline: string; detail: string };

const PASSWORD_POLICY_HEADLINE = `Password isn't long enough`;
const PASSWORD_POLICY_DETAIL = `Use at least eight characters, then try again.`;

function matchesPasswordPolicyError(raw?: string): boolean {
	const lower = (raw ?? '').toLowerCase();
	return (
		lower.includes('too short') ||
		lower.includes('weak') ||
		(lower.includes('password') && lower.includes('minimum')) ||
		(lower.includes('password') && (lower.includes('least') || lower.includes('at least'))) ||
		(lower.includes('password') && lower.includes('length')) ||
		(lower.includes('character') &&
			(lower.includes('least') || lower.includes('minimum') || lower.includes('at least')))
	);
}

function defaultNameFromEmail(email: string): string {
	const trimmed = email.trim();
	const local = trimmed.includes('@') ? trimmed.slice(0, trimmed.indexOf('@')) : trimmed;
	const spaced = local.replace(/[._-]+/g, ' ').trim();
	return spaced.length > 0 ? spaced : 'User';
}

function signInBanner(raw?: string): LoginBanner {
	if (matchesPasswordPolicyError(raw)) {
		return {
			headline: PASSWORD_POLICY_HEADLINE,
			detail: PASSWORD_POLICY_DETAIL
		};
	}
	const lower = (raw ?? '').toLowerCase();
	if (
		lower.includes('invalid email or password') ||
		lower.includes('invalid credentials') ||
		(lower.includes('invalid') && lower.includes('password')) ||
		(lower.includes('email') && lower.includes('invalid'))
	) {
		return {
			headline: `Couldn't sign you in`,
			detail: `Those credentials don't match anything on file. Double-check spelling, try Forgot password, or switch to Create account if you're new.`
		};
	}
	return {
		headline: `Couldn't sign you in`,
		detail: raw?.trim() || `We couldn't sign you in—try again in a moment.`
	};
}

function signUpBanner(raw?: string): LoginBanner {
	if (matchesPasswordPolicyError(raw)) {
		return {
			headline: PASSWORD_POLICY_HEADLINE,
			detail: PASSWORD_POLICY_DETAIL
		};
	}
	const lower = (raw ?? '').toLowerCase();
	if (lower.includes('already') || lower.includes('exist') || lower.includes('duplicate')) {
		return {
			headline: `Couldn't finish sign-up`,
			detail: `Someone already signed up with that email—switch to Log in or use Forgot password.`
		};
	}
	return {
		headline: `Couldn't finish sign-up`,
		detail: raw?.trim() || `We couldn't complete sign-up—try again in a moment.`
	};
}

function genericBanner(): LoginBanner {
	return {
		headline: 'Something went wrong',
		detail: 'Give it another try in a moment. If it persists, wait a bit and revisit.'
	};
}

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
					callbackURL: '/'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					loginBanner: signInBanner(error.message),
					loginBannerFor: 'signIn'
				});
			}
			return fail(500, {
				loginBanner: genericBanner(),
				loginBannerFor: 'signIn'
			});
		}

		return redirect(302, '/');
	},
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = defaultNameFromEmail(email);

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: '/'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					loginBanner: signUpBanner(error.message),
					loginBannerFor: 'signUp'
				});
			}
			return fail(500, {
				loginBanner: genericBanner(),
				loginBannerFor: 'signUp'
			});
		}

		return redirect(302, '/');
	}
};
