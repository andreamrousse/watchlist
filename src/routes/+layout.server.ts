import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const u = locals.user;
	return {
		user: u?.email ? { email: u.email, name: u.name ?? null } : null
	};
};
