"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 hover:shadow-xl hover:brightness-110 focus-visible:ring-pink-400/60",
        secondary:
          "bg-white text-zinc-950 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900",
        ghost:
          "bg-transparent text-zinc-950 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900",
        outline:
          "border border-zinc-200 text-zinc-950 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400/60",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-10 px-4 text-sm",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
