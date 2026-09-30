"use client"

import * as React from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

type AnimatedCounterProps = {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

/** Número que conta de 0 até `value` quando entra na tela. */
export function AnimatedCounter({ value, decimals = 0, duration = 2.2, className }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" })
  const reduce = useReducedMotion()
  const format = React.useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals]
  )

  React.useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    if (reduce) {
      node.textContent = format.format(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format.format(latest)
      },
    })
    return () => controls.stop()
  }, [inView, value, duration, format, reduce])

  return (
    <span ref={ref} className={className}>
      {format.format(0)}
    </span>
  )
}
