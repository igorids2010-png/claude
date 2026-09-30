import { Clock3, Mail, MapPin, Phone, Truck } from "lucide-react"

import { contact, navLinks } from "@/lib/data"
import { whatsappLink } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/icons"

const socials = [
  { label: "Instagram", href: contact.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: contact.social.facebook, Icon: FacebookIcon },
  { label: "WhatsApp", href: whatsappLink(contact.whatsapp, contact.whatsappMessage), Icon: WhatsAppIcon },
]

const extraLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Depoimentos", href: "#depoimentos" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-forest-900 text-cream-100">
      <div className="mx-auto max-w-7xl px-5 pt-20 pb-10 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-6">
            <Logo tone="light" />
            <p className="max-w-xs leading-relaxed text-cream-100/70">
              Buquês e arranjos montados à mão todos os dias, com flores frescas de produtores locais e entrega no mesmo
              dia.
            </p>
            <ul className="flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} do Jardim Aurora`}
                    className="grid size-11 place-items-center rounded-full border border-gold-500/40 text-gold-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-400 hover:bg-gold-500 hover:text-forest-900"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Links rápidos">
            <h2 className="text-xl text-gold-400">Links rápidos</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {[...navLinks, ...extraLinks].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-cream-100/75 transition-colors duration-300 hover:text-gold-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xl text-gold-400">Horário</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {contact.hours.map((h) => (
                <li key={h.days} className="flex items-start gap-3 text-cream-100/75">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden="true" />
                  <span>
                    <span className="block text-cream-100">{h.days}</span>
                    {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl text-gold-400">Contato</h2>
            <address className="mt-5 flex flex-col gap-4 not-italic text-cream-100/75">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden="true" />
                <span>
                  {contact.address}
                  <br />
                  {contact.city}
                </span>
              </p>
              <a href={contact.phoneHref} className="flex items-center gap-3 transition-colors hover:text-gold-300">
                <Phone className="size-4 shrink-0 text-gold-500" aria-hidden="true" />
                {contact.phone}
              </a>
              <a
                href={whatsappLink(contact.whatsapp, contact.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-colors hover:text-gold-300"
              >
                <WhatsAppIcon className="size-4 shrink-0 text-gold-500" />
                {contact.whatsappDisplay}
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 transition-colors hover:text-gold-300">
                <Mail className="size-4 shrink-0 text-gold-500" aria-hidden="true" />
                {contact.email}
              </a>
              <p className="flex items-start gap-3">
                <Truck className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden="true" />
                <span>
                  <span className="block text-cream-100">Área de entrega</span>
                  {contact.deliveryArea}
                </span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream-100/10 pt-8 text-sm text-cream-100/55 sm:flex-row">
          <p>© {year} Jardim Aurora Floricultura. Todos os direitos reservados.</p>
          <p>Feito com flores frescas e muito carinho.</p>
        </div>
      </div>
    </footer>
  )
}
