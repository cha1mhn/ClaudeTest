# Sound and haptics

Instructions for reproducing or extending the audio feedback on this site.
Written to be handed straight to an agent or a developer.

## The idea in one line

Four short sine tones, synthesised at runtime, where the direction of the pitch
tells you what just happened. Every tone is paired with a vibration. No audio
files anywhere.

## Why synthesised

Nothing is downloaded, so the page weight does not move and there is no second
request to wait on. A tone is nine numbers. An mp3 of the same tone is 8kb and a
network round trip. At this size, generating it is simply smaller.

It also means the sounds are editable. Change a frequency and you have a new
sound, with no asset pipeline in between.

## The grammar

Pitch direction carries the meaning. Learn it once and the page becomes
predictable.

| Shape | Means | Sound |
|---|---|---|
| Rising | Something opened | `open` |
| Falling | Something closed | `close` |
| Flat | You are passing through | `tick` |
| Rising, wider | A mode changed | `toggle` |

## The four sounds

| Name | From | To | Duration | Gain | Vibration | Fires on |
|---|---|---|---|---|---|---|
| `open` | 420Hz | 760Hz | 100ms | 0.05 | 12ms | Expanding a work row |
| `close` | 700Hz | 380Hz | 90ms | 0.04 | 7ms | Collapsing a work row |
| `tick` | 900Hz | 900Hz | 35ms | 0.035 | 5ms | Clicking any outbound link |
| `toggle` | 560Hz | 880Hz | 130ms | 0.05 | 8, 26, 12ms | Theme switch, sound switch on |

Everything lives between 380 and 900Hz. That band sits above room noise and
below the range where a sine starts to feel sharp. Do not go outside it.

Gain tops out at 0.05, which is about -26 dBFS. The tick is quieter again at
0.035 because it fires most often. Nothing lasts longer than 130ms, so no sound
can overlap the next one in normal use.

## The synth

One function. Both accent sounds and the tick come out of it.

```js
let actx = null;
function tone(from, to, dur = .09, vol = .05) {
  if (!soundOn) return;                     // no context, no oscillator, nothing
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + .02);
  } catch (e) {}
}
```

Five things in there matter more than they look:

1. **`sine` only.** A square or saw has harmonics that cut through a room. A sine
   sits under conversation. Do not change the waveform.
2. **The envelope is not optional.** Starting or stopping an oscillator at full
   gain produces an audible click, which is louder and nastier than the tone. The
   10ms ramp up and the ramp down to silence are what make it a sound rather than
   a pop.
3. **`.0001`, never `0`.** `exponentialRampToValueAtTime` cannot reach zero and
   throws if you ask it to. Ramp to a value near zero instead.
4. **The context is built lazily.** Browsers block audio until a user gesture, so
   creating an `AudioContext` on page load gets you a suspended one and a console
   warning. Build it inside the first click. `resume()` covers the case where it
   was suspended after a tab switch.
5. **The whole body is in a try/catch.** Audio is decoration. If it throws, the
   page must carry on. Same for the vibration wrapper.

## Muting

```js
let soundOn = true;
try { soundOn = localStorage.getItem('sound') !== 'off'; } catch (e) {}
```

Default is on, because the sounds are quiet and tied to deliberate clicks. Stored
as a string so a missing key reads as on.

The mute check sits at the very top of `tone()`. Muted means no oscillator is
created at all, not an oscillator at zero volume. Worth being strict about, since
the lazy check is the kind of thing that quietly costs battery on a page someone
leaves open.

The toggle is a header button with `aria-pressed`, and it swaps the glyph between
a single and a beamed quaver so the state is visible without colour. It plays
`toggle` when switched on and stays silent when switched off, which is the only
sensible confirmation in each direction.

## Haptics

```js
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
```

A number is a single pulse. An array alternates vibrate and pause, so
`[8, 26, 12]` is a short tap, a gap, then a slightly longer one. That double beat
is reserved for mode changes, matching the wider pitch jump on `toggle`.

**Vibration is deliberately not tied to the sound toggle.** Someone on a train
with sound off should still feel the page respond. They are two channels, muted
separately. Turning sound off still fires a 7ms pulse as confirmation.

### What it does not do

`navigator.vibrate` is Android Chrome and Firefox only. **iOS Safari has never
implemented it** and silently ignores the call. Desktop browsers do nothing.
There is no web API that reaches the iPhone Taptic Engine from a normal page, so
roughly half of mobile visitors get sound and animation but no haptics. Treat it
as an enhancement that often is not there, never as the only feedback for an
action.

## Adding a new sound

1. **One sound per intent, not per event.** Expanding a row is one intent, even
   though it fires a click, a class change and a transition.
2. **Never on hover, scroll, focus or page load.** Only on a deliberate press.
3. **Never on anything that can fire more than once a second.** Repeated tones
   stack into a buzz and get annoying within about four repeats.
4. **Stay in the 380 to 900Hz band** and under 130ms.
5. **Pick the direction from the grammar above** before picking the frequencies.
   If the new action does not open, close, pass through or change a mode, it
   probably should not make a sound.
6. **Always pair it with a `buzz`.** A sound with no haptic feels thin on a
   phone, and it leaves muted users with nothing.

## Accessibility note worth acting on

The sounds currently ignore `prefers-reduced-motion`. That setting is about
motion, so this is defensible, but some people set it because feedback of any
kind is distracting, and a few accessibility guides treat audio cues as covered
by it. If you want to be safe, default to muted when the setting is on:

```js
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
let soundOn = !calm;
try { const s = localStorage.getItem('sound'); if (s) soundOn = s !== 'off'; } catch (e) {}
```

An explicit choice still wins, so anyone who turns sound on keeps it.

## What sound is not doing here

No background music, no ambience, no hover chirps, no startup sting, no sound on
anything the visitor did not press. Total audio across an entire visit is under a
second. The restraint is the point. A page that makes noise before you touch it
is the thing everyone mutes at the tab level, and then you have lost the feedback
entirely.
