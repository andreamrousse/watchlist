<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Clapperboard from 'lucide-svelte/icons/clapperboard';

	let { form }: { form: ActionData } = $props();

	type AuthMode = 'signIn' | 'signUp';
	type AutoKeyword = Exclude<HTMLInputAttributes['autocomplete'], null | undefined>;

	let authMode = $state<AuthMode>('signIn');
	let passwordAutocomplete = $derived<AutoKeyword>(
		authMode === 'signIn' ? 'current-password' : 'new-password'
	);

	function onToggleKeydown(e: KeyboardEvent): void {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		authMode = e.key === 'ArrowRight' ? 'signUp' : 'signIn';
	}
</script>

<svelte:head>
	<title>{authMode === 'signIn' ? 'Sign in' : 'Create account'} — Moviemate</title>
</svelte:head>

<main class="page page-narrow login-page">
	<section class="login-card" aria-labelledby="login-heading">
		<div class="login-brand-mark" aria-hidden="true">
			<Clapperboard size={28} strokeWidth={1.5} class="login-brand-icon" />
		</div>

		<h1 id="login-heading" class="login-heading">Welcome to Moviemate</h1>
		<p class="login-subtitle">
			{#if authMode === 'signIn'}
				Log in to open your saved watchlist.
			{:else}
				Sign up to save films to your watchlist.
			{/if}
		</p>

		<div class="login-mode-switch" role="group" aria-label="Log in or create account">
			<button
				type="button"
				class="login-mode-switch-tab"
				aria-pressed={authMode === 'signIn'}
				onclick={() => (authMode = 'signIn')}
				onkeydown={onToggleKeydown}
			>
				Log in
			</button>
			<button
				type="button"
				class="login-mode-switch-tab"
				aria-pressed={authMode === 'signUp'}
				onclick={() => (authMode = 'signUp')}
				onkeydown={onToggleKeydown}
			>
				Create account
			</button>
		</div>

		<form id="login-form-panel" class="login-form stack" method="post" use:enhance>
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
				/>
			</div>
			<div class="login-field">
				<label class="login-field-label" for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete={passwordAutocomplete}
					placeholder={authMode === 'signIn' ? 'Enter your password' : 'Choose a password'}
					required
					class="input login-input"
				/>
			</div>
			<button
				type="submit"
				class="button login-submit"
				formaction={authMode === 'signIn' ? '?/signInEmail' : '?/signUpEmail'}
			>
				{authMode === 'signIn' ? 'Log in' : 'Create account'}
			</button>
		</form>
	</section>

	{#if form?.message}
		<p class="error-text login-error" role="alert">{form.message}</p>
	{/if}
</main>
