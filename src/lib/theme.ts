export type ColorSchemePref = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'watchlist-color-scheme';

/** Resolve `pref` against OS preference (`prefers-light` = result of `(prefers-color-scheme: light)`). */
export function getResolvedTheme(pref: ColorSchemePref, prefersLight: boolean): 'light' | 'dark' {
	if (pref === 'light' || pref === 'dark') return pref;
	return prefersLight ? 'light' : 'dark';
}

export function readPref(): ColorSchemePref {
	if (typeof localStorage === 'undefined') return 'system';
	try {
		const v = localStorage.getItem(THEME_STORAGE_KEY);
		if (v === 'light' || v === 'dark' || v === 'system') return v;
	} catch {
		/* ignore */
	}
	return 'system';
}

export function writePref(pref: ColorSchemePref): void {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, pref);
	} catch {
		/* ignore */
	}
}

export function prefersColorSchemeLight(): boolean {
	return typeof window !== 'undefined'
		? window.matchMedia('(prefers-color-scheme: light)').matches
		: false;
}

export function applyDataTheme(theme: 'light' | 'dark'): void {
	document.documentElement.setAttribute('data-theme', theme);
	document.documentElement.style.setProperty('color-scheme', theme);
}

/** Match status bar tint to `html[data-theme] --color-bg` (tokens in app.css). */
export function updateThemeColorMeta(): void {
	const el = document.querySelector('meta[name="theme-color"][data-watchlist-dynamic]');
	if (!(el instanceof HTMLMetaElement)) return;
	const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
	if (bg !== '') el.content = bg;
}
