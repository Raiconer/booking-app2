import { Booking, Specialist, WorkingHours } from "@/lib/types";

const STEP_MIN = 30;
const MS_PER_MIN = 60_000;
const DISPLAY_START_MIN = 8 * 60;
const DISPLAY_END_MIN = 18 * 60;
const DAY_LABEL = new Intl.DateTimeFormat("pl-PL", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Warsaw"
});

export type DayAvailability = {
  dateKey: string;
  dayLabel: string;
  slots: Array<{
    time: string;
    availableMinutes: number;
    isAvailable: boolean;
  }>;
};

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slotIso(day: Date, minuteOffset: number): string {
  const date = new Date(day);
  date.setUTCHours(0, minuteOffset, 0, 0);
  return date.toISOString();
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}

function isOnBreak(startMin: number, endMin: number, breaks: Array<{ start: string; end: string }>): boolean {
  return breaks.some((item) => {
    const breakStart = parseTimeToMinutes(item.start);
    const breakEnd = parseTimeToMinutes(item.end);
    return startMin < breakEnd && endMin > breakStart;
  });
}

function findRule(
  specialistId: string,
  date: Date,
  rules: WorkingHours[]
): WorkingHours | undefined {
  const weekday = date.getDay();
  return rules.find((rule) => rule.specialistId === specialistId && rule.weekday === weekday);
}

function isSegmentFree(
  day: Date,
  minuteStart: number,
  specialistBookings: Booking[],
  breaks: Array<{ start: string; end: string }>
): boolean {
  if (isOnBreak(minuteStart, minuteStart + STEP_MIN, breaks)) {
    return false;
  }

  const segmentStart = new Date(slotIso(day, minuteStart));
  const segmentEnd = new Date(segmentStart.getTime() + STEP_MIN * MS_PER_MIN);

  return !specialistBookings.some((booking) => {
    const bookingStart = new Date(booking.startIso);
    const bookingEnd = new Date(booking.endIso);
    return overlaps(segmentStart, segmentEnd, bookingStart, bookingEnd);
  });
}

export function listVisibleDays(startOffset: number, count: number): Date[] {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );

  return Array.from({ length: count }, (_, idx) => {
    const next = new Date(today);
    next.setUTCDate(today.getUTCDate() + startOffset + idx);
    return next;
  });
}

export function getAvailabilityForSpecialist(
  specialist: Specialist,
  days: Date[],
  schedule: WorkingHours[],
  allBookings: Booking[],
  requiredMinutes: number
): DayAvailability[] {
  const specialistBookings = allBookings.filter(
    (item) => item.specialistId === specialist.id && item.status !== "cancelled"
  );

  return days.map((day) => {
    const rule = findRule(specialist.id, day, schedule);
    const startMin = rule ? parseTimeToMinutes(rule.start) : -1;
    const endMin = rule ? parseTimeToMinutes(rule.end) : -1;
    const slots: Array<{ time: string; availableMinutes: number; isAvailable: boolean }> = [];

    for (let cursor = DISPLAY_START_MIN; cursor + STEP_MIN <= DISPLAY_END_MIN; cursor += STEP_MIN) {
      const candidateStartDate = new Date(slotIso(day, cursor));
      const isWithinWorkingHours =
        Boolean(rule) && cursor >= startMin && cursor + STEP_MIN <= endMin;

      let availableMinutes = 0;
      if (isWithinWorkingHours && candidateStartDate > new Date() && rule) {
        for (let probe = cursor; probe + STEP_MIN <= endMin; probe += STEP_MIN) {
          if (!isSegmentFree(day, probe, specialistBookings, rule.breaks)) {
            break;
          }
          availableMinutes += STEP_MIN;
        }
      }

      const isAvailable = availableMinutes >= requiredMinutes;

      const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
      const mm = String(cursor % 60).padStart(2, "0");
      slots.push({
        time: `${hh}:${mm}`,
        availableMinutes,
        isAvailable
      });
    }

    return {
      dateKey: toDateKey(day),
      dayLabel: DAY_LABEL.format(day),
      slots
    };
  });
}

export function findFirstAvailable(days: DayAvailability[]): string {
  const day = days.find((item) => item.slots.some((slot) => slot.isAvailable));
  if (!day) {
    return "Brak wolnych terminów w tym zakresie";
  }
  const firstSlot = day.slots.find((slot) => slot.isAvailable);
  if (!firstSlot) {
    return "Brak wolnych terminów w tym zakresie";
  }
  return `${day.dayLabel}, godz. ${firstSlot.time}`;
}
