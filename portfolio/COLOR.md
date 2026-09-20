# Colour system

Instructions for reproducing or extending the colour on this site. Written to be
handed straight to an agent or a developer.

## The idea in one line

Two accents sitting opposite each other on the colour wheel. Rust marks the work
itself. Teal marks anything you can click through to. Everything else is neutral.

Measured hue angles: rust 15deg, teal 188deg. That is 173deg apart, near enough
to a true complement (180deg) to read as deliberate rather than accidental.

## Tokens

Six variables per theme, declared on `:root`. Nothing in the stylesheet uses a
raw hex value except `::selection`, which needs white text on the accent.

```css
:root{
  --bg:#FFFFFF;   /* page          */
  --ink:#101012;  /* primary text  */
  --dim:#87878E;  /* secondary text, section labels, descriptions */
  --line:#EAEAE6; /* hairline rules between rows */
  --ac:#B8461F;   /* rust  */
  --ac2:#12707E;  /* teal  */
}
:root[data-theme="dark"]{
  --bg:#0C0C0D;
  --ink:#ECECEA;
  --dim:#7A7A82;
  --line:#222225;
  --ac:#F08A5D;   /* rust, lifted for dark */
  --ac2:#5CC2CE;  /* teal, lifted for dark */
}
```

The dark accents are not the light ones inverted. They are lighter and less
saturated, because a dark background makes a deep colour look muddy. Keep the
hue, raise the lightness.

Declare the same dark block twice: once under `:root[data-theme="dark"]` for the
manual toggle, once under `@media (prefers-color-scheme:dark)` guarded by
`:root:not([data-theme="light"])` so the system preference applies until someone
overrides it.

## The rule

| Colour | Meaning | Applied to |
|---|---|---|
| `--ac` rust | This is the work. Time, state, and the thing being expanded. | Year column, expand marker, current employer, text selection |
| `--ac2` teal | This goes somewhere. Anything clickable that leaves the page or toggles state. | Featured and Education key columns, outbound arrow, nav links on hover, nav underline, sound toggle when on, footer link |
| `--ink` | Names. | Company names, article titles, school names |
| `--dim` | Everything else. | Section labels, role titles, descriptions, dates in the right column |

If you add an element, ask one question: is it about the work, or does it take
you somewhere? That answers which accent it gets. If neither, it stays neutral.

## Element map

Every accent usage in the file, in order. There are eleven.

**Rust, `--ac`, four places**

| Selector | Property | Why |
|---|---|---|
| `::selection` | `background`, with `color:#fff` | Selection is the one place a raw hex is allowed |
| `.now b` | `color` | Current employer in the intro paragraph. The only coloured word in body copy |
| `.hd .yr` | `color` | Year column of the work list. This is the main run of colour on the page |
| `.mk::before`, `.mk::after` | `background` | The two bars of the plus and minus marker |

**Teal, `--ac2`, seven places**

| Selector | Property | Why |
|---|---|---|
| `.top nav a::after` | `background` | Underline that sweeps in from the left on hover |
| `.top nav a:hover` | `color` | |
| `.top button:hover` | `color` | Sound and theme buttons |
| `#snd.on` | `color` | Sound toggle stays teal while sound is on. Reverts to `--dim` when off |
| `.links .k` | `color` | Key column of Featured and Education. Mirrors the rust year column, different job |
| `.links .ar` | `color` | The outbound arrow |
| `footer a` | `color` | |

## Rules to hold to

1. **Never use both accents on one element.** A row gets rust or teal, not both.
2. **Never colour a heading, a company name or a body paragraph.** Names stay
   `--ink`, prose stays `--dim`. The accents are for the small stuff around them.
3. **Keep the coloured share near a fifth of the page.** If colour starts
   carrying the layout rather than annotating it, pull some back to neutral.
4. **Hover changes colour, it does not add colour.** A neutral element can move
   to an accent on hover. An accent element should not switch accents.
5. **No gradients, no tints, no opacity variants of the accents.** One flat value
   per accent per theme. Dimming is done with `opacity` on the whole row.
6. **Borders and rules stay `--line`.** No coloured borders anywhere.

## Re-theming

To move to a different pair, change four hex values and nothing else.

1. Pick the primary. Take its hue angle.
2. Add 180deg for the partner, then nudge by up to 15deg either way if the exact
   complement clashes. True complements can vibrate against each other.
3. For light mode, aim for 40 to 50% lightness so both clear 4.5:1 on white.
4. For dark mode, same hue at 60 to 70% lightness.
5. Check all four against their backgrounds before shipping.

Pairs that work with the same rules: teal and coral, indigo and amber, forest and
plum. Avoid red and green together, which reads as status rather than structure.

## Contrast

Measured against the page background. 4.5:1 is the WCAG AA floor for body text,
3:1 for large text and non-text marks.

| Token | Light on `#FFFFFF` | Dark on `#0C0C0D` |
|---|---|---|
| `--ac` rust | 5.34:1 | 7.91:1 |
| `--ac2` teal | 5.76:1 | 9.37:1 |
| `--dim` | 3.57:1 | 4.59:1 |
| `--ink` | 19.01:1 | high |

Both accents clear AA in both themes. `--dim` at 3.57:1 in light mode is under
the body-text floor. It carries secondary copy only, never anything load
bearing, but if you want full AA throughout, darken it to about `#6E6E76`.

## What colour is not doing here

No coloured backgrounds, no cards, no badges, no filled buttons. The page is
white or near-black with hairline rules. Colour appears as text and as two 1.5px
bars. That restraint is the point. Adding a filled accent button or a tinted
panel will break the balance faster than changing the hues will.
