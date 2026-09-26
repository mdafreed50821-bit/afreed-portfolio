import { motion } from 'framer-motion'

/* =========================================================================
   BOOT CONSOLE
   Part of the master load-in sequence, not a decoration. Every line is a real
   subsystem this project actually touches: the aerofoil solver, the mesh
   budget, the six-waypoint flight plan, the CFD grid.
   ========================================================================= */

const LINES: [string, string, string][] = [
  ['BUS', 'Avionics bus scan', 'OK'],
  ['REF', 'NACA 2412 section', 'SOLVED'],
  ['MESH', 'Airframe tessellation', '1.5K TRI'],
  ['CFD', 'External flow grid', 'READY'],
  ['PLAN', 'Flight plan waypoints', '6 LOADED'],
]

export function BootConsole() {
  return (
    <div
      data-intro-boot
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-[var(--gutter)] pb-10 sm:pb-14"
    >
      <div className="w-full max-w-[430px] bezel cut p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="legend text-signal-dim">SYS SELFTEST</span>
          <span className="legend tabular-nums text-steel-400">POST</span>
        </div>

        <ul className="mono space-y-[6px] text-[11px] leading-none sm:text-xs">
          {LINES.map(([tag, label, value]) => (
            <li key={tag} data-intro-bootline className="flex items-baseline gap-3 text-steel-300">
              <span className="w-9 shrink-0 text-signal-dim">&gt; {tag}</span>
              <span className="min-w-0 flex-1 truncate border-b border-dotted border-hull-600/70 pb-[3px]">
                {label}
              </span>
              <span className="shrink-0 text-chalk">{value}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-4 h-px w-full overflow-hidden bg-hull-700">
          <motion.div
            data-intro-bootbar
            className="absolute inset-y-0 left-0 w-full bg-signal"
            style={{ boxShadow: '0 0 12px rgba(60,201,214,0.8)' }}
          />
        </div>
      </div>
    </div>
  )
}
