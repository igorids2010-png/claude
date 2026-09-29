/**
 * Porta de aço que sobe ao carregar a página e revela o salão.
 * A animação é só CSS (roda antes da hidratação) e some com prefers-reduced-motion.
 */
export function Shutter() {
  return (
    <div
      aria-hidden
      className="steel-slats pointer-events-none absolute inset-0 z-20 animate-shutter-up shadow-[0_30px_60px_rgba(0,0,0,0.8)] motion-reduce:hidden"
    >
      {/* Nome pintado na porta */}
      <div className="absolute inset-0 grid place-items-center px-5">
        <div className="text-center">
          <p className="font-display text-[19vw] leading-[0.85] font-bold uppercase tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.28)] sm:text-[13vw]">
            Black Steel
          </p>
          <p className="mt-4 text-[0.65rem] uppercase tracking-[0.6em] text-white/40 sm:text-xs">Barbershop · Desde 2017</p>
        </div>
      </div>

      {/* Barra inferior com o puxador */}
      <div className="absolute inset-x-0 bottom-0 h-6 border-t border-white/25 bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900" />
      <div className="absolute bottom-2 left-1/2 h-2 w-28 -translate-x-1/2 rounded-full bg-neutral-300/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]" />
    </div>
  )
}
