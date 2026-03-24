"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const onSingleSelect =
    props.mode === "single"
      ? (props.onSelect as ((day: Date | undefined) => void) | undefined)
      : undefined;

  const handleToday = () => {
    onSingleSelect?.(new Date());
  };

  const handleClear = () => {
    onSingleSelect?.(undefined);
  };

  return (
    <div
      className={cn(
        "w-[320px] rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-md",
        className,
      )}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className="w-full"
        formatters={{
          formatWeekdayName: (date) =>
            new Intl.DateTimeFormat("en-US", { weekday: "short" })
              .format(date)
              .slice(0, 2),
        }}
        classNames={{
          months: "flex flex-col",
          month: "w-full space-y-4",
          month_caption: "relative mb-4 flex items-center justify-center",
          caption: "relative mb-4 flex items-center justify-center",
          caption_label: "text-base font-semibold text-gray-800",
          nav: "pointer-events-none absolute left-0 right-0 top-0 flex h-8 items-center justify-between",
          button_previous: cn(
            buttonVariants({ variant: "ghost" }),
            "pointer-events-auto h-8 w-8 bg-transparent p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900",
          ),
          button_next: cn(
            buttonVariants({ variant: "ghost" }),
            "pointer-events-auto h-8 w-8 bg-transparent p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900",
          ),
          month_grid: "w-full border-collapse",
          weekdays: "grid grid-cols-7 gap-1 mb-2",
          weekday:
            "flex h-8 items-center justify-center text-center text-xs font-medium text-gray-500",
          weeks: "space-y-1",
          week: "grid grid-cols-7 gap-1",
          day: "flex items-center justify-center",
          day_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 p-0 font-normal rounded-md aria-selected:opacity-100 hover:bg-gray-100 text-gray-700",
          ),
          range_end: "day-range-end",
          selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold",
          today: "border border-primary text-primary bg-transparent",
          outside:
            "day-outside text-gray-300 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          disabled: "text-muted-foreground opacity-50",
          range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          Chevron: ({ orientation, className, ...iconProps }) => {
            if (orientation === "left") {
              return <ChevronLeft className={cn("h-4 w-4", className)} />;
            }

            if (orientation === "right" || orientation === "down") {
              return <ChevronRight className={cn("h-4 w-4", className)} />;
            }

            return <ChevronLeft className={cn("h-4 w-4", className)} />;
          },
        }}
        {...props}
      />

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600 cursor-pointer hover:text-gray-900">
          <Clock className="w-4 h-4 mr-2" />
          <span>12:00 AM</span>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleToday}
            className="text-primary hover:underline font-medium"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-900 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
