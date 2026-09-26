import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildBlade, buildFuselage, buildLoft, mirrorX, naca4 } from '../lib/airfoil'
import { flight } from '../store/flight'
import { bankAt, basisAt } from './flightCurve'
import type { Tier } from '../hooks/useDeviceTier'

/* =========================================================================
   THE AIRFRAME
   A slender research UAV, lofted from a real NACA 2412 wing and a 10% thick
   symmetric tail. Entirely procedural: no .glb, no textures, ~1.5k tris.
   It assembles itself out of a wireframe capture cage on load.
   ========================================================================= */

const SIGNAL = new THREE.Color('#3CC9D6')
const CAUTION = new THREE.Color('#F0A93B')
const PORT_RED = new THREE.Color('#FF5C3E')
const STBD_GREEN = new THREE.Color('#5CE08A')

const SPAN = 6.5
const seg = (p: number, a: number, b: number) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1)
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

/* --- Skin material: one compiled program, per-instance uniforms ----------- */

interface SkinUniforms {
  uRim: { value: THREE.Color }
  uRimPower: { value: number }
  uPanel: { value: number }
}

function makeSkin(color: string, metalness: number, roughness: number, rimPower: number, panel: number) {
  const uniforms: SkinUniforms = {
    uRim: { value: SIGNAL.clone() },
    uRimPower: { value: rimPower },
    uPanel: { value: panel },
  }
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness,
    roughness,
  })
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = uniforms.uRim
    shader.uniforms.uRimPower = uniforms.uRimPower
    shader.uniforms.uPanel = uniforms.uPanel

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPanel;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPanel = uv;')

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec2 vPanel;
uniform vec3 uRim;
uniform float uRimPower;
uniform float uPanel;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
// Rib lines at constant spanwise station, spar lines at constant chordwise
// station — the panel breakdown a stress run would actually be built on.
float gRib  = abs( fract( vPanel.y * 7.0 ) - 0.5 );
float gSpar = abs( fract( vPanel.x * 4.0 ) - 0.5 );
float lines = ( 1.0 - smoothstep( 0.0, 0.055, gRib ) ) * 0.55
            + ( 1.0 - smoothstep( 0.0, 0.045, gSpar ) ) * 0.35;
lines = clamp( lines * uPanel, 0.0, 1.0 );
diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * 0.42, lines );`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
// Avionics rim: a cold fresnel edge so the silhouette holds against the
// dark scene without paying for an outline pass.
float fres = pow( 1.0 - clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 ), uRimPower );
totalEmissiveRadiance += uRim * fres * 0.55;`,
      )
  }
  return mat
}

export function Aircraft({ tier }: { tier: Tier }) {
  const root = useRef<THREE.Group>(null!)
  const fuselage = useRef<THREE.Group>(null!)
  const wingL = useRef<THREE.Group>(null!)
  const wingR = useRef<THREE.Group>(null!)
  const finL = useRef<THREE.Group>(null!)
  const finR = useRef<THREE.Group>(null!)
  const propGroup = useRef<THREE.Group>(null!)
  const propBlades = useRef<THREE.Group>(null!)
  const cage = useRef<THREE.LineSegments>(null!)

  const lowDetail = tier === 'low'
  const sections = lowDetail ? 4 : 9
  const radial = lowDetail ? 10 : 16

  const geo = useMemo(() => {
    const wing = buildLoft({
      airfoil: naca4(0.02, 0.4, 0.12, lowDetail ? 12 : 22),
      sections,
      span: SPAN,
      rootChord: 1.05,
      tipChord: 0.44,
      sweep: 0.42,
      offset: 0.22,
      twist: 0.07,
      spanAxis: 'x',
      capTip: true,
    })

    const fin = buildLoft({
      airfoil: naca4(0, 0.4, 0.1, lowDetail ? 8 : 14),
      sections,
      span: 1.15,
      rootChord: 0.72,
      tipChord: 0.3,
      sweep: 0.34,
      offset: 0,
      twist: 0,
      spanAxis: 'y',
      capTip: true,
    })

    const body = buildFuselage(
      [
        { z: -2.35, r: 0.02 },
        { z: -2.15, r: 0.19 },
        { z: -1.75, r: 0.33 },
        { z: -1.1, r: 0.42 },
        { z: -0.2, r: 0.44 },
        { z: 0.7, r: 0.38 },
        { z: 1.35, r: 0.29 },
        { z: 1.9, r: 0.19 },
        { z: 2.4, r: 0.1 },
        { z: 2.62, r: 0.05 },
      ],
      radial,
    )

    return {
      wingR: wing,
      wingL: mirrorX(wing),
      fin,
      body,
      blade: buildBlade(0.2, 0.07, 0.62, 0.02),
      cage: new THREE.EdgesGeometry(new THREE.BoxGeometry(SPAN + 0.8, 1.6, 5.6)),
    }
  }, [lowDetail, radial, sections])

  const mat = useMemo(
    () => ({
      body: makeSkin('#202a38', 0.62, 0.34, 2.6, 1),
      wing: makeSkin('#2b374a', 0.55, 0.3, 2.9, 1),
      fin: makeSkin('#1a2230', 0.6, 0.38, 2.6, 0.7),
      blade: makeSkin('#101821', 0.35, 0.5, 2.2, 0),
      accent: new THREE.MeshStandardMaterial({ color: '#0d141d', metalness: 0.3, roughness: 0.6 }),
      lens: new THREE.MeshStandardMaterial({
        color: '#0a1017',
        emissive: SIGNAL.clone(),
        emissiveIntensity: 1.5,
        metalness: 0.1,
        roughness: 0.15,
      }),
      disc: new THREE.MeshBasicMaterial({
        color: SIGNAL.clone(),
        transparent: true,
        opacity: 0.11,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      cage: new THREE.LineBasicMaterial({
        color: SIGNAL.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      navPort: new THREE.MeshStandardMaterial({
        color: '#2a0a06',
        emissive: PORT_RED.clone(),
        emissiveIntensity: 2.4,
        roughness: 0.3,
      }),
      navStbd: new THREE.MeshStandardMaterial({
        color: '#062a16',
        emissive: STBD_GREEN.clone(),
        emissiveIntensity: 2.4,
        roughness: 0.3,
      }),
      strobe: new THREE.MeshStandardMaterial({
        color: '#22262c',
        emissive: CAUTION.clone(),
        emissiveIntensity: 0.35,
        roughness: 0.35,
      }),
    }),
    [],
  )

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      look: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      bank: 0,
      spin: 0,
    }),
    [],
  )

  useFrame((state, delta) => {
    const t = flight.t
    basisAt(t, tmp.right, tmp.up, tmp.fwd, tmp.pos)

    if (root.current) {
      tmp.matrix.lookAt(tmp.pos, tmp.look.copy(tmp.pos).add(tmp.fwd), tmp.up)
      root.current.quaternion.setFromRotationMatrix(tmp.matrix)
      // Bank into the turn, plus a slow idle breath so it never feels frozen.
      const time = state.clock.elapsedTime
      tmp.bank += (bankAt(t) - tmp.bank) * (1 - Math.exp(-3 * delta))
      root.current.rotateZ(tmp.bank + Math.sin(time * 0.42) * 0.035)
      root.current.rotateX(Math.sin(time * 0.31 + 1.1) * 0.02)
      root.current.position.copy(tmp.pos)
    }

    /* --- Load-in assembly, driven by the GSAP master timeline ------------- */
    const intro = flight.intro
    const kBody = easeOut(seg(intro, 0.02, 0.42))
    const kWing = easeOut(seg(intro, 0.18, 0.66))
    const kFin = easeOut(seg(intro, 0.36, 0.8))
    const kProp = easeOut(seg(intro, 0.52, 0.92))

    if (fuselage.current) fuselage.current.scale.setScalar(0.55 + 0.45 * kBody)

    const fold = (1 - kWing) * 1.35
    if (wingL.current) wingL.current.rotation.z = fold
    if (wingR.current) wingR.current.rotation.z = -fold

    // Tail surfaces swing fore/aft about the airframe roll axis into place.
    const finFold = (1 - kFin) * 0.9
    if (finL.current) finL.current.rotation.x = -finFold
    if (finR.current) finR.current.rotation.x = finFold

    if (propGroup.current) {
      propGroup.current.scale.setScalar(0.25 + 0.75 * kProp)
      tmp.spin += delta * (5 + 54 * kProp)
      if (propBlades.current) propBlades.current.rotation.z = tmp.spin
    }

    if (cage.current) {
      const m = cage.current.material as THREE.LineBasicMaterial
      m.opacity = 0.6 * (1 - seg(intro, 0.08, 0.48))
    }

    // Tail strobe on the real 1.15 s double-flash anti-collision rhythm.
    const ph = (state.clock.elapsedTime * 0.87) % 1
    const flash = ph < 0.05 || (ph > 0.13 && ph < 0.18) ? 1 : 0
    mat.strobe.emissiveIntensity = 0.3 + flash * 6
  })

  return (
    <group ref={root}>
      {/* Practical that travels with the airframe, lifting the underside. */}
      <pointLight color="#3cc9d6" intensity={9} distance={7.5} decay={2} position={[0, -0.2, -0.4]} />
      {/* Capture cage — the assembly volume the airframe builds inside. */}
      <lineSegments ref={cage} geometry={geo.cage} material={mat.cage} position={[0, 0.1, 0.1]} />

      <group ref={fuselage}>
        <mesh geometry={geo.body} material={mat.body} />
        {/* Nose EO/IR turret — the avionics payload, and the focal point. */}
        <mesh position={[0, -0.16, -1.55]} material={mat.accent}>
          <sphereGeometry args={[0.29, radial, Math.max(6, radial - 4)]} />
        </mesh>
        <mesh position={[0, -0.2, -1.74]} rotation={[Math.PI / 2, 0, 0]} material={mat.lens}>
          <cylinderGeometry args={[0.13, 0.15, 0.08, radial]} />
        </mesh>
        {/* Dorsal avionics bay. */}
        <mesh position={[0, 0.36, 0.5]} material={mat.accent}>
          <boxGeometry args={[0.34, 0.16, 1]} />
        </mesh>
      </group>

      <group position={[0, 0.16, -0.45]}>
        <group ref={wingL}>
          <mesh geometry={geo.wingL} material={mat.wing} />
        </group>
        <group ref={wingR}>
          <mesh geometry={geo.wingR} material={mat.wing} />
        </group>
        {/* Navigation lights: port red, starboard green. */}
        <mesh position={[-SPAN * 0.99, 0.21, 0.2]} material={mat.navPort}>
          <sphereGeometry args={[0.075, 8, 8]} />
        </mesh>
        <mesh position={[SPAN * 0.99, 0.21, 0.2]} material={mat.navStbd}>
          <sphereGeometry args={[0.075, 8, 8]} />
        </mesh>
      </group>

      {/* V-tail — no horizontal stabiliser, so the planform stays readable. */}
      <group position={[0, 0.16, 2.05]}>
        <group ref={finL} rotation={[0, 0, 0.72]}>
          <mesh geometry={geo.fin} material={mat.fin} />
        </group>
        <group ref={finR} rotation={[0, 0, -0.72]}>
          <mesh geometry={geo.fin} material={mat.fin} />
        </group>
      </group>

      <group ref={propGroup} position={[0, 0.16, 2.72]}>
        <mesh material={mat.accent} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.13, 0.22, radial]} />
        </mesh>
        <group ref={propBlades}>
          <mesh geometry={geo.blade} material={mat.blade} />
          <mesh geometry={geo.blade} material={mat.blade} rotation={[0, 0, Math.PI]} />
        </group>
        {/* Prop disc standing in for rotational blur. */}
        <mesh material={mat.disc}>
          <ringGeometry args={[0.22, 0.78, 32]} />
        </mesh>
      </group>

      <mesh position={[0, 0.3, 2.5]} material={mat.strobe}>
        <sphereGeometry args={[0.07, 8, 8]} />
      </mesh>

      {/* Umbilical running from the datalink pod aft to the tail. */}
      <mesh position={[0, -0.32, 1.4]} material={mat.accent}>
        <boxGeometry args={[0.06, 0.3, 1.5]} />
      </mesh>
    </group>
  )
}
