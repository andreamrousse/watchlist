<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign in — Watchlist</title>
</svelte:head>

<main class="page page-narrow">
	<h1 class="page-title">Watchlist</h1>
	<p class="muted">Sign in or create an account with email and password.</p>

	<form method="post" action="?/signInEmail" class="stack" use:enhance>
		<div class="field">
			<label for="email">Email</label>
			<input id="email" name="email" type="email" autocomplete="email" required class="input" />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="input"
			/>
		</div>
		<div class="field">
			<label for="name">Name <span class="muted">(when registering)</span></label>
			<input id="name" name="name" type="text" autocomplete="name" class="input" />
		</div>
		<div class="button-row">
			<button type="submit" class="button">Sign in</button>
			<button type="submit" formaction="?/signUpEmail" class="button button-secondary">
				Register
			</button>
		</div>
	</form>

	{#if form?.message}
		<p class="error-text" role="alert">{form.message}</p>
	{/if}
</main>
