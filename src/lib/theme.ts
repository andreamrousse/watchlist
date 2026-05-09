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

/** Match status bar tint to `--color-bg` for each resolved theme */
export function updateThemeColorMeta(theme: 'light' | 'dark'): void {
	const el = document.querySelector('meta[name="theme-color"][data-watchlist-dynamic]');
	if (el instanceof HTMLMetaElement) {
		el.content = theme === 'light' ? '#eef1f9' : '#0b0f17';
	}
}
