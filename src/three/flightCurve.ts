import * as THREE from 'three'

/* =========================================================================
   THE FLIGHT PATH
   One Catmull-Rom curve threaded through the page. Named waypoints sit at
   t = 0, .2, .4, .6, .8, 1.0 so they line up 1:1 with the six page sections.
   DOM scroll is mapped onto t at runtime (see useScrollProgress) so the
   aircraft always arrives exactly as a section comes into frame.
   ========================================================================= */

export type WaypointId = 'hero' | 'about' | 'education' | 'projects' | 'achievements' | 'contact'

export interface Waypoint {
  id: WaypointId
  index: number
  code: string
  label: string
  /** Normalised position on the curve == index / (WAYPOINTS.length - 1). */
  t: number
  position: [number, number, number]
  /** Camera framing used while this waypoint is active. */
  cam: { offset: [number, number, number]; fov: number }
}

export const WAYPOINTS: Waypoint[] = [
  {
    id: 'hero',
    index: 0,
    code: 'WP-00',
    label: 'Briefing',
    t: 0,
    position: [0, 0, 0],
    cam: { offset: [7.4, 2.9, 9.2], fov: 40 },
  },
  {
    id: 'about',
    index: 1,
    code: 'WP-01',
    label: 'Profile',
    t: 0.2,
    position: [16, 14, -38],
    cam: { offset: [8.6, 2.2, 8.4], fov: 41 },
  },
  {
    id: 'education',
    index: 2,
    code: 'WP-02',
    label: 'Training',
    t: 0.4,
    position: [-13, 23, -82],
    cam: { offset: [-8.2, 2.6, 8.8], fov: 42 },
  },
  {
    id: 'projects',
    index: 3,
    code: 'WP-03',
    label: 'Payload',
    t: 0.6,
    position: [-17, 13, -122],
    cam: { offset: [-7.6, 3.4, 9.6], fov: 43 },
  },
  {
    id: 'achievements',
    index: 4,
    code: 'WP-04',
    label: 'Logbook',
    t: 0.8,
    position: [21, 11, -162],
    cam: { offset: [8.8, 2.4, 8.2], fov: 41 },
  },
  {
    id: 'contact',
    index: 5,
    code: 'WP-05',
    label: 'Recovery',
    t: 1,
    position: [0, 2, -206],
    cam: { offset: [6.6, 3.2, 10.4], fov: 39 },
  },
]

/**
 * Full control polygon in route order. Unnamed points only bend the path
 * between waypoints — they carry no UI meaning.
 */
const ROUTE: [number, number, number][] = [
  [0, 0, 0],
  [6, 7, -18],
  [16, 14, -38],
  [10, 20, -62],
  [-13, 23, -82],
  [-26, 19, -100],
  [-17, 13, -122],
  [-4, 8, -142],
  [21, 11, -162],
  [12, 4, -190],
  [0, 2, -206],
]

export const flightCurve = new THREE.CatmullRomCurve3(
  ROUTE.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  false,
  'catmullrom',
  0.4,
)
flightCurve.arcLengthDivisions = 900

/** Texel count of the curve lookup texture used by the streamline shader. */
export const CURVE_SAMPLES = 512
export const CURVE_LENGTH = flightCurve.getLength()

/* -------------------------------------------------------------------------
   Instrument readouts — derived from actual curve state, not invented.
   ---------------------------------------------------------------------- */

/** Track origin: Hyderabad, India. Distances scale off the model. */
const ORIGIN = { lat: 17.385, lon: 78.4867 }
const METRES_PER_UNIT = 200
const DEG_LAT = 111320
const DEG_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180)

export interface Readout {
  alt: number
  hdg: number
  spd: number
  aoa: number
  mach: number
  trk: number
  lat: number
  lon: number
  dist: number
  active: number
}

const _pos = new THREE.Vector3()
const _ahead = new THREE.Vector3()
const _chord = new THREE.Vector3()
const _tan = new THREE.Vector3()
const _prevTan = new THREE.Vector3()
const _cross = new THREE.Vector3()
const WORLD_UP = new THREE.Vector3(0, 1, 0)

const QUANT = { alt: 20, hdg: 1, spd: 1, aoa: 1, mach: 0.01, trk: 1, dist: 1, lat: 4, lon: 4 }
const snap = (v: number, step: number) => Math.round(v / step) * step
const rad2deg = (r: number) => (r * 180) / Math.PI

export function readFlight(t: number): Readout {
  const tc = THREE.MathUtils.clamp(t, 0, 1)
  flightCurve.getPointAt(tc, _pos)
  flightCurve.getTangentAt(tc, _tan)

  const alt = 2400 + _pos.y * 300
  // Compass convention for the model: 0° = path north (−Z), 90° = +X.
  const hdg = (rad2deg(Math.atan2(_tan.x, -_tan.z)) + 360) % 360

  // Ground track comes from the chord (position-to-position) vector, so it
  // differs from heading by the crab angle on a banked turn.
  flightCurve.getPointAt(THREE.MathUtils.clamp(tc + 0.004, 0, 1), _ahead)
  _chord.copy(_ahead).sub(_pos)
  const trk = (rad2deg(Math.atan2(_chord.x, -_chord.z)) + 360) % 360

  const fpa = rad2deg(Math.asin(THREE.MathUtils.clamp(_tan.y, -1, 1)))

  const dist = tc * CURVE_LENGTH * METRES_PER_UNIT
  // Indicated ground speed inside a plausible envelope for a light UAV.
  const spd = 88 + 44 * Math.sin(tc * 3.1) + 26 * Math.min(1, Math.max(0, fpa * 0.06 + 0.5))
  const mach = spd / 573.5

  const east = _pos.x * METRES_PER_UNIT
  const north = -_pos.z * METRES_PER_UNIT

  let active = 0
  let best = Infinity
  for (const wp of WAYPOINTS) {
    const d = Math.abs(wp.t - tc)
    if (d < best) {
      best = d
      active = wp.index
    }
  }

  return {
    alt: snap(alt, QUANT.alt),
    hdg: snap(hdg, QUANT.hdg),
    spd: Math.max(0, snap(spd, QUANT.spd)),
    aoa: snap(fpa, QUANT.aoa),
    mach: snap(mach, QUANT.mach),
    trk: snap(trk, QUANT.trk),
    lat: snap(ORIGIN.lat + north / DEG_LAT, QUANT.lat),
    lon: snap(ORIGIN.lon + east / DEG_LON, QUANT.lon),
    dist: snap(dist, QUANT.dist),
    active,
  }
}

/**
 * Smoothed bank angle (radians) for the aircraft at `t`.
 * Heading −Z puts "left" at −X, so a left turn (tangent rotating toward −X,
 * giving t0 × t1 along +Y) must roll positive about the local Z axis.
 */
export function bankAt(t: number, out = _cross): number {
  const tc = THREE.MathUtils.clamp(t, 0, 1)
  flightCurve.getTangentAt(THREE.MathUtils.clamp(tc - 0.006, 0, 1), _prevTan)
  flightCurve.getTangentAt(THREE.MathUtils.clamp(tc + 0.006, 0, 1), _tan)
  out.copy(_prevTan).cross(_tan)
  return THREE.MathUtils.clamp(out.y * 26, -0.72, 0.72)
}

const _camOffset = new THREE.Vector3()
export function cameraFraming(t: number): { offset: THREE.Vector3; fov: number } {
  const tc = THREE.MathUtils.clamp(t, 0, 1)
  let i = 0
  while (i < WAYPOINTS.length - 2 && WAYPOINTS[i + 1].t < tc) i++
  const a = WAYPOINTS[i]
  const b = WAYPOINTS[i + 1]
  const raw = (tc - a.t) / (b.t - a.t)
  const k = raw * raw * (3 - 2 * raw) // smoothstep between framings
  _camOffset.set(
    THREE.MathUtils.lerp(a.cam.offset[0], b.cam.offset[0], k),
    THREE.MathUtils.lerp(a.cam.offset[1], b.cam.offset[1], k),
    THREE.MathUtils.lerp(a.cam.offset[2], b.cam.offset[2], k),
  )
  return { offset: _camOffset, fov: THREE.MathUtils.lerp(a.cam.fov, b.cam.fov, k) }
}

export { WORLD_UP }

/** Orthonormal flight basis at `t`, written into the supplied vectors. */
export function basisAt(
  t: number,
  right: THREE.Vector3,
  up: THREE.Vector3,
  fwd: THREE.Vector3,
  pos: THREE.Vector3,
): void {
  const tc = THREE.MathUtils.clamp(t, 0, 1)
  flightCurve.getPointAt(tc, pos)
  flightCurve.getTangentAt(tc, fwd).normalize()
  right.crossVectors(fwd, WORLD_UP).normalize()
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
  up.crossVectors(right, fwd).normalize()
}
