"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Clock3, Menu, ShoppingBag } from "lucide-react"

import { contact, navLinks } from "@/lib/data"
import { cn, whatsappLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { WhatsAppIcon } from "@/components/icons"
import { useShop } from "@/components/shop-provider"

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])
  return scrolled
}

/** Destaca no menu a seção visível no momento. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = React.useState(ids[0])
  React.useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [ids])
  return active
}

const sectionIds = navLinks.map((link) => link.href.slice(1))

export function Header() {
  const scrolled = useScrolled()
  const active = useActiveSection(sectionIds)
  const { count, setCartOpen } = useShop()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const light = !scrolled

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-soft",
        scrolled
          ? "border-b border-gold-500/20 bg-cream-100/85 py-2.5 shadow-[0_10px_30px_-20px_rgb(31_58_46/0.45)] backdrop-blur-lg"
          : "border-b border-transparent bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#inicio" aria-label="Jardim Aurora — voltar ao início" className="rounded-md">
          <Logo tone={light ? "light" : "dark"} />
        </a>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = active === link.href.slice(1)
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-300",
                      light ? "text-cream-100/85 hover:text-cream-50" : "text-forest-800/75 hover:text-forest-800",
                      isActive && (light ? "text-cream-50" : "text-forest-800")
                    )}
                  >
                    {link.label}
                    {isActive ? (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-x-4 -bottom-0.5 h-px bg-gold-500"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={count > 0 ? `Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}` : "Abrir sacola"}
            className={cn(
              "relative grid size-11 place-items-center rounded-full transition-colors duration-300",
              light ? "text-cream-100 hover:bg-cream-100/10" : "text-forest-800 hover:bg-forest-800/5"
            )}
          >
            <ShoppingBag className="size-[22px]" strokeWidth={1.6} />
            <AnimatePresence>
              {count > 0 ? (
                <motion.span
                  key={count}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: [1.35, 1], opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-1 right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-forest-900 tabular-nums"
                >
                  {count}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>

          <Button asChild variant="gold" className="hidden sm:inline-flex">
            <a href="#buques">Encomendar agora</a>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className={cn(
                  "grid size-11 place-items-center rounded-full transition-colors lg:hidden",
                  light ? "text-cream-100 hover:bg-cream-100/10" : "text-forest-800 hover:bg-forest-800/5"
                )}
              >
                <Menu className="size-6" strokeWidth={1.6} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-forest-800 text-cream-100 [&>button]:text-cream-100 [&>button:hover]:bg-cream-100/10">
              <div className="flex h-full flex-col gap-10 overflow-y-auto p-8 pt-7">
                <div>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navegue pelas seções do site</SheetDescription>
                  <Logo tone="light" />
                </div>
                <nav aria-label="Menu mobile">
                  <ul className="flex flex-col gap-1">
                    {navLinks.map((link, i) => (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <SheetClose asChild>
                          <a
                            href={link.href}
                            className="group flex items-baseline gap-4 rounded-md py-2.5 font-serif text-3xl text-cream-100 transition-colors hover:text-gold-400"
                          >
                            <span className="font-sans text-xs tracking-widest text-gold-400">0{i + 1}</span>
                            {link.label}
                          </a>
                        </SheetClose>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-auto flex flex-col gap-4 border-t border-cream-100/15 pt-8">
                  <SheetClose asChild>
                    <Button asChild variant="gold" size="lg">
                      <a href="#buques">Encomendar agora</a>
                    </Button>
                  </SheetClose>
                  <Button asChild variant="outline-cream" size="lg">
                    <a href={whatsappLink(contact.whatsapp, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="size-5" />
                      {contact.whatsappDisplay}
                    </a>
                  </Button>
                  <p className="flex items-center gap-2 text-sm text-cream-100/70">
                    <Clock3 className="size-4 text-gold-400" />
                    {contact.hours[0].days}, {contact.hours[0].time}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
