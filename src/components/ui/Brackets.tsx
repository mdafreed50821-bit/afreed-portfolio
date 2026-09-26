/* =========================================================================
   BRACKETS & RETICLE
   The instrument-bezel marks that frame every panel. They converge on reveal
   rather than fading, which is what makes the scroll sequences read as a
   system calibrating instead of elements sliding in.
   ========================================================================= */

const base =
  'pointer-events-none absolute h-5 w-5 border-hull-500 transition-colors duration-500 group-hover:border-signal/60'

export function Brackets() {
  return (
    <>
      <span data-calib-bracket className={`${base} -left-px -top-px border-l border-t`} />
      <span data-calib-bracket className={`${base} -right-px -top-px border-r border-t`} />
      <span data-calib-bracket className={`${base} -bottom-px -left-px border-b border-l`} />
      <span data-calib-bracket className={`${base} -bottom-px -right-px border-b border-r`} />
    </>
  )
}

export function Reticle({ className = '' }: { className?: string }) {
  return (
    <span
      data-calib-reticle
      aria-hidden
      className={`pointer-events-none absolute flex h-9 w-9 items-center justify-center ${className}`}
    >
      <span className="absolute inset-0 rounded-full border border-signal/45" />
      <span className="absolute h-px w-full bg-signal/25" />
      <span className="absolute h-full w-px bg-signal/25" />
      <span className="h-1 w-1 rounded-full bg-signal" />
    </span>
  )
}
