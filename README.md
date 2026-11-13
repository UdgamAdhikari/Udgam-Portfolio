# Udgam Adhikari — portfolio

Source for [udgamadhikari.com.np](https://udgamadhikari.com.np).

The site is built around one idea, **Assembly**: interfaces are made of parts.
The hero is a bench of 3D UI parts, three of which really work (the toggle
switches the theme, the slider sets how much the site moves, the button opens
an email). Scrolling through section 02 assembles them into a panel.

## Stack

Next.js 16 (App Router; public pages prerendered and revalidated on demand) ·
React 19 · TypeScript (strict) · Tailwind CSS 4 · three.js via React Three
Fiber + Drei · PostgreSQL + Drizzle ORM · Zod · Resend · Vitest + Testing
Library · Playwright.

Content is managed in a private dashboard at `/admin`; the contact form stores
every inquiry in Postgres and emails a notification.

## Commands

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Local dev server on http://localhost:3000                       |
| `npm run build`     | Production build (every page is prerendered)                    |
| `npm start`         | Serve the production build                                      |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TypeScript rules)             |
| `npm run typecheck` | `tsc --noEmit`                                                  |
| `npm test`          | Unit + integration tests (Vitest; integration tests run on an in-process PostgreSQL via PGlite) |
| `npm run test:e2e`  | End-to-end tests on desktop and mobile — run `npm run build` first. Starts its own throwaway database. Uses your installed Chrome. |
| `npm run db:local`  | Local PostgreSQL (PGlite) on port 5544, data in `.data/pglite`  |
| `npm run db:migrate`| Apply SQL migrations in `drizzle/` to `DATABASE_URL`            |
| `npm run db:seed`   | Fill an empty database from `src/data/content.ts` + `src/content/work/*.md` (never overwrites) |
| `npm run db:generate` | Generate a new migration after changing `src/server/db/schema.ts` |
| `npm run admin:hash`| Print an `ADMIN_PASSWORD_HASH` for a password typed on stdin    |

### First run

```sh
cp .env.example .env.local      # fill APP_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH (escape each $ as \$)
npm run db:local                # terminal 1 — keep running
npm run db:migrate && npm run db:seed
npm run dev                     # http://localhost:3000, dashboard at /admin
```

## Editing content

Sign in at **/admin**. Everything public is edited there and goes live without
a deploy:

- **Inquiries** — filter by type/status, search by name, email or subject;
  mark new / read / replied / archived; reply from your mail client; delete.
  "Replied" is only ever set by you — the dashboard doesn't send replies.
- **Projects** — create, edit, upload a cover and screenshots, write the case
  study in Markdown, feature, reorder, publish and unpublish. New projects
  start as drafts.
- **Content** — profile and social links, hero, About, skills and the stack
  carousel, experience, contact copy, SEO, and the CV file.
- **Analytics** — page views, daily visitors, popular projects, referrers,
  contact-form starts and submissions.

Conventions that still apply:

- **Unconfirmed facts**: a Markdown paragraph starting with `TO_CONFIRM:` (or a
  `TO_CONFIRM` technology) renders as a dashed red marker, so it can never pass
  for finished content.
- **`src/data/content.ts`** and **`src/content/work/*.md`** are now seed data
  only: `npm run db:seed` loads them into an empty database.
- **The CV** (`public/UdgamAdhikari_CV.pdf`, template `scripts/resume.html`) is
  deliberately not linked from the site. A CV uploaded in the dashboard is
  served at `/resume`, also unlinked.

## How it's put together

```
src/
  app/                 routes: home, /work/[slug], 404, sitemap, robots, OG image, icon
    admin/             dashboard pages + Server Actions (_actions/)
    api/contact        form token (GET) and submission (POST)
    api/collect        cookieless analytics beacon
    api/cron/…         daily maintenance (retries, retention)
    media/[id]         uploads stored in Postgres
  components/
    hero/              fitted headline, HTML control panel, hero layout
    sections/          Assembly, Stack, Work (+ WorkIndex), Record, About, Contact
    contact/           the multi-step contact form and its CSS-3D part stack
    content/           Markdown renderer, analytics tracker
    admin/             dashboard components
    site/              header, footer, blueprint mode, Pending marker
    three/             the 3D bench: scene, stage (lazy + paused offscreen), fallback
  content/work/        case-study seed Markdown
  data/content.ts      seed content
  lib/                 controls store, shared Zod schemas (contact, content)
  server/              server-only: env, db (schema, client), auth, contact,
                       email, content (cached readers), storage, analytics,
                       security (rate limit, bot checks, origin), maintenance
drizzle/               SQL migrations
tests/
  unit/                Vitest (components, validation)
  integration/         Vitest on real Postgres (PGlite): contact, auth, projects, routes
  e2e/                 Playwright
```

- **Controls** (`src/lib/controls.ts`): theme and motion live in one tiny
  store. The 3D loop reads it every frame; React subscribes with
  `useSyncExternalStore`. An inline boot script applies the saved or system
  preference before first paint, so the theme never flashes.
- **3D**: three.js is loaded only after the page has painted, mounts when its
  stage nears the viewport, and stops rendering when it leaves. Without WebGL
  (or if the scene throws) a line drawing replaces it, and the HTML controls
  still work. Reduced-motion users start at motion 0.
- **Case-study transition**: opening a case study is a normal page load. In
  browsers that support cross-document view transitions, the screenshot
  morphs from the index into the case-study hero.
- **Hidden detail**: press `B` (or click the name three times) for blueprint
  mode.

## Backend

**Contact pipeline** (`src/server/contact/submit.ts`): same-origin check → JSON
size limit → idempotent replay → honeypot → signed timing token → rate limits
(5 per 10 min and 20 per day per visitor, 200 per day overall; Postgres-backed,
so they hold across serverless instances) → optional Turnstile → Zod
validation → duplicate-content check → insert → owner notification via Resend.
The visitor sees "received" only after the row is committed. If email fails,
the inquiry is kept, flagged `failed`, and retried from the dashboard or by the
daily cron. If the database fails, the visitor is told nothing was sent, and
their answers stay in the form with a mailto fallback.

**Auth** (`src/server/auth`): one owner account from env (scrypt hash). Opaque
session tokens in an `httpOnly`, `Secure`, `SameSite=Strict`, `__Host-`
cookie; only their sha256 is stored. Sessions end after 7 days, or after 12
hours idle. Login is rate limited per IP and globally. `src/proxy.ts`
redirects signed-out visitors away from `/admin`, but the real check is
`requireAdmin()` at the top of every Server Action and admin page. CSRF:
Server Actions verify `Origin` (Next.js), the cookie is `SameSite=Strict`,
and the public POST routes check `Origin` themselves.

**Content and caching**: public pages read through `unstable_cache` with tags
(`src/server/content/public.ts`) and are prerendered. Each admin change calls
`revalidateTag(tag, { expire: 0 })` and `revalidatePath`, so the next visitor
gets fresh HTML. Case studies published later render on first request.

**Uploads**: the file type is sniffed from the bytes (PNG, JPEG, WebP, AVIF,
GIF, PDF; never SVG), with size and dimension limits. Files are stored in
Postgres (default) or any S3-compatible bucket (`STORAGE_DRIVER=s3`), and
served with `nosniff` and a sandboxing CSP.

**Privacy**: inquiries store only what the visitor typed (no IP, no user
agent). Analytics are first-party and cookieless: no IPs, only referrer hosts,
and a visitor id that is an HMAC rotating daily, so nobody can be followed
across days. Visitors with Global Privacy Control or Do Not Track are never
recorded. Archived inquiries and old analytics are deleted after
`INQUIRY_RETENTION_DAYS` / `ANALYTICS_RETENTION_DAYS`. Logs redact personal
data and secrets by key.

**Security headers** (`next.config.ts`): CSP, HSTS, `X-Frame-Options: DENY`,
`nosniff`, a strict Referrer-Policy and a Permissions-Policy. Admin pages are
`noindex` and `no-store`.

## Deploying (Vercel)

1. Create a PostgreSQL database (Neon, Supabase, Vercel Postgres, RDS …).
   The Vercel build command in `vercel.json` runs `db:migrate` and `db:seed`
   before `next build`, so tables and starting content are created on deploy
   (both are safe to repeat; the seed only fills empty tables). Note: if you
   ever delete *every* project, the next deploy re-seeds the defaults.
2. In Resend, verify the sending domain and create an API key.
3. Import the repository in Vercel and set the environment variables from
   `.env.example` (at least `DATABASE_URL`, `APP_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`,
   `CONTACT_TO_EMAIL`, `CRON_SECRET`). In Vercel's UI, paste the hash
   *without* escaping the `$` characters.
4. Set the production domain. Canonical URLs, the sitemap and OG metadata use
   the profile's website, editable in the dashboard.
5. `vercel.json` schedules `/api/cron/maintenance` daily. Vercel sends the
   `CRON_SECRET` automatically.
