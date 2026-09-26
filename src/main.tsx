import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { gsap, ScrollTrigger } from './lib/gsap'

/* Fonts change section heights, which changes where every ScrollTrigger fires.
   Re-measure once the real typefaces are in. */
if (document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh())
}

gsap.ticker.lagSmoothing(220, 33)

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
