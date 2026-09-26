import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* Single registration point for GSAP plugins. */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  gsap.defaults({ ease: 'power3.out', duration: 0.7 })
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger }
