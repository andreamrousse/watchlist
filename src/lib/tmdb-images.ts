/** TMDB image CDN — no secrets; safe for client + server. */
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export type TmdbImageSize = 'w92' | 'w154' | 'w185' | 'w342';

export function posterSrc(posterPath: string | null, size: TmdbImageSize): string | null {
	if (!posterPath) return null;
	return `${IMAGE_BASE}/${size}${posterPath}`;
}
