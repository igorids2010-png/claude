"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { contact } from "@/lib/data"
import { whatsappLink } from "@/lib/utils"
import { WhatsAppIcon } from "@/components/icons"

/** Botão flutuante de WhatsApp com pulso sutil e tooltip. */
export function WhatsAppButton() {
  const [hint, setHint] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)

  // Mostra o tooltip uma vez, alguns segundos depois de a página abrir.
  React.useEffect(() => {
    const show = window.setTimeout(() => setHint(true), 4500)
    const hide = window.setTimeout(() => setHint(false), 10500)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [])

  const tooltipVisible = hint || hovered

  return (
    <motion.aside
      aria-label="Atendimento pelo WhatsApp"
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.8, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed right-4 bottom-4 z-30 flex items-center gap-3 sm:right-6 sm:bottom-6"
    >
      <AnimatePresence>
        {tooltipVisible ? (
          <motion.span
            id="whatsapp-tooltip"
            role="tooltip"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="hidden rounded-full border border-gold-500/40 bg-cream-50 px-4 py-2 text-sm font-medium whitespace-nowrap text-forest-800 shadow-lg sm:block"
          >
            Fale com a nossa florista 🌿
          </motion.span>
        ) : null}
      </AnimatePresence>
      <a
        href={whatsappLink(contact.whatsapp, contact.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar no WhatsApp"
        aria-describedby={tooltipVisible ? "whatsapp-tooltip" : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="relative grid size-14 place-items-center rounded-full bg-[#1e9e55] text-white shadow-[0_12px_30px_-8px_rgb(30_158_85/0.7)] transition-transform duration-300 hover:scale-110 focus-visible:outline-gold-500 sm:size-16"
      >
        <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-[#1e9e55]" />
        <WhatsAppIcon className="relative size-7 sm:size-8" />
      </a>
    </motion.aside>
  )
}
