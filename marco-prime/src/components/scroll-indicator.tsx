/** Indicador de rolagem discreto, ancorado ao rodapé do hero. */
export function ScrollIndicator() {
  return (
    <a
      href="#numeros"
      aria-label="Rolar para o conteúdo"
      className="group absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 xl:[@media(min-height:960px)]:flex"
    >
      <span className="text-[0.5625rem] uppercase tracking-[0.3em] text-muted-foreground transition-colors group-hover:text-gold">
        Role
      </span>
      <span
        aria-hidden="true"
        className="relative block h-10 w-px overflow-hidden bg-border"
      >
        <span className="absolute inset-x-0 top-0 block h-4 bg-gold motion-safe:animate-[scroll-hint_2s_ease-in-out_infinite]" />
      </span>
    </a>
  );
}
