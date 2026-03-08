import { NextResponse } from "next/server";
import { getRuntimeCatalog, upsertRuntimeWorkingHours } from "@/lib/catalog-store";
import { WorkingHours } from "@/lib/types";

export const runtime = "nodejs";

type UpsertWorkingHoursBody = {
  specialistId: string;
  weekday: number;
  start: string;
  end: string;
  breaks?: Array<{ start?: string; end?: string }>;
};

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const specialistId = url.searchParams.get("specialistId");
    const catalog = await getRuntimeCatalog();

    const rows = specialistId
      ? catalog.workingHours.filter((item) => item.specialistId === specialistId)
      : catalog.workingHours;

    return NextResponse.json({ workingHours: rows });
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać godzin pracy" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpsertWorkingHoursBody;

    if (!body.specialistId || !isValidTime(body.start) || !isValidTime(body.end)) {
      return NextResponse.json({ error: "Nieprawidłowe dane godzin" }, { status: 400 });
    }

    if (!Number.isInteger(body.weekday) || body.weekday < 0 || body.weekday > 6) {
      return NextResponse.json({ error: "Nieprawidłowy dzień tygodnia" }, { status: 400 });
    }

    if (toMinutes(body.start) >= toMinutes(body.end)) {
      return NextResponse.json({ error: "Godzina rozpoczęcia musi być wcześniejsza niż zakończenia" }, { status: 400 });
    }

    const catalog = await getRuntimeCatalog();
    const specialistExists = catalog.specialists.some((item) => item.id === body.specialistId);
    if (!specialistExists) {
      return NextResponse.json({ error: "Nie znaleziono specjalisty" }, { status: 404 });
    }

    const breaks: Array<{ start: string; end: string }> = [];
    const incomingBreaks = Array.isArray(body.breaks) ? body.breaks : [];
    for (const item of incomingBreaks) {
      if (!item.start && !item.end) {
        continue;
      }

      if (!item.start || !item.end || !isValidTime(item.start) || !isValidTime(item.end)) {
        return NextResponse.json({ error: "Każda przerwa musi mieć poprawne godziny od-do" }, { status: 400 });
      }

      if (toMinutes(item.start) >= toMinutes(item.end)) {
        return NextResponse.json({ error: "Przerwa: godzina od musi być wcześniejsza niż do" }, { status: 400 });
      }

      if (toMinutes(item.start) < toMinutes(body.start) || toMinutes(item.end) > toMinutes(body.end)) {
        return NextResponse.json(
          { error: "Przerwy muszą mieścić się w godzinach pracy specjalisty" },
          { status: 400 }
        );
      }

      breaks.push({ start: item.start, end: item.end });
    }

    breaks.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < breaks.length; i += 1) {
      const prev = breaks[i - 1];
      const next = breaks[i];
      if (toMinutes(next.start) < toMinutes(prev.end)) {
        return NextResponse.json({ error: "Przerwy nie mogą się nakładać" }, { status: 400 });
      }
    }

    const payload: WorkingHours = {
      specialistId: body.specialistId,
      weekday: body.weekday,
      start: body.start,
      end: body.end,
      breaks
    };

    await upsertRuntimeWorkingHours(payload);
    return NextResponse.json({ workingHours: payload }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Nie udało się zapisać godzin pracy" }, { status: 500 });
  }
}
