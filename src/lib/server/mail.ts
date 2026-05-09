import { env } from '$env/dynamic/private';

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function escapeHtmlAttr(s: string): string {
	return escapeHtml(s).replace(/'/g, '&#39;');
}

export type TransactionalEmailParams = {
	to: string;
	subject: string;
	html: string;
	text: string;
};

/**
 * Sends email via Resend when `RESEND_API_KEY` and `MAIL_FROM` are set (see `.env.example`).
 * Returns true only if Resend accepted the send (still check deliverability/spam separately).
 */
export async function sendTransactionalEmail(params: TransactionalEmailParams): Promise<boolean> {
	const apiKey = env.RESEND_API_KEY?.trim();
	const from = env.MAIL_FROM?.trim();
	if (!apiKey || !from) {
		return false;
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from,
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text
		})
	});

	if (!res.ok) {
		console.error('[Moviemate] Email send failed:', res.status, await res.text().catch(() => ''));
		return false;
	}

	return true;
}

export function resetPasswordEmailBodies(url: string, displayName?: string | null): { html: string; text: string } {
	const name = displayName?.trim();
	const greetingHtml = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
	const greetText = name ? `Hi ${name},` : 'Hi,';

	const safeHref = escapeHtmlAttr(url);
	const visibleLink = escapeHtml(url);

	const html = `
<p>${greetingHtml}</p>
<p>We received a request to reset your Moviemate password.</p>
<p><a href="${safeHref}">Choose a new password</a></p>
<p style="margin-top:1rem;font-size:13px;line-height:1.45;color:#666;">Copy-paste link if needed:<br>${visibleLink}</p>
<p style="font-size:13px;line-height:1.45;color:#666;">If you didn’t ask for this, you can safely ignore this message.</p>
`.trim();
	const text =
		`${greetText}\n\n` +
		`Reset your Moviemate password:\n${url}\n\n` +
		`If you didn't request this, you can ignore this email.`;

	return { html, text };
}
