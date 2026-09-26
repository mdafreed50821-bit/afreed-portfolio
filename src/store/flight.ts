import { create } from 'zustand'

/* =========================================================================
   FLIGHT STATE
   Two channels, deliberately separated:
   • `flight` is a plain mutable object read every frame inside useFrame.
     Writing it never triggers a React render, so scroll stays cheap.
   • `useHud` is a zustand store that only receives quantised values, which
     keeps DOM re-renders down to a handful per scroll gesture.
   ========================================================================= */

/** What the visitor asked for. `auto` follows the detected device tier. */
export type QualityPref = 'auto' | 'full' | 'lite' | 'off'
/** What actually gets mounted. */
export type Quality = 'full' | 'lite' | 'off'

export const flight = {
  /** Position on the flight curve, 0 → 1. Written by the scroll mapper. */
  t: 0,
  /** Raw page scroll progress, 0 → 1. */
  progress: 0,
  /** Load-in sequence progress, 0 → 1, driven by the GSAP master timeline. */
  intro: 0,
  /** Normalised pointer, -1 → 1, for parallax. */
  pointer: { x: 0, y: 0 },
}

export function resetFlight() {
  flight.t = 0
  flight.progress = 0
  flight.intro = 0
  flight.pointer.x = 0
  flight.pointer.y = 0
}

export interface HudState {
  alt: number
  hdg: number
  spd: number
  aoa: number
  mach: number
  trk: number
  lat: number
  lon: number
  dist: number
  /** Index of the nearest named waypoint. */
  active: number
  qualityPref: QualityPref
  quality: Quality
  setReadout: (r: Partial<HudState>) => void
  setQualityPref: (p: QualityPref) => void
  setQuality: (q: Quality) => void
}

const INITIAL = {
  alt: 2400,
  hdg: 0,
  spd: 88,
  aoa: 0,
  mach: 0.15,
  trk: 0,
  lat: 17.385,
  lon: 78.4867,
  dist: 0,
  active: 0,
  qualityPref: 'auto' as QualityPref,
  quality: 'full' as Quality,
}

export const useHud = create<HudState>((set) => ({
  ...INITIAL,
  setReadout: (r) => set(r),
  setQualityPref: (qualityPref) => set({ qualityPref }),
  setQuality: (quality) => set({ quality }),
}))
