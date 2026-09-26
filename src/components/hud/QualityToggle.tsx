import { motion } from 'framer-motion'
import { useHud } from '../../store/flight'
import { usePrefersReducedMotion, useTier } from '../../hooks/useDeviceTier'
import type { QualityPref } from '../../store/flight'

/* =========================================================================
   SCENE QUALITY CONTROL
   The 3D is by far the heaviest thing on the page, so the visitor gets to
   turn it down — or off — without touching the OS. The default is chosen
   automatically from the detected device tier; this makes that visible and
   lets it be overridden. Off falls back to the static instrument poster.
   ========================================================================= */

const OPTIONS: { id: QualityPref; label: string; hint: string }[] = [
  { id: 'full', label: '3D', hint: 'Full WebGL scene' },
  { id: 'lite', label: 'Lite', hint: 'Reduced geometry and particles' },
  { id: 'off', label: 'Off', hint: 'Static instrument poster' },
]

export function QualityToggle() {
  const effective = useHud((s) => s.quality)
  const pref = useHud((s) => s.qualityPref)
  const setPref = useHud((s) => s.setQualityPref)
  const tier = useTier()
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="legend text-steel-500">SCENE</span>
        <span className="mono text-[10px] uppercase tracking-[0.14em] text-caution">
          Static — reduced motion
        </span>
      </div>
    )
  }

  const detected = tier === 'low' ? 'Lite' : 'Full'

  return (
    <div className="flex items-center gap-2.5">
      <span className="legend text-steel-500">Scene</span>
      <div role="radiogroup" aria-label="Scene quality" className="bezel cut-sm flex items-center gap-0.5 p-0.5">
        {OPTIONS.map((o) => {
          // Highlight whichever option produced the quality actually running.
          const selected = o.id === 'full' ? effective === 'full' : o.id === effective
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={o.hint}
              onClick={() => setPref(o.id)}
              className={`relative px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                selected ? 'text-hull-950' : 'text-steel-400 hover:text-chalk'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="quality-pill"
                  className="absolute inset-0 bg-signal"
                  style={{ boxShadow: '0 0 14px rgba(60,201,214,0.55)' }}
                  transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          )
        })}
      </div>
      <span className="mono hidden text-[9px] uppercase tracking-[0.14em] text-steel-500 xl:inline">
        {pref === 'auto' ? `Auto → ${detected}` : 'Overridden'}
      </span>
    </div>
  )
}
