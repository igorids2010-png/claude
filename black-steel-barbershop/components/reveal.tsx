"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 32 },
  down: { y: -32 },
  left: { x: 32 },
  right: { x: -32 },
  none: {},
}

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: Direction
  as?: "div" | "li" | "article" | "section"
}

/** Fade + slide sutil quando o elemento entra na tela (uma única vez). */
export function Reveal({ children, className, delay = 0, direction = "up", as = "div" }: RevealProps) {
  const reduce = useReducedMotion()
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, ...offset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}
