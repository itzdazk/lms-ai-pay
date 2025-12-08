import * as React from "react";
import { SelectTrigger, SelectContent, SelectItem } from "./select";
import { cn } from "./utils";

type SelectTriggerProps = React.ComponentProps<typeof SelectTrigger>;
type SelectContentProps = React.ComponentProps<typeof SelectContent>;
type SelectItemProps = React.ComponentProps<typeof SelectItem>;

/**
 * DarkOutlineSelectTrigger - SelectTrigger component với style dark theme chuẩn
 * Sử dụng cho các SelectTrigger trong dark theme với border và text màu trắng
 * Style: border-[#2D2D2D] !text-white hover:bg-white/10 (tương tự DarkOutlineButton)
 * Tự động thay đổi style dựa trên dark/light mode
 */
export const DarkOutlineSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  SelectTriggerProps
>(({ className, ...props }, ref) => {
  return (
    <SelectTrigger
      ref={ref}
      className={cn(
        "!cursor-pointer border-gray-300 !text-black !bg-white hover:!bg-gray-400",
        "dark:border-[#2D2D2D] dark:!text-white dark:hover:!bg-gray-800 dark:!bg-black",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineSelectTrigger.displayName = "DarkOutlineSelectTrigger";

/**
 * DarkOutlineSelectContent - SelectContent component với style dark theme chuẩn
 * Sử dụng cho các SelectContent trong dark theme
 * Light mode: nền trắng, chữ đen
 * Dark mode: nền đen, chữ trắng
 * Tự động thay đổi style dựa trên dark/light mode
 */
export const DarkOutlineSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  SelectContentProps
>(({ className, ...props }, ref) => {
  return (
    <SelectContent
      ref={ref}
      className={cn(
        "!bg-white !text-black border-gray-300",
        "dark:!bg-[#1A1A1A] dark:!text-white dark:border-[#2D2D2D]",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineSelectContent.displayName = "DarkOutlineSelectContent";

/**
 * DarkOutlineSelectItem - SelectItem component với style dark theme chuẩn
 * Sử dụng cho các SelectItem trong dark theme
 * Light mode: chữ đen, hover nền xám nhạt
 * Dark mode: chữ trắng, hover nền xám đậm
 * Tự động thay đổi style dựa trên dark/light mode
 */
export const DarkOutlineSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  SelectItemProps
>(({ className, ...props }, ref) => {
  return (
    <SelectItem
      ref={ref}
      className={cn(
        "!text-black focus:!bg-gray-100 focus:!text-black",
        "dark:!text-white dark:focus:!bg-[#2D2D2D] dark:focus:!text-white",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineSelectItem.displayName = "DarkOutlineSelectItem";

