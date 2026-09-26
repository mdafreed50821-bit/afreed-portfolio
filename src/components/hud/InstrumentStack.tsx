import { motion } from 'framer-motion'
import { useHud } from '../../store/flight'
import { WAYPOINTS } from '../../three/flightCurve'

/* =========================================================================
   INSTRUMENT STACK
   Every number here is derived from the aircraft's actual position and tangent
   on the flight curve — altitude from the path's Y, heading from the tangent,
   ground track from the chord between two path samples, speed from distance
   covered. Monospace, tabular, and only used where a value is genuinely live.
   ========================================================================= */

const ALT_MIN = 1800
const ALT_MAX = 9800
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function pad(n: number, len = 2) {
  return String(Math.round(n)).padStart(len, '0')
}

function Cell({ label, value, unit, wide = false }: { label: string; value: string; unit?: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <div className="legend mb-1 text-[9px] text-steel-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="mono text-[15px] leading-none tabular-nums text-chalk">{value}</span>
        {unit && <span className="mono text-[9px] leading-none text-steel-400">{unit}</span>}
      </div>
    </div>
  )
}

export function InstrumentStack() {
  const h = useHud()

  const altPct = clamp01((h.alt - ALT_MIN) / (ALT_MAX - ALT_MIN))
  const active = WAYPOINTS[h.active] ?? WAYPOINTS[0]

  return (
    <div className="flex flex-col gap-3">
      {/* --- Altitude tape --------------------------------------------- */}
      <div className="flex items-stretch gap-3">
        <div className="relative h-40 w-[52px] shrink-0 border border-hull-650 bg-hull-900/50">
          <div className="absolute inset-0 tick-rule-v opacity-40" />
          {Array.from({ length: 9 }).map((_, i) => {
            const t = (i + 1) / 10
            const alt = ALT_MAX - t * (ALT_MAX - ALT_MIN)
            const major = i % 2 === 0
            return (
              <div key={i} className="absolute inset-x-0 flex items-center" style={{ top: `${t * 100}%` }}>
                <span className={`h-px ${major ? 'w-3.5 bg-steel-500' : 'w-2 bg-hull-600'}`} />
                {major && (
                  <span className="mono ml-1 text-[8px] leading-none text-steel-500">
                    {Math.round(alt / 100) / 10}k
                  </span>
                )}
              </div>
            )
          })}
          {/* Current-altitude index box. */}
          <motion.div
            className="absolute inset-x-[-3px] h-[18px] border border-signal bg-signal/12"
            animate={{ top: `${(1 - altPct) * 100}%` }}
            transition={{ type: 'spring', stiffness: 160, damping: 26 }}
            style={{ marginTop: -9 }}
          >
            <span className="absolute -left-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 bg-signal" />
          </motion.div>
        </div>

        <div className="flex flex-col justify-between">
          <Cell label="Altitude" value={pad(h.alt, 5)} unit="M" />
          <Cell label="Heading" value={pad(h.hdg, 3)} unit="°" />
        </div>
      </div>

      <div className="h-px w-full bg-hull-700" />

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Cell label="Ground speed" value={pad(h.spd, 3)} unit="KT" />
        <Cell label="Flight path" value={`${h.aoa >= 0 ? '+' : '−'}${pad(Math.abs(h.aoa))}`} unit="°" />
        <Cell label="Mach (ind.)" value={h.mach.toFixed(2)} />
        <Cell label="Track" value={pad(h.trk, 3)} unit="°" />
      </div>

      <div className="h-px w-full bg-hull-700" />

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="legend text-[9px] text-steel-500">Ground track</span>
          <span className="mono text-[10px] tabular-nums text-steel-200">
            {Math.abs(h.lat).toFixed(4)}°{h.lat >= 0 ? 'N' : 'S'}{' '}
            {Math.abs(h.lon).toFixed(4)}°{h.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="legend text-[9px] text-steel-500">Distance</span>
          <span className="mono text-[10px] tabular-nums text-steel-200">{(h.dist / 1000).toFixed(1)} KM</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="legend text-[9px] text-steel-500">Waypoint</span>
          <span className="mono text-[10px] tabular-nums text-signal">
            {active.code} / {active.label.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
