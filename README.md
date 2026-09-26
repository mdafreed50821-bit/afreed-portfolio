# Md Afreed — Aeronautical Portfolio

A scroll-driven flight path. The page is a research UAV flying a route; the
sections are its waypoints, and the instrument cluster is a live HUD driven by
the same curve the camera follows.

Original build. No template, theme or asset from any reference project.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview
```

## Before you publish

- The headshot is committed at `public/headshot.jpg`, so `PhotoSlot` shows the
  image rather than its designed placeholder. To swap it, replace the file
  (keep it 899×1599) or point `headshotSrc` in `src/data/content.ts` at a new
  file. Tune the circle-crop framing with `headshot.focusY` in the same file.
- `src/data/content.ts` is the only place biography facts live. It follows one
  rule: nothing is written there that is not on record. Design work must never
  introduce a capability claim, metric, employer, date or award by itself.
- `index.html` carries the meta description, Open Graph tag and JSON-LD
  `Person` block. Update the URLs to the deployed domain.

## How the scroll works

`src/store/flight.ts` owns a plain mutable `flight` object that the render loop
reads directly — no React state on the per-frame path.

1. `useScrollProgress` maps document scroll to `flight.t` in `[0, 1]`.
2. `src/three/flightCurve.ts` owns one `CatmullRomCurve3` with six waypoints,
   one per section. It is the single source of truth: the aircraft transform,
   the camera, the streamline shader head and the HUD readouts all sample it.
3. `Aircraft` lofts a NACA-section wing (`src/lib/airfoil.ts`) into real
   `BufferGeometry`, so the airframe is procedural and costs no download.
4. `CameraRig` trails the aircraft and re-frames per section: copy column left,
   aircraft right on desktop, recentred and biased upward on mobile.
5. `useHud` mirrors derived values (heading, speed, altitude, active waypoint)
   into Zustand for the DOM HUD, which only re-renders on change.

Scroll-scrubbed transforms go through GSAP `quickTo`; scrubbed CSS reveals go
through `ScrollTrigger`. `useCalibrateReveal` measures each block and staggers
them into place, so the timeline survives reflow.

## Performance

- The WebGL layer is a lazy chunk (`three/Scene.tsx`). Reduced-motion and
  off-quality visitors never download Three.js.
- Device tier is detected once (`useDeviceTier`) and drops streamlines, ground
  grid resolution, shadow maps and DPR ceiling on low-power hardware.
- `prefers-reduced-motion` skips the scene entirely for the static instrument
  poster (`components/hud/StaticPoster.tsx`) and the intro.
- Manual override lives in the footer: 3D / Lite / Off, defaulting to auto.

## Layout

```
src/
  data/          content.ts (all biography facts) · sections.ts (waypoint metadata)
  hooks/         scroll mapping · device tier · calibration · intro timeline
  lib/           airfoil lofting · GSAP/ScrollTrigger setup · smooth scrolling
  store/         flight.ts — mutable per-frame state + Zustand HUD slice
  three/         Scene · Aircraft · World · Streamlines · CameraRig · flightCurve
  components/
    hud/         chrome, boot console, waypoint nav, instrument stack, quality
    sections/    Hero · About · Education · Projects · Achievements · Contact
    ui/          frames, headers, brackets, chips, photo slot
```

## Editing the flight path

Waypoints live in `flightCurve.ts` as `[position, lookOffset]` pairs. Move a
point and the aircraft, the camera rig, the streamline field and the HUD all
follow. Section heights come from `sections.ts`; `scroll` is the fraction of
total page height where that waypoint is reached, so adjust it when copy length
changes.
