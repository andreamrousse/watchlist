# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.15.2 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright sveltekit-adapter="adapter:netlify" drizzle="database:postgresql+postgresql:neon" better-auth="demo:password" --install pnpm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Database schema

Apply pending migrations (requires `DATABASE_URL` in the environment). Do **not** use `drizzle-kit push` for this project—use migrations only.

```sh
pnpm db:migrate
```

After changing `src/lib/server/db/schema.ts`, generate a new migration and commit the SQL under `drizzle/`:

```sh
pnpm db:generate
pnpm db:migrate
```

Netlify runs `pnpm db:migrate && pnpm run build` before deploy (see `netlify.toml`); add `DATABASE_URL` to the site’s **build** environment so migrations can run.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
