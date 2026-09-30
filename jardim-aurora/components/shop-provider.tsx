"use client"

import * as React from "react"
import { toast } from "sonner"

import type { Bouquet, BouquetFilter } from "@/lib/data"

export type CartItem = { bouquet: Bouquet; quantity: number }

type ShopContextValue = {
  items: CartItem[]
  count: number
  total: number
  add: (bouquet: Bouquet) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  filter: BouquetFilter
  setFilter: (filter: BouquetFilter) => void
}

const ShopContext = React.createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = React.useState(false)
  const [filter, setFilter] = React.useState<BouquetFilter>("todos")

  const add = React.useCallback((bouquet: Bouquet) => {
    setItems((current) => {
      const existing = current.find((item) => item.bouquet.id === bouquet.id)
      if (existing) {
        return current.map((item) =>
          item.bouquet.id === bouquet.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...current, { bouquet, quantity: 1 }]
    })
    toast(`${bouquet.name} está na sua sacola`, {
      description: "Finalize o pedido pelo WhatsApp quando quiser.",
      action: { label: "Ver sacola", onClick: () => setCartOpen(true) },
    })
  }, [])

  const setQuantity = React.useCallback((id: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.bouquet.id !== id)
        : current.map((item) => (item.bouquet.id === id ? { ...item, quantity } : item))
    )
  }, [])

  const remove = React.useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.bouquet.id !== id))
  }, [])

  const value = React.useMemo<ShopContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const total = items.reduce((sum, item) => sum + item.quantity * item.bouquet.price, 0)
    return { items, count, total, add, setQuantity, remove, cartOpen, setCartOpen, filter, setFilter }
  }, [items, add, setQuantity, remove, cartOpen, filter])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = React.useContext(ShopContext)
  if (!context) throw new Error("useShop precisa estar dentro de <ShopProvider>")
  return context
}
