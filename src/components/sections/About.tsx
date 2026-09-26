import { motion } from 'framer-motion'
import { focusAreas, skillGroups, summary } from '../../data/content'
import type { SectionMeta } from '../../data/sections'
import { SectionFrame } from '../ui/SectionFrame'
import { SectionHeader } from '../ui/SectionHeader'
import { Reticle } from '../ui/Brackets'
import { TickItem } from '../ui/Bits'

/* =========================================================================
   ABOUT & FOCUS AREAS
   The focus areas are the load-bearing content, so they get the weight:
   a numbered register with a discipline strip, not three identical cards.
   Skills sit underneath as a compact tool inventory.
   ========================================================================= */

export function About({ section, index }: { section: SectionMeta; index: number }) {
  return (
    <SectionFrame section={section} options={{ stagger: 0.06 }}>
      <SectionHeader
        section={section}
        index={index}
        aside={
          <p data-calib-blur className="max-w-[54ch] text-[15px] leading-relaxed text-steel-200">
            {summary}
          </p>
        }
      />

      <Reticle className="-right-1 -top-1 hidden sm:flex" />

      {/* --- Focus register ------------------------------------------- */}
      <ol className="mt-9 border-t border-hull-700">
        {focusAreas.map((fa, i) => (
          <motion.li
            key={fa.code}
            data-calib
            className="group relative border-b border-hull-700/80 py-5 pl-7 pr-1 transition-colors duration-300 hover:bg-signal/[0.025]"
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            {/* Index rail: a tick that extends on hover. */}
            <span className="absolute left-0 top-1/2 -translate-y-1/2">
              <span className="mono block text-[10px] tabular-nums text-steel-500">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mt-1 block h-4 w-px bg-hull-600 transition-all duration-300 group-hover:h-7 group-hover:bg-signal" />
            </span>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-display text-[17px] font-600 uppercase tracking-[0.05em] text-chalk">
                {fa.title}
              </h3>
              <span className="mono text-[10px] text-signal-dim">{fa.code}</span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {fa.keywords.map((k) => (
                <li
                  key={k}
                  className="mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-steel-500"
                >
                  <span className="h-1 w-1 rotate-45 bg-signal-dim" />
                  {k}
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>

      {/* --- Tool inventory ------------------------------------------- */}
      <div className="mt-11">
        <div className="mb-5 flex items-center gap-4">
          <span data-calib-rule className="h-px flex-1 bg-gradient-to-r from-hull-600 to-transparent" />
          <span className="legend text-steel-500">Tool inventory</span>
        </div>

        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {skillGroups.map((g) => (
            <div key={g.code} data-calib>
              <div className="mb-2.5 flex items-baseline gap-2">
                <span className="mono text-[10px] text-signal-dim">{g.code}</span>
                <span className="legend text-[9px] text-steel-400">{g.label}</span>
              </div>
              <ul className="space-y-1.5">
                {g.items.map((item) => (
                  <TickItem key={item}>{item}</TickItem>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SectionFrame>
  )
}
