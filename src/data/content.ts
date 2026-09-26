/* =========================================================================
   SITE CONTENT — single source of truth.
   Nothing outside this file should hard-code biography facts, so design
   changes never risk rewriting real information.

   RULE: every string below is either supplied verbatim or is a label the
   visitor can verify from the material next to it. Do not add capability
   claims, metrics, employers, dates or outcomes that are not on record.
   ========================================================================= */

export const profile = {
  name: 'Md Afreed',
  firstName: 'Afreed',
  location: 'Hyderabad, India',
  role: 'Aeronautical Engineering Student, 4th Year',
  collegeShort: 'MRCET',
  college: 'Malla Reddy College of Engineering and Technology (MRCET)',
  campus: 'Maisammaguda',
  degree: 'B.Tech Aeronautical Engineering',
  duration: '2023–2027',
  cgpa: '7.75/10',
  phone: '+91 96520 71995',
  phoneHref: 'tel:+919652071995',
  email: 'mdafreed50821@gmail.com',
  emailHref: 'mailto:mdafreed50821@gmail.com',
  linkedin: 'https://www.linkedin.com/in/md-afreed-45232727b/',
  github: 'https://github.com/mdafreed50821-bit',
} as const

export const summary =
  'Aeronautical engineering student with working knowledge of aerodynamics, aircraft structures, propulsion, and computation. Focused on avionics, UAV/drone design, and CFD — currently exploring AI-driven wing optimization, and looking for opportunities to contribute to real aerospace and defense engineering projects.'

export interface FocusArea {
  code: string
  title: string
  /** Compact label for chips and tight spaces. */
  short: string
  /** Terms the visitor can check against the tool inventory below. */
  keywords: string[]
}

export const focusAreas: FocusArea[] = [
  {
    code: 'FA-01',
    title: 'Avionics & Flight Control Systems',
    short: 'Avionics',
    keywords: ['Embedded control'],
  },
  {
    code: 'FA-02',
    title: 'UAV / Drone Design',
    short: 'UAV design',
    keywords: ['Unmanned aircraft'],
  },
  {
    code: 'FA-03',
    title: 'Computational Fluid Dynamics',
    short: 'CFD',
    keywords: ['ANSYS Fluent', 'Aerodynamics'],
  },
]

export const skillGroups: { code: string; label: string; items: string[] }[] = [
  {
    code: 'SK-A',
    label: 'Aerospace',
    items: [
      'Aircraft Structures & Design',
      'Aerodynamics',
      'Finite Element Analysis',
      'Computational Fluid Dynamics',
      'Aircraft Maintenance Engineering Concepts',
    ],
  },
  {
    code: 'SK-S',
    label: 'Software',
    items: [
      'Python',
      'ANSYS Fluent',
      'AutoCAD',
      'SolidWorks',
      'MATLAB',
      'XFLR5 (basics)',
      'MS Excel',
    ],
  },
  {
    code: 'SK-L',
    label: 'Languages',
    items: ['English', 'Hindi', 'Telugu', 'Urdu'],
  },
]

export interface Project {
  index: number
  code: string
  title: string
  status: 'active' | 'publishing' | 'study'
  statusLabel: string
  /** Show the pulsing status pip. */
  live?: boolean
  body: string
  /** Only tools named in the source material. */
  tools?: string[]
}

export const projects: Project[] = [
  {
    index: 1,
    code: 'PRJ-01',
    title: 'AI-Based Wing Optimization',
    status: 'active',
    statusLabel: 'In progress',
    live: true,
    body: 'Applying AI-driven optimization techniques to wing design to improve aerodynamic efficiency beyond traditional iterative methods.',
    tools: ['Python', 'XFLR5'],
  },
  {
    index: 2,
    code: 'PRJ-02',
    title: 'Blended Wing Body Aircraft',
    status: 'publishing',
    statusLabel: 'Paper in publication',
    live: true,
    body: 'Studied and designed a blended wing body configuration, exploring aerodynamic and structural advantages over conventional tube-and-wing aircraft. A paper on this work is currently in the publication process.',
  },
  {
    index: 3,
    code: 'PRJ-03',
    title: 'Composite Materials in Modern Aviation',
    status: 'study',
    statusLabel: 'Exploration study',
    body: 'Explored Carbon Nanotube (CNT) and Kevlar-based composites for lightweight, high-strength, fuel-efficient aircraft structures and structural health monitoring.',
    tools: ['CNT', 'Kevlar', 'SHM'],
  },
]

export interface Achievement {
  code: string
  title: string
  detail?: string
  tag: string
  /** Only set where the result is on record. */
  weight?: string
}

export const achievements: Achievement[] = [
  {
    code: 'ACH-01',
    title: 'Paper publication in process',
    detail: 'Blended Wing Body',
    tag: 'Research',
    weight: 'IN REVIEW',
  },
  {
    code: 'ACH-02',
    title: 'RC Plane Workshop',
    detail: '2nd best prototype',
    tag: 'Fabrication',
  },
  {
    code: 'ACH-03',
    title: 'Composite Materials Workshop',
    detail: 'CNT and Kevlar composites',
    tag: 'Materials lab',
  },
]

export interface Certification {
  code: string
  issuer: string
  title: string
  detail?: string
}

export const certifications: Certification[] = [
  {
    code: 'CRT-01',
    issuer: 'Cambridge',
    title: 'Cambridge English Certification',
    detail: 'C1, LSRW skills',
  },
  {
    code: 'CRT-02',
    issuer: 'Python',
    title: 'Python programming certification',
  },
]

/* --- Headshot -----------------------------------------------------------
   Drop the file in /public. The slot crops to a circle, so a tall portrait
   needs its focal point biased upward or the crop eats the top of the head.
   `focusY` is the one knob: lower it to move the crop window down.
   ---------------------------------------------------------------------- */

export const headshotSrc = '/headshot.jpg'

export const headshot = {
  /** Intrinsic size, used to reserve space before the image decodes. */
  width: 899,
  height: 1599,
  /** Circle-crop focal point, as a percentage of image height. */
  focusY: '24%',
  alt: `${profile.name}, ${profile.role}`,
}
