import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { bookings as mockBookings, services } from "@/lib/mock-data";
import { Booking } from "@/lib/types";

export const runtime = "nodejs";

type CreateBookingBody = {
  specialistId: string;
  serviceId: string;
  startIso: string;
  fullName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
  termsConsent: boolean;
};

function hasConflict(
  specialistId: string,
  start: Date,
  end: Date,
  existingBookings: Booking[]
): boolean {
  return existingBookings
    .filter((item) => item.specialistId === specialistId && item.status !== "cancelled")
    .some((item) => {
      const itemStart = new Date(item.startIso);
      const itemEnd = new Date(item.endIso);
      return start < itemEnd && end > itemStart;
    });
}

type StoredBooking = Booking & {
  fullName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
  termsConsent: boolean;
};

const DATA_DIR = join(process.cwd(), "data");
const BOOKINGS_FILE = join(DATA_DIR, "bookings.json");

async function readStoredBookings(): Promise<StoredBooking[]> {
  try {
    const raw = await readFile(BOOKINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredBooking[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

async function writeStoredBookings(bookings: StoredBooking[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
}

export async function GET() {
  try {
    const stored = await readStoredBookings();
    const merged = [...mockBookings, ...stored];
    return NextResponse.json({ bookings: merged });
  } catch {
    return NextResponse.json({ bookings: mockBookings });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingBody;

    if (
      !body.fullName ||
      !body.email ||
      !body.phone ||
      !body.specialistId ||
      !body.serviceId ||
      !body.startIso
    ) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    if (!body.termsConsent) {
      return NextResponse.json({ error: "Wymagana jest zgoda na regulamin" }, { status: 400 });
    }

    const service = services.find((item) => item.id === body.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Nieznana usługa" }, { status: 400 });
    }

    const start = new Date(body.startIso);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data rozpoczęcia" }, { status: 400 });
    }

    const totalMinutes = service.durationMin + service.bufferMin;
    const end = new Date(start.getTime() + totalMinutes * 60_000);

    const storedBookings = await readStoredBookings();
    const existingBookings: Booking[] = [...mockBookings, ...storedBookings];
    if (hasConflict(body.specialistId, start, end, existingBookings)) {
      return NextResponse.json({ error: "Wybrany termin nie jest już dostępny" }, { status: 409 });
    }

    const created: StoredBooking = {
      id: randomUUID(),
      specialistId: body.specialistId,
      serviceId: body.serviceId,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      status: "new",
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      marketingConsent: Boolean(body.marketingConsent),
      termsConsent: Boolean(body.termsConsent)
    };

    await writeStoredBookings([...storedBookings, created]);

    return NextResponse.json(
      {
        booking: {
          id: created.id,
          specialistId: created.specialistId,
          serviceId: created.serviceId,
          startIso: created.startIso,
          endIso: created.endIso,
          status: created.status
        }
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Błąd API rezerwacji. Uruchom ponownie serwer i spróbuj jeszcze raz." },
      { status: 500 }
    );
  }
}