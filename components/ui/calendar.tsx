'use client';

import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  type Locale,
} from 'react-day-picker';

import { cn } from '@/lib/utils';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from 'lucide-react';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('friendly-calendar', className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon
                className={cn('size-4', className)}
                {...props}
              />
            );
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
