import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { SECTIONS } from '../../data/sections'
import { useHud } from '../../store/flight'
import { scrollToSection } from '../../lib/scrollToSection'
import { profile } from '../../data/content'

/* =========================================================================
   PERSISTENT NAVIGATION — HUD waypoint strip
   Always reachable: a vertical waypoint list with a live progress rail on wide
   screens, and a fixed bottom bar with a full-screen sheet on small ones.
   The active waypoint is driven by the flight path, not by IntersectionObserver,
   so the menu and the 3D can never disagree.
   ========================================================================= */

function WaypointList({ onNavigate }: { onNavigate?: () => void }) {
  const active = useHud((s) => s.active)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setPct(window.scrollY / max)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
    }
  }, [])

  return (
    <div className="relative flex items-stretch gap-4">
      {/* Progress rail: the route travelled. */}
      <div className="relative w-px shrink-0 bg-hull-600/70">
        <motion.div
          className="absolute inset-x-0 top-0 origin-top bg-signal"
          style={{ boxShadow: '0 0 10px rgba(60,201,214,0.7)' }}
          animate={{ height: `${pct * 100}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
        {SECTIONS.map((s, i) => (
          <span
            key={s.id}
            className={`absolute -left-[3.5px] h-[7px] w-[7px] -translate-y-1/2 rotate-45 border transition-colors duration-300 ${
              i <= active
                ? 'border-signal bg-signal'
                : 'border-steel-500 bg-hull-900'
            }`}
            style={{ top: `${(i / (SECTIONS.length - 1)) * 100}%` }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-3.5">
        {SECTIONS.map((s, i) => {
          const isActive = i === active
          const isDone = i < active
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  scrollToSection(s.id)
                  onNavigate?.()
                }}
                className="group flex w-full items-center gap-3 text-left"
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  className={`mono text-[10px] tabular-nums transition-colors duration-300 ${
                    isActive ? 'text-signal' : 'text-steel-500 group-hover:text-steel-300'
                  }`}
                >
                  {String(i).padStart(2, '0')}
                </span>
                <span className="relative flex h-5 items-center">
                  {isActive && (
                    <motion.span
                      layoutId="waypoint-underline"
                      className="absolute inset-x-0 h-px bg-signal"
                      style={{ boxShadow: '0 0 8px rgba(60,201,214,0.9)' }}
                      transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                    />
                  )}
                  <span
                    className={`relative font-display text-[13px] font-600 uppercase tracking-[0.16em] transition-colors duration-300 ${
                      isActive
                        ? 'text-chalk'
                        : isDone
                          ? 'text-steel-300 group-hover:text-chalk'
                          : 'text-steel-400 group-hover:text-chalk'
                    }`}
                  >
                    {s.nav}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function WaypointNav() {
  const [open, setOpen] = useState(false)
  const active = useHud((s) => s.active)
  const current = SECTIONS[active] ?? SECTIONS[0]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* --- Wide viewport: vertical waypoint rail ------------------------ */}
      <nav
        data-intro-rail
        aria-label="Sections"
        className="pointer-events-auto fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      >
        <WaypointList />
        <div className="mt-8 flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-signal" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          <span className="legend text-steel-500">LINK NOMINAL</span>
        </div>
      </nav>

      {/* --- Narrow viewport: fixed bar + sheet --------------------------- */}
      <div
        data-intro-rail
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-hull-700/80 bg-hull-950/88 px-[var(--gutter)] py-2.5 backdrop-blur-md lg:hidden"
      >
        <div className="min-w-0">
          <p className="mono truncate text-[10px] uppercase tracking-[0.18em] text-steel-400">
            {profile.name}
          </p>
          <p className="truncate font-display text-xs font-600 uppercase tracking-[0.16em] text-chalk">
            {String(active).padStart(2, '0')} {current.nav}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bezel cut-sm flex shrink-0 items-center gap-2 px-3 py-1.5"
          aria-expanded={open}
          aria-label="Open section menu"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block h-px w-3.5 bg-signal" />
            <span className="block h-px w-3.5 bg-signal" />
            <span className="block h-px w-3.5 bg-signal" />
          </span>
          <span className="legend text-steel-300">Menu</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            type="button"
            aria-label="Close section menu"
            className="absolute inset-0 bg-hull-950/92 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sections"
            className="absolute inset-x-0 bottom-0 bezel cut border-t-2 border-signal/40 p-5"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="legend text-signal-dim">FLIGHT PLAN</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="legend text-steel-300 hover:text-signal"
              >
                Close
              </button>
            </div>
            <WaypointList onNavigate={() => setOpen(false)} />
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
