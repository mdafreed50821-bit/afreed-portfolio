import type { WaypointId } from '../three/flightCurve'

export interface SectionMeta {
  id: WaypointId
  /** DOM id — the scroll mapper reads these offsets. */
  domId: string
  /** Instrument legend. Technical, mono, never decorative prose. */
  legend: string
  /** Navigation label. */
  nav: string
  /** Section headline, which is also the document-level h2. */
  title: string
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 'hero',
    domId: 'section-hero',
    legend: 'SECT 00 / FLIGHT BRIEF',
    nav: 'Brief',
    title: 'Mission briefing',
  },
  {
    id: 'about',
    domId: 'section-about',
    legend: 'SECT 01 / PROFILE & FOCUS',
    nav: 'Profile',
    title: 'Profile and focus areas',
  },
  {
    id: 'education',
    domId: 'section-education',
    legend: 'SECT 02 / TRAINING',
    nav: 'Training',
    title: 'Education and certifications',
  },
  {
    id: 'projects',
    domId: 'section-projects',
    legend: 'SECT 03 / PAYLOAD',
    nav: 'Payload',
    title: 'Projects',
  },
  {
    id: 'achievements',
    domId: 'section-achievements',
    legend: 'SECT 04 / LOGBOOK',
    nav: 'Logbook',
    title: 'Achievements',
  },
  {
    id: 'contact',
    domId: 'section-contact',
    legend: 'SECT 05 / RECOVERY',
    nav: 'Recovery',
    title: 'Contact',
  },
]

export function sectionById(id: WaypointId): SectionMeta {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0]
}
