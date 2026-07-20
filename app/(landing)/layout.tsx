import type { ReactNode } from "react";
import LenisProvider from "./LenisProvider";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <LenisProvider>{children}</LenisProvider>;
}
