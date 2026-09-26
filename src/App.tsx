import { Suspense, lazy, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { SECTIONS } from './data/sections'
import { profile } from './data/content'
import { useHud } from './store/flight'
import { usePrefersReducedMotion, useTier, resolveQuality } from './hooks/useDeviceTier'
import { useScrollProgress } from './hooks/useScrollProgress'
import { useIntroSequence } from './hooks/useIntroSequence'
import { HudChrome, IntroVeil } from './components/hud/HudChrome'
import { WaypointNav } from './components/hud/WaypointNav'
import { StaticPoster } from './components/hud/StaticPoster'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Education } from './components/sections/Education'
import { Projects } from './components/sections/Projects'
import { Achievements } from './components/sections/Achievements'
import { Contact } from './components/sections/Contact'
import { scrollToSection } from './lib/scrollToSection'

/* The WebGL layer is code-split: reduced-motion and low-power visitors never
   download Three.js at all. */
const Scene = lazy(() => import('./three/Scene'))

export default function App() {
  const tier = useTier()
  const reduced = usePrefersReducedMotion()
  const pref = useHud((s) => s.qualityPref)
  const setQuality = useHud((s) => s.setQuality)

  const root = useRef<HTMLDivElement>(null)
  // Stable identity: a fresh callback here would tear down and rebuild the
  // whole intro timeline on every render, re-locking scroll each time.
  const onIntroComplete = useCallback(() => undefined, [])
  useIntroSequence(root, { enabled: true, onComplete: onIntroComplete })
  useScrollProgress()

  const quality = useMemo(() => resolveQuality(tier, pref, reduced), [tier, pref, reduced])

  useEffect(() => {
    setQuality(quality)
  }, [quality, setQuality])

  const [hero, about, education, projects, achievements, contact] = SECTIONS

  return (
    <div ref={root} className="relative min-h-screen">
      {/* --- Scene layer ------------------------------------------------ */}
      {quality === 'off' ? (
        <StaticPoster />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
          <Suspense fallback={null}>
            <Scene tier={tier} lite={quality === 'lite'} />
          </Suspense>
        </div>
      )}

      <IntroVeil />

      {/* --- Copy layer -------------------------------------------------- */}
      <main className="relative z-10">
        <Hero section={hero} />
        <About section={about} index={1} />
        <Education section={education} index={2} />
        <Projects section={projects} index={3} />
        <Achievements section={achievements} index={4} />
        <Contact section={contact} index={5} />
        <Colophon />
      </main>

      <HudChrome />
      <WaypointNav />
    </div>
  )
}

/* --- Colophon ------------------------------------------------------------ */

function Colophon() {
  return (
    <footer className="relative z-10 border-t border-hull-700/70 bg-hull-950/70 py-10">
      <div className="shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-[13px] font-700 uppercase tracking-[0.2em] text-chalk">
              {profile.name}
            </p>
            <p className="mono mt-1.5 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-steel-500">
              {profile.degree} · {profile.collegeShort} · {profile.duration}
              <br />
              {profile.email} · {profile.phone}
            </p>
          </div>

          <dl className="mono grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.14em]">
            <div className="flex gap-2">
              <dt className="text-steel-500">Base</dt>
              <dd className="text-steel-300">{profile.location}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-steel-500">Airframe</dt>
              <dd className="text-steel-300">Procedural</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-steel-500">Waypoints</dt>
              <dd className="text-steel-300">{String(SECTIONS.length).padStart(2, '0')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-steel-500">Scene</dt>
              <dd className="text-signal">R3F / GLSL</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-hull-800 pt-5">
          <p className="mono text-[9.5px] uppercase tracking-[0.14em] text-steel-500">
            End of route — recovery at WP-05
          </p>
          <motion.button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="group mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.14em] text-steel-400 transition-colors duration-200 hover:text-signal"
            whileHover={{ y: -2 }}
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-y-0.5">
              ↑
            </span>
            Return to start
          </motion.button>
        </div>
      </div>
    </footer>
  )
}
