import type { RefObject } from 'react'
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { prefersReducedMotion } from './useDeviceTier'

/* =========================================================================
   CALIBRATION REVEAL
   Not a fade-up. Each section runs an instrument warm-up: corner brackets
   converge from outside, the reticle snaps to centre, the header rule extends,
   then the content unlocks left-to-right with a brief defocus — and a single
   scanline passes down the block once, like a display refreshing.
   ========================================================================= */

export interface CalibrateOptions {
  /** Stagger between content rows, in seconds. */
  stagger?: number
  /** Skip the scanline pass (used for short blocks). */
  noScan?: boolean
}

export function useCalibrateReveal(
  scope: RefObject<HTMLElement>,
  { stagger = 0.075, noScan = false }: CalibrateOptions = {},
) {
  useEffect(() => {
    const root = scope.current
    if (!root) return

    if (prefersReducedMotion()) {
      gsap.set(root.querySelectorAll('[data-calib], [data-calib-blur]'), {
        opacity: 1,
        y: 0,
        filter: 'none',
        clipPath: 'inset(0 0 0 0)',
      })
      gsap.set(root.querySelectorAll('[data-calib-bracket]'), { scale: 1, opacity: 1 })
      gsap.set(root.querySelectorAll('[data-calib-rule]'), { scaleX: 1 })
      gsap.set(root.querySelectorAll('[data-calib-reticle]'), { scale: 1, opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 82%',
          end: 'bottom 45%',
          toggleActions: 'play none none reverse',
        },
      })

      tl.from('[data-calib-bracket]', {
          scale: 2.1,
          opacity: 0,
          duration: 0.55,
          stagger: 0.045,
          ease: 'power3.out',
        })
        .fromTo(
          '[data-calib-reticle]',
          { scale: 1.4, opacity: 0, rotate: -35 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: 'expo.out' },
          0.04,
        )
        .from(
          '[data-calib-rule]',
          { scaleX: 0, transformOrigin: 'left center', duration: 0.65, ease: 'expo.inOut' },
          0.08,
        )
        .from(
          '[data-calib]',
          { y: 20, opacity: 0, duration: 0.72, stagger, ease: 'expo.out' },
          0.14,
        )
        .from(
          '[data-calib-blur]',
          { y: 12, opacity: 0, filter: 'blur(7px)', duration: 0.8, stagger, ease: 'expo.out' },
          0.2,
        )

      if (!noScan) {
        tl.fromTo(
          '[data-calib-scan]',
          { yPercent: -130, opacity: 0 },
          { yPercent: 700, opacity: 1, duration: 1.15, ease: 'power1.inOut' },
          0.24,
        ).to('[data-calib-scan]', { opacity: 0, duration: 0.3 }, 1.2)
      }
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [scope, stagger, noScan])
}
