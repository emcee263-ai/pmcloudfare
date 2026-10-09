# PEACEMAGENTS storefront

Next.js 15 (App Router), TypeScript, Tailwind CSS 3, Zustand and Supabase. It deploys to Cloudflare Workers through the OpenNext adapter (`@opennextjs/cloudflare`).

## Run it locally

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

With the Supabase values left empty the app runs on sample products from `src/lib/mock-data.ts`, so you can work on the UI straight away. Checkout returns a demo order in that mode.

To test the app inside the Workers runtime, as it will run on Cloudflare:

```bash
npm run preview
```

## Connect Supabase

1. Create a project and run the base schema from the technical document in the SQL editor.
2. Run `supabase/extras.sql`. It adds the `drop_at` column, a profile-on-signup trigger, RLS policies and realtime stock.
3. Fill in `.env.local` (see the table below).
4. Create a public Storage bucket called `product-images` and add rows to `product_images` with the public URLs.
5. Sign up on `/login`, then run the last line of `extras.sql` to make yourself an admin.

## Deploy to Cloudflare

You need a free Cloudflare account. The Worker name is set in `wrangler.jsonc` (`peacemagents`).

### Option A: from your terminal

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` builds the app and uploads it. Your `NEXT_PUBLIC_*` values must be in `.env.local` when you run it, because they are baked in at build time. Then add the server secret:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Option B: connect GitHub (deploys on every push)

1. Push the project to GitHub.
2. In the Cloudflare dashboard go to Workers & Pages, create an application and import the repository.
3. Build command: `npx opennextjs-cloudflare build`. Deploy command: `npx opennextjs-cloudflare deploy`.
4. Under build variables add the `NEXT_PUBLIC_*` values. Under the Worker's variables and secrets add `SUPABASE_SERVICE_ROLE_KEY`.
5. The Worker name in Cloudflare must match `name` in `wrangler.jsonc`.

### Where each setting goes

| Setting | When it is read | Where to set it on Cloudflare |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CURRENCY` | Build time | Build variables (option B) or `.env.local` on your machine (option A) |
| `SUPABASE_SERVICE_ROLE_KEY` and the payment keys | Runtime | Worker secrets |

If `NEXT_PUBLIC_SUPABASE_URL` is missing at build time, the deployed site silently falls back to sample products. If the live site shows sample products, this is the first thing to check.

### After the first deploy

- Set `NEXT_PUBLIC_SITE_URL` to your live address and redeploy, so product share previews use the right links.
- In Supabase, go to Authentication, URL configuration, and add your live address as the Site URL and as a redirect URL. Without this, sign-up confirmation emails send people to the wrong place.

## How it is set up for Cloudflare

- `wrangler.jsonc`: the Worker, its static assets, and the image binding used by `next/image`.
- `open-next.config.ts`: default adapter config.
- `public/_headers`: long cache lifetime for the hashed files in `/_next/static`.
- Pages that read products (home, drops, product page) render fresh on every request, so stock and drop times are never stale. This also means no R2 bucket or queue is needed. If you later want cached pages, follow the OpenNext caching guide and set up an R2 incremental cache.
- `src/middleware.ts` stays on the default edge runtime, which the adapter supports. Node.js middleware is not supported yet.
- Do not add `export const runtime = 'edge'` to routes. Leave them on the default runtime.

## Structure

```
src/app            routes: / shop drops lookbook product/[slug] checkout login account admin api/checkout
src/components     layout, cart drawer, product, checkout, account, admin, ui
src/store          cart.ts (persisted Zustand cart), ui.ts (drawer and menu state)
src/lib            supabase clients, product queries, mock data, validation, utils
src/middleware.ts  protects /account and /admin
supabase/          extras.sql
wrangler.jsonc     Cloudflare Worker config
```

## What is wired and what is not

Done: drop hero with countdown, catalog with filters, product page with live stock and size guide, slide-out cart with coupon (`PEACE10` in demo), validated checkout form, order tracker, customer account, admin stock and order status editing, per-product OpenGraph tags.

Still to build: the payment step. `/api/checkout` saves a `pending` order and redirects to the success page. Replace the TODO in that route with Stripe or Paynow/Ecocash session creation, then add a webhook that sets the order to `paid` and decrements stock.

Placeholders to replace: product photos (line drawings show until you add images), lookbook frames, size guide measurements, and the sample copy.
