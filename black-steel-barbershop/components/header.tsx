"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Menu } from "lucide-react"

import { navLinks, whatsappUrl } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "./logo"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      // entra logo depois que a porta de aço do hero sobe
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 1.2 }}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled ? "border-line bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-5 transition-[height] duration-500 sm:px-8",
          scrolled ? "h-16" : "h-20",
        )}
      >
        <Logo />

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-10">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative py-2 text-xs font-medium uppercase tracking-[0.25em] text-neutral-300 transition-colors hover:text-white"
                >
                  {link.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Agendar horário
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-6!" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="text-xs tracking-[0.35em] text-muted uppercase">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navegação principal do site</SheetDescription>
              <nav aria-label="Menu móvel" className="mt-10">
                <ul className="flex flex-col">
                  {navLinks.map((link, i) => (
                    <li key={link.href} className="border-b border-line">
                      <SheetClose asChild>
                        <a
                          href={link.href}
                          className="flex items-baseline gap-4 py-5 font-display text-3xl font-bold uppercase tracking-wide transition-colors hover:text-neutral-400"
                        >
                          <span className="text-xs text-subtle tabular-nums">0{i + 1}</span>
                          {link.label}
                        </a>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <Button asChild className="mt-auto w-full">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  Agendar horário
                </a>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
