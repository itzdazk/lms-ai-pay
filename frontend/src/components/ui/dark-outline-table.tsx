import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";
import { cn } from "./utils";

type TableProps = React.ComponentProps<typeof Table>;
type TableHeaderProps = React.ComponentProps<typeof TableHeader>;
type TableBodyProps = React.ComponentProps<typeof TableBody>;
type TableFooterProps = React.ComponentProps<typeof TableFooter>;
type TableRowProps = React.ComponentProps<typeof TableRow>;
type TableHeadProps = React.ComponentProps<typeof TableHead>;
type TableCellProps = React.ComponentProps<typeof TableCell>;
type TableCaptionProps = React.ComponentProps<typeof TableCaption>;

/**
 * DarkOutlineTable - Table component với style dark theme chuẩn
 * Light mode: nền trắng, chữ đen
 * Dark mode: nền đen, chữ trắng
 * Tự động thay đổi style dựa trên dark/light mode
 */
export const DarkOutlineTable = React.forwardRef<
  React.ElementRef<typeof Table>,
  TableProps
>(({ className, ...props }, ref) => {
  return (
    <Table
      ref={ref}
      className={cn(
        "bg-white text-gray-900",
        "dark:bg-[#1A1A1A] dark:text-white",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTable.displayName = "DarkOutlineTable";

/**
 * DarkOutlineTableHeader - TableHeader component với style dark theme chuẩn
 * Light mode: border-gray-300
 * Dark mode: border-[#2D2D2D]
 */
export const DarkOutlineTableHeader = React.forwardRef<
  React.ElementRef<typeof TableHeader>,
  TableHeaderProps
>(({ className, ...props }, ref) => {
  return (
    <TableHeader
      ref={ref}
      className={cn(
        "border-gray-300 dark:border-[#2D2D2D]",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTableHeader.displayName = "DarkOutlineTableHeader";

/**
 * DarkOutlineTableBody - TableBody component với style dark theme chuẩn
 * Light mode: nền trắng
 * Dark mode: nền đen
 */
export const DarkOutlineTableBody = React.forwardRef<
  React.ElementRef<typeof TableBody>,
  TableBodyProps
>(({ className, ...props }, ref) => {
  return (
    <TableBody
      ref={ref}
      className={cn(
        "bg-white",
        "dark:bg-[#1A1A1A]",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTableBody.displayName = "DarkOutlineTableBody";

/**
 * DarkOutlineTableFooter - TableFooter component với style dark theme chuẩn
 */
export const DarkOutlineTableFooter = React.forwardRef<
  React.ElementRef<typeof TableFooter>,
  TableFooterProps
>(({ className, ...props }, ref) => {
  return (
    <TableFooter
      ref={ref}
      className={cn(
        "bg-gray-50 text-gray-900 border-gray-300",
        "dark:bg-[#1F1F1F] dark:text-white dark:border-[#2D2D2D]",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTableFooter.displayName = "DarkOutlineTableFooter";

/**
 * DarkOutlineTableRow - TableRow component với style dark theme chuẩn
 * Light mode: border-gray-300, hover:bg-blue-50
 * Dark mode: border-[#2D2D2D], hover:bg-blue-500/20
 * 
 * @param selected - Nếu true, hàng sẽ có background màu xanh để highlight
 * @param onRowToggle - Callback được gọi khi click vào hàng, nhận vào trạng thái selected hiện tại
 */
export const DarkOutlineTableRow = React.forwardRef<
  React.ElementRef<typeof TableRow>,
  TableRowProps & { 
    selected?: boolean;
    onRowToggle?: (isSelected: boolean, event: React.MouseEvent<HTMLTableRowElement>) => void;
  }
>(({ className, selected, onRowToggle, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Nếu có onRowToggle, gọi nó với trạng thái selected hiện tại
    if (onRowToggle) {
      onRowToggle(selected || false, e);
    }
    // Vẫn gọi onClick gốc nếu có
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <TableRow
      ref={ref}
      className={cn(
        "border-gray-300 hover:bg-blue-50 transition-colors",
        "dark:border-[#2D2D2D] dark:hover:bg-blue-500/20",
        selected && "bg-blue-500/40 dark:bg-blue-500/40 border-blue-500/50 dark:border-blue-500/50",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
});
DarkOutlineTableRow.displayName = "DarkOutlineTableRow";

/**
 * DarkOutlineTableHead - TableHead component với style dark theme chuẩn
 * Light mode: text-gray-900, bg-gray-50
 * Dark mode: text-white, bg-[#1F1F1F]
 */
export const DarkOutlineTableHead = React.forwardRef<
  React.ElementRef<typeof TableHead>,
  TableHeadProps
>(({ className, ...props }, ref) => {
  return (
    <TableHead
      ref={ref}
      className={cn(
        "text-gray-900 bg-gray-50",
        "dark:text-white dark:bg-[#1F1F1F]",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTableHead.displayName = "DarkOutlineTableHead";

/**
 * DarkOutlineTableCell - TableCell component với style dark theme chuẩn
 * Light mode: text-gray-900
 * Dark mode: text-gray-300
 */
export const DarkOutlineTableCell = React.forwardRef<
  React.ElementRef<typeof TableCell>,
  TableCellProps
>(({ className, ...props }, ref) => {
  return (
    <TableCell
      ref={ref}
      className={cn(
        "text-gray-900",
        "dark:text-gray-300",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTableCell.displayName = "DarkOutlineTableCell";

/**
 * DarkOutlineTableCaption - TableCaption component với style dark theme chuẩn
 */
export const DarkOutlineTableCaption = React.forwardRef<
  React.ElementRef<typeof TableCaption>,
  TableCaptionProps
>(({ className, ...props }, ref) => {
  return (
    <TableCaption
      ref={ref}
      className={cn(
        "text-gray-500",
        "dark:text-gray-400",
        className
      )}
      {...props}
    />
  );
});
DarkOutlineTableCaption.displayName = "DarkOutlineTableCaption";

