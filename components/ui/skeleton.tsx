import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const skeletonSizes = {
  sm: "h-4",
  md: "h-6",
  lg: "h-8",
};

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "animate-pulse rounded-[1.5rem] bg-zinc-200/80 shadow-inner dark:bg-zinc-800/80",
        skeletonSizes[size],
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
