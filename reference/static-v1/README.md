# Lumen MUN — Edition I

Implementation of the **Lumen MUN** design canvas, imported from Claude Design
(project `677594ea-5987-4b89-b048-51680bfdf474`).

A static site: no build step, no dependencies, no framework. Drop the folder on
any static host (GitHub Pages, Netlify, Cloudflare Pages, S3) and it runs.

## Run it locally

```bash
node lumen-mun/serve.js 4173
```

Then open <http://localhost:4173>. (Opening `index.html` over `file://` also
works, but a server is closer to production.)

## Layout

```
lumen-mun/
├─ index.html              all eleven pages, one document
├─ assets/
│  ├─ css/styles.css       tokens → primitives → components → responsive
│  ├─ js/data.js           ← edit this to update site content
│  ├─ js/app.js            router, rendering, interactions
│  └─ img/crest.jpg        the crest
├─ serve.js                local preview server
└─ design/                 the imported design canvas, unmodified
   ├─ Lumen MUN.dc.html
   ├─ support.js
   └─ uploads/1000396282.jpg
```

`design/` is the source of truth for visual decisions and is kept verbatim so
the implementation can be diffed against it later. Nothing in the site loads
from it.

## Updating content

Everything that changes between now and the conference lives in
`assets/js/data.js` — committees, secretariat roles, the three days, sponsor
tiers, FAQs, and the design tokens. Edit the arrays; the markup follows.

Prose that is unlikely to change (hero copy, mission and vision, the About
essay) is written directly in `index.html`.

Placeholders still to fill in:

- **Social handles** — `#page-contact` renders them as inert `<span class="social">`.
  Swap each for `<a class="social" href="…">` when the accounts go live.
- **Image slots** — every `[ … ]` hatched panel is a named photo slot. Replace
  the `.slot-label` with an `<img>`; the reticle brackets and hover states carry over.
- **Dates and agendas** — currently "To be announced" throughout, as designed.

## Forms

Three forms: individual delegate (Form A), school delegation (Form B), and
contact. All validate natively before submitting.

By default they compose a pre-filled email to the owning department, so the site
is fully functional with no backend. To POST to a real endpoint instead, set the
global before `app.js` loads:

```html
<script>window.LUMEN_FORM_ENDPOINT = 'https://example.com/api/registrations';</script>
```

The endpoint receives a JSON body of the field names plus a `form` key naming
which form was submitted.

## What the design specified, and where it lives

| Design decision | Implementation |
| --- | --- |
| 620ms HUD sweep, content swaps at 260ms | `navigate()` in `app.js` |
| Counters tick once over 1.1s | `startCounters()`, cubic ease-out |
| Reticle brackets ignite on hover | `--ret` custom property per card |
| Corner cuts 14–20px | `.cut` + `--cut`, 10px under 720px |
| Panels black at 18–22% over maroon | `--surface-*` tokens |
| Never scale, never bounce | only `translateY` and `box-shadow` transition |

## Deliberate departures from the prototype

Three, all noted because they change what a visitor sees:

1. **The registration page's "RESPONSIVE BEHAVIOUR" panel moved.** In the canvas
   it sat inside the registration page itself — design documentation in a
   delegate-facing page. Its five rules are now implemented as real CSS, and the
   panel itself moved to the Design system page beside the existing
   "Homepage — mobile" spec, where documentation belongs.

2. **Every `<div onClick>` became a link or a button.** The prototype had no
   keyboard path through the site at all. Navigation items are `<a href="#/…">`
   (so they are focusable, deep-linkable and open in a new tab), the FAQ is a
   proper accordion with `aria-expanded`, and the track picker is a pair of
   `aria-pressed` buttons. A gold focus ring is the one visual element added
   that the design does not draw.

3. **Motion respects `prefers-reduced-motion`.** The drifting starfields, scan
   line, pulsing dots and page sweep all stop, and routing becomes instant.

## Routing

Hash-based (`#/committees`), so deep links, the back button and refresh all work
on a plain static host with no server rewrites. `#/` and an empty hash both
resolve to home; anything unrecognised falls back to home rather than a blank page.

## Browser support

Modern evergreen browsers. Uses `clip-path`, CSS custom properties,
`aspect-ratio`, `backdrop-filter` and `:focus-visible` — all as the design
specified. `backdrop-filter` degrades to a solid header background where absent.
