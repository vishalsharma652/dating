"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const cardMotion = {
  hidden: { opacity: 0, y: 12, scale: 0.995 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const Card = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof motion.div>>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={cardMotion}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/90 shadow-xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
);
Card.displayName = "Card";

export { Card };
