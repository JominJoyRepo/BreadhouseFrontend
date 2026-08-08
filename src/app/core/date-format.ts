import {
  DateAdapter,
  MAT_NATIVE_DATE_FORMATS,
  NativeDateAdapter,
} from '@angular/material/core';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const NATIVE_DISPLAY = MAT_NATIVE_DATE_FORMATS.display;

function sameOptions(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ordinalSuffix(day: number): string {
  if (day > 3 && day < 21) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function formatDisplayDate(date: Date | string): string {
  const d =
    typeof date === 'string'
      ? new Date(`${date}T00:00:00`)
      : date;
  return `${d.getDate()}${ordinalSuffix(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`;
}

export class BreadhouseDateAdapter extends NativeDateAdapter {
  override format(
    date: Date,
    displayFormat: string | Intl.DateTimeFormatOptions,
  ): string {
    if (sameOptions(displayFormat, NATIVE_DISPLAY.dateInput)) {
      return formatDisplayDate(date);
    }
    return super.format(date, displayFormat);
  }

  override parse(value: unknown): Date | null {
    if (typeof value === 'string') {
      value = value.replace(/(\d+)(st|nd|rd|th)/i, '$1');
    }
    return super.parse(value);
  }
}

export const breadhouseDateAdapterProvider = {
  provide: DateAdapter,
  useClass: BreadhouseDateAdapter,
};
