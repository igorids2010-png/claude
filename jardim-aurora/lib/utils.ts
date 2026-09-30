import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function formatPrice(value: number) {
  return brl.format(value)
}

/** Link de WhatsApp com mensagem pré-preenchida. */
export function whatsappLink(phone: string, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${phone}${text}`
}
