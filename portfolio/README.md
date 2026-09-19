# chaitanyamohan

A single-file personal site. No build step, no dependencies — open `index.html`.

## Editing

All content lives in two arrays near the top of the `<script>` block: `WORK` and
`LINKS`. The intro paragraphs and the education row are plain HTML in the body.
A work entry with a `note` becomes expandable; one without stays a single line.

## Interactions

- Hovering the work or links list dims every other row
- Click a role to expand its detail (only roles with a `note`)
- Light/dark toggle, persisted to `localStorage`, defaults to system preference
- Staggered fade-in on load; all motion is disabled under `prefers-reduced-motion`

## Deploying

One static file — GitHub Pages, Netlify, Vercel, or any static host.
