<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#e8e4df" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#141312" media="(prefers-color-scheme: dark)" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,500;0,600;1,400&amp;display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
