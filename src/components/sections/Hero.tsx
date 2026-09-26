import { motion } from 'framer-motion'
import { focusAreas, profile } from '../../data/content'
import type { SectionMeta } from '../../data/sections'
import { Brackets } from '../ui/Brackets'
import { PhotoSlot } from '../ui/PhotoSlot'
import { BootConsole } from '../hud/BootConsole'
import { scrollToSection } from '../../lib/scrollToSection'

/* =========================================================================
   HERO
   Everything on this screen is part of the one orchestrated load-in: the
   console streams, the airframe assembles behind it, and the name wipes in
   behind a clip path once the aircraft has finished building itself.
   ========================================================================= */

function ScrollCue() {
  return (
    <motion.button
      type="button"
      data-intro-meta
      onClick={() => scrollToSection('about')}
      className="group absolute bottom-24 left-[var(--gutter)] z-20 flex items-center gap-3 lg:bottom-8 lg:left-[max(1.5rem,calc(50%-30rem))] lg:left-20"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <span className="relative flex h-9 w-6 items-start justify-center border border-hull-600 pt-1.5 transition-colors duration-300 group-hover:border-signal">
        <motion.span
          className="block h-2 w-px bg-signal"
          animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
      <span className="legend transition-colors duration-300 group-hover:text-signal">
        Scroll to fly the route
      </span>
    </motion.button>
  )
}

export function Hero({ section }: { section: SectionMeta }) {
  return (
    <section
      id={section.domId}
      className="relative flex min-h-[100svh] items-center pb-36 pt-28 sm:pt-32 lg:pb-24"
    >
      <div className="shell">
        <div className="group relative w-full max-w-[min(660px,100%)] lg:ml-16 xl:ml-20">
          <Brackets />

          {/* --- Standing status ------------------------------------- */}
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span data-intro-line className="legend text-signal">
              {section.legend}
            </span>
            <span className="hidden h-3 w-px bg-hull-600 sm:block" />
            <span data-intro-line className="legend text-steel-400">
              {profile.location}
            </span>
            <span className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-signal" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              <span className="legend text-steel-400">Route live</span>
            </span>
          </div>

          {/* --- Name ------------------------------------------------ */}
          <h1 className="font-display font-700 uppercase leading-[0.82] tracking-[-0.01em]">
            <span
              data-intro-line
              className="block text-[clamp(3rem,11vw,6.6rem)] text-chalk text-shadow-hud"
            >
              Md Afreed
            </span>
            <span
              data-intro-line
              className="mt-2 block font-display text-[clamp(0.85rem,2.1vw,1.35rem)] font-600 uppercase leading-[1.15] tracking-[0.12em] text-signal"
            >
              Aeronautical Engineering
            </span>
          </h1>

          <div data-calib-rule className="mt-7 h-px w-full bg-gradient-to-r from-signal/60 via-hull-600 to-transparent" />

          {/* --- Standing data + photo slot -------------------------- */}
          <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-9">
            <div className="min-w-0 flex-1 space-y-5">
              <p data-intro-meta className="max-w-[46ch] text-[15px] leading-relaxed text-steel-200">
                {profile.role}. {profile.degree} at {profile.college}, {profile.campus} —{' '}
                {profile.duration}, CGPA {profile.cgpa}.
              </p>

              <ul className="flex flex-wrap gap-2">
                {focusAreas.map((fa) => (
                  <li key={fa.code} data-intro-meta>
                    <span className="cut-sm inline-flex items-center gap-2 border border-hull-600 bg-hull-900/60 px-2.5 py-1.5">
                      <span className="mono text-[9px] text-signal-dim">{fa.code}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-steel-200">
                        {fa.short}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:max-w-md">
                <div data-intro-meta>
                  <dt className="legend text-[9px] text-steel-500">Discipline</dt>
                  <dd className="mono mt-1 text-[12px] text-chalk">AERO / UAV / CFD</dd>
                </div>
                <div data-intro-meta>
                  <dt className="legend text-[9px] text-steel-500">Standing</dt>
                  <dd className="mono mt-1 text-[12px] text-chalk">4TH YEAR · {profile.cgpa}</dd>
                </div>
              </dl>
            </div>

            <PhotoSlot />
          </div>
        </div>
      </div>

      <BootConsole />
      <ScrollCue />
    </section>
  )
}
