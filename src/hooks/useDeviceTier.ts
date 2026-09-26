import { useEffect, useState } from 'react'
import type { Quality, QualityPref } from '../store/flight'

/* =========================================================================
   DEVICE / MOTION CAPABILITY
   Drives three things: whether the WebGL scene mounts at all, how heavy that
   scene is allowed to be, and whether the intro timeline runs.
   ========================================================================= */

function match(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

export function prefersReducedMotion(): boolean {
  return match('(prefers-reduced-motion: reduce)')
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export type Tier = 'high' | 'low'

interface NavigatorHints {
  hardwareConcurrency?: number
  deviceMemory?: number
}

/** Coarse capability probe — cheap, synchronous, no layout thrash. */
export function detectTier(): Tier {
  if (typeof navigator === 'undefined') return 'high'
  const hints = navigator as Navigator & NavigatorHints
  const cores = hints.hardwareConcurrency ?? 8
  const memory = hints.deviceMemory ?? 8
  const small = Math.min(window.innerWidth, window.innerHeight) < 480
  const coarse = match('(pointer: coarse)')
  const saveData = match('(prefers-reduced-data: reduce)')

  if (saveData) return 'low'
  if (cores <= 4 && small) return 'low'
  if (cores <= 2 || memory <= 2) return 'low'
  if (coarse && cores <= 6) return 'low'
  return 'high'
}

export function useTier(): Tier {
  const [tier, setTier] = useState<Tier>(detectTier)
  useEffect(() => {
    let last = tier
    const on = () => {
      const next = detectTier()
      if (next !== last) {
        last = next
        setTier(next)
      }
    }
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return tier
}

/** Resolves the effective scene quality from tier + visitor override. */
export function resolveQuality(tier: Tier, pref: QualityPref, reduced: boolean): Quality {
  if (reduced) return 'off'
  switch (pref) {
    case 'off':
      return 'off'
    case 'lite':
      return 'lite'
    case 'full':
      return 'full'
    default:
      return tier === 'low' ? 'lite' : 'full'
  }
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 900
}
