import { useEffect } from 'react'
import { flight, useHud } from '../store/flight'
import { readFlight, WAYPOINTS } from '../three/flightCurve'
import { prefersReducedMotion } from './useDeviceTier'

/* =========================================================================
   SCROLL → FLIGHT PATH
   Page scroll is the throttle. Each section registers an anchor: the aircraft
   is at that section's waypoint when the section is framed, so the airframe
   arrives exactly as its copy comes on screen — regardless of how tall each
   section turns out to be.

   Writes go to a mutable object (free, per-frame safe) plus a quantised store
   (a handful of DOM re-renders per gesture). Nothing renders at scroll rate.
   ========================================================================= */

/** Fraction of a viewport at which a section counts as "arrived". */
const ARRIVAL_LEAD = 0.12

interface Anchor {
  s: number
  t: number
}

function mapT(anchors: Anchor[], scroll: number): number {
  if (anchors.length === 0) return 0
  if (scroll <= anchors[0].s) return anchors[0].t
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]
    const b = anchors[i + 1]
    if (scroll <= b.s) {
      const span = Math.max(1, b.s - a.s)
      return a.t + (b.t - a.t) * ((scroll - a.s) / span)
    }
  }
  return anchors[anchors.length - 1].t
}

export function useScrollProgress() {
  useEffect(() => {
    const doc = document.documentElement
    let raf = 0
    let anchors: Anchor[] = []

    const measure = () => {
      const max = Math.max(1, doc.scrollHeight - window.innerHeight)
      anchors = WAYPOINTS.map((wp, i) => {
        const el = document.getElementById(`section-${wp.id}`)
        const top = el ? el.getBoundingClientRect().top + window.scrollY : 0
        const s = i === 0 ? 0 : top - window.innerHeight * ARRIVAL_LEAD
        return { s: Math.min(max, Math.max(0, s)), t: wp.t }
      })
    }

    const apply = () => {
      raf = 0
      const max = Math.max(1, doc.scrollHeight - window.innerHeight)
      const scroll = window.scrollY || window.pageYOffset || 0
      const progress = Math.min(1, Math.max(0, scroll / max))
      const t = mapT(anchors, scroll)
      flight.progress = progress
      flight.t = t
      useHud.getState().setReadout(readFlight(t))
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }

    const onResize = () => {
      measure()
      onScroll()
    }

    const onPointer = (e: PointerEvent) => {
      flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      flight.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }

    // Fonts and the headshot change section heights; re-measure once settled.
    const settle = window.setTimeout(() => {
      measure()
      apply()
    }, 400)

    measure()
    apply()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    if (!prefersReducedMotion()) {
      window.addEventListener('pointermove', onPointer, { passive: true })
    }

    return () => {
      window.clearTimeout(settle)
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])
}
