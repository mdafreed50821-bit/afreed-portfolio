import { motion } from 'framer-motion'
import { useState } from 'react'
import { headshot, headshotSrc } from '../../data/content'

/* =========================================================================
   HEADSHOT SLOT
   Drop the real file in /public as headshot.jpg and this fills itself in —
   no code change. Until then the slot shows an explicit, framed placeholder
   so it is obvious what belongs there.

   Circular, to contrast with the cut-corner panels everywhere else. The source
   is a tall portrait, so the crop focal point is biased toward the top; see
   `headshot.focusY` in data/content.ts if it needs nudging.
   ========================================================================= */

function Placeholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-hull-900 text-center">
      <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="none" stroke="#1b7c86" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx="24" cy="18.5" r="6" fill="none" stroke="#3CC9D6" strokeWidth="1.2" />
        <path d="M12 38c2.6-6.6 7-9.9 12-9.9S33.4 31.4 36 38" fill="none" stroke="#3CC9D6" strokeWidth="1.2" />
        <path d="M24 2v5M24 41v5M2 24h5M41 24h5" stroke="#1b7c86" strokeWidth="1" />
      </svg>
      <span className="font-mono text-[8.5px] uppercase leading-relaxed tracking-[0.12em] text-steel-500">
        Photo slot
        <br />
        headshot.jpg
      </span>
    </div>
  )
}

export function PhotoSlot() {
  const [status, setStatus] = useState<'pending' | 'ready' | 'missing'>('pending')

  return (
    <div data-intro-photo className="relative w-[136px] shrink-0 sm:w-[152px]">
      <div className="relative aspect-square">
        {/* Tick ring: 12 marks, every third long. */}
        <div aria-hidden className="absolute -inset-[9px]">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            const r = 76
            const long = i % 3 === 0
            return (
              <span
                key={i}
                className={`absolute left-1/2 top-1/2 bg-hull-500 ${long ? 'h-2 w-px' : 'h-1 w-px'}`}
                style={{
                  transform: `translate(-50%,-50%) rotate(${(a * 180) / Math.PI}deg) translateY(-${r}px)`,
                }}
              />
            )
          })}
        </div>

        <div className="relative h-full w-full overflow-hidden rounded-full border border-hull-600 bg-hull-900">
          {status !== 'missing' && (
            <img
              src={headshotSrc}
              alt={headshot.alt}
              onError={() => setStatus('missing')}
              onLoad={() => setStatus('ready')}
              decoding="async"
              className="h-full w-full object-cover"
              style={{ objectPosition: `50% ${headshot.focusY}` }}
              width={headshot.width}
              height={headshot.height}
            />
          )}
          {status !== 'ready' && (
            <div className="absolute inset-0">
              <Placeholder />
            </div>
          )}

          {/* Refresh line, looping. */}
          {status === 'ready' && (
            <motion.span
              aria-hidden
              className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-signal/15 to-transparent"
              animate={{ y: ['-8%', '112%'] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <span
          aria-hidden
          className="absolute -right-px -top-px h-4 w-4 rounded-full border border-signal/60 bg-hull-950"
        />
      </div>

      <p className="mono mt-4 text-center text-[9px] uppercase leading-relaxed tracking-[0.14em] text-steel-500">
        {status === 'ready' ? headshot.alt.split(',')[0] : 'Add headshot.jpg to /public'}
      </p>
    </div>
  )
}
