"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  services as fallbackServices,
  specialists as fallbackSpecialists
} from "@/lib/mock-data";
import { Booking, Service, Specialist } from "@/lib/types";

type BookingListItem = Booking & {
  fullName?: string;
  email?: string;
  phone?: string;
};

const STATUS_LABEL: Record<Booking["status"], string> = {
  new: "Nowa",
  confirmed: "Potwierdzona",
  cancelled: "Anulowana",
  no_show: "Nieobecność"
};

const WEEKDAY_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function formatDate(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return "Nieznana data";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function AdminReservationsPage() {
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [specialists, setSpecialists] = useState<Specialist[]>(fallbackSpecialists);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>("");
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => monthStart(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          services: Service[];
          specialists: Specialist[];
        };

        if (!Array.isArray(data.services) || !Array.isArray(data.specialists)) {
          return;
        }

        setServices(data.services);
        setSpecialists(data.specialists);
        setSelectedSpecialistId((current) => current || data.specialists[0]?.id || "");
      } catch {
        // Keep fallback values.
      }
    };

    const loadBookings = async () => {
      try {
        const response = await fetch("/api/bookings", { cache: "no-store" });
        if (!response.ok) {
          setErrorMessage("Nie udało się pobrać rezerwacji.");
          return;
        }

        const data = (await response.json()) as { bookings: BookingListItem[] };
        if (!Array.isArray(data.bookings)) {
          setErrorMessage("Nieprawidłowa odpowiedź serwera.");
          return;
        }

        setBookings(data.bookings);
      } catch {
        setErrorMessage("Błąd sieci podczas pobierania rezerwacji.");
      }
    };

    void loadCatalog();
    void loadBookings();
  }, []);

  useEffect(() => {
    if (!selectedSpecialistId && specialists.length > 0) {
      setSelectedSpecialistId(specialists[0].id);
      return;
    }

    if (selectedSpecialistId && !specialists.some((item) => item.id === selectedSpecialistId)) {
      setSelectedSpecialistId(specialists[0]?.id ?? "");
    }
  }, [selectedSpecialistId, specialists]);

  const serviceNameById = useMemo(() => {
    return new Map(services.map((item) => [item.id, item.name]));
  }, [services]);

  const selectedSpecialist = specialists.find((item) => item.id === selectedSpecialistId);

  const specialistBookings = useMemo(() => {
    if (!selectedSpecialistId) {
      return [];
    }

    return bookings
      .filter((item) => item.specialistId === selectedSpecialistId)
      .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());
  }, [bookings, selectedSpecialistId]);

  useEffect(() => {
    setSelectedDateKey("");
  }, [selectedSpecialistId]);

  const bookingsByDay = useMemo(() => {
    const counters = new Map<string, number>();
    for (const booking of specialistBookings) {
      if (booking.status === "cancelled") {
        continue;
      }

      const date = new Date(booking.startIso);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = formatDateKey(date);
      counters.set(key, (counters.get(key) ?? 0) + 1);
    }

    return counters;
  }, [specialistBookings]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("pl-PL", {
      month: "long",
      year: "numeric"
    }).format(visibleMonth);
  }, [visibleMonth]);

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekdayOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date; count: number } | null> = [];
    for (let i = 0; i < firstWeekdayOffset; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = formatDateKey(date);
      cells.push({
        date,
        count: bookingsByDay.get(key) ?? 0
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [bookingsByDay, visibleMonth]);

  const visibleBookings = useMemo(() => {
    if (!selectedDateKey) {
      return specialistBookings;
    }

    return specialistBookings.filter((item) => {
      const date = new Date(item.startIso);
      if (Number.isNaN(date.getTime())) {
        return false;
      }
      return formatDateKey(date) === selectedDateKey;
    });
  }, [selectedDateKey, specialistBookings]);

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Panel administratora</p>
        <h1>Rezerwacje specjalisty</h1>
        <p>Wybierz specjalistę i sprawdź listę jego umówionych wizyt.</p>
        <div className="step-actions">
          <Link href="/admin" className="secondary-action link-action">
            Wróć do panelu admina
          </Link>
          <Link href="/" className="primary-action link-action">
            Wróć do kalendarza
          </Link>
        </div>
      </section>

      <section className="booking-form-panel">
        <label>
          Specjalista
          <select
            value={selectedSpecialistId}
            onChange={(event) => {
              setSelectedSpecialistId(event.target.value);
            }}
          >
            {specialists.map((specialist) => (
              <option key={specialist.id} value={specialist.id}>
                {specialist.fullName}
              </option>
            ))}
          </select>
        </label>
      </section>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <section className="booking-form-panel">
        <div className="calendar-header">
          <h2>Kalendarz rezerwacji</h2>
          <div className="window-controls">
            <button
              type="button"
              onClick={() => {
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                );
              }}
            >
              Poprzedni miesiąc
            </button>
            <button
              type="button"
              onClick={() => {
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                );
              }}
            >
              Kolejny miesiąc
            </button>
          </div>
        </div>

        <p className="selected-summary month-label">{monthLabel}</p>

        <div className="admin-calendar-grid" role="grid" aria-label="Kalendarz rezerwacji">
          {WEEKDAY_SHORT.map((label) => (
            <p key={label} className="calendar-weekday" role="columnheader">
              {label}
            </p>
          ))}

          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="calendar-cell is-empty" aria-hidden="true" />;
            }

            return (
              <div
                key={cell.date.toISOString()}
                className={`calendar-cell ${cell.count > 0 ? "has-bookings" : ""} ${
                  selectedDateKey === formatDateKey(cell.date) ? "is-selected" : ""
                }`.trim()}
                role="gridcell"
                onClick={() => {
                  const dateKey = formatDateKey(cell.date);
                  setSelectedDateKey((current) => (current === dateKey ? "" : dateKey));
                }}
              >
                <span>{cell.date.getDate()}</span>
                {cell.count > 1 ? <span className="booking-count-badge">{cell.count}</span> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="booking-form-panel">
        <h2>
          Lista rezerwacji{selectedSpecialist ? `: ${selectedSpecialist.fullName}` : ""}
        </h2>

        {selectedDateKey ? (
          <p className="selected-summary">
            Filtrowanie po dniu: {selectedDateKey}.{" "}
            <button
              type="button"
              className="text-action"
              onClick={() => {
                setSelectedDateKey("");
              }}
            >
              Wyczyść filtr dnia
            </button>
          </p>
        ) : null}

        {visibleBookings.length === 0 ? (
          <p className="selected-summary">Brak rezerwacji dla wybranego specjalisty.</p>
        ) : (
          <ul className="reservations-list">
            {visibleBookings.map((booking) => {
              const customerLabel = booking.fullName ? booking.fullName : "Dane klienta niedostępne";
              return (
                <li key={booking.id} className="reservations-item">
                  <p>
                    <strong>Termin:</strong> {formatDate(booking.startIso)}
                  </p>
                  <p>
                    <strong>Usługa:</strong> {serviceNameById.get(booking.serviceId) ?? booking.serviceId}
                  </p>
                  <p>
                    <strong>Status:</strong> {STATUS_LABEL[booking.status]}
                  </p>
                  <p>
                    <strong>Klient:</strong> {customerLabel}
                  </p>
                  {booking.phone ? (
                    <p>
                      <strong>Telefon:</strong> {booking.phone}
                    </p>
                  ) : null}
                  {booking.email ? (
                    <p>
                      <strong>E-mail:</strong> {booking.email}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
