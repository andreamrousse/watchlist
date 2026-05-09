# Project

## About

I will build a Watchlist app for the user to track the watched movies and the movies their want to watch

## Set up

- SvelteKit
- TypeScript
- Additional options: Prettier, ESLint, Vitest, Playwright, SvelteKit adapter, Drizzle, Better Auth
- SvelteKit adapter: Netlify
- Drizzle database: PostgreSQL
- PostgreSQL client: Neon
- Better Auth: email and password
- Package manager: pnpm

## Priorites

### Must have

- List of movies
- Movie title
- Watched / want to watch status

### Nice to have

- Movie picture
- Filter movies by status
- Sorting movies by date added
- Integration with external API to show the movie poster

### Could have

- Movie public rating (cached TMDB vote average when available)
- Movie launching date
- Movie genere
- Movie watching platform
- Sharing funcionality
- Watch trailer

## Usability

- Follow usability best practices from https://www.nngroup.com/articles/ten-usability-heuristics/
- Follow accesibility WCAG for good redability
- Follow code accesibility a11y

## Guidelines

- Use design tokens in CSS
- Use Lucide icon library https://lucide.dev/icons/
- Avoid overcomplexity, keep it simple
- **Drizzle migrations only:** use `pnpm db:generate` when the schema changes, then `pnpm db:migrate`. Never use `drizzle-kit push`; the `db:push` script is intentionally not in this repo.
- DON'T store database querie in in a .svelte file. DON'T store HTML in a .server.ts
