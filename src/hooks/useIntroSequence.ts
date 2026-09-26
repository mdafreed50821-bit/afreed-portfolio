import type { RefObject } from 'react'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { flight } from '../store/flight'
import { prefersReducedMotion } from './useDeviceTier'

/* =========================================================================
   THE ONE ORCHESTRATED SEQUENCE
   Page load is treated as a system coming up, not a pile of elements fading
   in. A single GSAP master timeline does all of it:

     0.00  a veil masks the WebGL canvas while the scene warms up
     0.15  the airframe starts assembling out of its capture cage while the
           camera runs up from wide                        (writes flight.intro)
     0.20  the bus self-test streams down the boot console
     0.50  the veil lifts, revealing the finished airframe
     0.55  name and role wipe in behind a clip path
     1.00  metadata, photo slot and the scroll cue settle
     1.20  the boot console clears upward
     1.90  HUD rails index in from the bezels

   Scroll is locked for the duration and can be skipped at any time.
   ========================================================================= */

const TOTAL = 2.8

export interface IntroHandle {
  skip: () => void
}

export function useIntroSequence(
  container: RefObject<HTMLElement>,
  { enabled, onComplete }: { enabled: boolean; onComplete: () => void },
): IntroHandle {
  const ctxRef = useRef<gsap.core.Timeline | null>(null)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    flight.intro = 1
    document.documentElement.classList.remove('is-intro-locked')
    onComplete()
    ScrollTrigger.refresh()
  }, [onComplete])

  const skip = useCallback(() => {
    if (finished.current) return
    ctxRef.current?.progress(1)
  }, [])

  useLayoutEffect(() => {
    const root = container.current
    if (!root || !enabled) return

    if (prefersReducedMotion()) {
      flight.intro = 1
      gsap.set(root.querySelectorAll('[data-intro-veil]'), { opacity: 0 })
      onComplete()
      return
    }

    const doc = document.documentElement
    doc.classList.add('is-intro-locked')
    window.scrollTo(0, 0)

    const state = { intro: 0 }
    const q = gsap.utils.selector(root)

    const ctx = gsap.context(() => {
      // Initial state, applied before paint so nothing flashes unstyled.
      gsap.set(q('[data-intro-veil]'), { opacity: 1 })
      gsap.set(q('[data-intro-bootline]'), { opacity: 0, x: -10 })
      gsap.set(q('[data-intro-bootbar]'), { scaleX: 0, transformOrigin: 'left center' })
      gsap.set(q('[data-intro-rail]'), { opacity: 0, x: (i: number) => (i % 2 === 0 ? -22 : 22) })
      gsap.set(q('[data-intro-line]'), { clipPath: 'inset(0 100% 0 0)', x: 26 })
      gsap.set(q('[data-intro-meta]'), { opacity: 0, y: 14 })
      gsap.set(q('[data-intro-photo]'), { opacity: 0, scale: 0.86 })

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: finish })
      ctxRef.current = tl

      // Airframe assembly + camera run-up. The 3D layer reads flight.intro.
      tl.to(
        state,
        {
          intro: 1,
          duration: 2.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            flight.intro = state.intro
          },
        },
        0.15,
      )

      // Bus self-test.
      tl.to(q('[data-intro-bootline]'), { opacity: 1, x: 0, duration: 0.3, stagger: 0.075 }, 0.2).to(
        q('[data-intro-bootbar]'),
        { scaleX: 1, duration: 1.5, ease: 'power2.inOut' },
        0.35,
      )

      // Veil lifts to reveal the assembled airframe.
      tl.to(q('[data-intro-veil]'), { opacity: 0, duration: 1.3, ease: 'power2.inOut' }, 0.5)

      // Name + role wipe in behind a clip path.
      tl.to(q('[data-intro-line]'), { clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.95, stagger: 0.1 }, 0.55).to(
        q('[data-intro-meta]'),
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 },
        1.0,
      )

      tl.to(q('[data-intro-photo]'), { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.6)' }, 1.1)

      // Boot console clears upward, HUD rails index in from the bezels.
      tl.to(q('[data-intro-boot]'), { yPercent: -118, opacity: 0, duration: 0.6, ease: 'power3.in' }, 1.2).to(
        q('[data-intro-rail]'),
        { opacity: 1, x: 0, duration: 0.85, stagger: 0.09 },
        TOTAL - 0.9,
      )
    }, root)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        skip()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      ctx.revert()
      ctxRef.current = null
      doc.classList.remove('is-intro-locked')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, enabled, finish, skip])

  return { skip }
}
