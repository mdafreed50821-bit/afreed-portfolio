import type { ReactNode } from 'react'
import { useRef } from 'react'
import { useCalibrateReveal } from '../../hooks/useCalibrateReveal'
import { Brackets } from './Brackets'
import type { SectionMeta } from '../../data/sections'

/* =========================================================================
   SECTION FRAME
   Every section is a panel: bezel + converging brackets + one refresh
   scanline. On wide viewports the copy column is pinned left, leaving the
   right half entirely to the flight path.
   ========================================================================= */

export function SectionFrame({
  section,
  children,
  options,
}: {
  section: SectionMeta
  children: ReactNode
  options?: { stagger?: number; noScan?: boolean }
}) {
  const ref = useRef<HTMLElement>(null)
  useCalibrateReveal(ref, options)

  return (
    <section
      ref={ref}
      id={section.domId}
      className="relative flex min-h-[100svh] items-center scroll-mt-10 py-24 sm:py-28"
    >
      <div className="shell">
        <div className="group relative w-full max-w-[min(660px,100%)] lg:ml-16 xl:ml-20">
          <Brackets />
          <span
            data-calib-scan
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-signal/[0.06] to-transparent"
          />
          {children}
        </div>
      </div>
    </section>
  )
}
