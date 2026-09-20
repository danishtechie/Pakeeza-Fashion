# Pakeeza Fashion

Pakeeza Fashion is a modern Pakistani and Kashmiri fashion store built for
online product discovery, WhatsApp-based ordering, and simple store
management.

Customers can browse collections, view product details, choose sizes and
colors, add items to a bag, complete a checkout form, and continue the order
conversation on WhatsApp.

Store administrators can manage products, brands, images, categories, stock,
orders, reviews, store settings, and COD rules from the protected admin panel.

## What The Website Includes

### Storefront

- Homepage with featured collections and products
- Women, men, Pakistani, and Kashmiri collections
- Product search, filters, sorting, and wishlist
- Product galleries with multiple images
- Size, color, variant, and stock selection
- Sale pricing and discount display
- Cart drawer and checkout flow
- WhatsApp order handoff
- Cash on Delivery support
- Shipping, returns, privacy, terms, FAQ, and COD policy pages
- Newsletter signup

### Admin Panel

Open `/admin/login` to access the store dashboard.

From the admin panel you can:

- Add and edit products
- Add brand names
- Upload and reorder product images
- Replace the seeded placeholder images
- Add sizes, colors, variant SKUs, and stock quantities
- Set low-stock thresholds
- Publish or hide products
- Mark products as featured, trending, bestseller, or new arrival
- Create and enable/disable categories
- Search products by name, brand, or SKU
- Filter published and unpublished products
- Review and update orders
- Moderate customer reviews
- Change store information and WhatsApp settings
- Configure delivery fees and COD advance percentage

## Technology Used

- **Next.js 15** with the App Router
- **React 19** for the user interface
- **TypeScript** for type-safe application code
- **Tailwind CSS** for styling and responsive layouts
- **Framer Motion** for interface animation
- **Lucide React** for icons
- **Drizzle ORM** for database queries and schema management
- **SQLite/libSQL** for local development
- **Turso** as the recommended hosted database
- **Auth.js / NextAuth v5** for admin authentication
- **bcryptjs** for password hashing
- **Zod** for request and form validation
- **Zustand** for cart and wishlist state
- **Sharp** for image validation, resizing, and WebP conversion
- **Vitest** for automated tests
- **WhatsApp `wa.me` links** for customer communication

There is currently no online payment gateway. Payment and order confirmation
are handled manually through WhatsApp.

## Requirements

Install these before starting:

- Node.js 20 or newer
- npm
- Git, if you want to use GitHub

## Run The Project Locally

From the project folder:

```powershell
npm install
```

Create a local `.env` file in the project root. Do not commit this file:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
WHATSAPP_DEFAULT_NUMBER="919999999999"
SEED_ADMIN_EMAIL="admin@pakeezafashion.com"
SEED_ADMIN_PASSWORD="ChangeThisPassword123!"
```

Create the local database tables:

```powershell
npx drizzle-kit push
```

Add demo categories, products, images, settings, and an admin user:

```powershell
npm run seed
```

Start the development server:

```powershell
npm run dev
```

Open:

- Storefront: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

The default seeded login is taken from `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD`. Change it before using the project publicly.

## Useful Commands

```powershell
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Start the production build
npm run seed      # Add demo data and the first admin user
npm test          # Run the Vitest test suite
npx drizzle-kit push  # Apply the current schema to the database
```

## Product Management

The easiest way to add a real product is:

1. Log in at `/admin/login`.
2. Open **Add product** from the dashboard.
3. Enter the product name, brand, SKU, description, category, and price.
4. Upload product images in the Images section.
5. Add at least one size/color variant with a unique variant SKU.
6. Enter stock for each variant.
7. Choose the product visibility and promotional flags.
8. Click **Create Product**.

When editing a seeded product, remove its placeholder image, upload your
real product images, and move the preferred thumbnail to the first position.

## Deploy For Free

The recommended free setup is:

- **Vercel** for the Next.js application
- **Turso** for the hosted database
- **Cloudinary or Vercel Blob** for permanent product images
- **GitHub** for source control

### Important Image Upload Note

Locally, uploaded images are written to `public/uploads`. This works on your
computer, but Vercel's serverless filesystem is temporary. Images uploaded
after deployment may disappear or fail to persist.

Before relying on admin image uploads in production, move the upload route to
Cloudinary or another object-storage provider. The affected file is:

```text
src/app/api/admin/upload/route.ts
```

The database can still be hosted on Turso while product image URLs are stored
in the product image table.

### Deploying The App

1. Push this project to GitHub.
2. Create a Turso database and token.
3. Apply the schema to Turso.
4. Seed the Turso database with your production admin credentials.
5. Import the GitHub repository into Vercel.
6. Add the production environment variables in Vercel.
7. Deploy and test the storefront and admin panel.

Apply the schema from PowerShell:

```powershell
$env:TURSO_DATABASE_URL="libsql://your-database.turso.io"
$env:TURSO_AUTH_TOKEN="your-turso-token"
npx drizzle-kit push
```

Seed the hosted database:

```powershell
$env:SEED_ADMIN_EMAIL="your-admin-email@example.com"
$env:SEED_ADMIN_PASSWORD="use-a-strong-private-password"
npm run seed
```

Add these variables to Vercel:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
AUTH_SECRET
NEXTAUTH_URL
WHATSAPP_DEFAULT_NUMBER
```

Set `NEXTAUTH_URL` to the deployed Vercel URL, for example:

```text
https://your-project.vercel.app
```

If you connect Cloudinary, also add:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Never commit `.env`, database tokens, admin passwords, or Cloudinary secrets.

## GitHub: Replace The Existing README

This project is connected to:

```text
https://github.com/danishtechie/Pakeeza-Fashion.git
```

After replacing this local README, run these commands from the project folder:

```powershell
cd D:\Downloads\pakeeza-fashion
git status
git add README.md
git commit -m "Rewrite project documentation"
git push origin main
```

Refresh the GitHub repository page. The new README will replace the previous
one automatically.

If GitHub rejects the push because the remote has newer commits, update your
local branch first:

```powershell
git pull --rebase origin main
git push origin main
```

## Project Structure

```text
src/
  app/
    (storefront)/       Storefront pages and layouts
    admin/               Login and protected admin pages
    api/                 Auth, orders, products, uploads, and admin APIs
  components/            Storefront, cart, checkout, product, and admin UI
  db/                    Drizzle database client and schema
  lib/                   Validation, money, cart, wishlist, settings, and helpers
  server/                Catalog, orders, admin products, and dashboard queries
  auth.ts                Auth.js configuration
middleware.ts            Admin page and API protection
scripts/seed.ts          Demo data and first admin account
```

## Tests And Validation

Run the test suite with:

```powershell
npm test
```

The tests cover money calculations, COD totals, order creation, stock
protection, invalid input, IDOR protection, and admin authentication lockout.

Before a real launch, also manually test:

- Admin login
- Product creation and editing
- Product image upload
- Variant stock selection
- Cart and checkout
- WhatsApp handoff
- Order status updates
- Production image persistence

## Security Notes

- Admin pages and admin APIs require authentication.
- Admin passwords are hashed with bcrypt.
- Failed admin logins trigger a temporary lockout.
- Product prices and stock are recalculated on the server.
- Product image files are validated and re-encoded through Sharp.
- Security headers are configured in `next.config.mjs`.
- `.env` and local database files are excluded from Git.

For production, use a strong unique `AUTH_SECRET`, strong admin credentials,
hosted database credentials, and persistent object storage for images.
