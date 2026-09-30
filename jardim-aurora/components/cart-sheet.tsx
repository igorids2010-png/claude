"use client"

import Image from "next/image"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"

import { contact } from "@/lib/data"
import { formatPrice, whatsappLink } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LogoMark } from "@/components/botanical-ornaments"
import { WhatsAppIcon } from "@/components/icons"
import { useShop } from "@/components/shop-provider"

export function CartSheet() {
  const { items, total, count, setQuantity, remove, cartOpen, setCartOpen } = useShop()

  const orderMessage = [
    "Olá, Jardim Aurora! Gostaria de encomendar:",
    ...items.map((item) => `• ${item.quantity}x ${item.bouquet.name} (${formatPrice(item.bouquet.price)})`),
    `Total: ${formatPrice(total)}`,
  ].join("\n")

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader className="border-b border-border/70 pb-5">
          <SheetTitle>Sua sacola</SheetTitle>
          <SheetDescription>
            {count > 0
              ? `${count} ${count === 1 ? "item" : "itens"} · entrega no mesmo dia para pedidos até 16h`
              : "Escolha um buquê para começar."}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="grid size-20 place-items-center rounded-full border border-dashed border-gold-500/60 text-gold-600">
              <LogoMark className="size-10" />
            </div>
            <p className="font-serif text-2xl text-forest-800">Sua sacola ainda está vazia</p>
            <SheetClose asChild>
              <Button asChild variant="gold">
                <a href="#buques">Ver buquês</a>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border/70 overflow-y-auto px-6">
              {items.map(({ bouquet, quantity }) => (
                <li key={bouquet.id} className="flex gap-4 py-5">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                    <Image
                      src={bouquet.image.src}
                      alt={bouquet.image.alt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-lg leading-tight text-forest-800">{bouquet.name}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(bouquet.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(bouquet.id)}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-forest-800/5 hover:text-destructive"
                        aria-label={`Remover ${bouquet.name} da sacola`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 self-start rounded-full border border-border bg-cream-100 p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(bouquet.id, quantity - 1)}
                        className="grid size-7 place-items-center rounded-full text-forest-800 transition-colors hover:bg-cream-200"
                        aria-label={`Diminuir quantidade de ${bouquet.name}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(bouquet.id, quantity + 1)}
                        className="grid size-7 place-items-center rounded-full text-forest-800 transition-colors hover:bg-cream-200"
                        aria-label={`Aumentar quantidade de ${bouquet.name}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <SheetFooter className="border-t border-border/70 bg-cream-100/60">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-serif text-2xl text-forest-800">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Frete e cartão personalizado combinados no atendimento.
              </p>
              <Button asChild variant="gold" size="lg" className="mt-2 w-full">
                <a href={whatsappLink(contact.whatsapp, orderMessage)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-5" />
                  Finalizar pelo WhatsApp
                </a>
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" className="w-full">
                  <ShoppingBag />
                  Continuar escolhendo
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
