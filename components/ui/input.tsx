import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-[1.75rem] border border-zinc-200/80 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm transition duration-200 placeholder:text-zinc-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-pink-400 dark:focus:ring-pink-500/20",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
