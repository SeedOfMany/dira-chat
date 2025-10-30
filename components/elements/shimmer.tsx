"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ShimmerProps = ComponentProps<"span"> & {
  duration?: number;
  children: React.ReactNode;
};

export const Shimmer = ({
  className,
  duration = 1,
  children,
  ...props
}: ShimmerProps) => {
  return (
    <span
      className={cn("inline-block animate-pulse", className)}
      style={{
        animationDuration: `${duration}s`,
      }}
      {...props}
    >
      {children}
    </span>
  );
};

Shimmer.displayName = "Shimmer";
