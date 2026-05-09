<script lang="ts">
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form?: { message?: string } } = $props();

	const qpErrorMessages: Record<string, string> = {
		INVALID_TOKEN: 'That reset link expired or isn’t valid. Request a new one from sign in.'
	};

	let qpErrorLabel = $derived(
		data.err ? (qpErrorMessages[data.err] ?? 'This reset link is not valid.') : null
	);
</script>

<svelte:head>
	<title>Set new password — Moviemate</title>
</svelte:head>

<main class="page page-narrow login-page">
	<section class="login-card" aria-labelledby="reset-heading">
		<h1 id="reset-heading" class="login-heading login-heading--sub">Set a new password</h1>

		{#if qpErrorLabel}
			<p class="error-text login-reset-banner" role="alert">{qpErrorLabel}</p>
		{:else if data.token}
			{#if form?.message}
				<p class="error-text login-reset-banner" role="alert">{form.message}</p>
			{/if}
			<form class="login-form stack" method="post">
				<input type="hidden" name="token" value={data.token} />
				<div class="login-field">
					<label class="login-field-label" for="password">New password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						minlength="8"
						placeholder="At least 8 characters"
						required
						class="input login-input"
					/>
				</div>
				<div class="login-field">
					<label class="login-field-label" for="passwordConfirm">Confirm password</label>
					<input
						id="passwordConfirm"
						name="passwordConfirm"
						type="password"
						autocomplete="new-password"
						minlength="8"
						required
						class="input login-input"
					/>
				</div>
				<button type="submit" class="button login-submit">Update password</button>
			</form>
		{:else}
			<p class="muted login-subtitle-inline">
				Open this page from the reset link we send—we use the URL to unlock the password
				fields.
			</p>
		{/if}

		<p class="login-back">
			<a href="/login/forgot-password" class="login-inline-link">Need another email?</a>
			<span class="login-back-sep" aria-hidden="true"> · </span>
			<a href="/login" class="login-inline-link">Back to sign in</a>
		</p>
	</section>
</main>
