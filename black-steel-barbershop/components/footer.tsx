import { Clock, Mail, MapPin, Phone } from "lucide-react"

import { navLinks, site } from "@/lib/data"
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./brand-icons"
import { Logo } from "./logo"

const socials = [
  { label: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
  { label: "TikTok", href: site.social.tiktok, Icon: TikTokIcon },
]

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em]">{children}</h2>
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="contact" aria-labelledby="contact-title" className="border-t border-line bg-background">
      <h2 id="contact-title" className="sr-only">
        Contact
      </h2>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:grid-cols-2 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">{site.tagline} Haircuts, shaves and men's grooming in the heart of São Paulo.</p>
          <ul className="mt-8 flex gap-3">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  className="grid size-11 place-items-center border border-line-strong text-neutral-300 transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <ColumnTitle>Quick links</ColumnTitle>
          <ul className="mt-6 space-y-3 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-muted transition-colors hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <ColumnTitle>Contact</ColumnTitle>
          <address className="mt-6 space-y-4 text-sm not-italic text-muted">
            <p className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-white" />
              <span>
                {site.address.street} · {site.address.district}
                <br />
                {site.address.city} · {site.address.zip}
              </span>
            </p>
            <p>
              <a href={`tel:+${site.whatsapp}`} className="flex gap-3 transition-colors hover:text-white">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-white" />
                {site.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${site.email}`} className="flex gap-3 transition-colors hover:text-white">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-white" />
                {site.email}
              </a>
            </p>
          </address>
        </div>

        <div className="lg:col-span-3">
          <ColumnTitle>Hours</ColumnTitle>
          <ul className="mt-6 space-y-3 text-sm">
            {site.hours.map((h) => (
              <li key={h.days} className="flex items-baseline justify-between gap-4 border-b border-line pb-3 text-muted">
                <span className="flex items-center gap-3">
                  <Clock aria-hidden className="size-4 text-white" />
                  {h.days}
                </span>
                <span className={h.time === "Closed" ? "text-subtle" : "text-white"}>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {year} {site.fullName}. All rights reserved.
          </p>
          <a href="#home" className="uppercase tracking-[0.25em] transition-colors hover:text-white">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
