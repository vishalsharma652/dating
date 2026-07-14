"use client";

import { type PropsWithChildren, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader } from "@/components/ui/loader";

export function Providers({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider>
      {!mounted && <Loader fullscreen text="Initializing premium experience..." />}
      {children}
    </ThemeProvider>
  );
}
