import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "Avatar", fallback = "JD", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-500 text-sm font-semibold text-white shadow-lg shadow-pink-500/20",
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="select-none">{fallback}</span>
      )}
    </div>
  )
);
Avatar.displayName = "Avatar";

export { Avatar };
