<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeToggle from '$lib/ThemeToggle.svelte';
	import UserMenu from '$lib/UserMenu.svelte';
	import Clapperboard from 'lucide-svelte/icons/clapperboard';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#0b0f17" data-watchlist-dynamic="true" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,500;0,600;1,400&amp;family=Plus+Jakarta+Sans:wght@600;700&amp;display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<header class="app-top-bar">
	<div class="app-top-bar-inner">
		<div class="app-top-bar-brand">
			<span class="app-top-bar-brand-symbol" aria-hidden="true">
				<Clapperboard size={17} strokeWidth={1.5} class="app-top-bar-brand-icon" />
			</span>
			<span class="app-top-bar-brand-wordmark">Moviemate</span>
		</div>
		<div class="app-top-bar-controls">
			<ThemeToggle />
			{#if data.user}
				<UserMenu email={data.user.email} />
			{/if}
		</div>
	</div>
</header>
{@render children()}
