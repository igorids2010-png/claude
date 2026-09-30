"use client"

import * as React from "react"
import { motion, type HTMLMotionProps, type Variants } from "motion/react"

const EASE = [0.22, 1, 0.36, 1] as const

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number
  /** Deslocamento inicial em px (vertical por padrão). */
  y?: number
  x?: number
}

/** Fade + slide suave ao entrar na tela (uma única vez). */
export function Reveal({ delay = 0, y = 28, x = 0, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

const groupVariants: Variants = {
  hidden: {},
  show: (stagger: number = 0.12) => ({ transition: { staggerChildren: stagger } }),
}

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
}

/** Container que revela os filhos (`RevealItem`) em sequência. */
export function RevealGroup({
  stagger = 0.12,
  children,
  ...props
}: HTMLMotionProps<"div"> & { stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      custom={stagger}
      variants={groupVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={revealItemVariants} {...props}>
      {children}
    </motion.div>
  )
}
