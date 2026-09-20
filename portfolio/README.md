# chai

A single-file personal site. No build step, no dependencies. Open `index.html`.

## Editing

Content lives in three arrays at the top of the `<script>` block: `WORK`, `LINKS`
and `EDU`. The two intro paragraphs are plain HTML in the body. Every work row
expands to show its `note`. The profile photo is `chai.png`.

The accent colour is the `--ac` custom property, set once per theme at the top of
the stylesheet. Change those two values and every coloured element follows.

## Interactions

- Hovering the work or featured list dims the other rows; the hovered row slides
  right and its marker, year and role pick up the accent
- Click a company to expand what the work was. The marker turns from plus to
  minus over a half turn and the text fades up behind it
- Sound: short sine tones on expand, collapse and outbound links, synthesised in
  the Web Audio API so there are no audio files. Toggle in the header, saved to
  `localStorage`
- Haptics: `navigator.vibrate` on the same events, independent of the sound
  toggle. Android Chrome only, iOS Safari has never supported it
- Light/dark toggle, saved to `localStorage`, follows the system setting by
  default. Updates `theme-color` so mobile browser chrome matches
- All motion is switched off under `prefers-reduced-motion`

## Deploying

One HTML file plus one image. Works on GitHub Pages, Netlify, Vercel, or any
static host.
