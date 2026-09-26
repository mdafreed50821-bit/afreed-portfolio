import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/* Small labelled spec row. Mono value, mono label — no decorative type. */

export function SpecRow({
  label,
  value,
  mono = true,
  className = '',
}: {
  label: string
  value: ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-baseline gap-4 border-b border-hull-700/70 py-2.5 last:border-b-0 ${className}`}>
      <span className="legend w-28 shrink-0 text-[9px] text-steel-500">{label}</span>
      <span className={`${mono ? 'mono text-[12px]' : 'text-[13px]'} flex-1 text-chalk-dim`}>{value}</span>
    </div>
  )
}

/** Discipline / tool chip. Sharp-cornered to match the panel geometry. */
export function Chip({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'signal' | 'caution' }) {
  const tones = {
    default: 'border-hull-600 text-steel-300',
    signal: 'border-signal/45 text-signal',
    caution: 'border-caution/45 text-caution',
  } as const
  return (
    <span
      className={`cut-sm inline-flex items-center border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/** Status pill used for "in progress" / "in publication". */
export function StatusTag({ label, live }: { label: string; live?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 border border-caution/40 bg-caution/[0.06] px-2.5 py-1">
      <span className="relative flex h-1.5 w-1.5">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-caution" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${live ? 'bg-caution' : 'bg-caution/60'}`}
        />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">{label}</span>
    </span>
  )
}

/** Interactive row used for skills and disciplines. */
export function TickItem({ children }: { children: ReactNode }) {
  return (
    <motion.li
      className="group flex items-start gap-2.5"
      whileHover={{ x: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
    >
      <span className="mt-[7px] h-1 w-1 shrink-0 rotate-45 bg-steel-500 transition-colors duration-200 group-hover:bg-signal" />
      <span className="text-[13.5px] leading-snug text-steel-200 transition-colors duration-200 group-hover:text-chalk">
        {children}
      </span>
    </motion.li>
  )
}
