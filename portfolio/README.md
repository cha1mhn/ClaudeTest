# chai

A single-file personal site. No build step, no dependencies. Open `index.html`.

## Editing

Content lives in three arrays at the top of the `<script>` block: `WORK`, `LINKS`
and `EDU`. The two intro paragraphs are plain HTML in the body. Every work row
expands to show its `note`. The profile photo is `chai.png`.

## Unverified copy

The role notes are written at director altitude and some specifics were invented
to make them land. Check these before the site goes public:

- iplicit: "growing fast enough to break things", and the AI layer described as
  making the pipeline report itself
- ProsperoHub: "live in weeks instead of a quarter"
- Zeni: "turned month end from an investigation into a report"

Everything else (companies, dates, titles, schools, the Datazip interview) comes
straight off the LinkedIn profile.

## Colour

Two custom properties set per theme: `--ac` rust and `--ac2` teal, opposite each
other on the wheel. Rust marks the work list, teal marks anything you can click
through to. Change those two values and the page follows.

## Interactions

- Hovering a list dims the other rows; the hovered row slides and its year opens up
- Click a company to expand. The plus turns to a minus over a half turn
- Sound: short Web Audio tones on expand, collapse and outbound links. No audio
  files. Header toggle, saved to `localStorage`
- Haptics: `navigator.vibrate` on the same events, independent of the sound
  toggle. Android Chrome only, iOS Safari has never supported it
- Light/dark toggle, saved, follows the system by default, drives `theme-color`
- All motion off under `prefers-reduced-motion`

## Deploying

One HTML file plus one image. GitHub Pages, Netlify, Vercel, any static host.
