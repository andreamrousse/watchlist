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
