export const MOVIE_STATUSES = ['want_to_watch', 'watching', 'watched'] as const;
export type MovieStatus = (typeof MOVIE_STATUSES)[number];

export const MOVIE_STATUS_LABELS: Record<MovieStatus, string> = {
	want_to_watch: 'Want to watch',
	watching: 'Watching',
	watched: 'Watched'
};

export function isMovieStatus(value: string): value is MovieStatus {
	return (MOVIE_STATUSES as readonly string[]).includes(value);
}
