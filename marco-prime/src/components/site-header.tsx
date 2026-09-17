"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/site";

/** Header fixo e transparente que ganha fundo sólido após o scroll. */
export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava o scroll do corpo enquanto o menu mobile estiver aberto.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || open
          ? "border-b border-border bg-background/92 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <a
          href="#inicio"
          className="shrink-0"
          aria-label="Marco Prime Imóveis — ir para o início"
        >
          <Logo />
        </a>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="group relative text-[0.8125rem] uppercase tracking-[0.16em] text-foreground/75 transition-colors hover:text-gold"
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden lg:block">
          <Button asChild size="sm">
            <a href="#contato">Fale com um consultor</a>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="-mr-2 flex size-11 items-center justify-center text-gold lg:hidden"
        >
          {open ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      <div
        id="menu-mobile"
        hidden={!open}
        className="border-t border-border bg-background lg:hidden"
      >
        <nav aria-label="Navegação principal (mobile)" className="px-6 py-6">
          <ul className="flex flex-col">
            {navigation.map((item) => (
              <li key={item.href} className="border-b border-border/60">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-sm uppercase tracking-[0.16em] text-foreground/85 transition-colors hover:text-gold"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-7 w-full">
            <a href="#contato" onClick={() => setOpen(false)}>
              Fale com um consultor
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
