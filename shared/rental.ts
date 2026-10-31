export const RENTAL_UNITS_BY_CATEGORY: Record<string, readonly string[]> = {
  العقارات: ["يوم", "أسبوع", "شهر", "سنة"],
  السيارات: ["ساعة", "يوم", "أسبوع"],
  الأزياء: ["يوم", "أسبوع", "مناسبة"],
  الإلكترونيات: ["ساعة", "يوم", "أسبوع"],
  المعدات: ["ساعة", "يوم", "أسبوع", "شهر"],
  "الأثاث والمنزل": ["يوم", "أسبوع", "شهر"],
  المناسبات: ["ساعة", "يوم", "مناسبة"],
  الرحلات: ["يوم", "ليلة", "أسبوع"],
  "أقسام أخرى": ["ساعة", "يوم", "أسبوع", "شهر", "سنة", "مناسبة"],
};

export const ALL_RENTAL_UNITS = [...new Set(Object.values(RENTAL_UNITS_BY_CATEGORY).flat())];
const DAY_MS = 86_400_000;

export function rentalUnitsForCategory(category: string): readonly string[] {
  return RENTAL_UNITS_BY_CATEGORY[category] ?? ["يوم"];
}

function parseUtcDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? timestamp : null;
}

function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? { hours: Number(match[1]), minutes: Number(match[2]) } : null;
}

function addUtcMonths(timestamp: number, months: number): number {
  const source = new Date(timestamp);
  const targetMonthStart = Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1);
  const target = new Date(targetMonthStart);
  const daysInTarget = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const targetDay = Math.min(source.getUTCDate(), daysInTarget);
  return Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), targetDay);
}

function calendarPeriods(start: number, end: number, monthsPerUnit: number): number | null {
  for (let units = 1; units <= 60; units += 1) {
    if (addUtcMonths(start, units * monthsPerUnit) >= end) return units;
  }
  return null;
}

/** Returns whole billable units rounded up, or null for an invalid/non-positive period. */
export function calculateRentalUnits(
  unit: string,
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
): number | null {
  const startDay = parseUtcDate(startDate);
  const endDay = parseUtcDate(endDate);
  if (startDay === null || endDay === null) return null;

  if (unit === "ساعة") {
    if (!startTime || !endTime) return null;
    const from = parseTime(startTime);
    const to = parseTime(endTime);
    if (!from || !to) return null;
    const start = startDay + (from.hours * 60 + from.minutes) * 60_000;
    const end = endDay + (to.hours * 60 + to.minutes) * 60_000;
    if (end <= start) return null;
    return Math.ceil((end - start) / 3_600_000);
  }

  if (endDay <= startDay) return null;
  if (unit === "مناسبة") return 1;
  if (unit === "أسبوع") return Math.ceil((endDay - startDay) / (7 * DAY_MS));
  if (unit === "شهر") return calendarPeriods(startDay, endDay, 1);
  if (unit === "سنة") return calendarPeriods(startDay, endDay, 12);
  return Math.ceil((endDay - startDay) / DAY_MS);
}

export function formatRentalDuration(units: number, unit: string): string {
  const number = new Intl.NumberFormat("ar-SA").format(units);
  const forms: Record<string, [string, string, string, string]> = {
    ساعة: ["ساعة", "ساعتان", "ساعات", "ساعة"],
    يوم: ["يوم", "يومان", "أيام", "يومًا"],
    ليلة: ["ليلة", "ليلتان", "ليالٍ", "ليلة"],
    أسبوع: ["أسبوع", "أسبوعان", "أسابيع", "أسبوعًا"],
    شهر: ["شهر", "شهران", "أشهر", "شهرًا"],
    سنة: ["سنة", "سنتان", "سنوات", "سنة"],
    مناسبة: ["مناسبة", "مناسبتان", "مناسبات", "مناسبة"],
  };
  const [one, two, few, many] = forms[unit] ?? [unit, unit, unit, unit];
  const form = units === 1 ? one : units === 2 ? two : units <= 10 ? few : many;
  return `${number} ${form}`;
}
