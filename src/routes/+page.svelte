<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form?: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Watchlist</title>
</svelte:head>

<main class="page">
	<header class="page-header">
		<h1 class="page-title">Watchlist</h1>
		<p class="muted">Signed in as {data.user.email}</p>
		<form method="post" action="?/signOut" class="signout-form">
			<button type="submit" class="button button-secondary">Sign out</button>
		</form>
	</header>

	<section class="section" aria-labelledby="add-heading">
		<h2 id="add-heading" class="section-title">Add a movie</h2>
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
			<button type="submit" class="button" disabled={submitting}>Add</button>
		</form>
		{#if form?.message}
			<p class="error-text" role="alert">{form.message}</p>
		{/if}
	</section>

	<section class="section" aria-labelledby="list-heading">
		<h2 id="list-heading" class="section-title">Your list</h2>
		{#if data.movies.length === 0}
			<p class="muted">No movies yet. Add a title above.</p>
		{:else}
			<ul class="movie-list">
				{#each data.movies as m (m.id)}
					<li class="movie-item">{m.title}</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
