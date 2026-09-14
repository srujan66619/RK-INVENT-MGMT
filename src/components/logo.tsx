import { cn } from "@/lib/utils";
import React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function Logo({ className, alt = "RK Repair Labs", ...props }: LogoProps) {
  return (
    <img
      src="/assets/rk-repair-labs-logo.png"
      alt={alt}
      className={cn("object-contain", className)}
      {...props}
    />
  );
}
