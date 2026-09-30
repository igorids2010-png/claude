"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-gold-500/40 !bg-forest-800 !text-cream-100 !shadow-2xl !font-sans",
          description: "!text-cream-100/75",
          actionButton: "!rounded-full !bg-gold-500 !px-3 !text-forest-900 !font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
