<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';
	import { posterSrc } from '$lib/tmdb-images';
	import { MOVIE_STATUSES, MOVIE_STATUS_LABELS } from '$lib/movie-status';
	import Film from 'lucide-svelte/icons/film';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import ImageOff from 'lucide-svelte/icons/image-off';
	import List from 'lucide-svelte/icons/list';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Mail from 'lucide-svelte/icons/mail';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import User from 'lucide-svelte/icons/user';

	type SuggestHit = {
		tmdbId: number;
		title: string;
		posterPath: string | null;
		releaseYear: string | null;
	};

	let { data, form }: { data: PageServerData; form?: ActionData } = $props();

	let query = $state('');
	let searchResults = $state<SuggestHit[]>([]);
	let suggestLoading = $state(false);
	let suggestError = $state<string | null>(null);
	let suggestHadZero = $state(false);
	let adding = $state(false);
	let statusUpdatingId = $state<number | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let abortSuggest: AbortController | undefined;

	let displayName = $derived(data.user.name?.trim() || data.user.email);
	let showEmailLine = $derived(Boolean(data.user.name?.trim()));

	async function runSuggest(raw: string) {
		const trimmed = raw.trim();
		if (trimmed.length < 2) {
			searchResults = [];
			suggestHadZero = false;
			suggestLoading = false;
			suggestError = null;
			return;
		}

		abortSuggest?.abort();
		abortSuggest = new AbortController();
		suggestLoading = true;
		suggestError = null;
		suggestHadZero = false;

		try {
			const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(trimmed)}`, {
				signal: abortSuggest.signal,
				credentials: 'same-origin'
			});
			const payload: { results?: SuggestHit[]; error?: string } = await res
				.json()
				.catch(() => ({}));
			if (!res.ok) {
				suggestError = typeof payload.error === 'string' ? payload.error : 'Search failed.';
				searchResults = [];
				suggestHadZero = false;
				return;
			}
			suggestError = null;
			const next = Array.isArray(payload.results) ? payload.results : [];
			searchResults = next;
			suggestHadZero = trimmed.length >= 2 && next.length === 0;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			suggestError = 'Search failed.';
			searchResults = [];
			suggestHadZero = false;
		} finally {
			suggestLoading = false;
		}
	}

	function handleQueryInput(value: string) {
		clearTimeout(debounceTimer);
		if (value.trim().length < 2) {
			abortSuggest?.abort();
			searchResults = [];
			suggestHadZero = false;
			suggestLoading = false;
			suggestError = null;
			return;
		}
		debounceTimer = setTimeout(() => void runSuggest(value), 320);
	}
</script>

<svelte:head>
	<title>Watchlist</title>
</svelte:head>

<main class="page">
	<header class="shell-top">
		<h1 class="brand-heading">
			<Film size={22} strokeWidth={1.65} class="icon-muted" aria-hidden="true" />
			Watchlist
		</h1>

		<div class="shell-session">
			<div class="user-primary-row">
				<User size={18} strokeWidth={1.65} class="icon-muted" aria-hidden="true" />
				{displayName}
			</div>
			{#if showEmailLine}
				<p class="muted user-email-secondary">
					<Mail size={18} strokeWidth={1.65} class="icon-muted" aria-hidden="true" />
					<span class="user-email-text">{data.user.email}</span>
				</p>
			{/if}
			<form method="post" action="?/signOut">
				<button type="submit" class="button button-secondary button-has-icon">
					<LogOut size={18} strokeWidth={1.65} aria-hidden="true" />
					<span>Sign out</span>
				</button>
			</form>
		</div>
	</header>

	{#if form?.message}
		<p class="error-text alert-global" role="alert">{form.message}</p>
	{/if}

	<section class="section" aria-labelledby="add-heading">
		<h2 id="add-heading" class="section-title">
			<span class="section-title-inner">
				<CirclePlus size={18} strokeWidth={1.65} class="icon-muted" aria-hidden="true" />
				Add a movie
			</span>
		</h2>
		<p class="muted add-lead">
			Start typing a title — suggestions appear from TMDB. Pick a film to add.
		</p>
		<div class="search-field-wrap">
			<label class="sr-only" for="q">Search movies</label>
			<input
				id="q"
				type="search"
				autocomplete="off"
				placeholder="Search by title"
				class="input search-field-input"
				maxlength="500"
				bind:value={query}
				oninput={() => handleQueryInput(query)}
			/>
			{#if suggestLoading}
				<p class="search-status muted" aria-live="polite">Searching…</p>
			{/if}
		</div>

		{#if suggestError}
			<p class="error-text search-suggest-error" role="alert">{suggestError}</p>
		{/if}

		{#if searchResults.length > 0}
			<p class="search-results-caption muted">Suggestions — scroll sideways.</p>
			<div class="search-suggest-rail-wrap">
				<ul id="search-suggest-list" class="search-suggest-rail" role="list">
					{#each searchResults as hit (hit.tmdbId)}
						{@const searchPoster = posterSrc(hit.posterPath, 'w154')}
						<li class="search-suggest-item">
							<div class="search-suggest-thumb">
								{#if searchPoster}
									<img
										src={searchPoster}
										alt=""
										width="92"
										height="138"
										class="search-result-img"
										loading="lazy"
										decoding="async"
									/>
								{:else}
									<div class="poster-placeholder poster-placeholder--search" aria-hidden="true">
										<ImageOff size={28} strokeWidth={1.5} class="icon-muted" />
									</div>
								{/if}
							</div>
							<p class="search-suggest-title">{hit.title}</p>
							{#if hit.releaseYear}
								<p class="search-suggest-year muted">{hit.releaseYear}</p>
							{/if}
							<form
								method="post"
								action="?/addMovie"
								class="search-suggest-add"
								use:enhance={() => {
									adding = true;
									return async ({ result, update }) => {
										await update();
										adding = false;
										if (result.type === 'success') {
											query = '';
											searchResults = [];
											suggestHadZero = false;
										}
									};
								}}
							>
								<input type="hidden" name="title" value={hit.title} />
								<input type="hidden" name="tmdbId" value={hit.tmdbId} />
								<input type="hidden" name="posterPath" value={hit.posterPath ?? ''} />
								<button
									type="submit"
									class="button button-has-icon button-suggest-add"
									disabled={adding}
								>
									<Plus size={18} strokeWidth={1.65} aria-hidden="true" />
									<span>Add</span>
								</button>
							</form>
						</li>
					{/each}
				</ul>
			</div>
		{:else if suggestHadZero && !suggestLoading}
			<p class="muted search-empty">No matches. Try different wording.</p>
		{:else if query.trim().length > 0 && query.trim().length < 2}
			<p class="muted search-hint">Type at least two characters to search.</p>
		{/if}
	</section>

	<section class="section" aria-labelledby="list-heading">
		<h2 id="list-heading" class="section-title">
			<span class="section-title-inner">
				<List size={18} strokeWidth={1.65} class="icon-muted" aria-hidden="true" />
				Your list
			</span>
		</h2>
		{#if data.movies.length === 0}
			<p class="muted">No movies yet. Search above and add a film.</p>
		{:else}
			<ul class="movie-list">
				{#each data.movies as m (m.id)}
					{@const listPoster = posterSrc(m.posterPath, 'w92')}
					<li class="movie-item">
						<div class="movie-item-row">
							<div class="movie-item-main">
								<div class="movie-item-thumb">
									{#if listPoster}
										<img
											src={listPoster}
											alt=""
											width="48"
											height="72"
											class="movie-item-img"
											loading="lazy"
										/>
									{:else}
										<div class="poster-placeholder poster-placeholder--list" aria-hidden="true">
											<Film size={20} strokeWidth={1.5} class="icon-muted" />
										</div>
									{/if}
								</div>
								<div class="movie-item-title-row">
									<span class={`movie-status-dot movie-status-dot--${m.status}`} aria-hidden="true"
									></span>
									<span class="movie-item-title">{m.title}</span>
								</div>
							</div>
							<div class="movie-item-controls">
								<form
									method="post"
									action="?/updateMovieStatus"
									class="movie-status-form"
									use:enhance={() => {
										const updatingId = m.id;
										statusUpdatingId = updatingId;
										return async ({ update }) => {
											await update();
											statusUpdatingId = null;
										};
									}}
								>
									<input type="hidden" name="movieId" value={m.id} />
									<label class="sr-only" for={`movie-status-${m.id}`}>Status for {m.title}</label>
									<div class="movie-status-select-wrap">
										<select
											id={`movie-status-${m.id}`}
											name="status"
											class="movie-status-select"
											disabled={statusUpdatingId === m.id}
											onchange={(e) => e.currentTarget.form?.requestSubmit()}
										>
											{#each MOVIE_STATUSES as s (s)}
												<option value={s} selected={s === m.status}>{MOVIE_STATUS_LABELS[s]}</option
												>
											{/each}
										</select>
									</div>
								</form>
								<form method="post" action="?/deleteMovie" class="movie-delete-form" use:enhance>
									<input type="hidden" name="movieId" value={m.id} />
									<button
										type="submit"
										class="button-remove button-has-icon"
										aria-label="Remove from list"
									>
										<Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
									</button>
								</form>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
