import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Aircraft } from './Aircraft'
import { CameraRig } from './CameraRig'
import { Streamlines } from './Streamlines'
import { World } from './World'
import type { Tier } from '../hooks/useDeviceTier'

/* =========================================================================
   SCENE
   Lighting is a three-source night-flight rig: cold key from high starboard,
   teal bounce from below, and a dim fill so the underside of the wing never
   goes fully black. No shadow maps — the frame budget goes to geometry and
   the streamline field instead.
   ========================================================================= */

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize( position );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`

const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uNadir;
  uniform float uOpacity;

  float hash( vec2 p ) {
    return fract( sin( dot( p, vec2( 41.3, 289.1 ) ) ) * 43758.5453 );
  }

  void main() {
    float h = vDir.y;
    vec3 col = mix( uHorizon, uZenith, smoothstep( 0.0, 0.62, h ) );
    col = mix( uNadir, col, smoothstep( -0.55, 0.015, h ) );

    // Sparse star field, quantised on the direction vector so it stays fixed.
    vec2 cell = floor( vDir.xz * 190.0 / max( 0.22, abs( h ) + 0.22 ) );
    float s = hash( cell );
    float star = step( 0.9975, s ) * smoothstep( 0.0, 0.35, h );
    col += vec3( 0.55, 0.72, 0.8 ) * star * 0.5;

    gl_FragColor = vec4( col, uOpacity );
  }
`

function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uZenith: { value: new THREE.Color('#03050a') },
          uHorizon: { value: new THREE.Color('#0a141f') },
          uNadir: { value: new THREE.Color('#05080c') },
          uOpacity: { value: 1 },
        },
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh material={material} renderOrder={-100} frustumCulled={false}>
      <sphereGeometry args={[480, 24, 16]} />
    </mesh>
  )
}

/* --- Device pixel ratio governor ---------------------------------------- */

function DprGovernor({ tier }: { tier: Tier }) {
  const setDpr = useThree((s) => s.setDpr)
  const [dpr, setDprState] = useState(() => {
    const base = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    return tier === 'low' ? 1 : Math.min(1.75, base)
  })

  useEffect(() => {
    setDpr(dpr)
  }, [dpr, setDpr])

  return (
    <PerformanceMonitor
      bounds={() => [45, 58]}
      flipflops={3}
      onChange={({ factor }) => {
        const next = Math.round((0.8 + factor * 0.95) * 20) / 20
        const clamped = Math.max(tier === 'low' ? 0.85 : 1, Math.min(1.75, next))
        setDprState((prev) => (Math.abs(prev - clamped) > 0.08 ? clamped : prev))
      }}
    />
  )
}

/* --- Root ---------------------------------------------------------------- */

export interface SceneProps {
  tier: Tier
  lite: boolean
}

export default function Scene({ tier, lite }: SceneProps) {
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')

  // A hidden tab must not burn frames.
  useEffect(() => {
    const on = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  return (
    <Canvas
      frameloop={frameloop}
      dpr={tier === 'low' ? 1 : [1, 1.75]}
      camera={{ fov: 42, near: 0.1, far: 1200, position: [10, 6, 16] }}
      gl={{
        antialias: !lite,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.12
        scene.fog = new THREE.Fog('#05080c', 90, 460)
      }}
    >
      <DprGovernor tier={tier} />
      <SkyDome />

      <hemisphereLight args={['#3d5a78', '#070b11', 0.55]} />
      <ambientLight intensity={0.22} color="#2a3d54" />
      {/* Key: high and to starboard, cold. */}
      <directionalLight position={[9, 12, 5]} intensity={1.75} color="#d3e8f7" />
      {/* Bounce: teal from below and behind, so the wing underside reads. */}
      <directionalLight position={[-8, -5, -7]} intensity={0.55} color="#2e8f9b" />
      <directionalLight position={[-3, 2, 11]} intensity={0.4} color="#7f93a8" />

      <CameraRig />
      <Aircraft tier={tier} />
      <Streamlines tier={lite ? 'low' : tier} />
      <World tier={lite ? 'low' : tier} />
    </Canvas>
  )
}
