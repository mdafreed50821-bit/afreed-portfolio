import { prefersReducedMotion } from '../hooks/useDeviceTier'
import { sectionById } from '../data/sections'
import type { WaypointId } from '../three/flightCurve'

/** Matches the arrival lead used by the scroll mapper so nav and 3D agree. */
const ARRIVAL_LEAD = 0.12

export function scrollToSection(id: WaypointId) {
  const meta = sectionById(id)
  const el = document.getElementById(meta.domId)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * ARRIVAL_LEAD
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}
