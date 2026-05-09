import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { resetPasswordEmailBodies, sendTransactionalEmail } from '$lib/server/mail';

function logResetLink(email: string, url: string, sent: boolean): void {
	const headline = sent
		? `[Moviemate] Password reset email queued via Resend for ${email}`
		: `[Moviemate] Password reset link (no outbound email)`;

	console.info(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${headline}

${url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
	if (!sent) {
		console.info(`[Moviemate] Add RESEND_API_KEY and MAIL_FROM in .env to send real emails.`);
	}
}

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			const bodies = resetPasswordEmailBodies(url, user.name);
			const sent = await sendTransactionalEmail({
				to: user.email,
				subject: 'Reset your Moviemate password',
				html: bodies.html,
				text: bodies.text
			});
			logResetLink(user.email, url, sent);
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
