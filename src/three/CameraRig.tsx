import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { basisAt, cameraFraming } from './flightCurve'
import { flight } from '../store/flight'

/* =========================================================================
   CAMERA RIG
   Scroll is the throttle. The camera trails the aircraft along the curve with
   a per-waypoint framing, framed so the airframe sits in the right third of
   a wide viewport and type owns the left. On narrow viewports it pulls back,
   recentres and biases the subject upward so copy can sit underneath it.
   ========================================================================= */

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const width = useThree((s) => s.size.width)

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      look: new THREE.Vector3(),
      lookSmoothed: new THREE.Vector3(),
    }),
    [],
  )
  const started = useRef(false)

  const solve = (t: number) => {
    const narrow = width < 900
    basisAt(t, tmp.pos, tmp.right, tmp.up, tmp.fwd)
    const { offset, fov } = cameraFraming(t)

    // Run-up distance during the load-in: the camera starts wide and settles.
    const introK = 1 + (1 - flight.intro) * 2.7
    const lateral = narrow ? offset.x * 0.5 : offset.x

    tmp.desired
      .copy(tmp.pos)
      .addScaledVector(tmp.right, lateral + flight.pointer.x * (narrow ? 0.25 : 0.85))
      .addScaledVector(tmp.up, offset.y + flight.pointer.y * 0.5)
      .addScaledVector(tmp.fwd, -offset.z * (narrow ? 1.5 : 1) * introK)

    tmp.look.copy(tmp.pos).addScaledVector(tmp.fwd, 2.2)
    if (narrow) {
      // Push the subject up so the copy column can occupy the lower half.
      tmp.look.addScaledVector(tmp.up, -2.1)
    } else {
      // Look left of the subject: it lands right-of-centre.
      tmp.look.addScaledVector(tmp.right, -3.4)
    }
    return { fov: (narrow ? fov + 13 : fov) * (1 + (1 - flight.intro) * 0.09), narrow }
  }

  useLayoutEffect(() => {
    const { fov } = solve(flight.t)
    camera.position.copy(tmp.desired)
    tmp.lookSmoothed.copy(tmp.look)
    camera.lookAt(tmp.lookSmoothed)
    camera.fov = fov
    camera.updateProjectionMatrix()
    started.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width])

  useFrame((_, delta) => {
    const { fov } = solve(flight.t)
    // Frame-rate independent exponential damping.
    const k = 1 - Math.exp(-(width < 900 ? 7 : 4.5) * Math.min(delta, 0.1))
    camera.position.lerp(tmp.desired, k)
    if (!started.current) {
      started.current = true
      tmp.lookSmoothed.copy(tmp.look)
    }
    tmp.lookSmoothed.lerp(tmp.look, k)
    camera.lookAt(tmp.lookSmoothed)

    if (Math.abs(camera.fov - fov) > 0.02) {
      camera.fov += (fov - camera.fov) * k
      camera.updateProjectionMatrix()
    }
  })

  return null
}
