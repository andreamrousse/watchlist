<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import Clapperboard from 'lucide-svelte/icons/clapperboard';

	let { form }: { form: ActionData } = $props();

	type AuthMode = 'signIn' | 'signUp';

	let authMode = $state<AuthMode>('signIn');
	let signInEmail = $state('');
	let signInPassword = $state('');
	let signUpEmail = $state('');
	let signUpPassword = $state('');

	function selectAuthMode(next: AuthMode): void {
		if (next === authMode) return;
		authMode = next;
	}

	function onToggleKeydown(e: KeyboardEvent): void {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		selectAuthMode(e.key === 'ArrowRight' ? 'signUp' : 'signIn');
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
				onclick={() => selectAuthMode('signIn')}
				onkeydown={onToggleKeydown}
			>
				Log in
			</button>
			<button
				type="button"
				class="login-mode-switch-tab"
				aria-pressed={authMode === 'signUp'}
				onclick={() => selectAuthMode('signUp')}
				onkeydown={onToggleKeydown}
			>
				Create account
			</button>
		</div>

		<form id="login-form-panel" class="login-form stack" method="post" use:enhance>
			<div class="login-field">
				<label class="login-field-label" for="email">Email</label>
				{#if authMode === 'signIn'}
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
						class="input login-input"
						bind:value={signInEmail}
					/>
				{:else}
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
						class="input login-input"
						bind:value={signUpEmail}
					/>
				{/if}
			</div>
			<div class="login-field">
				<label class="login-field-label" for="password">Password</label>
				{#if authMode === 'signIn'}
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						placeholder="Enter your password"
						required
						class="input login-input"
						bind:value={signInPassword}
					/>
				{:else}
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						minlength={8}
						placeholder="At least 8 characters"
						required
						class="input login-input"
						bind:value={signUpPassword}
					/>
				{/if}
			</div>
			{#if authMode === 'signIn'}
				<p class="login-forgot">
					<a href="/login/forgot-password" class="login-inline-link">Forgot password?</a>
				</p>
			{/if}
			<button
				type="submit"
				class="button login-submit"
				formaction={authMode === 'signIn' ? '?/signInEmail' : '?/signUpEmail'}
			>
				{authMode === 'signIn' ? 'Log in' : 'Create account'}
			</button>

			{#if form?.loginBanner && form.loginBannerFor === authMode}
				<div class="login-banner" role="alert">
					<span class="login-banner-icon-wrap" aria-hidden="true">
						<CircleAlert size={22} strokeWidth={1.75} class="login-banner-icon" />
					</span>
					<div class="login-banner-copy">
						<p class="login-banner-title">{form.loginBanner.headline}</p>
						<p class="login-banner-detail">{form.loginBanner.detail}</p>
					</div>
				</div>
			{/if}
		</form>
	</section>
</main>
