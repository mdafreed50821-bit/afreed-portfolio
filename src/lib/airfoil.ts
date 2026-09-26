import * as THREE from 'three'

/* =========================================================================
   PROCEDURAL AERODYNAMICS
   Nothing here is an imported model — the airframe is lofted from genuine
   NACA 4-digit sections so the silhouette is a real aerofoil profile, not a
   decorative shape. Keeps the bundle tiny and the geometry art-directable.
   ========================================================================= */

export interface AirfoilProfile {
  /** Chordwise stations, 0 = leading edge → 1 = trailing edge. */
  x: number[]
  /** Thickness / camber ordinates, normalised to chord. */
  y: number[]
}

/**
 * NACA 4-digit section. Cosine spacing clusters points at the leading edge,
 * which is where curvature (and therefore mesh density) matters most.
 *
 * @param m max camber (fraction of chord)
 * @param p position of max camber
 * @param t max thickness (fraction of chord)
 */
export function naca4(m: number, p: number, t: number, n = 22): AirfoilProfile {
  const upper: [number, number][] = []
  const lower: [number, number][] = []

  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((Math.PI * i) / n)) / 2
    // -0.1036 (not -0.1015) closes the trailing edge.
    const yt =
      5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4)

    let yc: number
    let dyc: number
    if (x < p) {
      yc = (m / (p * p)) * (2 * p * x - x * x)
      dyc = ((2 * m) / (p * p)) * (p - x)
    } else {
      yc = (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x)
      dyc = ((2 * m) / ((1 - p) ** 2)) * (p - x)
    }

    const th = Math.atan(dyc)
    upper.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)])
    lower.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)])
  }

  // Closed loop: LE → TE along the upper surface, then back along the lower.
  const pts: [number, number][] = []
  for (const pt of upper) pts.push(pt)
  for (let i = lower.length - 2; i >= 1; i--) pts.push(lower[i])

  return { x: pts.map((p) => p[0]), y: pts.map((p) => p[1]) }
}

export interface LoftOptions {
  airfoil: AirfoilProfile
  /** Spanwise stations (>= 2). More = smoother loft, more triangles. */
  sections: number
  /** Span from root (x=0 / y=0) to tip. */
  span: number
  rootChord: number
  tipChord: number
  /** Chordwise offset applied at the tip, in model units. Positive = swept aft. */
  sweep: number
  /** Lateral offset applied at the tip (dihedral for 'x', cant base for 'y'). */
  offset: number
  /** Geometric twist at the tip, radians. Negative = washout. */
  twist: number
  spanAxis: 'x' | 'y'
  capTip?: boolean
}

/**
 * Lofts an airfoil from root to tip with taper, sweep, offset and twist.
 * Produces a half-surface starting at the root plane so it can be folded
 * out from a pivot and mirrored for the opposite side.
 */
export function buildLoft(o: LoftOptions): THREE.BufferGeometry {
  const { airfoil, sections, span, rootChord, tipChord, sweep, offset, twist, spanAxis } = o
  const P = airfoil.x.length
  const ring = sections + 1
  const vertCount = ring * P + (o.capTip ? 1 : 0)

  const positions = new Float32Array(vertCount * 3)
  const uvs = new Float32Array(vertCount * 2)

  for (let i = 0; i < ring; i++) {
    const s = i / sections
    const chord = rootChord + (tipChord - rootChord) * s
    const a = s * span
    const b = offset * s
    // Washout is negative: the tip is twisted nose-down relative to the root.
    const ang = -twist * s
    const ca = Math.cos(ang)
    const sa = Math.sin(ang)

    for (let j = 0; j < P; j++) {
      // Quarter-chord sits on the pivot line, the usual loft reference.
      const rawZ = (airfoil.x[j] - 0.25) * chord
      const rawY = airfoil.y[j] * chord
      const z = rawZ * ca - rawY * sa + sweep * s
      const y = rawZ * sa + rawY * ca + b
      const o3 = (i * P + j) * 3
      const o2 = (i * P + j) * 2
      if (spanAxis === 'x') {
        positions[o3] = a
        positions[o3 + 1] = y
        positions[o3 + 2] = z
      } else {
        positions[o3] = y
        positions[o3 + 1] = a
        positions[o3 + 2] = z
      }
      uvs[o2] = j / P
      uvs[o2 + 1] = s
    }
  }

  const indices: number[] = []
  for (let i = 0; i < sections; i++) {
    for (let j = 0; j < P; j++) {
      const j2 = (j + 1) % P
      const a = i * P + j
      const b = i * P + j2
      const c = (i + 1) * P + j
      const d = (i + 1) * P + j2
      indices.push(a, c, d, a, d, b)
    }
  }

  let tipCentroid = -1
  if (o.capTip) {
    tipCentroid = ring * P
    let cx = 0
    let cy = 0
    let cz = 0
    const base = sections * P
    for (let j = 0; j < P; j++) {
      cx += positions[(base + j) * 3]
      cy += positions[(base + j) * 3 + 1]
      cz += positions[(base + j) * 3 + 2]
    }
    positions[tipCentroid * 3] = cx / P
    positions[tipCentroid * 3 + 1] = cy / P
    positions[tipCentroid * 3 + 2] = cz / P
    uvs[tipCentroid * 2] = 0.5
    uvs[tipCentroid * 2 + 1] = 1
    for (let j = 0; j < P; j++) {
      indices.push(base + j, tipCentroid, base + ((j + 1) % P))
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

/**
 * Mirrors a geometry across X with winding and normals corrected, so the copy
 * can be lit normally (a plain `scale-x={-1}` on a mesh renders inside-out).
 */
export function mirrorX(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = src.clone()
  const pos = out.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) pos.setX(i, -pos.getX(i))
  pos.needsUpdate = true

  const idx = out.getIndex()
  if (idx) {
    const arr = Array.from(idx.array as ArrayLike<number>)
    const flipped: number[] = []
    for (let i = 0; i < arr.length; i += 3) flipped.push(arr[i], arr[i + 2], arr[i + 1])
    out.setIndex(flipped)
  }
  out.computeVertexNormals()
  return out
}

/** Revolve a radius/axial profile into a fuselage body. Axis ends up on +Z. */
export function buildFuselage(
  stations: { z: number; r: number }[],
  radialSegments: number,
): THREE.BufferGeometry {
  const profile = stations.map((s) => new THREE.Vector2(Math.max(s.r, 0.001), s.z))
  const geo = new THREE.LatheGeometry(profile, radialSegments)
  geo.rotateX(Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

/** Tapered blade blank, used for the pusher propeller. */
export function buildBlade(
  rootChord: number,
  tipChord: number,
  span: number,
  thickness: number,
): THREE.BufferGeometry {
  const naca = naca4(0.02, 0.4, thickness / rootChord, 8)
  return buildLoft({
    airfoil: naca,
    sections: 4,
    span,
    rootChord,
    tipChord,
    sweep: 0.06,
    offset: 0,
    twist: 0.5,
    spanAxis: 'x',
    capTip: true,
  })
}

/** Straight-line wire loop, used for the altitude ladder rings. */
export function lineLoop(points: THREE.Vector3[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return geo
}

/** Hexagonal gate outline lying in the XY plane, ready to be oriented. */
export function hexagon(radius: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0))
  }
  return lineLoop(pts)
}

export { lineLoop as buildLineLoop }
