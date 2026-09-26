import { motion } from 'framer-motion'
import { projects } from '../../data/content'
import type { SectionMeta } from '../../data/sections'
import { SectionFrame } from '../ui/SectionFrame'
import { SectionHeader } from '../ui/SectionHeader'
import { Reticle } from '../ui/Brackets'
import { Chip, StatusTag } from '../ui/Bits'

/* =========================================================================
   PROJECTS
   The heaviest section, so it gets the widest panels. Each entry is a
   spec sheet: index, status, domain, narrative, tooling. Hover sweeps a
   signal bar across the top edge and lights the index.
   ========================================================================= */

export function Projects({ section, index }: { section: SectionMeta; index: number }) {
  return (
    <SectionFrame section={section} options={{ stagger: 0.11, noScan: true }}>
      <SectionHeader section={section} index={index} />

      <Reticle className="-right-1 -top-1 hidden sm:flex" />

      <div className="mt-9 space-y-4">
        {projects.map((p) => (
          <motion.article
            key={p.code}
            data-calib
            className="group relative"
            whileHover="hover"
            initial="rest"
            animate="rest"
          >
            <motion.div
              variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-0 h-px origin-left bg-signal"
              style={{ boxShadow: '0 0 12px rgba(60,201,214,0.7)' }}
            />

            <div className="bezel cut p-5 transition-colors duration-400 group-hover:border-signal/40 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="mono pt-1 text-[22px] font-medium leading-none tabular-nums text-hull-500 transition-colors duration-300 group-hover:text-signal">
                    {String(p.index).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="mono text-[10px] text-signal-dim">{p.code}</span>
                    </div>
                    <h3 className="mt-1.5 font-display text-[clamp(1.1rem,2.7vw,1.45rem)] font-700 uppercase leading-[1.08] tracking-[0.01em] text-chalk">
                      {p.title}
                    </h3>
                  </div>
                </div>

                {p.status === 'study' ? (
                  <span className="border border-hull-600 px-2.5 py-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel-300">
                      {p.statusLabel}
                    </span>
                  </span>
                ) : (
                  <StatusTag label={p.statusLabel} live={p.live} />
                )}
              </div>

              <p className="mt-4 max-w-[58ch] text-[14px] leading-relaxed text-steel-200">{p.body}</p>

              {p.tools && p.tools.length > 0 && (
                <>
                  <div data-calib-rule className="mt-5 h-px w-full bg-hull-700/80" />

                  <ul className="mt-4 flex flex-wrap items-center gap-2">
                    <li className="legend mr-1 text-[9px] text-steel-500">Tooling</li>
                    {p.tools.map((t) => (
                      <li key={t}>
                        <Chip>{t}</Chip>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </SectionFrame>
  )
}
