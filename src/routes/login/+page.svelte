<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import LogIn from 'lucide-svelte/icons/log-in';
	import UserPlus from 'lucide-svelte/icons/user-plus';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign in — Moviemate</title>
</svelte:head>

<main class="page page-narrow">
	<h1 class="page-title login-brand">Sign in</h1>
	<p class="muted login-lead">Sign in or create an account with email and password.</p>

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
			<button type="submit" class="button button-has-icon">
				<LogIn size={18} strokeWidth={1.65} aria-hidden="true" />
				<span>Sign in</span>
			</button>
			<button
				type="submit"
				formaction="?/signUpEmail"
				class="button button-secondary button-has-icon"
			>
				<UserPlus size={18} strokeWidth={1.65} aria-hidden="true" />
				<span>Register</span>
			</button>
		</div>
	</form>

	{#if form?.message}
		<p class="error-text" role="alert">{form.message}</p>
	{/if}
</main>
