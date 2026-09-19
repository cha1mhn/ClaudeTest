# chai

A single-file personal site. No build step, no dependencies. Open `index.html`.

## Editing

Content lives in three arrays at the top of the `<script>` block: `WORK`, `LINKS`
and `EDU`. The two intro paragraphs are plain HTML in the body. Every work row
expands to show its `note`. The profile photo is `chai.png`.

## Interactions

- Hovering the work or featured list dims the other rows
- Click a company to expand what the work was
- Light/dark toggle, saved to `localStorage`, follows the system setting by default
- Staggered fade-in on load, switched off under `prefers-reduced-motion`

## Deploying

One HTML file plus one image. Works on GitHub Pages, Netlify, Vercel, or any
static host.
