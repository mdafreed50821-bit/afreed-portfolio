/* =========================================================================
   STATIC INSTRUMENT POSTER
   Stand-in for the WebGL scene when motion is suppressed or the visitor
   turns the scene off. Same visual language — the same airframe drawn from
   the same proportions, the same streamline field, the same radar PPI — so the
   page never degrades into a grey box. CSS-only drift, and completely frozen
   under prefers-reduced-motion.
   ========================================================================= */

const U = 42 // px per model unit

function AirframePlan({ cx, cy, stroke, fill }: { cx: number; cy: number; stroke: string; fill: string }) {
  const s = U
  const span = 3.25 * s
  const sweep = 0.42 * s
  const rootChord = 1.05 * s
  const tipChord = 0.44 * s
  const wing = [
    [-span, sweep],
    [-span, sweep + tipChord],
    [0, rootChord],
    [span, sweep + tipChord],
    [span, sweep],
    [0, 0],
  ]
    .map(([x, y]) => `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`)
    .join(' ')

  // V-tail plan projection: span 1.15 canted 41° from vertical.
  const finSpan = 1.15 * s
  const finX = finSpan * Math.sin(0.72)
  const finY = finSpan * Math.cos(0.72)
  const finSweep = 0.34 * s
  const finChord = 0.72 * s
  const finTip = 0.3 * s
  const fin = (dir: 1 | -1) =>
    [
      [cx + dir * 2, cy + 84],
      [cx + dir * finX, cy + 84 - finY + finSweep],
      [cx + dir * finX, cy + 84 - finY + finSweep + finTip],
      [cx + dir * 2, cy + 84 + finChord],
    ]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ')

  return (
    <g>
      {/* Capture cage — the assembly volume, kept as a static reference. */}
      <rect
        x={cx - span - 26}
        y={cy - 128}
        width={(span + 26) * 2}
        height={252}
        fill="none"
        stroke="#1b7c86"
        strokeOpacity="0.3"
        strokeDasharray="3 5"
      />

      <polygon points={wing} fill={fill} stroke={stroke} strokeWidth="1.1" />
      <polygon points={fin(-1)} fill={fill} stroke={stroke} strokeWidth="1.1" />
      <polygon points={fin(1)} fill={fill} stroke={stroke} strokeWidth="1.1" />

      {/* Fuselage */}
      <path
        d={`M ${cx} ${cy - 100}
            C ${cx + 20} ${cy - 88}, ${cx + 21} ${cy - 40}, ${cx + 19} ${cy + 4}
            C ${cx + 16} ${cy + 48}, ${cx + 7} ${cy + 74}, ${cx + 5} ${cy + 84}
            L ${cx - 5} ${cy + 84}
            C ${cx - 7} ${cy + 74}, ${cx - 16} ${cy + 48}, ${cx - 19} ${cy + 4}
            C ${cx - 21} ${cy - 40}, ${cx - 20} ${cy - 88}, ${cx} ${cy - 100} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.1"
      />

      {/* Nose sensor turret */}
      <circle cx={cx} cy={cy - 66} r="11" fill="#0b1018" stroke={stroke} strokeWidth="1" />
      <circle cx={cx} cy={cy - 66} r="4.5" fill="#3CC9D6" fillOpacity="0.75" />

      {/* Pusher disc */}
      <circle cx={cx} cy={cy + 112} r="33" fill="#3CC9D6" fillOpacity="0.05" stroke="#3CC9D6" strokeOpacity="0.28" strokeDasharray="2 6" />
      <line x1={cx - 33} y1={cy + 112} x2={cx + 33} y2={cy + 112} stroke="#3CC9D6" strokeOpacity="0.3" />
      <line x1={cx} y1={cy + 79} x2={cx} y2={cy + 145} stroke="#3CC9D6" strokeOpacity="0.3" />

      {/* Structural panel lines, matching the WebGL skin shader. */}
      <g stroke="#1b7c86" strokeOpacity="0.55" strokeWidth="0.6">
        {[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map((k) => (
          <line
            key={k}
            x1={cx + k * s}
            y1={cy + (k === 0 ? 0 : sweep * Math.abs(k) / 3.25) - 2}
            x2={cx + k * s}
            y2={cy + (k === 0 ? 0 : sweep * Math.abs(k) / 3.25) + (k === 0 ? rootChord : tipChord) + 2}
          />
        ))}
      </g>

      {/* Nav lights */}
      <circle cx={cx - span - 4} cy={cy + sweep + tipChord / 2} r="3.6" fill="#FF5C3E" />
      <circle cx={cx + span + 4} cy={cy + sweep + tipChord / 2} r="3.6" fill="#5CE08A" />
    </g>
  )
}

function Streamlines({ cx, cy, count = 22 }: { cx: number; cy: number; count?: number }) {
  const lines = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const y = cy - 150 + t * 320
    // Deflection around the wing: streamlines part above, compress below.
    const bulge = Math.exp(-Math.pow((y - (cy + 22)) / 78, 2)) * (y < cy + 22 ? 34 : -20)
    const d = `M -60 ${y.toFixed(0)}
      C ${cx - 240} ${(y + bulge * 0.4).toFixed(0)}, ${cx - 90} ${(y + bulge).toFixed(0)}, ${cx + 40} ${(y + bulge * 0.55).toFixed(0)}
      S ${cx + 300} ${(y - bulge * 0.3).toFixed(0)}, ${cx + 660} ${(y - bulge * 0.5).toFixed(0)}`
    return { d, op: 0.1 + 0.32 * (1 - Math.abs(t - 0.5) * 1.4), w: i % 4 === 0 ? 1.1 : 0.6 }
  })
  return (
    <g>
      {lines.map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill="none"
          stroke="#3CC9D6"
          strokeOpacity={Math.max(0.06, l.op)}
          strokeWidth={l.w}
          className="poster-flow"
          style={{ animationDelay: `${-i * 0.42}s` }}
        />
      ))}
    </g>
  )
}

function RadarPpi({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g opacity="0.5">
      {[0.28, 0.56, 0.84, 1].map((k) => (
        <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke="#1b7c86" strokeWidth="0.7" />
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i + Math.PI / 6
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r * 0.14}
            y1={cy + Math.sin(a) * r * 0.14}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="#1b7c86"
            strokeWidth="0.6"
          />
        )
      })}
      <g className="poster-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <path d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx + r * 0.7} ${cy - r * 0.71} Z`} fill="#3CC9D6" fillOpacity="0.07" />
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#F0A93B" strokeWidth="0.9" strokeOpacity="0.8" />
      </g>
      <circle cx={cx} cy={cy} r="2" fill="#3CC9D6" />
    </g>
  )
}

export function StaticPoster() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_60%_38%,#0a141f_0%,#05080c_62%,#03050a_100%)]" />
      <div className="blueprint absolute inset-0 opacity-[0.55]" />

      {/* Wide composition: airframe right, copy column left — mirrors the 3D framing. */}
      <svg
        className="absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <Streamlines cx={1080} cy={430} />
        <AirframePlan cx={1080} cy={420} stroke="#3CC9D6" fill="#0F1620" />
        <RadarPpi cx={300} cy={690} r={168} />
      </svg>

      {/* Narrow composition: centred, biased up so copy sits below. */}
      <svg
        className="absolute inset-0 h-full w-full lg:hidden"
        viewBox="0 0 420 760"
        preserveAspectRatio="xMidYMid slice"
      >
        <Streamlines cx={210} cy={300} count={18} />
        <g transform="translate(0,-40) scale(0.62)">
          <AirframePlan cx={338} cy={300} stroke="#3CC9D6" fill="#0F1620" />
        </g>
      </svg>
    </div>
  )
}
