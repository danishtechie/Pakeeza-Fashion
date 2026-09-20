# Pakeeza Fashion

Premium Pakistani & Kashmiri fashion e-commerce platform. Product discovery →
Cart → Checkout → WhatsApp handoff → Admin order management. No payment
gateway is integrated anywhere — payment is always confirmed manually,
directly with the customer, on WhatsApp.

## Fixed since first delivery

Two real bugs were reported after the first handoff and are fixed as of
this version — worth knowing if you pulled an earlier copy:

1. **Product grids and the homepage hero rendered invisible** on some
   machines (elements existed in the page, but stayed at `opacity: 0`
   forever). Cause: entrance animations were built with framer-motion's
   "start hidden, animate to visible" pattern, which depends on client JS
   hydration completing and an `IntersectionObserver` firing — if either
   was even slightly delayed, the content just never appeared. Fixed by
   switching the hero and product cards to a pure-CSS entrance animation
   (`animate-fade-up` in `globals.css`) that runs the instant the browser
   paints, needs no JS, and always ends visible.
2. **Seed/demo images referenced specific Unsplash photo IDs that were
   never actually verified as live** (the build environment couldn't
   reach `images.unsplash.com` to check them), and one was dead — it
   broke the hero background and the "Women's Collection" card
   everywhere it was reused. Fixed by generating all demo images locally
   (`scripts/placeholder-image.ts`, rasterized via `sharp` at seed time)
   — zero external network dependency, so the demo store now looks right
   on any machine, any network, offline included. Real product photos
   uploaded through the admin panel are unaffected by any of this.

## Stack & Architecture

- **Framework:** Next.js 15 (App Router, TypeScript, React 19)
- **Styling/Motion:** Tailwind CSS, Framer Motion
- **Database/ORM:** Drizzle ORM. Ships on **SQLite** for zero-setup local
  development; the schema is written to be Postgres-portable (see
  "Deploying to Postgres" below).
- **Auth:** NextAuth v5 (Credentials provider), bcrypt password hashing,
  JWT sessions, account lockout after 5 failed logins, `middleware.ts`
  gating the entire `/admin` and `/api/admin` surface server-side.
- **Images:** Uploaded files are re-encoded through `sharp` (blocks
  disguised/polyglot files) and stored under `public/uploads`, referenced
  behind `src/lib` so swapping to S3/Cloudinary later is a small,
  isolated change.
- **WhatsApp:** Plain `wa.me` click-to-chat deep link — no WhatsApp
  Business API, no third-party messaging SDK.

### Why Drizzle instead of Prisma?

The original build environment couldn't reach Prisma's binary-download
host, so the ORM was built on Drizzle instead so it could actually be
run, seeded, and tested end-to-end rather than shipped unverified. Both
are production-grade, fully-typed choices — if you'd prefer Prisma,
`src/db/schema.ts` maps directly onto an equivalent Prisma schema (see
the git history / prior conversation for the original Prisma version).

### Why no next/font/google?

The same sandboxed build environment couldn't reach Google's font CDN.
Fonts are wired through the `--font-display` / `--font-body` CSS
variables in `src/app/globals.css` with elegant serif/sans fallback
stacks. To use the intended typefaces (Cormorant Garamond + Inter) with
real internet access, either:

1. Add `next/font/google` in `src/app/layout.tsx` and pass the resulting
   variable class to `<body>`, or
2. Self-host the font files under `public/fonts` and `@font-face` them
   in `globals.css`.

## Getting Started

```bash
npm install
cp .env.example .env    # then edit values, especially AUTH_SECRET
npx drizzle-kit push    # creates dev.db and all tables
npm run seed            # demo products, categories, settings, admin user
npm run dev
```

Visit `http://localhost:3000` for the storefront and
`http://localhost:3000/admin/login` for the admin panel.

**What you need:** Node.js 20+ and npm (Node 18+ works, 20 LTS
recommended) — [nodejs.org](https://nodejs.org). No database server, no
Docker, no compiler toolchain required; everything else installs via
`npm install`. Get the project onto your machine either by unzipping the
download, or `git clone` if you've pushed it to a repo, then run the
commands above from inside the project folder in a terminal (Terminal on
macOS/Linux, PowerShell or Command Prompt on Windows).

**Default seeded admin login** (from `.env`, change these before going
anywhere near production):
- Email: `SEED_ADMIN_EMAIL` (default `admin@pakeezafashion.com`)
- Password: `SEED_ADMIN_PASSWORD` (default `ChangeThisPassword123!`)

### Creating your first real admin account

The seed script is the supported way to create the first admin. For
production:

1. Set strong, unique `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` values
   in your production environment (never commit them).
2. Run `npm run seed` once against the production database.
3. Immediately log in and, if you want additional admins, insert them via
   a one-off script using the same `bcrypt.hash(password, 12)` pattern in
   `scripts/seed.ts` — there's no self-service "create admin" UI by
   design, since that surface would itself need to be secured.
4. Change the seeded password (or delete/rotate that account) once you've
   created your permanent one.

## Deploying for Free

The recommended free stack for this project is **Vercel** (hosting the
Next.js app) + **Turso** (hosted SQLite, same libsql protocol this app
already speaks locally — no ORM/query changes needed). Both have
generous free tiers as of this writing.

1. **Create a Turso database** (free): sign up at
   [turso.tech](https://turso.tech), install their CLI or use the web
   dashboard, and create a database. You'll get a database URL
   (`libsql://your-db-name-org.turso.io`) and can generate an auth token
   from the dashboard/CLI.
2. **Push the schema to Turso** from your machine:
   ```bash
   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx drizzle-kit push
   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run seed
   ```
3. **Push your code to a GitHub repo**, then import it into
   [vercel.com](https://vercel.com) (free Hobby tier) — it auto-detects
   Next.js, no config needed.
4. **Set environment variables** in the Vercel project settings (same
   names as `.env.example`): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
   `AUTH_SECRET` (generate a real one — `openssl rand -base64 32`),
   `NEXTAUTH_URL` (your Vercel domain, e.g.
   `https://pakeeza-fashion.vercel.app`), and `WHATSAPP_DEFAULT_NUMBER`.
   You do **not** need `DATABASE_URL` once `TURSO_DATABASE_URL` is set —
   `src/db/client.ts` and `drizzle.config.ts` both prefer Turso
   automatically when it's present.
5. Deploy. Vercel builds and hosts it for free on their Hobby plan for
   personal/non-commercial-scale projects.

### Important caveat: product image uploads

Vercel's filesystem is **read-only and ephemeral** at runtime — there's
no persistent disk, so the admin "Add Product" image upload
(`/api/admin/upload`, which currently writes to `public/uploads`) will
not persist images between requests once deployed there. Two ways to
fix this before you rely on it in production:

- **Easiest**: use direct image URLs instead of uploading files (paste a
  hosted image URL into the product form) until you wire up real
  storage — the storefront already renders any external URL you give it.
- **Proper fix**: swap the upload route to a free object-storage
  provider — Vercel Blob (free tier, tightest integration) or
  Cloudinary (free tier) are the natural choices. This is a contained
  change to `src/app/api/admin/upload/route.ts` only. Ask and I can wire
  this up for you.

If you'd rather avoid this entirely, deploying to a host with real
persistent disk (a small VPS, Railway, Render — paid tiers, not free)
lets `public/uploads` work exactly as it does locally, no code changes
needed.

## Environment Variables

See `.env.example` for the full list. Never commit `.env`. Required for
production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path locally; Postgres connection string in production |
| `AUTH_SECRET` | NextAuth session signing secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://pakeezafashion.com` |
| `WHATSAPP_DEFAULT_NUMBER` | Fallback only — the real number lives in Settings once seeded |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Used only by `npm run seed` |

## Deploying to Postgres (alternative to Turso)

If you'd rather run Postgres than Turso/libsql in production, the schema
in `src/db/schema.ts` avoids anything SQLite-specific, so it's a
straightforward swap:

1. `npm install pg drizzle-orm` (drizzle-orm is already installed) and
   remove `@libsql/client` if you no longer need local dev on SQLite.
2. In `src/db/client.ts`, replace the `@libsql/client` driver with
   `drizzle-orm/node-postgres` (or `postgres-js`), pointed at
   `DATABASE_URL`.
3. In `drizzle.config.ts`, change `dialect: "sqlite"` to
   `dialect: "postgresql"`.
4. In `src/db/schema.ts`, swap `sqliteTable` for `pgTable` and
   `text(...).primaryKey()` id columns stay the same shape; `integer(...,
   { mode: "timestamp" })` becomes `timestamp(...)`. Money columns stay
   `integer` (paise) — no change needed.
5. Run `npx drizzle-kit push` (or generate + run a migration) against
   your Postgres instance, then `npm run seed`.

## Running Tests

```bash
npm test
```

36 tests covering:
- **Money/COD math** (`src/lib/__tests__/money.test.ts`) — sale-price
  logic, discount percentages, COD advance/remaining split at various
  percentages, paisa-level rounding correctness.
- **Order creation integration tests**
  (`src/server/__tests__/orders.test.ts`) — real orders created against
  the database: correct server-recalculated totals, stock decrement,
  rejection of orders exceeding stock, rejection of unpublished
  products, COD advance sourced from Settings.
- **Security tests**
  (`src/app/api/orders/__tests__/security.test.ts`) — injection-shaped
  input handling, negative/NaN/oversized quantities, invalid enum
  values, ignored client-injected price fields, IDOR (mismatched
  product/variant pairs, nonexistent variant), and an overselling race
  simulation (two orders for the last unit — the second is rejected).
- **Admin auth / brute-force lockout tests**
  (`src/server/__tests__/admin-auth.test.ts`) — correct/incorrect
  password handling, lockout after 5 failed attempts, the correct
  password still being rejected while locked, no lockout below the
  threshold, and inactive-account rejection.

These were run against the live dev/production server during
development, not just in isolation — see below for what was verified
live.

## Security — what's implemented and how it was verified

Everything below was actually exercised against a running instance
during development, not just written:

- **Unauthenticated admin API access → 401** for every `/api/admin/*`
  route (products, categories, orders, settings, upload), verified live
  with `curl`.
- **Unauthenticated `/admin/*` page access → 307 redirect** to
  `/admin/login`, enforced in `middleware.ts` (not just hidden UI).
- **Brute-force login lockout**: 5 failed attempts locks the account for
  15 minutes; verified live that a 6th attempt — even with the *correct*
  password — is still rejected while locked.
- **Malicious file upload rejection**: a shell script renamed to `.jpg`
  and a PHP webshell renamed to `.png` (both with a spoofed
  `Content-Type` header) were both rejected with `400 File is not a
  valid image`, because the upload route decodes and re-encodes every
  file through `sharp` rather than trusting the extension or
  client-reported MIME type. Oversized files (>5MB) are rejected before
  that. A genuine PNG upload succeeds and is written to a random
  hex filename as `.webp`.
- **Manipulated price / stock / quantity**: `createOrder` never reads
  price, total, or discount from the request — only `productId`,
  `variantId`, and `quantity`. Price and stock are always re-read from
  the database inside a transaction; a client-injected `price: 1` field
  on an order line is silently ignored (covered by an explicit test).
- **IDOR**: ordering a real variant ID paired with a different (wrong)
  product ID is rejected; ordering a nonexistent variant ID is rejected.
- **Overselling / race conditions**: stock decrement uses a
  `WHERE stock = <known value>` guard inside the same transaction as the
  order insert, so two near-simultaneous orders for the last unit can't
  both succeed.
- **Output escaping**: React's default JSX text rendering escapes all
  user-supplied strings (names, addresses, review text, admin notes) —
  nothing in this codebase uses `dangerouslySetInnerHTML` except the
  one static, server-generated JSON-LD block on the product page, which
  contains no unescaped user input.
- **Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy`, and a restrictive `Permissions-Policy`
  are set on every response via `next.config.mjs`.
- **Rate limiting**: order creation and newsletter signup are
  IP-rate-limited (in-memory — see the note in `src/lib/rate-limit.ts`
  about swapping to a shared store like Redis if you scale to multiple
  instances).

### Known gaps / next steps before a real production launch

- **CSRF**: NextAuth's credentials flow includes CSRF protection
  natively; the custom `/api/orders` and other mutation routes rely on
  same-origin fetches from the app and don't currently set a separate
  CSRF token. For a public storefront POST endpoint this is a common,
  acceptable tradeoff (no session/cookie-based authority is being
  exercised by an anonymous checkout POST), but if you add customer
  accounts/sessions later, add explicit CSRF tokens to any
  session-authenticated mutation.
- **Rate limiting is in-memory** — fine for a single server instance;
  move to Redis/Upstash before scaling horizontally (also worth noting
  if you deploy to Vercel: serverless functions don't share memory
  across invocations, so this limiter is effectively per-instance there
  too — swap to Upstash Redis, which has a free tier, if you need real
  cross-request rate limiting on serverless).
- **No automated Playwright/E2E browser test suite** was included in
  this pass — the flows above were verified via direct HTTP requests
  against a running server (equivalent coverage for the API/security
  surface, but doesn't catch UI-only regressions). Adding
  `@playwright/test` for the Home → Shop → Product → Cart → Checkout →
  WhatsApp and Admin login → dashboard → product CRUD → order update
  flows is the natural next step.
- **Product image uploads need object storage on serverless hosting**
  (Vercel etc.) — see "Deploying for Free" above; local/VPS deployment
  is unaffected.

## Admin Operations

- **Change the WhatsApp number**: Admin → Settings → WhatsApp Business
  Number. Takes effect immediately for all new orders.
- **Change the COD advance percentage**: Admin → Settings → COD Advance
  Percent (e.g. `50`). Existing orders keep the percentage that was in
  effect when they were placed (snapshotted on the order).
- **Add a product**: Admin → Products → Add Product. Fill in details,
  upload images (drag isn't supported — use the ←/→ buttons on a thumbnail
  to reorder; first image is the thumbnail), add at least one size/color
  variant with its own stock and SKU.
- **Manage an order**: Admin → Orders → click an order → update Order
  Status / Payment Status / internal notes on the right-hand panel. Use
  the "Message on WhatsApp" button to jump straight into the customer's
  chat.
- **Only a Super Admin can change Settings** — the seeded account is
  `SUPER_ADMIN`; if you create additional admins as `MANAGER`, they can
  manage products/orders/categories/reviews but not store-wide settings.

## Backup Strategy

SQLite: back up the `dev.db` (or your production DB filename) file
directly — it's a single file, so a simple scheduled copy (e.g. via
cron + `sqlite3 dev.db ".backup backup-$(date +%F).db"`) is sufficient
for most volumes. Postgres: use your host's automated backups (most
managed Postgres providers, e.g. RDS/Supabase/Neon, include this) or
`pg_dump` on a schedule. Either way, back up `public/uploads` separately
if you haven't moved to object storage yet.

## Project Structure

```
src/
  app/
    (storefront)/       # Home, Shop, Product, Checkout, policy pages — has Navbar/Footer/Cart
    admin/               # /admin/login (public) + admin/(dash)/* (protected, own sidebar layout)
    api/                 # orders, admin/*, auth, newsletter, products/by-ids
  components/            # ui, layout, cart, product, shop, checkout, home, admin
  db/                    # Drizzle schema + client
  lib/                   # money math, validation, whatsapp, rate-limit, cart/wishlist stores, id, settings, audit
  server/                # order creation, catalog queries, admin product/stat queries
  auth.ts                # NextAuth config
middleware.ts             # server-side /admin + /api/admin gate
scripts/seed.ts            # demo data + first admin account
```
