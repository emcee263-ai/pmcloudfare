# PEACEMAGENTS storefront

Next.js 15 (App Router), TypeScript, Tailwind CSS 3 and Zustand, running on Cloudflare Workers through the OpenNext adapter.

- **Database:** Cloudflare D1. Products, sizes, stock, images, drop dates, orders and accounts all live there.
- **Admin dashboard:** `/admin`. Add, edit, hide and delete products, set stock and drop dates, and manage orders.
- **Payments:** Paynow Zimbabwe. Ecocash and OneMoney (a prompt on the customer's phone) and Visa, Mastercard or other methods on Paynow's secure page. Card details never touch this site. Card availability depends on your Paynow account, so ask Paynow to enable it.
- **Enquiries:** every product page has WhatsApp, email, call and Instagram buttons, and there is a `/contact` page. Edit the details in `src/lib/site.ts`.
- **Themes and screen sizes:** the site follows your device: dark on a dark-mode phone or computer, light on a light-mode one, and it switches by itself when the device does. The button in the header cycles through "follow my device" (monitor icon), light (sun) and dark (moon), and remembers the choice. Colours live in `src/app/globals.css` (the `--bg`, `--fg`, `--surface` and `--mute` values). Layouts stretch to the full width on phones, tablets, laptops and wide monitors, and respect phone notches. Text grows gently on big screens, and a phone showing the "desktop site" gets larger text so it stays readable.
- **Intro on the home page:** the PM logo builds itself on a blank screen, then the cover slides away. It plays once per browser session, a tap skips it, and it is skipped for visitors who prefer reduced motion. The logo is drawn in `src/components/ui/PMLogo.tsx`; timing is in the "Intro" block at the bottom of `globals.css`.
- **Fonts:** body text is Inter, stored in `public/fonts/`. Headings use Syne (the wide black look), loaded from Google Fonts. To serve Syne from this site instead, follow `public/fonts/README.txt`.
- **Search engines (SEO):** every public page has its own title, description and canonical address; products carry structured data (price, stock, photos) that search engines can show as rich results; `/sitemap.xml` lists every page and product; `/robots.txt` keeps checkout, account and API pages out of search; there is a web app manifest and PM icons. See "Search engines" below.
- **Policies:** `/faq`, `/privacy`, `/cookies` and `/terms`, plus a short cookie notice. Read them and check they match how you really run the shop.
- **Emails:** Cloudflare Email Service. Customers get an order confirmation once their payment clears, and you get a new-order alert.

> This code has not been built or run on a live Cloudflare account yet. Expect a round or two of small fixes on first deploy, and test with Paynow's test mode before taking real money.

**Before you launch, work through `LAUNCH.md`.** It covers the 20-point checklist, a backup and restore test, an end-to-end test script and a rollback plan.

## How it works

1. A customer checks out. The order is saved and its stock is held in one step, so two people cannot buy the last item.
2. The server asks Paynow to start the payment. Mobile money customers see a prompt on their phone and wait on `/order/...`. Card customers are sent to Paynow.
3. Paynow tells the shop when the payment changes. The shop never takes Paynow's word from the message alone: it asks Paynow directly, then marks the order paid and sends the emails (once).
4. Orders that nobody pays within 45 minutes are cancelled and their stock goes back on sale.

## Setting up on Cloudflare

### 1. Deploy once

Your GitHub repo is already connected to Cloudflare Workers Builds. On the next push it builds and deploys, and Cloudflare creates the `peacemagents-db` D1 database for you. The tables are created by the app the first time it runs.

Build settings: build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`.

### 2. Build variables (Settings > Build > Variables and secrets)

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | your live address, for example `https://peacemagents.yourname.workers.dev` |
| `NEXT_PUBLIC_CURRENCY` | `USD` (or the currency your Paynow account uses) |
| `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | Optional. Cloudflare Web Analytics token. See `LAUNCH.md` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional. The code Google Search Console gives you (see "Search engines") |
| `NEXT_PUBLIC_SELF_HOST_SYNE` | Optional. `true` once you have put the Syne font files in `public/fonts/` |

These are baked in at build time, so changing them needs a new deploy.

### 3. Edit `wrangler.jsonc`

Change the two placeholders under `vars`:

- `ADMIN_EMAIL`: your own email. It is your admin login, and new-order alerts go here.
- `EMAIL_FROM`: the address your customers see emails coming from, written as `PEACEMAGENTS <orders@your-domain.com>`. You choose it yourself. The part after the `@` must be a domain you own and have set up in step 5, and the part before it (`orders`, `hello`, anything) does not need to exist as a real mailbox. If you have no domain yet, leave the placeholder. Orders still work, emails will fail with a reason shown on the order in the admin, and you can press **Resend confirmation** once the domain is ready.

### 4. Secrets (Settings > Variables and secrets, runtime, type "Secret")

| Name | What it is |
|---|---|
| `ADMIN_PASSWORD` | The password you will use to sign in to `/admin`. Make it long. |
| `PAYNOW_INTEGRATION_ID` | From your Paynow integration |
| `PAYNOW_INTEGRATION_KEY` | From your Paynow integration |
| `PAYNOW_MERCHANT_EMAIL` | Only for test mode: the email your Paynow account is registered with |

Never put these in the repository.

### 5. Email (Cloudflare Email Service)

Email Service is in beta and needs the **Workers Paid** plan, and your domain must use Cloudflare DNS.

1. In the Cloudflare dashboard open your domain, find Email, then Email Sending, and onboard the domain. Cloudflare adds the DNS records for you.
2. Use an address on that domain in `EMAIL_FROM`.
3. Place a test order. If the email fails, the order still goes through, and the reason shows on the order in the admin so you can fix it and press **Resend confirmation**.

### 6. Paynow

1. Create an integration in your Paynow account. Copy the Integration ID and Key into the secrets above.
2. Keep `PAYNOW_TEST_MODE` as `"true"` in `wrangler.jsonc` while you test. In test mode no real money moves. Mobile money test numbers:

| Number | Result |
|---|---|
| `0771111111` | Payment succeeds |
| `0772222222` | Succeeds after a delay |
| `0773333333` | Cancelled |
| `0774444444` | Insufficient balance |

3. When it all works, set `PAYNOW_TEST_MODE` to `"false"`, push, and make one small real purchase yourself.

### 7. Sign in to the admin

Go to `/login` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. You land on `/admin`. On an empty shop, press **Load sample products** to see the storefront, or add your own.

Changing `ADMIN_PASSWORD` later (update the secret) changes your login straight away. Nobody can sign up with the admin email.

## Search engines

1. **Set your address.** Add the build variable `NEXT_PUBLIC_SITE_URL` (for example `https://peacemagents.co.zw` once you have your own domain). Until then the site uses its `workers.dev` address for canonical links, the sitemap and structured data.
2. **Register with Google.** Open Google Search Console, add your site, and copy the verification code it offers (the "HTML tag" method gives a `content="..."` value). Add it as the build variable `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, deploy, press Verify, then submit `https://your-address/sitemap.xml`. Bing Webmaster Tools can import the same site from Search Console.
3. **Write good product pages.** In the admin, give each product a clear name ("Minimal Boxy Tee, Black") and a real description, and add photos. These become the search result title, text and image.
4. **A custom domain helps a lot.** A `workers.dev` address can be indexed, but search engines and shoppers trust a domain of your own more. Add one under your Worker's Settings > Domains & Routes.
5. **Time.** New sites usually take days to weeks to appear in Google, and ranking depends on links, content and traffic, which no setting can force. Share the site on Instagram and WhatsApp; links from your own channels help.

## Using the admin

- **Products:** name, web address, price, description, sizes with stock, image links, "show in shop" and "this is a drop" with a date and time (this drives the countdown). Untick "Show in shop" to hide a product without deleting it.
- **Stock:** when you change a stock number, the shop adds your difference to the live count, so sales made while the form was open are not undone.
- **Images:** paste links that start with `https://`. You can also put photos in the project's `public/products/` folder and use `/products/photo.jpg`.
- **Orders:** change status (paid, shipped, delivered, cancelled), see delivery details, and resend the confirmation. Cancelling returns the stock. A cancelled order cannot be reopened.
- A red note on an order means it needs you, for example a payment that arrived after the order was cancelled and the item had sold out.

## Updating the project you already pushed (from Acode)

This version replaces the Supabase one. In your project folder:

```bash
rm -rf src supabase package-lock.json
unzip -o /path/to/peacemagents-cloudflare-db.zip -d /tmp/pm
cp -r /tmp/pm/peacemagents/. .
git add -A
git commit -m "Add D1 database, admin dashboard, Paynow and email"
git push
```

Replace `/path/to/` with where the zip is saved on your phone.

## Running locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Local development uses a local copy of the D1 database. Put `ADMIN_PASSWORD` and the Paynow keys in `.dev.vars` (already ignored by git) to test those parts. Paynow cannot reach `localhost`, but the order page asks Paynow directly, so payments still complete.

## Good to know

- **Cloudflare plan:** the free Workers plan allows only 10 ms of CPU per request. Next.js pages and password sign-in may exceed it. If you see "Worker exceeded CPU time limit" errors, upgrade to Workers Paid, which you need for email anyway.
- **Pages are never cached.** Stock and drop times are always current, and no R2 bucket is needed.
- **Old pending orders** are cleaned up whenever someone starts a checkout or you open the admin. There is no background timer.
- **If the database is not created automatically:** run `npx wrangler d1 create peacemagents-db`, then add the printed `"database_id": "..."` next to `database_name` in `wrangler.jsonc`.
- Do not add `export const runtime = 'edge'` to routes.
- **Admin security:** `/admin` pages and every `/api/admin` route check your signed-in session on the server. Anyone who is not signed in as the admin, customers included, sees the normal "Not found" page at `/admin`, so they are never sent to a sign-in screen. To reach the admin, sign in at `/login` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then open `/admin` (or press **Open admin** on `/account`). The new-order alert email links through sign-in for the same reason. The admin address is not listed in `robots.txt` or anywhere on the public site. There is no separate admin site, because it would add a second deployment without adding protection beyond this.
- **Optional extra lock, once you have your own domain:** Cloudflare Access (Zero Trust) can sit in front of the paths `/admin*` and `/api/admin*` so that even the sign-in check is only reached by approved emails. Cloudflare documents this for hostnames and paths on your own domain. Do not switch Access on for the whole Worker, because that would lock customers out of the shop too.

## Structure

```
src/app            storefront, order/[id], login, account, admin/*, api/*
src/components     layout, cart, product, checkout, order, account, admin, ui
src/store          cart.ts (persisted Zustand cart), ui.ts
src/lib            schema + db (D1), auth, products, orders, payments, paynow, email, validation, site (contact details)
wrangler.jsonc     Worker, D1 and email bindings, non-secret settings
```
