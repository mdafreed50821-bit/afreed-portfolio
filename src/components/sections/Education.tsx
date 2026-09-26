import { certifications, profile } from '../../data/content'
import type { SectionMeta } from '../../data/sections'
import { SectionFrame } from '../ui/SectionFrame'
import { SectionHeader } from '../ui/SectionHeader'
import { Reticle } from '../ui/Brackets'
import { SpecRow } from '../ui/Bits'

/* =========================================================================
   EDUCATION
   Laid out as a training record: the degree as the primary block, then the
   certifications as a short secondary register.
   ========================================================================= */

export function Education({ section, index }: { section: SectionMeta; index: number }) {
  return (
    <SectionFrame section={section} options={{ stagger: 0.08 }}>
      <SectionHeader section={section} index={index} />

      <Reticle className="-right-1 -top-1 hidden sm:flex" />

      {/* --- Degree block --------------------------------------------- */}
      <div data-calib className="bezel cut relative p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="legend text-signal-dim">EDU-01</span>
            <h3 className="mt-2 font-display text-[clamp(1.25rem,3.1vw,1.7rem)] font-700 uppercase leading-[1.05] text-chalk">
              {profile.degree}
            </h3>
          </div>
          <span className="mono shrink-0 border border-signal/40 px-2.5 py-1 text-[11px] tabular-nums text-signal">
            {profile.duration}
          </span>
        </div>

        <p data-calib className="mt-3 max-w-[54ch] text-[13.5px] leading-relaxed text-steel-200">
          {profile.college} — {profile.campus}.
        </p>

        <div data-calib-rule className="mt-5 h-px w-full bg-hull-700" />

        <dl className="mt-4 grid gap-x-10 sm:grid-cols-2">
          <SpecRow label="Institution" value={profile.collegeShort} />
          <SpecRow label="Campus" value={profile.campus} />
          <SpecRow label="Duration" value={profile.duration} />
          <SpecRow
            label="CGPA"
            value={
              <span className="flex items-baseline gap-2">
                <span className="mono text-[15px] text-signal">{profile.cgpa}</span>
                <span className="text-[11px] text-steel-500">/ 10</span>
              </span>
            }
          />
        </dl>
      </div>

      {/* --- Certifications ------------------------------------------- */}
      <div className="mt-10">
        <div className="mb-5 flex items-center gap-4">
          <span data-calib-rule className="h-px flex-1 bg-gradient-to-r from-hull-600 to-transparent" />
          <span className="legend text-steel-500">Certifications</span>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {certifications.map((c) => (
            <li
              key={c.code}
              data-calib
              className="group bezel cut-sm relative p-4 transition-colors duration-300 hover:border-signal/45"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="legend text-[9px] text-signal-dim">{c.issuer}</span>
                <span className="mono text-[9px] text-steel-500">{c.code}</span>
              </div>
              <p className="mt-2 font-display text-[14px] font-600 uppercase tracking-[0.05em] text-chalk">
                {c.title}
              </p>
              <p className="mono mt-1.5 text-[11px] text-steel-400">{c.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </SectionFrame>
  )
}
