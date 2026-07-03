import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-950 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700",
        pink: "bg-pink-500/10 text-pink-600 ring-pink-200 dark:text-pink-300",
        purple: "bg-violet-500/10 text-violet-700 ring-violet-200 dark:text-violet-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = "Badge";

export { Badge };
