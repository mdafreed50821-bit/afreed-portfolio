import { motion } from 'framer-motion'
import { achievements } from '../../data/content'
import type { SectionMeta } from '../../data/sections'
import { SectionFrame } from '../ui/SectionFrame'
import { SectionHeader } from '../ui/SectionHeader'
import { Reticle } from '../ui/Brackets'

/* =========================================================================
   ACHIEVEMENTS
   A logbook. Each row leads with its result weight, because that is the part
   a judge or a recruiter scans for.
   ========================================================================= */

export function Achievements({ section, index }: { section: SectionMeta; index: number }) {
  return (
    <SectionFrame section={section} options={{ stagger: 0.09 }}>
      <SectionHeader section={section} index={index} />

      <Reticle className="-right-1 -top-1 hidden sm:flex" />

      <ul className="mt-9 space-y-3">
        {achievements.map((a) => (
          <motion.li
            key={a.code}
            data-calib
            className="group relative flex gap-4 border-b border-hull-700/80 pb-5 pt-1 transition-colors duration-300 last:border-b-0 sm:gap-6"
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            {/* Result weight — the piece that has to land first. */}
            <div className="w-[74px] shrink-0 pt-1 sm:w-[104px]">
              {a.weight ? (
                <span className="cut-sm inline-flex w-full items-center justify-center border border-caution/45 bg-caution/[0.07] px-1.5 py-1.5">
                  <span className="mono text-[10px] leading-tight tracking-[0.08em] text-caution">
                    {a.weight}
                  </span>
                </span>
              ) : (
                <span className="mono block pt-2 text-[10px] tracking-[0.08em] text-hull-500">
                  {a.code}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-[16px] font-600 uppercase tracking-[0.04em] text-chalk">
                  {a.title}
                </h3>
                {a.weight && <span className="mono text-[10px] text-signal-dim">{a.code}</span>}
                <span className="legend text-[9px] text-steel-500">{a.tag}</span>
              </div>
              {a.detail && (
                <p className="mt-1.5 max-w-[52ch] text-[13.5px] leading-relaxed text-steel-300">
                  {a.detail}
                </p>
              )}
            </div>
          </motion.li>
        ))}
      </ul>

      <p data-calib className="mono mt-9 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-steel-500">
        Research output: one blended wing body paper in the publication process.
      </p>
    </SectionFrame>
  )
}
