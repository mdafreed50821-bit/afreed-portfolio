import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CURVE_SAMPLES, flightCurve } from './flightCurve'
import { flight } from '../store/flight'
import type { Tier } from '../hooks/useDeviceTier'

/* =========================================================================
   AIRFLOW FIELD
   Streamlines riding the whole flight path. The curve is baked into a
   512-texel lookup texture, so the vertex shader positions every particle on
   the GPU — the CPU cost per frame is one uniform write, not N transforms.
   Particles cycle along the route; brightness peaks in the wake around the
   aircraft, which is what makes the field read as flow rather than confetti.
   ========================================================================= */

const VERT = /* glsl */ `
  uniform sampler2D uCurve;
  uniform float uN;
  uniform float uHead;
  uniform float uTime;
  uniform float uSpread;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aJitter;
  varying float vFade;
  varying float vJit;

  void main() {
    float s = fract( aSeed + uTime * 0.042 );
    float d = abs( s - uHead );
    float wake = exp( -d * 8.5 );
    float ambient = 0.14;

    vFade = ( wake + ambient )
          * smoothstep( 0.0, 0.03, s )
          * ( 1.0 - smoothstep( 0.88, 1.0, s ) );
    vJit = aJitter;

    // Nearest-sample the baked curve: float linear filtering is not
    // universally available, exact texel indexing always is.
    float idx = clamp( floor( s * ( uN - 1.0 ) ), 0.0, uN - 1.0 );
    vec3 base = texture2D( uCurve, vec2( ( idx + 0.5 ) / uN, 0.5 ) ).xyz;

    // Each particle holds a fixed radius in the tube, then drifts around it.
    float ang = aJitter * 6.28318 + s * 24.0 + uTime * 0.3;
    float r = ( 0.3 + 1.55 * aJitter ) * uSpread;
    vec3 p = base + vec3( cos( ang ) * r, sin( ang ) * r * 0.7, 0.0 );

    vec4 mv = modelViewMatrix * vec4( p, 1.0 );
    gl_Position = projectionMatrix * mv;
    // Manual distance falloff: the material is additive and unfogged, so the
    // far end of the route has to be dimmed here or it reads as noise.
    vFade *= 1.0 - smoothstep( 150.0, 330.0, -mv.z );
    gl_PointSize = uSize * uPixelRatio * ( 16.0 / max( -mv.z, 1.0 ) );
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform vec3 uCaution;
  uniform float uIntensity;
  varying float vFade;
  varying float vJit;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot( c, c );
    if ( r2 > 0.25 ) discard;
    float a = pow( 1.0 - r2 * 4.0, 2.4 );
    vec3 col = mix( uColor, uHot, smoothstep( 0.3, 0.95, vFade ) );
    // A sparse scatter of caution motes inside a teal field.
    col = mix( col, uCaution, step( 0.945, vJit ) * 0.8 );
    gl_FragColor = vec4( col, a * vFade * uIntensity );
  }
`

export function Streamlines({ tier }: { tier: Tier }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const points = useRef<THREE.Points>(null!)
  const count = tier === 'low' ? 520 : 1500
  const baseIntensity = tier === 'low' ? 0.5 : 0.72

  const { curveTex, geometry, material } = useMemo(() => {
    const data = new Float32Array(CURVE_SAMPLES * 4)
    const p = new THREE.Vector3()
    for (let i = 0; i < CURVE_SAMPLES; i++) {
      flightCurve.getPointAt(i / (CURVE_SAMPLES - 1), p)
      data[i * 4] = p.x
      data[i * 4 + 1] = p.y
      data[i * 4 + 2] = p.z
      data[i * 4 + 3] = 1
    }
    const tex = new THREE.DataTexture(data, CURVE_SAMPLES, 1, THREE.RGBAFormat, THREE.FloatType)
    tex.minFilter = THREE.NearestFilter
    tex.magFilter = THREE.NearestFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    const seed = new Float32Array(count)
    const jitter = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random()
      jitter[i] = Math.random()
    }
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aJitter', new THREE.BufferAttribute(jitter, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 12, -104), 420)

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uCurve: { value: tex },
        uN: { value: CURVE_SAMPLES },
        uHead: { value: 0 },
        uTime: { value: 0 },
        uSpread: { value: tier === 'low' ? 1.0 : 1.35 },
        uSize: { value: tier === 'low' ? 1.5 : 1.9 },
        uPixelRatio: { value: 1 },
        uColor: { value: new THREE.Color('#1d8f9c') },
        uHot: { value: new THREE.Color('#9df3fa') },
        uCaution: { value: new THREE.Color('#F0A93B') },
        uIntensity: { value: baseIntensity },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { curveTex: tex, geometry: g, material: m }
  }, [baseIntensity, count, tier])

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(dpr, 2)
  }, [dpr, material])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      curveTex.dispose()
    },
    [geometry, material, curveTex],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uHead.value = flight.t
    // Fade the field up as the load-in sequence completes.
    material.uniforms.uIntensity.value = baseIntensity * Math.min(1, flight.intro * 2.2)
    if (points.current) points.current.visible = flight.intro > 0.05
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
