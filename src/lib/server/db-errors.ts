/** True when Postgres reports a missing column (e.g. migrations not applied yet). */
export function dbErrorLooksLikeMissingMigration(err: unknown): boolean {
	const ex = err as unknown;
	let text = '';
	let code = '';
	if (ex instanceof Error) {
		text = ex.message;
		const maybe = ex as unknown as { cause?: unknown };
		if (maybe.cause instanceof Error) text += ` ${maybe.cause.message}`;
		else if (maybe.cause != null) text += ` ${String(maybe.cause)}`;
		const codeField = ex as unknown as { code?: unknown };
		if (typeof codeField.code === 'string') code = codeField.code;
	} else {
		text = String(ex);
	}
	return (
		code === '42703' ||
		text.includes('42703') ||
		/\bcolumn\b.*\bdoes not exist\b/i.test(text) ||
		/tmdb_release_year/i.test(text)
	);
}

/** True when Postgres reports a unique violation (e.g. duplicate movie per user). */
export function dbErrorLooksLikeUniqueViolation(err: unknown): boolean {
	let cur: unknown = err;
	for (let depth = 0; cur != null && depth < 8; depth++) {
		const o = cur as { code?: unknown; message?: unknown };
		const code = typeof o.code === 'string' ? o.code : '';
		if (code === '23505') return true;

		let text = '';
		if (cur instanceof Error) text = cur.message;
		else if (typeof o.message === 'string') text = o.message;
		else text = String(cur);
		if (/\b23505\b/.test(text) || /\bduplicate key\b/i.test(text) || /\bunique constraint\b/i.test(text))
			return true;

		const cause =
			cur instanceof Error && 'cause' in cur
				? (cur as Error & { cause?: unknown }).cause
				: undefined;
		cur = cause;
	}
	return false;
}
