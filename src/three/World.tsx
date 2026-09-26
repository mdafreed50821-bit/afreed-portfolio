import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { WAYPOINTS, basisAt, flightCurve } from './flightCurve'
import { flight } from '../store/flight'
import { hexagon } from '../lib/airfoil'
import type { Tier } from '../hooks/useDeviceTier'

/* =========================================================================
   THE WORLD
   Everything the aircraft flies *through*: the route itself, a hexagonal gate
   at each page section, a ground reference ladder, a radar PPI that tracks the
   airframe, a ticked plumb line dropping to the ladder, and a drifting cloud
   deck. One draw call each — lines and single quads only.
   ========================================================================= */

const SIGNAL = new THREE.Color('#3CC9D6')
const SIGNAL_DIM = new THREE.Color('#1b7c86')
const CAUTION = new THREE.Color('#F0A93B')
const GATE_R = 3.7

/* --- The route ----------------------------------------------------------
   Two coincident lines: a soft base glow, and a dashed line whose dash
   pattern marches along the path so the route reads as being drawn ahead of
   the airframe. `lineDistance` is rewritten each frame because
   LineDashedMaterial has no offset uniform — the phase lives in the attribute.
   ---------------------------------------------------------------------- */

function RouteLine({ tier }: { tier: Tier }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = tier === 'low' ? 180 : 380
    const p = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      flightCurve.getPointAt(i / (n - 1), p)
      pts.push(p.clone())
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    g.computeBoundingSphere()
    return g
  }, [tier])

  const { baseLine, dashLine, baseDistances, dashOffset } = useMemo(() => {
    const base = new THREE.LineBasicMaterial({
      color: SIGNAL_DIM,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
    const dash = new THREE.LineDashedMaterial({
      color: SIGNAL,
      dashSize: 1.1,
      gapSize: 0.75,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    const l1 = new THREE.Line(geometry, base)
    const l2 = new THREE.Line(geometry, dash)
    l1.computeLineDistances()
    l2.computeLineDistances()
    const attr = l2.geometry.getAttribute('lineDistance') as THREE.BufferAttribute
    return {
      baseLine: l1,
      dashLine: l2,
      baseDistances: Float32Array.from(attr.array as Float32Array),
      dashOffset: { current: 0 },
    }
  }, [geometry])

  useEffect(
    () => () => {
      baseLine.material.dispose()
      dashLine.material.dispose()
      geometry.dispose()
    },
    [baseLine, dashLine, geometry],
  )

  useFrame(() => {
    const attr = dashLine.geometry.getAttribute('lineDistance') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    dashOffset.current = flight.t * 150 + flight.intro * 45
    for (let i = 0; i < arr.length; i++) arr[i] = baseDistances[i] + dashOffset.current
    attr.needsUpdate = true
  })

  return (
    <group>
      <primitive object={baseLine} />
      <primitive object={dashLine} />
    </group>
  )
}

/* --- Hexagonal gate per section ----------------------------------------- */

function WaypointGates() {
  const groups = useRef<(THREE.Group | null)[]>([])
  const lines = useRef<(THREE.LineLoop | null)[]>([])
  const inners = useRef<(THREE.LineLoop | null)[]>([])

  const frames = useMemo(
    () =>
      WAYPOINTS.map((wp) => {
        const pos = new THREE.Vector3()
        const fwd = new THREE.Vector3()
        const right = new THREE.Vector3()
        const up = new THREE.Vector3()
        basisAt(wp.t, right, up, fwd, pos)
        const q = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(pos, pos.clone().add(fwd), up),
        )
        return { pos, q }
      }),
    [],
  )

  const outerGeo = useMemo(() => hexagon(GATE_R), [])
  const innerGeo = useMemo(() => hexagon(GATE_R * 0.82), [])

  useFrame((state) => {
    const t = flight.t
    const reveal = Math.min(1, flight.intro * 2)
    const clock = state.clock.elapsedTime
    for (let i = 0; i < frames.length; i++) {
      const g = groups.current[i]
      if (!g) continue
      // A gate is "hot" when the aircraft is inside it — the arrival cue.
      const near = 1 - Math.min(1, Math.abs(WAYPOINTS[i].t - t) / 0.11)
      const base = 0.18 * reveal
      const lm = lines.current[i]?.material as THREE.LineBasicMaterial | undefined
      const im = inners.current[i]?.material as THREE.LineBasicMaterial | undefined
      if (lm) {
        lm.opacity = base + near * 0.9 * reveal
        lm.color.copy(SIGNAL).lerp(CAUTION, near * 0.4)
      }
      if (im) im.opacity = base * 0.7 + near * 0.4 * (0.6 + 0.4 * Math.sin(clock * 2 + i)) * reveal
      g.scale.setScalar(1 + near * 0.07)
    }
  })

  return (
    <group>
      {WAYPOINTS.map((wp, i) => (
        <group
          key={wp.id}
          ref={(el) => {
            groups.current[i] = el
          }}
          position={frames[i].pos}
          quaternion={frames[i].q}
        >
          <lineLoop
            ref={(el: THREE.LineLoop | null) => {
              lines.current[i] = el
            }}
            geometry={outerGeo}
          >
            <lineBasicMaterial color={SIGNAL} transparent opacity={0} depthWrite={false} />
          </lineLoop>
          <lineLoop
            ref={(el: THREE.LineLoop | null) => {
              inners.current[i] = el
            }}
            geometry={innerGeo}
          >
            <lineBasicMaterial color={SIGNAL_DIM} transparent opacity={0} depthWrite={false} />
          </lineLoop>
        </group>
      ))}
    </group>
  )
}

/* --- Ground reference ladder -------------------------------------------- */

function AltitudeLadder() {
  const geometry = useMemo(() => {
    const verts: number[] = []
    const p = new THREE.Vector3()
    const half = 23
    const n = 15
    for (let i = 0; i < n; i++) {
      flightCurve.getPointAt(i / (n - 1), p)
      const cx = p.x
      const cz = p.z
      const corners = [
        [cx - half, cz - half],
        [cx + half, cz - half],
        [cx + half, cz + half],
        [cx - half, cz + half],
      ]
      for (let k = 0; k < 4; k++) {
        const a = corners[k]
        const b = corners[(k + 1) % 4]
        verts.push(a[0], 0, a[1], b[0], 0, b[1])
      }
      // Corner ticks so distance along the route is readable, not just a box.
      verts.push(cx - half, 0, cz, cx - half + 3, 0, cz)
      verts.push(cx + half - 3, 0, cz, cx + half, 0, cz)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return g
  }, [])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={SIGNAL_DIM} transparent opacity={0.3} depthWrite={false} />
    </lineSegments>
  )
}

/* --- Plumb line: airframe down to the ladder, ticked --------------------- */

const PLUMB_TICKS = 12

function PlumbLine() {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((1 + PLUMB_TICKS) * 2 * 3), 3))
    return g
  }, [])

  const basis = useMemo(
    () => ({ pos: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), fwd: new THREE.Vector3() }),
    [],
  )

  useFrame(() => {
    basisAt(flight.t, basis.right, basis.up, basis.fwd, basis.pos)
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const alt = Math.max(2, basis.pos.y)
    const { x, y, z } = basis.pos
    let o = 0
    // Main drop line.
    arr[o++] = x
    arr[o++] = y
    arr[o++] = z
    arr[o++] = x
    arr[o++] = 0
    arr[o++] = z
    // Altitude ticks, every fifth one long.
    for (let i = 0; i < PLUMB_TICKS; i++) {
      const ty = (alt * (i + 1)) / (PLUMB_TICKS + 1)
      const w = i % 3 === 0 ? 1.6 : 0.75
      arr[o++] = x - w
      arr[o++] = ty
      arr[o++] = z
      arr[o++] = x + w
      arr[o++] = ty
      arr[o++] = z
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={CAUTION} transparent opacity={0.26} depthWrite={false} />
    </lineSegments>
  )
}

/* --- Radar PPI that tracks the airframe ---------------------------------- */

const RADAR_R = new THREE.Vector3()
const RADAR_U = new THREE.Vector3()
const RADAR_F = new THREE.Vector3()
const RADAR_P = new THREE.Vector3()

const RADAR_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`

const RADAR_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform vec3 uAccent;

  // Soft-edged repeating line at multiples of n. Width grows with radius so
  // the far field fades out instead of aliasing into noise.
  float rule( float v, float n, float w ) {
    return 1.0 - smoothstep( 0.0, w, abs( fract( v * n + 0.5 ) - 0.5 ) );
  }

  void main() {
    vec2 p = ( vUv - 0.5 ) * 2.0;
    float r = length( p );
    float w = 0.018 + r * 0.055;
    float rings  = rule( r, 7.0, w );
    float spokes = rule( atan( p.y, p.x ) * 0.1591, 6.0, 0.02 );
    float a = atan( p.y, p.x ) - uTime * 0.5;
    float sweep = pow( max( 0.0, cos( a ) ), 20.0 );
    float fall = 1.0 - smoothstep( 0.14, 1.0, r );
    float amt = ( rings * 0.30 + spokes * 0.14 + sweep * 0.40 ) * fall * uOpacity;
    vec3 col = mix( uColor, uAccent, sweep * 0.75 + rings * 0.12 );
    gl_FragColor = vec4( col, amt );
  }
`

function RadarFloor() {
  const ref = useRef<THREE.Mesh>(null!)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: SIGNAL.clone() },
          uAccent: { value: CAUTION.clone() },
        },
        vertexShader: RADAR_VERT,
        fragmentShader: RADAR_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uOpacity.value = 0.55 * Math.min(1, flight.intro * 1.6)
    if (ref.current) {
      basisAt(flight.t, RADAR_R, RADAR_U, RADAR_F, RADAR_P)
      ref.current.position.set(RADAR_P.x, RADAR_P.y - 13, RADAR_P.z)
    }
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[300, 300, 1, 1]} />
    </mesh>
  )
}

/* --- High-altitude cloud deck ------------------------------------------- */

function softSprite(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.32)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function CloudDeck({ tier }: { tier: Tier }) {
  const ref = useRef<THREE.Points>(null!)
  const count = tier === 'low' ? 24 : 54

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const p = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      flightCurve.getPointAt(i / count, p)
      positions[i * 3] = p.x + (Math.random() - 0.5) * 160
      positions[i * 3 + 1] = p.y - 9 - Math.random() * 28
      positions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 160
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 12, -104), 520)
    const m = new THREE.PointsMaterial({
      size: 28,
      map: softSprite(),
      color: new THREE.Color('#2c6673'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: g, material: m }
  }, [count])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      material.map?.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    material.opacity = 0.42 * Math.min(1, flight.intro * 1.6)
    if (ref.current) {
      // Drift the whole deck rather than mutating 54 vertices per frame.
      const t = state.clock.elapsedTime
      ref.current.position.y = Math.sin(t * 0.07) * 2.2
      ref.current.position.x = Math.sin(t * 0.045) * 5
      ref.current.rotation.y = Math.sin(t * 0.02) * 0.06
    }
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

/* --- Assembly ----------------------------------------------------------- */

export function World({ tier }: { tier: Tier }) {
  return (
    <group>
      <RouteLine tier={tier} />
      <WaypointGates />
      <AltitudeLadder />
      <PlumbLine />
      <RadarFloor />
      <CloudDeck tier={tier} />
    </group>
  )
}
