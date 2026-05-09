import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			// Wire a real SMTP/Resend/etc. integration here for production deliverability.
			// See: https://www.better-auth.com/docs/authentication/email-password
			void Promise.resolve().then(() => {
				console.info(
					`[Moviemate] Password reset for ${user.email}\nFollow this URL to continue (link also sent via your mail provider once configured):\n${url}`
				);
			});
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
