"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/components/ui/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  animated?: boolean;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const colorClasses = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};

export function ProgressBar({
  value,
  className,
  showPercentage = false,
  size = "md",
  color = "primary",
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1">
        <Progress
          value={clampedValue}
          className={cn(
            sizeClasses[size],
            "w-full",
            animated && "transition-all duration-300 ease-in-out"
          )}
        />
        {showPercentage && (
          <span className="text-xs text-muted-foreground ml-2 min-w-[3rem]">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    </div>
  );
}
