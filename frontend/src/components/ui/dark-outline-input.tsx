import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

type InputProps = React.ComponentProps<typeof Input>;

/**
 * DarkOutlineInput - Input component với style dark theme chuẩn
 * Sử dụng cho các Input trong dark theme với border và text màu trắng
 * Style: border-[#2D2D2D] !text-white (tương tự DarkOutlineButton)
 * Tự động thay đổi style dựa trên dark/light mode
 */
export const DarkOutlineInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type={type}
        className={cn(
          "!cursor-pointer border-gray-300 !text-black !bg-white placeholder:text-gray-500 focus:border-gray-400 focus:ring-gray-400",
          "dark:border-[#2D2D2D] dark:!text-white dark:!bg-black dark:placeholder:text-gray-400 dark:focus:border-[#2D2D2D] dark:focus:ring-[#2D2D2D]",
          // Date input specific styling for calendar icon visibility
          type === "date" && "date-input-calendar-icon",
          className
        )}
        {...props}
      />
    );
  }
);
DarkOutlineInput.displayName = "DarkOutlineInput";


