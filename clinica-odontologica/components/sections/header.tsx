"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icon";
import { clinic, navLinks, socials } from "@/data/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#inicio");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Destaca o link da seção visível
  useEffect(() => {
    const sections = navLinks
      .map((l) => document.querySelector(l.href))
      .filter((el): el is Element => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const solid = scrolled && !open;

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          solid
            ? "border-b border-black/5 bg-white/80 py-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent py-5"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Logo tone={solid ? "dark" : "light"} />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                  solid ? "text-ink/70 hover:text-ink" : "text-white/75 hover:text-white",
                  active === link.href && (solid ? "text-ink" : "text-white")
                )}
              >
                {active === link.href && (
                  <motion.span
                    layoutId="nav-pill"
                    className={cn("absolute inset-0 rounded-full", solid ? "bg-turquoise-50" : "bg-white/10")}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild size="default" className="hidden sm:inline-flex">
              <a href="#contato">
                Agende sua avaliação
                <ArrowUpRight className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            </Button>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              className={cn(
                "grid size-11 place-items-center rounded-full transition-colors lg:hidden",
                solid ? "bg-ink text-white" : "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md"
              )}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <motion.div
          style={{ scaleX: progress }}
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-turquoise-300 via-turquoise-500 to-turquoise-700"
        />
      </motion.header>

      {/* Menu mobile em tela cheia */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="grain fixed inset-0 z-40 flex flex-col bg-ink px-6 pb-10 pt-28 lg:hidden"
          >
            <div className="pointer-events-none absolute -right-32 top-1/3 size-96 rounded-full bg-turquoise-500/20 blur-3xl" />
            <nav className="relative flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex items-baseline gap-4 border-b border-white/10 py-4 font-serif text-4xl text-white"
                >
                  <span className="font-sans text-xs text-turquoise-400">0{i + 1}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-2">{link.label}</span>
                </motion.a>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative mt-auto space-y-6"
            >
              <Button asChild size="lg" className="w-full">
                <a href="#contato" onClick={() => setOpen(false)}>
                  Agende sua avaliação <ArrowUpRight />
                </a>
              </Button>
              <div className="flex items-center justify-between text-white/60">
                <a href="#contato" className="flex items-center gap-2 text-sm">
                  <Phone className="size-4" /> {clinic.phone}
                </a>
                <div className="flex gap-3">
                  {socials.map((s) => (
                    <a key={s.label} href={s.href} aria-label={s.label} className="hover:text-turquoise-300">
                      <SocialIcon name={s.icon} className="size-5" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
