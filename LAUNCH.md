# Launch checklist

Where each of the 20 launch items stands. **Done** means it is in the code. **You** means only you can do it (it needs your accounts or a real device). Nothing here has been run on a live Cloudflare account yet, so the first deploy is also a test.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Hide every API key | Done | A scan of `src/`, `wrangler.jsonc`, `.env.example` and the README found no keys. The only `NEXT_PUBLIC_` values are the site address, currency and the analytics token, which are public by nature. Paynow and admin secrets are read on the server only. **You:** keep secrets in Cloudflare only, never in chat or git. |
| 2 | Rotate any key that was committed | You | **Revoke the GitHub token you used to push** at github.com/settings/tokens (it has write access to your repo). Make a new one only when you need it. Check history: `git log -p \| grep -iE "paynow\|password\|token\|secret"`. If anything shows up, treat it as leaked and replace it in Paynow or Cloudflare. |
| 3 | Rate limiting | Done + You | In code: sign-in, sign-up, password reset and checkout are limited per visitor, and Paynow status checks are limited per order. **You:** add a Cloudflare rule as a second layer: Security > WAF > Rate limiting rules, match `/api/*`, about 60 requests per minute per IP. |
| 4 | Auth on every route | Done | Every `/api/admin/*` route calls `requireAdminApi()` itself, and every admin page calls `requireAdmin()`. Public routes are on purpose: checkout, sign-in, sign-up, password reset, the order status check (unguessable order link) and the Paynow result (verified by hash, then confirmed by asking Paynow). |
| 5 | Lock down database rules | Done | D1 has no public access and no keys in the browser. Only server code reads it. Customers can only list their own orders, and admin data needs an admin session. A single order page can be opened by anyone holding its random link, which is how the confirmation email works. |
| 6 | Validate every input on the server | Done | Every JSON route validates with zod. Prices, names and stock come from the database, never from the browser. Coupon codes are re-checked on the server. |
| 7 | Spending cap on AI provider | N/A | The shop does not call any AI service. **You:** set a billing alert in Cloudflare (Notifications) so unexpected Workers usage is flagged. |
| 8 | Errors do not leak stack traces | Done | Visitors see plain messages and a styled error page. Technical detail goes to the Worker logs only. Paynow's own error wording is shown only while `PAYNOW_TEST_MODE` is `"true"`. |
| 9 | Error tracking | Partial | Worker logs are on (`observability` in `wrangler.jsonc`): Cloudflare dashboard > your Worker > Observability. The admin shows failed confirmation emails and orders needing attention. **You:** add a Cloudflare notification for Worker errors if your plan offers it, or add Sentry later. |
| 10 | Back up the database and test a restore | You | D1 keeps automatic point-in-time history (Time Travel). Commands are below. I have not been able to run them, so do the restore test once before launch. |
| 11 | 404 and 500 pages | Done | `not-found.tsx`, `error.tsx` and `global-error.tsx`. |
| 12 | Works on a cheap Android | You | Pages are light and use no heavy libraries, but I could not test on a device. Open the live site on the slowest phone you can find. Compress product photos to about 150 KB each (around 1200 px wide), because the site does not resize images. |
| 13 | Nothing slower than 3 seconds | You | Not measured yet. Run the live address through pagespeed.web.dev (Mobile). The usual culprits are large images and the free Workers CPU limit. |
| 14 | Meta tags and OG image | Done | Default share image (`public/og.png`), per-product titles and images, large X card. **You:** set `NEXT_PUBLIC_SITE_URL` as a build variable, otherwise share links point at localhost. Then paste a product link into a draft post to check the preview. |
| 15 | Privacy policy and terms | Done (draft) | `/privacy`, `/cookies`, `/terms`, `/faq`. They match what the site really does. **You:** read them, confirm the 7-day return window and the delivery wording (`src/lib/site.ts`), and consider a local legal review. This is not legal advice. |
| 16 | Analytics | Done + You | Cloudflare Web Analytics, cookie-free, off until you add a token: dashboard > Analytics > Web Analytics > add your site > copy the token > set `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` as a build variable. It shows page visits, so you can see drop-off from product to checkout to order. The admin overview shows paid versus waiting orders. |
| 17 | Test signup, payment, password reset | You | Steps below. Password reset is built (`/forgot-password`). |
| 18 | Emails not landing in spam | You | Cloudflare adds SPF and DKIM when you onboard the domain. Also add a DMARC record (below). Send test orders to Gmail, Outlook and iCloud addresses and check the spam folders. |
| 19 | A way to contact you | Done | `/contact`, the footer, and WhatsApp, email, call and Instagram buttons on every product. |
| 20 | Rollback plan | Done | Below. |

## 10. Backup and restore commands

Run from your project folder (a computer or Acode with Node). Replace the date.

```bash
# Is point-in-time history available?
npx wrangler d1 time-travel info peacemagents-db

# Make a full copy you keep yourself
npx wrangler d1 export peacemagents-db --remote --output=backup.sql

# Test the copy WITHOUT touching the live shop: load it into a scratch database
npx wrangler d1 create peacemagents-restore-test
npx wrangler d1 execute peacemagents-restore-test --remote --file=backup.sql
npx wrangler d1 execute peacemagents-restore-test --remote --command "SELECT COUNT(*) FROM products"

# Real disaster: roll the live database back to a moment before things went wrong
npx wrangler d1 time-travel restore peacemagents-db --timestamp=2026-10-20T09:00:00Z
```

Delete the scratch database afterwards. Export a copy before any big change, and weekly once you have orders.

## 17. End-to-end test script

Do this in Paynow test mode, on the live site, before you switch to live mode.

1. Create a customer account, sign out, sign in. Use "Forgot your password?" and check the email arrives and the new password works.
2. Pay with Ecocash test number `0771111111`. The order page should flip to paid by itself, and the confirmation email should arrive once.
3. Pay with `0773333333` (cancelled) and `0774444444` (no balance). The order should cancel and the stock should return.
4. Pay by the card option. Confirm the Paynow page opens and you come back to the order page.
5. Buy the last unit of something from two browsers at once. Only one should succeed.
6. In the admin: add a product, edit its stock, mark an order shipped, press Resend confirmation.
7. Switch `PAYNOW_TEST_MODE` to `"false"`, deploy, and buy your cheapest item for real with your own phone. Refund yourself from the Paynow dashboard.

## 18. DMARC record

In Cloudflare DNS, add a TXT record named `_dmarc` with the value `v=DMARC1; p=none; rua=mailto:you@your-domain.com`. After a week of clean reports, you can tighten `p=none` to `p=quarantine`. To check a test email, open it in Gmail, choose "Show original" and look for SPF and DKIM both saying PASS.

## 20. Rollback plan

**Decide fast.** If two payments in a row fail, anyone is charged twice, or the site shows errors on the shop or checkout, stop selling first and investigate second.

1. **Stop new orders (about 1 minute).** In Cloudflare, delete the `PAYNOW_INTEGRATION_ID` secret. Checkout then says "Payments are not switched on yet" while visitors can still browse. Re-add the secret to resume. Post a short note on Instagram and WhatsApp status so customers know.
2. **Roll back the code (about 2 minutes).** Cloudflare dashboard > Workers & Pages > peacemagents > Deployments. Choose the last good version and roll back. Or from a terminal: `npx wrangler rollback`. If it was a bad commit, `git revert <commit>` and push.
3. **Database.** Changes to the tables only ever add things, so older code still runs on the newer database. If data was damaged, use the Time Travel restore above. Restoring loses everything after the chosen time, so check recent orders in the admin and in Paynow first and re-enter anything missing.
4. **Money.** Compare the admin Orders list with your Paynow dashboard. Orders marked paid with no matching Paynow payment, or the other way round, need a manual fix: change the status in the admin, or refund in Paynow.
5. **Afterwards.** Write down what happened, add the fix to this list, and run the test script above before reopening.

**Launch day:** keep this file, your Paynow login and the Cloudflare dashboard open. Launch when you can watch it for the first hour, not at night.
