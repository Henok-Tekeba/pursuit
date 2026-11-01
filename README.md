# Internship Tracker

A focused personal CRM for internship applications, cold emails, follow-ups, interviews, and every conversation in between. Built as a modular monolith with Next.js, TypeScript, Tailwind, shadcn-style Radix components, Drizzle ORM, and PostgreSQL.

The authentication screen and application shell are a close recreation of the supplied design references, extended into a full multi-user product.

## What's included

- **Real email/password accounts** — create your own account from `/signup`, sign in from `/login`, and manage your password in Settings. Passwords are hashed with scrypt and sessions use signed, HTTP-only cookies.
- **A separate demo workspace** — Elena is a real seeded user with realistic sample data, available from the login screen or with her credentials below. Your own account starts completely empty.
- **Multi-user, private by default** — every person who signs up gets their own applications, companies, emails, and templates. Every query and mutation is scoped to the signed-in user.
- **Dashboard** — total applications, responses, follow-ups due, interviews, recent applications, today's action items, and a status overview.
- **Application management** — create, edit, view, delete, search, filter, sort, paginate, bulk-update, and bulk-delete.
- **Conversation timeline** — initial email, follow-ups, replies, interview and assessment invitations, offers, rejections, status changes, scheduled follow-ups, and notes. Emails are append-only and are never overwritten.
- **Follow-up tracking** — days since application, days since last contact, next follow-up, overdue state, configurable intervals (defaults: day 5, 10, and 17), and a dedicated follow-up workspace.
- **Email archive and templates** — preserve the exact subject and body of every sent or received email; reuse cold-email, follow-up, and reply templates with `{{company}}`, `{{position}}`, `{{contactName}}`, `{{myName}}`, and `{{email}}` placeholders.
- **Analytics** — response rate, interview conversion, offer rate, average response time, follow-up effectiveness, status breakdown, method breakdown, monthly activity, and CSV export.
- **Companies** — company-level rollups, response rates, notes, and quick access to related applications.
- **Responsive + dark mode** — mobile navigation, mobile-friendly application/follow-up/email lists, larger type, and a complete dark theme.
- **Optional Supabase Auth** — Google and Apple sign-in use Supabase Auth when it is configured. Email/password auth works without any external auth provider.
- **Optional sample data** — the demo workspace is clearly marked. New accounts never receive fake data. Elena is seeded only when demo data is enabled.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn-style Radix primitives, Satoshi |
| Data | Drizzle ORM + PostgreSQL |
| Local database | Embedded PGlite (PostgreSQL WASM) so the app runs with zero external database setup |
| Production database | Supabase Postgres via `DATABASE_URL` |
| Auth | Built-in email/password auth; optional Supabase Auth for Google/Apple OAuth |
| Deployment | Vercel |

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
# Generate a session secret and put it in .env.local:
openssl rand -base64 32
pnpm dev
```

Open `http://localhost:3000`.

No database, Docker, or cloud account is required locally. On first use the app creates an embedded PostgreSQL database in `.data/pglite`, applies migrations, and seeds the demo workspace.

### Create your account

Go to **`/signup`** and create an account with your name, email, and a password (8+ characters). You will be signed in automatically and your workspace will start empty. This is your day-to-day account.

### Demo workspace

Elena's workspace contains 15 sample applications, emails, replies, follow-ups, and analytics. It is completely separate from your account.

- **Email:** `elena@internshiptracker.app`
- **Password:** `REDACTED_DEMO_CREDENTIAL!`

You can also click **Open demo** on the login screen for one-click access. The demo user is labelled **Demo workspace** in the product. Set `DEMO_LOGIN_ENABLED=false` to disable the demo shortcut, and `SEED_DEMO=false` to prevent seeding Elena locally.

In a deployed database, run the seed command once if you want the demo account available:

```bash
DATABASE_URL="postgresql://..." pnpm db:seed
```

### Testing the flows

With the dev server running on port 3001:

```bash
pnpm dev --port 3001
pnpm test:flows
pnpm test:extended
```

`pnpm test:flows` exercises the seeded demo account: sign-in, application creation with an initial email, recording a reply, searching, CSV export, and deletion. `pnpm test:extended` covers account creation, empty-state onboarding, templates, settings, bulk actions, notes, scheduling, private-data isolation, password changing, password sign-in, the demo shortcut, and sign-out.

## Environment variables

```bash
# App
APP_URL=http://localhost:3000
SESSION_SECRET=generate-a-long-random-value

# Demo workspace
DEMO_LOGIN_ENABLED=true
SEED_DEMO=true

# Production database (Supabase Postgres recommended)
DATABASE_URL=postgresql://...

# Optional: Supabase Auth for Google / Apple OAuth
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

`DATABASE_URL` is optional locally. When present, the app uses it instead of PGlite. In production, always set it.

`SESSION_SECRET` is required in production. Never commit `.env.local`.

## Giving access to other people

Share the deployment URL and point people to **`/signup`**. Each person creates their own password-protected account and sees only their own applications. There is no shared workspace and no way for one account to read another account's data.

If you want to keep the deployment private, use Vercel Deployment Protection or put the app behind your own access layer.

## Supabase + Vercel setup

### Database

1. Create a Supabase project.
2. Copy the Postgres connection string into `DATABASE_URL`. The pooled connection string is recommended for serverless deployments.
3. Apply the schema:
   ```bash
   DATABASE_URL="postgresql://..." pnpm db:migrate
   ```
   The SQL migrations live in `drizzle/`. For a fresh project you can instead paste `supabase/schema.sql` into the Supabase SQL editor. Use one method, not both.
4. Optionally seed Elena's demo workspace:
   ```bash
   DATABASE_URL="postgresql://..." pnpm db:seed
   ```

### Auth: Google & Apple sign-in

Email/password accounts work immediately with no external auth service. Supabase Auth is only needed for the **Sign In with Google** and **Sign In with Apple** buttons.

1. **Set the Supabase Auth environment variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
2. **Add the app callback to Supabase**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://your-domain.com`
   - Redirect URLs:
     - `https://your-domain.com/auth/callback`
     - `http://localhost:3000/auth/callback` for local testing
3. **Google**
   - Google Cloud Console → APIs & Services → OAuth consent screen. Publish the app (or add test users while testing).
   - Credentials → Create OAuth client ID → Web application.
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret into Supabase Dashboard → Authentication → Providers → Google.
4. **Apple**
   - Apple sign-in requires a paid Apple Developer Program membership.
   - In Apple Developer, create a Services ID with Sign in with Apple enabled. Add your domain and `https://<project-ref>.supabase.co/auth/v1/callback` as a return URL.
   - Create a Sign in with Apple key, note the Key ID and Team ID, and download the `.p8` key.
   - Add the Services ID, Team ID, Key ID, and private key in Supabase Dashboard → Authentication → Providers → Apple.
   - Apple’s provider setup is the slowest part. If Apple credentials are not ready, you can still go live with email/password and Google; the Apple button will only succeed once the provider is configured.

If Supabase Auth is not configured, the social buttons show a helpful inline message and email/password login continues to work normally.

### Go-live checklist

Use this on launch day:

- [ ] Supabase project created
- [ ] Database migration applied to the production database
- [ ] `DATABASE_URL` added to Vercel (transaction/session pooler)
- [ ] `SESSION_SECRET` generated and added to Vercel
- [ ] `APP_URL` set to the production URL
- [ ] Supabase Auth URL Configuration updated with the production callback
- [ ] Google OAuth client configured
- [ ] Apple provider configured (if launching with Apple)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel
- [ ] Deployment built and `/api/health` returns `{ "ok": true }`
- [ ] Open production `/signup`, create your own account, and confirm the dashboard is empty
- [ ] Open Google/Apple sign-in from production and confirm the callback returns to `/dashboard`
- [ ] Seed Elena's demo workspace if you want it in production: `DATABASE_URL="..." pnpm db:seed`
- [ ] Optional: disable demo access with `DEMO_LOGIN_ENABLED=false`

`/api/health` reports database reachability, whether Supabase Auth is configured, and whether a session secret is present. It never returns secret values.

### Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add `APP_URL`, `SESSION_SECRET`, and `DATABASE_URL`.
   - Set `SEED_DEMO=false` if you do not want Elena's sample data in production.
   - Leave `DEMO_LOGIN_ENABLED=true` only if the demo account exists and you want the shortcut visible.
4. Run the database migration once against the production database.
5. Deploy with the default Next.js build command (`pnpm build`).

## Data model

- `users` — name, email, password hash, optional avatar, and demo marker
- `auth_tokens` — legacy hashed local sign-in tokens (kept for future passwordless support)
- `companies` — user-scoped company records and notes
- `applications` — role, contact, method, status, applied/last-contact/follow-up dates, notes
- `email_interactions` — append-only sent and received emails with Gmail-ready metadata fields
- `activities` — the chronological timeline of every event, linked to emails where relevant
- `templates` — reusable email content
- `settings` — configurable follow-up intervals, default method, and signature

All reads and mutations filter by the authenticated user's ID. New accounts get an empty workspace and three starter templates. Only the demo user is seeded with sample data.

## Behaviour notes

- **Ghosted is manual.** No background job ever changes an application to ghosted. It must be confirmed in the UI.
- **Follow-up dates** are recalculated when you log a follow-up. Terminal statuses clear the next scheduled date. Changing your cadence affects future suggestions, not existing dates.
- **Emails are immutable.** Logging a follow-up or reply adds a row; existing interactions are never edited or deleted except when the whole application is deleted.
- **Follow-up effectiveness** only counts replies that arrived after at least one follow-up email was sent.
- **Password resets by email are not included yet.** Passwords can be changed from Settings while signed in.
- **Gmail integration** is intentionally deferred. `gmail_message_id` / `gmail_thread_id` fields are present on email interactions so syncing can be added without changing the core schema.
- **CSV export** is available from the top bar, each page's Export action, and `/api/export`.

## Project structure

```text
app/
  (auth)/                 auth pages + split layout
  (app)/                  protected shell and pages
  actions/                server actions for auth and CRUD
  api/                    search + CSV export
  auth/                   legacy link verification and Supabase OAuth callback
components/
  app-shell/              sidebar, top bar, search, notifications
  applications/           table, form, detail, timeline, email history
  dashboard/              metrics, recent applications, action items
  emails/                 email archive
  templates/              template manager
  companies/              company view
  settings/               profile, password, and cadence forms
  ui/                     shadcn-style primitives
lib/
  auth/                   password hashing, session signing, demo account helpers
  db/                     Drizzle schema, client, migrations, seed
  queries/                user-scoped read models
drizzle/                  generated SQL migrations
scripts/                  migrate, seed, reset, visual and flow tests
```

## Useful commands

```bash
pnpm dev                 # local development
pnpm build               # production build
pnpm start               # serve a production build
pnpm typecheck           # TypeScript check
pnpm db:generate         # generate a new migration from schema changes
pnpm db:migrate          # apply migrations to DATABASE_URL
pnpm db:seed             # reseed the demo workspace (stop the dev server first)
pnpm db:reset            # delete the local embedded database (stop the dev server first)
```

---

Built for a calmer, more organized internship search.
