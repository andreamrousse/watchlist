<script lang="ts">
	import type { MovieStatus } from '$lib/movie-status';
	import Clapperboard from 'lucide-svelte/icons/clapperboard';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import Heart from 'lucide-svelte/icons/heart';

	let {
		status,
		size = 14,
		class: className = ''
	}: {
		status: MovieStatus;
		size?: number;
		class?: string;
	} = $props();

	let iconClass = $derived(`movie-status-icon ${className}`.trim());
</script>

{#if status === 'want_to_watch'}
	<Heart size={size} strokeWidth={1.75} class={iconClass} aria-hidden="true" />
{:else if status === 'watching'}
	<Clapperboard size={size} strokeWidth={1.6} class={iconClass} aria-hidden="true" />
{:else}
	<CircleCheck size={size} strokeWidth={2} class={iconClass} aria-hidden="true" />
{/if}
