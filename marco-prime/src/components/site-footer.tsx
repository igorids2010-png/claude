import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/logo";
import { navigation, site, socials } from "@/lib/site";

const services = [
  { label: "Escritórios corporativos", href: "#imoveis" },
  { label: "Salas comerciais", href: "#imoveis" },
  { label: "Galpões logísticos", href: "#imoveis" },
  { label: "Prédios monousuário", href: "#imoveis" },
];

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-7 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Boutique de consultoria imobiliária corporativa. Curadoria,
              negociação e assessoria jurídica para empresas que tratam o
              endereço como ativo estratégico.
            </p>
          </div>

          <nav aria-labelledby="footer-mapa">
            <h2
              id="footer-mapa"
              className="text-[0.6875rem] uppercase tracking-[0.22em] text-gold"
            >
              Mapa do site
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-gold"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-servicos">
            <h2
              id="footer-servicos"
              className="text-[0.6875rem] uppercase tracking-[0.22em] text-gold"
            >
              Segmentos
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {services.map((service) => (
                <li key={service.label}>
                  <a
                    href={service.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-gold"
                  >
                    {service.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.6875rem] uppercase tracking-[0.22em] text-gold">
              Contato
            </h2>
            <ul className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-gold/70"
                />
                <address className="not-italic leading-relaxed">
                  {site.address.street}
                  <br />
                  {site.address.district} — {site.address.city}/
                  {site.address.state}
                  <br />
                  CEP {site.address.zip}
                </address>
              </li>
              <li>
                <a
                  href={site.phoneHref}
                  className="flex items-center gap-3 transition-colors hover:text-gold"
                >
                  <Phone aria-hidden="true" className="size-4 shrink-0 text-gold/70" />
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={site.emailHref}
                  className="flex items-center gap-3 transition-colors hover:text-gold"
                >
                  <Mail aria-hidden="true" className="size-4 shrink-0 text-gold/70" />
                  {site.email}
                </a>
              </li>
            </ul>

            <ul className="mt-7 flex flex-wrap gap-5">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-gold"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hairline mt-16" />

        <div className="mt-8 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.fullName}. Todos os direitos
            reservados. {site.creci}
          </p>
          <p>
            Empresa fictícia criada para fins de demonstração. Imagens
            ilustrativas.
          </p>
        </div>
      </div>
    </footer>
  );
}
