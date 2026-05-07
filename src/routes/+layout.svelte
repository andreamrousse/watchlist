<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#f6f7f9" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0f1419" media="(prefers-color-scheme: dark)" />
</svelte:head>

{@render children()}
