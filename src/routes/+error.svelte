<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import CloudOff from 'lucide-svelte/icons/cloud-off';
	import FileQuestionMark from 'lucide-svelte/icons/file-question-mark';
	import Lock from 'lucide-svelte/icons/lock';
	import ServerCrash from 'lucide-svelte/icons/server-crash';
	import Timer from 'lucide-svelte/icons/timer';

	type ErrorTone = 'error' | 'warn';

	type ErrorVisual = {
		title: string;
		detail: string;
		tone: ErrorTone;
	};

	function metaFor(code: number): ErrorVisual {
		switch (code) {
			case 403:
				return {
					title: 'You don’t have permission to view this',
					detail:
						'This address exists, but Moviemate won’t serve it with your current session—or it’s reserved for a different role or account.',
					tone: 'warn'
				};
			case 404:
				return {
					title: 'We couldn’t find that page',
					detail:
						'The address might be mistyped or the link is old. Use the Moviemate bar above or go home and pick something from there.',
					tone: 'warn'
				};
			case 408:
				return {
					title: 'That took too long',
					detail:
						'The request timed out before it finished—often a flaky connection or heavy load. Reload once; if nothing changes, try again in a little while.',
					tone: 'warn'
				};
			case 500:
				return {
					title: 'Something went wrong on our side',
					detail:
						'Moviemate hit an internal error preparing this screen. Refresh the page—or wait a minute and reload—while we stabilize things.',
					tone: 'error'
				};
			case 502:
				return {
					title: 'We hit a snag talking to another service',
					detail:
						'A step in loading this screen failed midway (often gateway or upstream hiccups). Try again shortly; these issues usually resolve on their own.',
					tone: 'warn'
				};
			case 503:
				return {
					title: 'Moviemate can’t respond right now',
					detail:
						'A dependency or upstream service is overloaded or paused—during deploys or outages this can happen briefly. Pause a moment and reload.',
					tone: 'warn'
				};
			case 504:
				return {
					title: 'The upstream step didn’t reply in time',
					detail:
						'A service Moviemate called never finished answering. Reload to retry; sustained problems usually mean the provider is strained or down.',
					tone: 'warn'
				};
			default:
				return {
					title: 'This page couldn’t load',
					detail:
						'Something interrupted the request before Moviemate could finish loading. Reload, go home, or try again later—you’re not blocked from fixing it on your end.',
					tone: code >= 400 && code < 500 ? 'warn' : 'error'
				};
		}
	}

	let meta = $derived(metaFor(page.status));
	let rawMessage = $derived(
		page.error?.message !== undefined &&
			page.error.message !== null &&
			String(page.error.message).trim().length > 0
			? String(page.error.message).trim()
			: null
	);
</script>

<svelte:head>
	<title>Error {page.status} · Moviemate</title>
</svelte:head>

<main class="page page--stacked-sections">
	<section
		class="section section-panel error-page-panel"
		aria-labelledby="error-page-heading"
	>
		<span class="error-page-code-badge" aria-hidden="true">{page.status}</span>
		<div
			class="error-page-icon-wrap"
			class:error-page-icon-wrap--error={meta.tone === 'error'}
			class:error-page-icon-wrap--warn={meta.tone === 'warn'}
		>
			{#if page.status === 404}
				<FileQuestionMark size={30} strokeWidth={1.5} class="error-page-icon" />
			{:else if page.status === 403}
				<Lock size={30} strokeWidth={1.5} class="error-page-icon" />
			{:else if page.status === 408}
				<Timer size={30} strokeWidth={1.5} class="error-page-icon" />
			{:else if page.status === 500}
				<ServerCrash size={30} strokeWidth={1.65} class="error-page-icon" />
			{:else if page.status === 502 || page.status === 503 || page.status === 504}
				<CloudOff size={30} strokeWidth={1.55} class="error-page-icon" />
			{:else}
				<CircleAlert size={30} strokeWidth={1.65} class="error-page-icon" />
			{/if}
		</div>
		<h1 id="error-page-heading" class="error-page-heading">{meta.title}</h1>
		<p class="error-page-lead muted">{meta.detail}</p>
		{#if dev && rawMessage}
			<details class="error-page-dev">
				<summary>Technical details (dev)</summary>
				<code class="error-page-dev-msg">{rawMessage}</code>
			</details>
		{/if}
		<div class="button-row error-page-actions">
			<button type="button" class="button button-secondary" onclick={() => location.reload()}>
				Try reloading
			</button>
			<a href="/" class="button">Go home</a>
		</div>
	</section>
</main>
