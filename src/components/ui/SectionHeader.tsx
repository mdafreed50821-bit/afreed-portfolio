import type { ReactNode } from 'react'
import type { SectionMeta } from '../../data/sections'

/* Section header: legend, index, headline, and the rule that extends on reveal. */

export function SectionHeader({
  section,
  index,
  aside,
}: {
  section: SectionMeta
  index: number
  aside?: ReactNode
}) {
  return (
    <header className="relative mb-8 sm:mb-10">
      <div className="flex items-center gap-4">
        <span className="legend text-signal">{section.legend}</span>
        <span data-calib-rule className="h-px flex-1 bg-gradient-to-r from-hull-600 to-transparent" />
        <span className="mono text-[11px] tabular-nums text-steel-500">
          {String(index).padStart(2, '0')}/{String(5).padStart(2, '0')}
        </span>
      </div>

      <h2
        data-calib
        className="mt-4 font-display text-[clamp(1.9rem,5.2vw,3.1rem)] font-700 uppercase leading-[0.94] tracking-[0.005em] text-chalk"
      >
        {section.title}
      </h2>

      {aside && <div className="mt-3">{aside}</div>}
    </header>
  )
}
