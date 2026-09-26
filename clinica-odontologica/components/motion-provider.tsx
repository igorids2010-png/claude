"use client";

import { MotionConfig } from "framer-motion";

/** Respeita a preferência do usuário por menos movimento. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
