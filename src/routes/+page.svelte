<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';
	import Film from 'lucide-svelte/icons/film';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import List from 'lucide-svelte/icons/list';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Mail from 'lucide-svelte/icons/mail';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import User from 'lucide-svelte/icons/user';

	let { data, form }: { data: PageServerData; form?: ActionData } = $props();

	let submitting = $state(false);

	let displayName = $derived(data.user.name?.trim() || data.user.email);
	let showEmailLine = $derived(Boolean(data.user.name?.trim()));
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
		<form
			method="post"
			action="?/addMovie"
			class="inline-form"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label class="sr-only" for="title">Movie title</label>
			<input
				id="title"
				name="title"
				type="text"
				autocomplete="off"
				placeholder="Movie title"
				class="input"
				required
				maxlength="500"
				disabled={submitting}
			/>
			<button type="submit" class="button button-has-icon" disabled={submitting}>
				<Plus size={18} strokeWidth={1.65} aria-hidden="true" />
				<span>Add</span>
			</button>
		</form>
	</section>

	<section class="section" aria-labelledby="list-heading">
		<h2 id="list-heading" class="section-title">
			<span class="section-title-inner">
				<List size={18} strokeWidth={1.65} class="icon-muted" aria-hidden="true" />
				Your list
			</span>
		</h2>
		{#if data.movies.length === 0}
			<p class="muted">No movies yet. Add a title above.</p>
		{:else}
			<ul class="movie-list">
				{#each data.movies as m (m.id)}
					<li class="movie-item">
						<div class="movie-item-row">
							<span class="movie-item-title">{m.title}</span>
							<form method="post" action="?/deleteMovie" class="movie-delete-form" use:enhance>
								<input type="hidden" name="movieId" value={m.id} />
								<button type="submit" class="button button-remove button-has-icon">
									<Trash2 size={16} strokeWidth={1.65} aria-hidden="true" />
									<span>Remove</span>
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
