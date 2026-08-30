# LUMEN MUN — Edition I

Conference site, delegate lifecycle and operations console for LUMEN MUN,
Guntur. Next.js App Router, Postgres via Drizzle, server-rendered throughout.

The look is the **LUMEN MUN design canvas** imported from Claude Design; the
feature set is reinterpreted from **VIVAMUN Edition III**
(`github.com/jirs27652-hash/vivamun-edition-iii`). Neither is copied — the
design system is the source of truth for how everything looks, and VivaMUN's
feature model is the source of truth for what the thing has to do.

---

## Run it

```bash
npm install
npm run db:push      # create the tables
npm run db:seed      # fill them with launch content
npm run dev
```

Then <http://localhost:3000>. The staff console is at `/admin`.

With no `DATABASE_URL` the app runs on an **embedded Postgres** (PGlite,
persisted in `.pglite/`) so it works out of the box. Point `DATABASE_URL` at
Supabase and everything is identical — same schema, same queries.

### Local sign-ins

Copy `.env.example` to `.env.local` and set at minimum `AUTH_SECRET`,
`ADMIN_USERNAME`, `ADMIN_PASSWORD` and `SUPERADMIN_PASSWORD`. The seed also
creates a named admin account, `academics` / `change-me-now` — change or delete
it before you go anywhere near production.

---

## Architecture

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router | Server components mean committee, schedule and team data is fetched on the server and rendered into HTML — no loading spinner on first paint, and it is indexable. |
| Database | **Supabase Postgres**, accessed with **Drizzle** | Supabase is what you already run for VivaMUN. Drizzle keeps the schema in version-controlled TypeScript rather than a dashboard, and talks to plain Postgres — so nothing here is locked to Supabase. |
| Local database | PGlite | A real Postgres in WASM. Same SQL, no account needed to run or seed the project. |
| Auth | scrypt + signed, revocable sessions | Sessions are recorded in the database, so a superadmin can sign one person — or one account, everywhere — straight out. |
| Mutations | Server actions | Every form works before hydration and without JavaScript; validation runs once, on the server, from one schema. |
| Styling | The design system's own CSS | Tokens, components and motion rules carried over verbatim from the canvas. No utility framework fighting it. |

### Rendering strategy

Content pages are **ISR with a 60-second revalidate** — edit a committee in the
console and the public page picks it up within a minute, with no redeploy.
Anything personal (`/register`, `/dashboard`, all of `/admin`) is dynamic and
never cached.

```
○  /  /about  /committees  /schedule  /secretariat  /sponsors  /press  /faq  /forms   ISR, 1m
ƒ  /committees/[slug]  /register  /contact  /dashboard  /admin/*  /api/*             dynamic
```

`/committees/[slug]` is dynamic on purpose: it gates background-guide downloads
on who is signed in, and an agenda release should be visible the second it is
flipped rather than up to a minute later.

---

## What is here

### Public

- **Home** — hero, live readout counters, committee preview, all DB-driven.
- **Committees** — list plus a page each, carrying agenda status and items,
  **chair and vice-chair bios**, seat counts, and **background-guide downloads**
  gated to delegates allocated to that committee.
- **Secretariat** — grouped **by department**, with roles, bios and portraits.
- **Schedule** — **day-by-day agenda** with a session timeline, typed by kind
  (committee / ceremony / break / social / check-in).
- **Register** — individual and school tracks, DB-driven **fee tiers**, live
  total, mandatory-form gate, UPI QR payment and proof upload.
- **Sponsors** — tiers with prices and perks; confirmed partners move into the
  logo wall.
- **Press & gallery**, **FAQ** (grouped, accordion), **Forms**, **Contact**
  (persisted, not just emailed), **Design system**.

### Delegates

Account created at registration, email verification, password reset, and a
dashboard with payment status, allocation, a progress rail, committee documents
and a **check-in QR pass**.

### Operations console (`/admin`)

Three roles — `oc`, `admin`, `superadmin` — each seeing only what it may use.

- **Overview** — confirmed / awaiting review / unpaid / allocated / checked-in,
  confirmed revenue, recent registrations and activity.
- **Registrations** — filter, search, **approve or reject with a reason**
  (the delegate sees it and can re-submit), view proof, **CSV export**.
- **School delegations** — review and approve invoiced delegations.
- **Allocations** — assign committee and portfolio against stated preferences,
  with live per-committee seat counts and over-capacity warnings, allocation
  history, and superadmin-only locks.
- **Check-in** — camera QR scanner with manual fallback, kit issue, daily
  check-in roll, append-only log.
- **Site content** — committees, secretariat, schedule, sponsors, FAQs, fee
  tiers, registration window, homepage copy and contact details.
- **Staff accounts** — create accounts, disable them, revoke live sessions.
- **Audit log** — append-only, searchable, paginated.

### Beyond the brief

Carried over from VivaMUN because leaving them out would have made the rest
weaker, and flagged here so they are a decision rather than a surprise:
delegate accounts and dashboard, UPI payment verification, the allocations
engine, QR check-in, role-based staff accounts, the audit log, and announcements.

Not carried over: Cultural Night sign-ups, web-push, database snapshot/restore,
succession keys, and delegate impersonation. Say the word and any of them can
follow — the schema has room.

---

## Editing content

Everything a delegate reads comes from Postgres and is edited in
`/admin/content/*`. `scripts/seed.ts` only sets the launch state; after the first
run it is not the source of truth.

Placeholders still to fill: social handles (`/admin/content/settings`), photo
paths for secretariat and chairs, the three mandatory-form PDFs in
`public/docs/`, and per-committee background guides.

---

## Design system

Editorial dark, built out of the crest itself.

The logo is a wine field carrying a gold mark. Sampling it gives `#540C24`,
hsl(340 75% 19%), and `#FCA800`, hsl(40 100% 49%). The page ground is that same
340deg wine taken down to near-black, and the accent is that same gold. Nothing
on the page is a colour the brand does not already own, which is what stops the
logo reading as pasted on.

Type is oversized with tight tracking, and the vertical rhythm is generous.

The tokens live in `app/globals.css`, the components in `app/ui.css`, and the
operations console has its own denser layer in `app/admin.css`. The whole system
is documented and rendered live at **`/system`**.

Four rules the system holds itself to, and which any new page has to keep:

- **One accent.** The crest's gold, used for emphasis, primary actions and
  state. Nothing else introduces a hue.
- **One radius rule.** Anything you can click is a pill. Surfaces are 16px.
  Inputs are 12px. No component invents its own corner.
- **One theme.** Dark from the header to the footer. No section inverts
  mid-scroll, so the reader never feels they changed website.
- **One layout family per section.** No page repeats a section shape. The home
  page runs seven sections across seven different families: centred masthead,
  hairline figure strip, editorial statement, asymmetric card grid, timeline,
  bento, and a full-bleed close.

Every text tier clears WCAG AA against the ground: body 8.2:1, secondary
5.5:1. `--text-4` is reserved for icons and placeholders, never copy.

Type is **Geist** and **Geist Mono**, both variable, self-hosted through
`next/font`. Photography renders monochrome and warms to full colour on hover,
which gives the hover something to say and makes a set of unrelated photographs
read as one set.

### The opening screen

The home page opens on a full viewport of nothing but the crest. The header is
hidden until that screen has been scrolled past, watched by an
IntersectionObserver on a 1px sentinel rather than a scroll listener. It is
`position: fixed` rather than sticky, because a sticky header still occupies a row
in the flow while hidden, which left a strip of page above the opening; routes
without an opening screen reserve the 68px themselves.

The section is painted in one flat colour, `--crest-field`, which is the artwork's
own background. Three things had to line up for the image to have no visible
edge, and all three are handled by `npm run crest`:

1. The outermost pixel ring of the source is a dark JPEG artifact, not the
   background. It is cropped.
2. The background is measured from the four corner patches. The border ring
   picks up that artifact and reads too dark; sampling inward picks up the
   globe and reads too light. Either one leaves a visible square.
3. Resampling and sharpening leave the flat area varying by a couple of levels,
   which shows against a solid page. Pixels within 12 of the field are snapped
   to it exactly, which is about 70% of the image.

The script prints the colour **as encoded**, and that is the value `--crest-field`
must hold. The image is rendered `unoptimized` so Next does not re-encode it and
shift the background back out of alignment.

The asset is 1600px against a 660px display size, roughly 2.4x density. The
source is only 1179px, so a larger export would add bytes rather than detail. If
the original vector ever turns up, replace `crest.jpg` and re-run the script.

### The crest

The mark ships as the supplied raster, upscaled and cleaned by `npm run crest`.

It is deliberately not a trace. Tracing it to vector worked, but the dim globe
wireframe sits only a few levels above the background, so noise crossed its
threshold constantly and it traced as thousands of ragged specks. The denoising
needed to fix that softened the whole mark, and the result was blurrier than the
original. The original is sharper, so the original is what ships.

Three details matter for the seamless opening screen, all handled by the script:

1. The outermost pixel ring of the source is a dark JPEG edge artifact, not the
   background. It is cropped, or it reads as a thin outline once scaled up.
2. The field is measured from the four corner patches. The border ring picks up
   that artifact and reads too dark; sampling inward picks up the globe and
   reads too light. Either one leaves a visible square.
3. Resampling leaves the flat field varying by a couple of levels, which shows
   against a solid page. Pixels within 12 of the field are snapped to it exactly,
   about 70% of the image.

The script prints the field colour **as encoded**, and that is what `--crest-field`
must hold. The image renders `unoptimized` so Next does not re-encode it and shift
the field back out of alignment.

The asset is 1600px against a 660px display, about 2.4x density. The source is
only 1179px, so a larger export would add bytes rather than detail. If the
original vector ever turns up, replace `crest.jpg` and re-run the script.

### The ambient ground

Three wine washes on deliberately mismatched cycles of 37, 53 and 67 seconds, so
the pattern never repeats the same way twice. On a fine pointer the whole field
also leans toward the cursor, which is what makes it read as a lit surface
rather than a picture of one.

It is rendered once in the site layout, not per page, so the node survives
client-side navigation: the animations keep their phase and the ground stays
continuous as you move between routes instead of restarting.

The pointer offset is written straight to a CSS custom property on the element,
coalesced to one write per frame, rather than going through React state. It
updates on every pointer move and re-rendering the tree at that rate would be
wasted work.

The grain layer over it is not decoration. An eight-bit gradient across this
much dark area bands visibly, and a little noise dithers it away.

### Photography

Every image comes from the database. Where a record has no image yet, which is
everything before Edition I happens, `lib/image.ts` serves a local stand-in from
`public/img/placeholder/`. They are held locally rather than hot-linked, so
there is no external dependency and the site renders complete offline.

To replace one, set the record's `image` column from the admin console. Nothing
else has to change.

---

## Motion

Motion is only allowed to run when it is communicating something. Every
animation below establishes hierarchy, sequence, or feedback.

- **Scroll reveal** — content arrives in the order you are meant to read it,
  once, then stays put. Nothing loops. Implemented with Motion's `whileInView`
  in `components/ui/Reveal.tsx`.
- **Hero entrance** — the headline, lede and actions stagger in on mount, which
  establishes the reading order of the page.
- **Pending state** — a link waiting on its route grows a moving amber underline
  (`useLinkStatus`). It reports state; it is not decoration.
- **Loading** — every data route has a skeleton with the *same grid and card
  heights* as the real content, so nothing reflows when data lands.
- **Card hover** — a 4px lift and a border brightening. Never a scale, never a
  bounce.
- **Reduced motion** — under `prefers-reduced-motion: reduce` every reveal
  renders in its final state with no transition, and the accordion, hover and
  skeleton animations stop.

---

## Deploying

1. Create the Supabase project and run `npm run db:push` against it
   (`DATABASE_URL=... npm run db:push`), then `npm run db:seed` once.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
   `SUPERADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`. Add `UPI_ID` to switch the
   payment QR on, and `SMTP_*` to switch email on. Both are optional — without
   them the app runs and those steps degrade with an honest message.
3. `npm run build && npm start`.

**The build needs a reachable database** (ISR pages are pre-rendered). That is
normal; set `DATABASE_URL` in CI. To smoke-test a production build locally
against PGlite: `ALLOW_PGLITE=1 npm run build`.

**Payment proofs are written to disk** (`./uploads`, or `UPLOAD_DIR`), served
only through an authenticated route. On a platform with an ephemeral filesystem
either mount a volume or move that one handler to Supabase Storage — nothing
else in the flow changes.

---

## Notes and gotchas

- **PGlite is single-writer.** The dev server holds the lock, so `db:seed` and
  any script will fail while it is running — stop the server first. If a hard
  kill corrupts the data directory, `npm run db:reset` rebuilds and reseeds it.
  Neither applies to Supabase.
- **Middleware is a fast path, not a security boundary.** It runs on the Edge
  runtime and only checks whether a session cookie exists. Every real check
  happens server-side where the database is reachable.
- `design/` is the imported Claude Design canvas and `reference/static-v1/` is
  the earlier static implementation. Both are kept for comparison, excluded from
  lint, and not part of the build.

---

## Layout

```
app/
  globals.css      design tokens, reset, type scale, buttons, forms
  ui.css           components: header, hero, cards, grids, wizard, footer
  admin.css        denser layer for the operations console only
  (site)/          public pages + delegate dashboard
  admin/           operations console
  api/             QR generation, proof upload/serve, CSV export
components/        site/, admin/, auth/, register/, ui/ (Reveal)
db/                schema.ts (the data model), index.ts (connection)
lib/
  image.ts         placeholder photography until real images are uploaded
  actions/         server actions: register, auth, admin, content, contact
  auth.ts          sessions, roles, password verification
  content.ts       cached content queries, every public page reads through here
  validation.ts    zod schemas shared by server actions and form errors
scripts/seed.ts    launch content
public/img/placeholder/  stand-in photography, swap via the admin console
design/            imported Claude Design canvas (reference)
reference/         previous static build (reference)
```
