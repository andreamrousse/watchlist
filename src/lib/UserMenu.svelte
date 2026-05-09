<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import LogOut from 'lucide-svelte/icons/log-out';

	let { email }: { email: string } = $props();

	let open = $state(false);
	let rootEl: HTMLDivElement | undefined = $state();

	function initialFromEmail(addr: string): string {
		const m = addr.trim().match(/[A-Za-z0-9]/u);
		return m ? m[0].toUpperCase() : '?';
	}

	let initial = $derived(initialFromEmail(email));

	function toggle(): void {
		open = !open;
	}

	function close(): void {
		open = false;
	}

	onMount(() => {
		const onDocClick = (e: MouseEvent) => {
			if (!open) return;
			const t = e.target;
			if (t instanceof Node && rootEl?.contains(t)) return;
			close();
		};
		document.addEventListener('click', onDocClick, true);
		return () => document.removeEventListener('click', onDocClick, true);
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') close();
	}}
/>

<div class="user-menu" bind:this={rootEl}>
	<button
		type="button"
		class="user-menu-trigger"
		aria-expanded={open}
		aria-haspopup="true"
		aria-controls="user-menu-panel"
		onclick={(e) => {
			e.stopPropagation();
			toggle();
		}}
	>
		<span class="user-avatar" aria-hidden="true">{initial}</span>
		<span class="sr-only">Account menu for {email}</span>
	</button>

	{#if open}
		<div id="user-menu-panel" class="user-menu-dropdown" role="menu">
			<p class="user-menu-email">{email}</p>
			<form
				method="post"
				action="/?/signOut"
				role="none"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						close();
					};
				}}
			>
				<button
					type="submit"
					class="user-menu-signout button button-secondary button-has-icon"
					role="menuitem"
				>
					<LogOut size={18} strokeWidth={1.65} aria-hidden="true" />
					<span>Sign out</span>
				</button>
			</form>
		</div>
	{/if}
</div>
