import { ArrowUp, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { SocialIcon } from "@/components/social-icon";
import { clinic, navLinks, socials, treatments } from "@/data/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8">
        <div className="grid gap-12 border-b border-white/10 pb-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/50">
              {clinic.tagline}. Tecnologia, especialistas e acolhimento para transformar o seu sorriso.
            </p>
            <div className="mt-8 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid size-11 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-turquoise-400 hover:bg-turquoise-500 hover:text-white"
                >
                  <SocialIcon name={s.icon} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turquoise-300">Navegação</p>
            <ul className="mt-6 space-y-3 text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/60 transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turquoise-300">Tratamentos</p>
            <ul className="mt-6 space-y-3 text-sm">
              {treatments.map((t) => (
                <li key={t.slug}>
                  <a href="#tratamentos" className="text-white/60 transition-colors hover:text-white">
                    {t.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-turquoise-300">Contato</p>
            <ul className="mt-6 space-y-4 text-sm text-white/60">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-turquoise-400" />
                <span>
                  {clinic.address}
                  <br />
                  {clinic.city}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-turquoise-400" />
                <span>
                  {clinic.phone} · WhatsApp {clinic.whatsapp}
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-turquoise-400" />
                <span>{clinic.email}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-turquoise-400" />
                <span>
                  {clinic.hours.map((h) => (
                    <span key={h.days} className="block">
                      {h.days}: {h.time}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Assinatura gigante */}
        <p
          aria-hidden
          className="pointer-events-none select-none bg-gradient-to-b from-white/15 to-transparent bg-clip-text py-6 text-center font-serif text-[22vw] font-medium leading-none text-transparent lg:text-[16rem]"
        >
          {clinic.name}
        </p>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-xs text-white/40 md:flex-row">
          <p>
            © {new Date().getFullYear()} [Nome da Clínica]. Todos os direitos reservados. · {clinic.legalId}
          </p>
          <p>{clinic.technicalManager}</p>
          <a href="#inicio" className="flex items-center gap-2 text-white/60 transition-colors hover:text-turquoise-300">
            Voltar ao topo <ArrowUp className="size-3.5" />
          </a>
        </div>
        <p className="pb-8 text-center text-[11px] text-white/30">
          Site demonstrativo de portfólio — clínica, profissionais e depoimentos fictícios.
        </p>
      </div>
    </footer>
  );
}
