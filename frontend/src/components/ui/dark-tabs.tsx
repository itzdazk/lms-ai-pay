"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { cn } from "./utils";

interface DarkTabsListProps extends React.ComponentProps<typeof TabsList> {
  variant?: "default" | "blue";
}

export function DarkTabsList({ 
  className, 
  variant = "default",
  ...props 
}: DarkTabsListProps) {
  return (
    <TabsList
      className={cn(
        "w-full justify-start bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-1",
        className
      )}
      {...props}
    />
  );
}

interface DarkTabsTriggerProps extends React.ComponentProps<typeof TabsTrigger> {
  variant?: "default" | "blue";
}

export function DarkTabsTrigger({ 
  className, 
  variant = "default",
  ...props 
}: DarkTabsTriggerProps) {
  return (
    <TabsTrigger
      className={cn(
        "!text-white rounded-lg px-4 py-2",
        variant === "blue"
          ? "data-[state=active]:!bg-blue-500 data-[state=active]:!text-white"
          : "data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black",
        className
      )}
      {...props}
    />
  );
}

