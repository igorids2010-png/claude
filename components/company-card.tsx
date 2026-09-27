"use client"

import type { Empresa, Fonte } from "@/lib/types"
import { linkWhatsApp, textoEmpresa } from "@/lib/format"

type Props = {
  empresa: Empresa
  fonte: Fonte
  nicho: string
  index: number
  onCopy: (texto: string, aviso: string) => void
}

function nomeRede(url: string) {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Rede social"
  }
  if (host.includes("instagram")) return "Instagram"
  if (host.includes("facebook") || host === "fb.com") return "Facebook"
  if (host.includes("wa.me") || host.includes("whatsapp")) return "WhatsApp"
  if (host.includes("ifood")) return "iFood"
  if (host.includes("tiktok")) return "TikTok"
  return host
}

export function CompanyCard({ empresa, fonte, nicho, index, onCopy }: Props) {
  const whatsapp = linkWhatsApp(empresa.telefone)

  return (
    <article
      className="animate-rise flex flex-col gap-4 rounded-3xl border border-line bg-panel p-5 transition hover:border-line/100 hover:bg-panel/90"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-balance">{empresa.nome}</h3>
        <span className="shrink-0 rounded-full border border-signal/40 bg-signal/10 px-2.5 py-1 font-mono text-[0.65rem] font-semibold tracking-wider text-signal">
          {empresa.redeSocial ? "SÓ REDE SOCIAL" : "SEM SITE"}
        </span>
      </header>

      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-3">
          <dt className="sr-only">Telefone</dt>
          <span aria-hidden className="mt-0.5 text-dim">
            <PhoneIcon />
          </span>
          <dd className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
            {empresa.telefone ? (
              <>
                <span className="font-mono text-[0.95rem] font-medium tabular-nums text-fg">{empresa.telefone}</span>
                <button
                  type="button"
                  onClick={() => onCopy(empresa.telefone!, "Telefone copiado!")}
                  className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.68rem] text-muted transition hover:border-signal/50 hover:text-fg"
                >
                  copiar
                </button>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-ok/40 bg-ok/10 px-2 py-0.5 font-mono text-[0.68rem] font-medium text-ok transition hover:bg-ok/20"
                  >
                    WhatsApp ↗
                  </a>
                )}
              </>
            ) : (
              <span className="text-dim">Telefone não informado</span>
            )}
          </dd>
        </div>

        <div className="flex items-start gap-3">
          <dt className="sr-only">Endereço</dt>
          <span aria-hidden className="mt-0.5 text-dim">
            <PinIcon />
          </span>
          <dd className="leading-relaxed text-muted">{empresa.endereco || "Endereço não informado"}</dd>
        </div>

        {(fonte === "google" || empresa.redeSocial) && (
          <div className="flex items-center gap-3">
            <dt className="sr-only">{fonte === "google" ? "Avaliação" : "Rede social"}</dt>
            <span aria-hidden className="text-dim">
              {fonte === "google" ? <StarIcon /> : <LinkIcon />}
            </span>
            <dd className="font-mono text-xs text-muted">
              {fonte === "google" &&
                (empresa.avaliacao != null ? (
                  <>
                    <span className="font-semibold text-star">{empresa.avaliacao.toFixed(1).replace(".", ",")}</span> ·{" "}
                    {empresa.totalAvaliacoes ?? 0} avaliações
                  </>
                ) : (
                  "Sem avaliações"
                ))}
              {fonte === "google" && empresa.redeSocial && " · "}
              {empresa.redeSocial && (
                <a
                  href={empresa.redeSocial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-signal-soft underline-offset-2 hover:underline"
                >
                  {nomeRede(empresa.redeSocial)}
                </a>
              )}
            </dd>
          </div>
        )}
      </dl>

      <footer className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => onCopy(textoEmpresa(empresa, nicho), "Dados copiados!")}
          className="flex-1 rounded-xl bg-signal px-4 py-2.5 text-sm font-bold text-[#1a0d05] transition hover:brightness-110"
        >
          Copiar dados
        </button>
        {empresa.linkMaps && (
          <a
            href={empresa.linkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-center text-sm font-semibold text-fg transition hover:border-signal/50"
          >
            {fonte === "google" ? "Ver no Google Maps ↗" : "Conferir no Google Maps ↗"}
          </a>
        )}
      </footer>
    </article>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z" />
    </svg>
  )
}
