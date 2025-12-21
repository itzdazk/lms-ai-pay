import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "./utils"
import { Button } from "./button"

export interface CalendarProps {
  mode?: "single" | "range" | "multiple"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
  className?: string
  disabled?: boolean
}

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
]

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  initialFocus = false,
  className,
  disabled = false,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear())

  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(selected.getMonth())
      setCurrentYear(selected.getFullYear())
    }
  }, [selected])

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    const date = new Date(currentYear, currentMonth, day)
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    const date = new Date(currentYear, currentMonth, day)
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleDayClick = (day: number) => {
    if (disabled) return
    const date = new Date(currentYear, currentMonth, day)
    if (onSelect) {
      if (isSelected(day)) {
        onSelect(undefined)
      } else {
        onSelect(date)
      }
    }
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDayClick(day)}
            disabled={disabled}
            className={cn(
              "p-2 text-sm rounded-md transition-colors",
              isSelected(day)
                ? "bg-primary text-primary-foreground font-semibold"
                : isToday(day)
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}



