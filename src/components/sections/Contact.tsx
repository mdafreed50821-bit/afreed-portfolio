import { motion } from 'framer-motion'
import { useState } from 'react'
import { profile, summary } from '../../data/content'
import type { SectionMeta } from '../../data/sections'
import { SectionFrame } from '../ui/SectionFrame'
import { SectionHeader } from '../ui/SectionHeader'
import { Reticle } from '../ui/Brackets'

/* =========================================================================
   CONTACT
   Four channels, each a row with its protocol spelled out. Copy-to-clipboard
   is a real affordance here, not decoration: recruiters paste these constantly.
   ========================================================================= */

interface Channel {
  code: string
  label: string
  value: string
  href: string
  protocol: string
  copyable?: boolean
  external?: boolean
}

const CHANNELS: Channel[] = [
  {
    code: 'COM-01',
    label: 'Phone',
    value: profile.phone,
    href: profile.phoneHref,
    protocol: 'TEL',
    copyable: true,
  },
  {
    code: 'COM-02',
    label: 'Email',
    value: profile.email,
    href: profile.emailHref,
    protocol: 'SMTP',
    copyable: true,
  },
  {
    code: 'COM-03',
    label: 'LinkedIn',
    value: 'in/md-afreed-45232727b',
    href: profile.linkedin,
    protocol: 'HTTPS',
    external: true,
  },
  {
    code: 'COM-04',
    label: 'GitHub',
    value: 'github.com/mdafreed50821-bit',
    href: profile.github,
    protocol: 'HTTPS',
    external: true,
  },
]

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be blocked; the value is selectable on the row anyway.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 border border-hull-600 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-steel-400 transition-colors duration-200 hover:border-signal/60 hover:text-signal"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function Contact({ section, index }: { section: SectionMeta; index: number }) {
  return (
    <SectionFrame section={section} options={{ stagger: 0.07, noScan: true }}>
      <SectionHeader section={section} index={index} />

      <Reticle className="-right-1 -top-1 hidden sm:flex" />

      <p data-calib-blur className="max-w-[56ch] text-[15px] leading-relaxed text-steel-200">
        {summary} Based in {profile.location}.
      </p>

      <ul data-calib className="mt-9 border-t border-hull-700">
        {CHANNELS.map((c) => (
          <li key={c.code} className="border-b border-hull-700/80">
            <div className="flex items-center gap-4 py-3.5">
              <span className="mono w-[52px] shrink-0 text-[10px] text-signal-dim">{c.code}</span>

              <a
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                className="group/link min-w-0 flex-1"
              >
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-[14px] font-600 uppercase tracking-[0.06em] text-chalk transition-colors duration-200 group-hover/link:text-signal">
                    {c.label}
                  </span>
                  <span className="mono truncate text-[12.5px] text-steel-200 transition-colors duration-200 group-hover/link:text-signal">
                    {c.value}
                  </span>
                </span>
                <span className="mono mt-0.5 block text-[9px] uppercase tracking-[0.16em] text-steel-500">
                  {c.protocol}
                </span>
              </a>

              <motion.span
                className="hidden h-8 w-px bg-hull-700 transition-colors duration-200 group-hover:bg-signal/50 sm:block"
                whileHover={{ scaleY: 1.4 }}
              />
              {c.copyable && <CopyChip text={c.value} />}
              {c.external && (
                <span className="mono shrink-0 text-[10px] text-steel-500" aria-hidden>
                  ↗
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* --- Signature block ------------------------------------------- */}
      <div data-calib className="mt-11 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-display text-[clamp(1.5rem,4.6vw,2.3rem)] font-700 uppercase leading-none text-chalk">
            {profile.name}
          </p>
          <p className="mono mt-2 text-[10.5px] uppercase leading-relaxed tracking-[0.14em] text-steel-400">
            {profile.role}
            <br />
            {profile.collegeShort} · {profile.campus} · {profile.location}
          </p>
        </div>
        <a
          href={profile.emailHref}
          className="cut-sm bezel px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-signal transition-colors duration-300 hover:border-signal/60 hover:bg-signal/10"
        >
          Open a channel
        </a>
      </div>
    </SectionFrame>
  )
}
