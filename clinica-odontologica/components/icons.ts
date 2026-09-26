import {
  Armchair,
  Award,
  CalendarCheck,
  Cpu,
  Gem,
  HeartHandshake,
  ScanLine,
  ShieldCheck,
  Smile,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Mapa de ícones usados nos dados mockados (data/site.ts). */
export const iconMap: Record<string, LucideIcon> = {
  smile: Smile,
  sparkles: Sparkles,
  gem: Gem,
  scan: ScanLine,
  cpu: Cpu,
  shield: ShieldCheck,
  armchair: Armchair,
  award: Award,
  heart: HeartHandshake,
  calendar: CalendarCheck,
};
