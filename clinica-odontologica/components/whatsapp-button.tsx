"use client";

import { motion } from "framer-motion";
import { SocialIcon } from "@/components/social-icon";
import { clinic } from "@/data/site";

export function WhatsappButton() {
  return (
    <motion.a
      href={clinic.whatsappLink}
      aria-label="Fale conosco pelo WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2.5, type: "spring", stiffness: 200, damping: 15 }}
      className="group fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-full bg-turquoise-500 p-4 text-white shadow-[0_15px_40px_-10px_rgba(22,169,155,0.8)] transition-colors hover:bg-turquoise-600"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-turquoise-400 opacity-30" />
      <SocialIcon name="whatsapp" className="size-6" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-500 group-hover:max-w-40 sm:inline">
        Fale conosco
      </span>
    </motion.a>
  );
}
