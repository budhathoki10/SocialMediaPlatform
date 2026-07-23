"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import RouteTransition from "@/components/motion/RouteTransition";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      {/* "user" makes every Motion primitive in the app (PressableButton,
          HoverCard, FieldFocus, ...) auto-disable transform/scale animation
          when the OS prefers-reduced-motion is set — one switch instead of
          checking it in each component. */}
      <MotionConfig reducedMotion="user">
        <RouteTransition>{children}</RouteTransition>
      </MotionConfig>
    </SessionProvider>
  );
}
