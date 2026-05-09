<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';
	import { posterSrc } from '$lib/tmdb-images';
	import { MOVIE_STATUSES, MOVIE_STATUS_LABELS, type MovieStatus } from '$lib/movie-status';
	import Film from 'lucide-svelte/icons/film';
	import ImageOff from 'lucide-svelte/icons/image-off';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import Plus from 'lucide-svelte/icons/plus';
	import SearchSlash from 'lucide-svelte/icons/search-slash';
	import Star from 'lucide-svelte/icons/star';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	type SuggestHit = {
		tmdbId: number;
		title: string;
		posterPath: string | null;
		releaseYear: string | null;
	};

	type ListStatusFilter = 'all' | MovieStatus;
	type ListSortMode = 'date_added' | 'public_score' | 'alphabetically';

	const SORT_OPTION_LABELS: Record<ListSortMode, string> = {
		date_added: 'Date added',
		public_score: 'TMDB score',
		alphabetically: 'Alphabetically'
	};

	const SORT_MODES_ORDER: ListSortMode[] = ['date_added', 'public_score', 'alphabetically'];

	const FILTER_TAB_LABELS: Record<ListStatusFilter, string> = {
		all: 'All',
		want_to_watch: 'Want',
		watching: 'Watching',
		watched: 'Watched'
	};

	const FILTER_TAB_ARIA_HINT: Partial<Record<ListStatusFilter, string>> = {
		all: 'All statuses',
		want_to_watch: MOVIE_STATUS_LABELS.want_to_watch
	};

	type FilterTab = { filter: ListStatusFilter; label: string };
	const FILTER_TABS: FilterTab[] = [
		{ filter: 'all', label: FILTER_TAB_LABELS.all },
		...MOVIE_STATUSES.map((s): FilterTab => ({ filter: s, label: FILTER_TAB_LABELS[s] }))
	];

	function createdAtMs(movie: { createdAt: Date | string }): number {
		const t = new Date(movie.createdAt).getTime();
		return Number.isFinite(t) ? t : 0;
	}

	let { data, form }: { data: PageServerData; form?: ActionData } = $props();

	let listStatusFilter = $state<ListStatusFilter>('all');
	let listSortMode = $state<ListSortMode>('date_added');

	let displayedMovies = $derived.by(() => {
		let rows = [...data.movies];
		if (listStatusFilter !== 'all') {
			rows = rows.filter((m) => m.status === listStatusFilter);
		}
		rows.sort((a, b) => {
			if (listSortMode === 'alphabetically') {
				const c = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
				return c !== 0 ? c : a.id - b.id;
			}
			if (listSortMode === 'public_score') {
				const diff = publicScoreSortKey(b) - publicScoreSortKey(a);
				if (diff !== 0) return diff;
				const d = createdAtMs(b) - createdAtMs(a);
				return d !== 0 ? d : b.id - a.id;
			}
			const d = createdAtMs(b) - createdAtMs(a);
			return d !== 0 ? d : b.id - a.id;
		});
		return rows;
	});

	let query = $state('');
	let searchResults = $state<SuggestHit[]>([]);
	let suggestLoading = $state(false);
	let suggestError = $state<string | null>(null);
	let suggestHadZero = $state(false);
	let adding = $state(false);
	let statusUpdatingId = $state<number | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let abortSuggest: AbortController | undefined;

	let sortDropdownOpen = $state(false);
	let sortDropdownEl: HTMLDivElement | undefined = $state();

	function publicScoreSortKey(movie: {
		tmdbVoteAverage: number | null;
	}): number {
		if (movie.tmdbVoteAverage != null && Number.isFinite(Number(movie.tmdbVoteAverage))) {
			return Number(movie.tmdbVoteAverage);
		}
		return -1;
	}

	function formatCompactVotes(n: number): string {
		return `${new Intl.NumberFormat(undefined, { notation: 'compact' }).format(n)} votes`;
	}

	onMount(() => {
		const onDocClick = (e: MouseEvent) => {
			const t = e.target;
			if (!(t instanceof Node)) return;

			const sortEl = sortDropdownEl;
			if (sortEl && !sortEl.contains(t)) sortDropdownOpen = false;
		};
		document.addEventListener('click', onDocClick, true);
		return () => document.removeEventListener('click', onDocClick, true);
	});

	function toggleSortDropdown(e: MouseEvent): void {
		e.stopPropagation();
		sortDropdownOpen = !sortDropdownOpen;
	}

	function chooseSort(mode: ListSortMode): void {
		listSortMode = mode;
		sortDropdownOpen = false;
	}

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

	function clearSearch(): void {
		query = '';
		clearTimeout(debounceTimer);
		abortSuggest?.abort();
		searchResults = [];
		suggestHadZero = false;
		suggestLoading = false;
		suggestError = null;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') sortDropdownOpen = false;
	}}
/>

<svelte:head>
	<title>Moviemate</title>
</svelte:head>

<main class="page page--stacked-sections">
	{#if form?.message}
		<p class="error-text alert-global" role="alert">{form.message}</p>
	{/if}

	<section class="section section-panel" aria-labelledby="add-heading">
		<h2 id="add-heading" class="section-title">Add a movie</h2>
		<p class="muted add-lead">
			What do you feel like watching? Start typing and we’ll suggest a few titles—add the one you
			meant.
		</p>
		<div class="search-field-wrap">
			<label class="sr-only" for="q">Search movies by title</label>
			<div class="search-field-inner" class:search-field-inner--has-clear={query.trim().length > 0}>
				<input
					id="q"
					type="text"
					role="searchbox"
					inputmode="search"
					autocomplete="off"
					enterkeyhint="search"
					placeholder="Search by movie title"
					class="input search-field-input"
					maxlength="500"
					bind:value={query}
					oninput={() => handleQueryInput(query)}
				/>
				{#if query.trim().length > 0}
					<button
						type="button"
						class="search-field-clear button-has-icon"
						aria-label="Clear movie search"
						onclick={() => clearSearch()}
					>
						<X size={16} strokeWidth={1.85} aria-hidden="true" />
					</button>
				{/if}
			</div>
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
			<div class="search-callout" role="status">
				<SearchSlash
					size={22}
					strokeWidth={1.6}
					class="search-callout-icon icon-muted"
					aria-hidden="true"
				/>
				<div class="search-callout-body">
					<p class="search-callout-title">Nothing matched</p>
					<p class="search-callout-detail">
						Try simpler words or a different spelling—we’ll show new picks as you go.
					</p>
				</div>
			</div>
		{:else if query.trim().length > 0 && query.trim().length < 2}
			<div class="search-callout" role="status">
				<Keyboard
					size={22}
					strokeWidth={1.6}
					class="search-callout-icon icon-muted"
					aria-hidden="true"
				/>
				<div class="search-callout-body">
					<p class="search-callout-title">One more letter</p>
					<p class="search-callout-detail">
						Add one more character—then we’ll start surfacing titles that match what you typed.
					</p>
				</div>
			</div>
		{/if}
	</section>

	<section class="section section-panel" aria-labelledby="list-heading">
		<h2 id="list-heading" class="section-title">Watchlist</h2>
		{#if data.movies.length === 0}
			<p class="muted">No movies yet. Search above and add a film.</p>
		{:else}
			<div class="list-controls">
				<div class="list-controls-row">
					<div class="list-filter-tabs" role="tablist" aria-label="Filter by status">
						{#each FILTER_TABS as { filter: f, label } (f)}
							<button
								type="button"
								class="list-filter-tab"
								role="tab"
								id={`list-tab-${f}`}
								aria-selected={listStatusFilter === f}
								tabindex={listStatusFilter === f ? 0 : -1}
								onclick={() => (listStatusFilter = f)}
								{...FILTER_TAB_ARIA_HINT[f] ? { 'aria-label': FILTER_TAB_ARIA_HINT[f]! } : {}}
							>
								{label}
							</button>
						{/each}
					</div>
					<div class="list-sort-dropdown" bind:this={sortDropdownEl}>
						<button
							type="button"
							class="list-sort-trigger"
							id="list-sort-trigger"
							aria-expanded={sortDropdownOpen}
							aria-haspopup="menu"
							aria-controls="list-sort-menu"
							onclick={(e) => toggleSortDropdown(e)}
						>
							<ArrowUpDown
								size={14}
								strokeWidth={1.75}
								class="list-sort-trigger-icon icon-muted"
								aria-hidden="true"
							/>
							<span class="list-sort-trigger-label">
								<span class="list-sort-trigger-prefix">Sort:</span>
								<span class="list-sort-trigger-value">{SORT_OPTION_LABELS[listSortMode]}</span>
							</span>
							<ChevronDown
								size={14}
								strokeWidth={2}
								class="list-sort-trigger-chevron"
								aria-hidden="true"
							/>
						</button>
						{#if sortDropdownOpen}
							<div
								id="list-sort-menu"
								class="list-sort-menu"
								role="menu"
								aria-labelledby="list-sort-trigger"
							>
								{#each SORT_MODES_ORDER as mode (mode)}
									<button
										type="button"
										class="list-sort-menu-item"
										class:list-sort-menu-item--selected={listSortMode === mode}
										role="menuitemradio"
										aria-checked={listSortMode === mode}
										onclick={() => chooseSort(mode)}
									>
										{SORT_OPTION_LABELS[mode]}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
			{#if displayedMovies.length === 0}
				<p class="muted">No movies match this filter.</p>
			{:else}
				<ul class="movie-list">
					{#each displayedMovies as m (m.id)}
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
									<div class="movie-item-meta">
										<div class="movie-item-title-row">
											<span
												class={`movie-status-dot movie-status-dot--${m.status}`}
												aria-hidden="true"
											></span>
											<span class="movie-item-title">{m.title}</span>
										</div>
										{#if m.tmdbVoteAverage != null && Number.isFinite(Number(m.tmdbVoteAverage))}
											{@const tmdbAvg = Number(m.tmdbVoteAverage)}
											{@const scoreTitle =
												`TMDB community average ${tmdbAvg.toFixed(1)} out of 10.` +
												(m.tmdbVoteCount != null && m.tmdbVoteCount > 0
													? ` ${formatCompactVotes(m.tmdbVoteCount)}`
													: '')}
											<div class="movie-public-score" title={scoreTitle} aria-label={scoreTitle}>
												<span class="movie-public-score-visual" aria-hidden="true">
													<Star
														size={14}
														strokeWidth={2}
														class="movie-public-score-star"
														fill="currentColor"
													/>
													<span class="movie-public-score-value">{tmdbAvg.toFixed(1)}</span>
													<span class="movie-public-score-max">/10</span>
												</span>
											</div>
										{/if}
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
													<option value={s} selected={s === m.status}
														>{MOVIE_STATUS_LABELS[s]}</option
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
		{/if}
	</section>
</main>
