import { motion } from 'framer-motion'
import { useHud } from '../../store/flight'
import { InstrumentStack } from './InstrumentStack'
import { QualityToggle } from './QualityToggle'
import { profile } from '../../data/content'

/* =========================================================================
   HUD CHROME
   The permanent instrument frame: bezel corners, a live heading tape across
   the top, the instrument stack on the right rail, and the film-grain /
   scanline / vignette treatment that ties DOM and WebGL into one image.
   ========================================================================= */

/* --- Heading tape: a real HSI window, ticks wrapping through 360° -------- */

const TAPE_SPAN = 3.1 // px per degree
const TAPE_TICKS = 27
const HALF = Math.floor(TAPE_TICKS / 2)

function HeadingTape() {
  const hdg = useHud((s) => s.hdg)
  const ticks: { deg: number; label: string | null }[] = []
  for (let i = -HALF; i <= HALF; i++) {
    const raw = hdg + i
    const norm = ((raw % 360) + 360) % 360
    const major = Math.round(norm) % 30 === 0
    ticks.push({
      deg: raw - hdg,
      label: major && i % 2 === 0 ? String(Math.round(norm)).padStart(3, '0') : null,
    })
  }

  return (
    <div className="pointer-events-none relative hidden h-9 w-[min(430px,42vw)] overflow-hidden border-x border-b border-hull-700/70 bg-hull-950/45 backdrop-blur-[2px] lg:block">
      <div className="relative h-full">
        {ticks.map((t, i) => (
          <div
            key={i}
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: '50%', transform: `translateX(calc(-50% + ${t.deg * TAPE_SPAN}px))` }}
          >
            {t.label && (
              <span className="mono mb-1 text-[9px] leading-none tabular-nums text-steel-300">{t.label}</span>
            )}
            <span
              className={`block w-px ${t.label ? 'h-2.5 bg-steel-400' : 'h-1.5 bg-hull-500'}`}
            />
          </div>
        ))}
      </div>
      {/* Fixed lubber line. */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <span className="h-3 w-[2px] bg-caution" style={{ boxShadow: '0 0 8px rgba(240,169,59,0.9)' }} />
      </div>
      <span className="legend absolute left-2 top-1.5 text-[9px] text-steel-500">HDG</span>
      <span className="mono absolute right-2 top-1 text-[11px] leading-none tabular-nums text-chalk">
        {String(Math.round(hdg)).padStart(3, '0')}°
      </span>
    </div>
  )
}

/* --- Fixed bezel corners ------------------------------------------------- */

function BezelCorners() {
  const corner =
    'pointer-events-none absolute h-8 w-8 border-hull-500/70 transition-colors duration-500'
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 hidden lg:block">
      <span className={`${corner} left-5 top-5 border-l border-t`} />
      <span className={`${corner} right-5 top-5 border-r border-t`} />
      <span className={`${corner} bottom-5 left-5 border-b border-l`} />
      <span className={`${corner} bottom-5 right-5 border-b border-r`} />
    </div>
  )
}

/* --- Identity block, top left ------------------------------------------- */

function IdentityBlock() {
  return (
    <div className="pointer-events-none fixed left-8 top-6 z-30 hidden lg:block">
      <p className="font-display text-sm font-700 uppercase tracking-[0.2em] text-chalk">
        {profile.name}
      </p>
      <p className="mono mt-1 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-steel-400">
        {profile.degree}
        <br />
        {profile.collegeShort} · {profile.duration}
      </p>
    </div>
  )
}

/* --- Assembly ------------------------------------------------------------ */

export function HudChrome() {
  return (
    <>
      <BezelCorners />
      <IdentityBlock />

      <div className="pointer-events-none fixed left-1/2 top-5 z-30 -translate-x-1/2">
        <div data-intro-rail>
          <HeadingTape />
        </div>
      </div>

      <div
        data-intro-rail
        className="pointer-events-none fixed right-8 top-1/2 z-30 hidden w-[228px] -translate-y-1/2 lg:block"
      >
        <div className="bezel cut p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="legend text-signal-dim">FLIGHT DATA</span>
            <span className="legend text-steel-500">AUTO</span>
          </div>
          <InstrumentStack />
        </div>
      </div>

      <div className="pointer-events-auto fixed bottom-5 left-8 z-30 hidden lg:block">
        <QualityToggle />
      </div>

      <div className="pointer-events-none fixed bottom-5 right-8 z-30 hidden text-right lg:block">
        <p className="mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-steel-500">
          {profile.location}
          <br />
          {profile.degree}
        </p>
      </div>

      {/* Atmosphere. Purely presentational, never intercepts input. */}
      <div className="vignette relative z-30" aria-hidden />
      <div className="grain" aria-hidden />
      <div className="scanlines" aria-hidden />
    </>
  )
}

/* --- Intro veil ----------------------------------------------------------
   Sits between the WebGL canvas and the DOM copy: it masks the scene while it
   warms up, then lifts to reveal the finished airframe. Page copy is never
   hidden by it, so nothing is ever waiting on an animation to be legible.
   ------------------------------------------------------------------------ */

export function IntroVeil() {
  return (
    <motion.div
      data-intro-veil
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] bg-hull-950"
      style={{ willChange: 'opacity' }}
    />
  )
}
