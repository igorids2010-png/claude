"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

/* Folha em formato de amêndoa, com a base em (0,0) apontando para cima. */
const LEAF = "M0 0C5-5 5.5-13 0-19C-5.5-13-5-5 0 0Z"
const LEAF_VEIN = "M0 -1.5V-16"

type SvgProps = React.SVGProps<SVGSVGElement>

/** Ícone da marca: sol nascente (aurora) com um raminho. */
export function LogoMark({ className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M7.5 27a12.5 12.5 0 0 1 25 0" opacity={0.55} />
      <path d="M4 27h32" />
      <path d="M20 34V11" />
      <path d="M20 23c-5 .3-7.6-2.6-7.8-6.6 4.6-.2 7.5 2.3 7.8 6.6Z" />
      <path d="M20 18.5c4.6.2 7-2.4 7.2-6.2-4.3-.2-7 2.2-7.2 6.2Z" />
      <path d="M20 11c-1.6-1.4-1.6-3.6 0-5 1.6 1.4 1.6 3.6 0 5Z" />
    </svg>
  )
}

/** Divisor com raminho central. */
export function SprigDivider({ className, ...props }: SvgProps) {
  const leaves = [
    { x: 46, r: -60 },
    { x: 52, r: -120 },
    { x: 68, r: 60 },
    { x: 74, r: 120 },
  ]
  return (
    <svg
      viewBox="0 0 120 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("h-5 w-30", className)}
      {...props}
    >
      <path d="M2 10h40M78 10h40" opacity={0.6} />
      <path d="M42 10h36" />
      {leaves.map((l, i) => (
        <path key={i} d={LEAF} transform={`translate(${l.x} 10) rotate(${l.r}) scale(0.42)`} />
      ))}
      <circle cx={60} cy={10} r={2.2} fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Galho em linha dourada gerado ao longo de uma curva de Bézier        */
/* ------------------------------------------------------------------ */

type Pt = [number, number]

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
}

function tangent(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number) {
  const u = 1 - t
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

const BRANCH: [Pt, Pt, Pt, Pt] = [
  [10, 290],
  [60, 210],
  [40, 110],
  [150, 20],
]

const BRANCH_LEAVES = Array.from({ length: 9 }, (_, i) => {
  const t = 0.12 + i * 0.1
  const [x, y] = cubic(...BRANCH, t)
  const angle = tangent(...BRANCH, t)
  const side = i % 2 === 0 ? 1 : -1
  // A folha nasce no caule e aponta para fora (±50° em relação à direção do galho).
  const rotation = angle + 90 + side * 50
  const scale = 1.25 - i * 0.06
  return { x, y, rotation, scale }
})

/**
 * Galho botânico em traço fino que se desenha ao entrar na tela.
 * Use `className` para posicionar e colorir (stroke = currentColor).
 */
export function Branch({
  className,
  strokeWidth = 1,
  animated = true,
}: {
  className?: string
  strokeWidth?: number
  animated?: boolean
}) {
  const reduce = useReducedMotion()
  const draw = animated && !reduce
  const [p0, p1, p2, p3] = BRANCH
  const stem = `M${p0[0]} ${p0[1]}C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`

  return (
    <svg
      viewBox="0 0 170 300"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
    >
      <motion.path
        d={stem}
        vectorEffect="non-scaling-stroke"
        initial={draw ? { pathLength: 0 } : false}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1] }}
      />
      {BRANCH_LEAVES.map((leaf, i) => (
        <g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotation}) scale(${leaf.scale})`}>
          <motion.g
            initial={draw ? { opacity: 0, scale: 0.2 } : false}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0.5, originY: 1 }}
          >
            <path d={LEAF} vectorEffect="non-scaling-stroke" />
            <path d={LEAF_VEIN} vectorEffect="non-scaling-stroke" opacity={0.6} />
          </motion.g>
        </g>
      ))}
      <motion.circle
        cx={p3[0]}
        cy={p3[1]}
        r={3}
        fill="currentColor"
        stroke="none"
        initial={draw ? { opacity: 0 } : false}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 2 }}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Folhas e pétalas flutuando (hero)                                   */
/* ------------------------------------------------------------------ */

const FLOATERS = [
  { top: "14%", left: "6%", size: 26, rotate: -20, duration: 11, delay: 0, kind: "leaf" },
  { top: "72%", left: "10%", size: 18, rotate: 30, duration: 9, delay: 1.5, kind: "petal" },
  { top: "22%", left: "46%", size: 16, rotate: 60, duration: 12, delay: 3, kind: "petal" },
  { top: "60%", left: "52%", size: 22, rotate: -40, duration: 10, delay: 0.8, kind: "leaf" },
  { top: "12%", left: "78%", size: 20, rotate: 15, duration: 13, delay: 2.2, kind: "leaf" },
  { top: "40%", left: "90%", size: 14, rotate: -70, duration: 8.5, delay: 0.4, kind: "petal" },
  { top: "84%", left: "70%", size: 24, rotate: 110, duration: 12.5, delay: 4, kind: "leaf" },
  { top: "34%", left: "30%", size: 12, rotate: 20, duration: 9.5, delay: 5, kind: "petal" },
] as const

export function FloatingLeaves({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {FLOATERS.map((f, i) => (
        <svg
          key={i}
          viewBox="-8 -21 16 23"
          className="absolute animate-float text-gold-400 motion-reduce:hidden"
          style={
            {
              top: f.top,
              left: f.left,
              width: f.size,
              height: f.size * 1.4,
              "--r": `${f.rotate}deg`,
              animationDuration: `${f.duration}s`,
              animationDelay: `-${f.delay}s`,
              opacity: f.kind === "leaf" ? 0.55 : 0.4,
            } as React.CSSProperties
          }
        >
          {f.kind === "leaf" ? (
            <>
              <path d={LEAF} fill="none" stroke="currentColor" strokeWidth={0.9} />
              <path d={LEAF_VEIN} fill="none" stroke="currentColor" strokeWidth={0.6} />
            </>
          ) : (
            <path d="M0 0C4-3 4-9 0-13C-4-9-4-3 0 0Z" fill="currentColor" opacity={0.7} />
          )}
        </svg>
      ))}
    </div>
  )
}

/** Pequena folha usada como separador (marquee, listas). */
export function LeafGlyph({ className, ...props }: SvgProps) {
  return (
    <svg viewBox="-8 -21 16 23" fill="none" stroke="currentColor" strokeWidth={1.1} aria-hidden="true" className={className} {...props}>
      <path d={LEAF} />
      <path d={LEAF_VEIN} opacity={0.7} />
    </svg>
  )
}
