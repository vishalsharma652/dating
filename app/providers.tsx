import { type PropsWithChildren } from "react";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
