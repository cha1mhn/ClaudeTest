# Portfolio

A single-file, dependency-free, interactive one-page portfolio.

## How to use

Open `index.html` in any browser. That's it — no build step, no install.

## How to edit

Everything on the page renders from one object near the top of the `<script>` block
in `index.html`:

```js
const PROFILE = { name, location, roles, bio, about, email, links,
                  stats, experience, skills, projects, education };
```

Change the values there and the whole page updates — nav, timeline, skill bars,
project cards, and the command palette are all generated from it.

## What's interactive

- Typewriter role cycler in the hero
- Command palette — `⌘K` / `Ctrl+K` or `/` — fuzzy jump to any section or action
- Scroll progress bar and scroll-spy nav underline
- Expandable experience timeline (accordion)
- Filterable skill grid with bars that animate on scroll
- Project cards with a cursor-following spotlight
- Light/dark toggle, persisted to `localStorage`, defaults to system preference
- Click-to-copy email with a toast confirmation
- Scroll-reveal animations, staggered per item
- Respects `prefers-reduced-motion`; no horizontal scroll at phone width

## Deploying

It's one static file. Drop `index.html` on GitHub Pages, Netlify, Vercel, or any
static host.
