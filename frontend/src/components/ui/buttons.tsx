import * as React from "react";
import { Button } from "./button";
import { cn } from "./utils";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * DarkOutlineButton - Button component với style dark theme chuẩn
 * Sử dụng cho các button trong dark theme với border và text màu trắng
 * Style: border-[#2D2D2D] !text-white hover:bg-white/10
 */
export const DarkOutlineButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "!cursor-pointer border-gray-300 !text-black !bg-white hover:!bg-gray-400",
          "dark:border-[#2D2D2D] dark:!text-white dark:hover:!bg-gray-800 dark:!bg-black",
          className
        )}
        {...props}
      />
    );
  }
);
DarkOutlineButton.displayName = "DarkOutlineButton";

