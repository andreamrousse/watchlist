<script lang="ts">
	import { onMount } from 'svelte';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Moon from 'lucide-svelte/icons/moon';
	import Sun from 'lucide-svelte/icons/sun';
	import {
		readPref,
		writePref,
		getResolvedTheme,
		prefersColorSchemeLight,
		applyDataTheme,
		updateThemeColorMeta,
		type ColorSchemePref
	} from '$lib/theme';

	let pref = $state<ColorSchemePref>('system');

	function sync(): void {
		const prefersLight = prefersColorSchemeLight();
		const resolved = getResolvedTheme(pref, prefersLight);
		applyDataTheme(resolved);
		updateThemeColorMeta();
	}

	onMount(() => {
		pref = readPref();
		sync();
		const mq = window.matchMedia('(prefers-color-scheme: light)');
		const onChange = () => {
			if (pref === 'system') sync();
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function setPref(next: ColorSchemePref): void {
		pref = next;
		writePref(next);
		sync();
	}
</script>

<div class="theme-toggle" role="group" aria-label="Appearance">
	<button
		type="button"
		class="theme-toggle-btn"
		aria-pressed={pref === 'system'}
		aria-label="Match system"
		onclick={() => setPref('system')}
	>
		<Monitor size={16} strokeWidth={1.75} aria-hidden="true" />
	</button>
	<button
		type="button"
		class="theme-toggle-btn"
		aria-pressed={pref === 'light'}
		aria-label="Light mode"
		onclick={() => setPref('light')}
	>
		<Sun size={16} strokeWidth={1.75} aria-hidden="true" />
	</button>
	<button
		type="button"
		class="theme-toggle-btn"
		aria-pressed={pref === 'dark'}
		aria-label="Dark mode"
		onclick={() => setPref('dark')}
	>
		<Moon size={16} strokeWidth={1.75} aria-hidden="true" />
	</button>
</div>
