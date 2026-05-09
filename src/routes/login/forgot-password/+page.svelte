<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { dev } from '$app/environment';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Forgot password — Moviemate</title>
</svelte:head>

<main class="page page-narrow login-page">
	<section class="login-card" aria-labelledby="forgot-heading">
		<h1 id="forgot-heading" class="login-heading login-heading--sub">Forgot password</h1>
		<p class="login-subtitle">
			Enter the email you use with Moviemate. If it matches an account, you’ll receive a reset
			link there.
		</p>

		{#if form?.success}
			<p class="muted login-success" role="status">
				Thanks. If that email is registered, watch your inbox—then finish on the linked page.
			</p>
		{/if}

		{#if dev}
			<p class="muted login-dev-hint" role="note">
				<strong>Development:</strong> reset links print in the server log—there’s no outbound
				email configured yet.
			</p>
		{/if}

		<form class="login-form stack" method="post" use:enhance>
			<div class="login-field">
				<label class="login-field-label" for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="you@example.com"
					required
					class="input login-input"
					disabled={form?.success}
				/>
			</div>
			{#if !form?.success}
				<button type="submit" class="button login-submit">Send reset link</button>
			{/if}
			{#if form?.message}
				<p class="error-text" role="alert">{form.message}</p>
			{/if}
		</form>

		<p class="login-back">
			<a href="/login" class="login-inline-link">Back to sign in</a>
		</p>
	</section>
</main>
