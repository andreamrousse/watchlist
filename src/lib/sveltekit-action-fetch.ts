/**
 * Helpers for `fetch`-ing SvelteKit form actions from script (when `use:enhance` is not available).
 * The server only returns deserialize-able JSON when the same headers are set as in
 * `@sveltejs/kit`’s `use:enhance` pipeline.
 */

/** Build POST URL for a `+page.server.ts` action (e.g. `?/addMovie`) from the current page’s path. */
export function pageActionUrl(pathname: string, origin: string, actionName: string): string {
	return new URL(`${pathname}?/${actionName}`, origin).href;
}

/** RequestInit for POST bodies built with URLSearchParams (default form encoding). */
export function svelteKitActionPost(bodyUrlEncoded: string): RequestInit {
	return {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
			'x-sveltekit-action': 'true',
		},
		body: bodyUrlEncoded,
		credentials: 'same-origin',
		cache: 'no-store',
	};
}
