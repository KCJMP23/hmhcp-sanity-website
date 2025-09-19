/**
 * Date Range Picker Component
 * Healthcare compliant with accessibility support
 */

'use client';

import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  from?: Date | null;
  to?: Date | null;
  onSelect: (range: { from: Date | null; to: Date | null }) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (range: any) => {
    onSelect({
      from: range?.from || null,
      to: range?.to || null,
    });
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn(
              'w-[240px] justify-start text-left font-normal',
              !from && !to && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(from, 'LLL dd, y')} - {format(to, 'LLL dd, y')}
                </>
              ) : (
                format(from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={from || new Date()}
            selected={{ from: from || undefined, to: to || undefined }}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}