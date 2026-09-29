"use client"

import { motion } from "framer-motion"

import { whatsappUrl } from "@/lib/data"
import { WhatsAppIcon } from "./brand-icons"

export function WhatsAppButton() {
  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book on WhatsApp (opens in a new tab)"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 2.6, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="group fixed right-5 bottom-5 z-50 flex items-center gap-3 sm:right-8 sm:bottom-8"
    >
      <span className="pointer-events-none hidden translate-x-2 bg-white px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-black opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Book now
      </span>
      <span className="relative grid size-14 place-items-center rounded-full bg-white text-black shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)]">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2.5s]" />
        <WhatsAppIcon className="relative size-7" />
      </span>
    </motion.a>
  )
}
