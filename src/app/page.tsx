"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  findFirstAvailable,
  getAvailabilityForSpecialist,
  listVisibleDays
} from "@/lib/availability";
import {
  bookings as fallbackBookings,
  services as fallbackServices,
  specialists as fallbackSpecialists,
  workingHours as fallbackWorkingHours
} from "@/lib/mock-data";
import { Booking, Service, Specialist, WorkingHours } from "@/lib/types";

const DAY_WINDOW = 4;

type SelectedSlot = {
  specialistId: string;
  specialistName: string;
  dateKey: string;
  dayLabel: string;
  hourMinute: string;
  availableMinutes: number;
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didInitFromUrl = useRef(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("all");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>("all");
  const [startOffset, setStartOffset] = useState<number>(0);
  const [allBookings, setAllBookings] = useState<Booking[]>(fallbackBookings);
  const [catalog, setCatalog] = useState<{
    services: Service[];
    specialists: Specialist[];
    workingHours: WorkingHours[];
  }>({
    services: fallbackServices,
    specialists: fallbackSpecialists,
    workingHours: fallbackWorkingHours
  });
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [nearestSlotKey, setNearestSlotKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await fetch("/api/bookings", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { bookings: Booking[] };
        setAllBookings(data.bookings);
      } catch {
        // Keep fallback mock bookings when network request fails.
      }
    };

    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          services: Service[];
          specialists: Specialist[];
          workingHours: WorkingHours[];
        };

        if (!Array.isArray(data.services) || !Array.isArray(data.specialists) || !Array.isArray(data.workingHours)) {
          return;
        }

        setCatalog({
          services: data.services,
          specialists: data.specialists,
          workingHours: data.workingHours
        });
      } catch {
        // Keep fallback catalog when network request fails.
      }
    };

    void loadBookings();
    void loadCatalog();
  }, []);

  useEffect(() => {
    if (didInitFromUrl.current) {
      return;
    }

    const city = searchParams.get("city");
    const service = searchParams.get("service");
    const specialist = searchParams.get("specialist");
    const offsetRaw = searchParams.get("offset");

    if (city) {
      setSelectedCity(city);
    }
    if (service) {
      setSelectedServiceId(service);
    }
    if (specialist) {
      setSelectedSpecialistId(specialist);
    }
    if (offsetRaw) {
      const parsed = Number.parseInt(offsetRaw, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        setStartOffset(parsed);
      }
    }

    didInitFromUrl.current = true;
  }, [searchParams]);

  const cities = useMemo(
    () => Array.from(new Set(catalog.specialists.map((item) => item.city))).sort(),
    [catalog.specialists]
  );

  const selectedService =
    selectedServiceId === "all"
      ? undefined
      : catalog.services.find((item) => item.id === selectedServiceId);

  const specialistsForSelect = useMemo(() => {
    return catalog.specialists.filter((specialist) => {
      const byCity = selectedCity === "all" || specialist.city === selectedCity;
      const byService =
        selectedServiceId === "all" ||
        specialist.serviceIds.includes(selectedServiceId);
      return byCity && byService;
    });
  }, [catalog.specialists, selectedCity, selectedServiceId]);

  const days = useMemo(() => listVisibleDays(startOffset, DAY_WINDOW), [startOffset]);

  useEffect(() => {
    if (!didInitFromUrl.current) {
      return;
    }

    const nextParams = new URLSearchParams();
    if (selectedCity !== "all") {
      nextParams.set("city", selectedCity);
    }
    if (selectedServiceId !== "all") {
      nextParams.set("service", selectedServiceId);
    }
    if (selectedSpecialistId !== "all") {
      nextParams.set("specialist", selectedSpecialistId);
    }
    if (startOffset > 0) {
      nextParams.set("offset", String(startOffset));
    }

    const query = nextParams.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }, [router, selectedCity, selectedServiceId, selectedSpecialistId, startOffset]);

  useEffect(() => {
    if (selectedCity !== "all" && !cities.includes(selectedCity)) {
      setSelectedCity("all");
    }
  }, [cities, selectedCity]);

  useEffect(() => {
    if (
      selectedServiceId !== "all" &&
      !catalog.services.some((item) => item.id === selectedServiceId)
    ) {
      setSelectedServiceId("all");
    }
  }, [catalog.services, selectedServiceId]);

  useEffect(() => {
    if (selectedSpecialistId === "all") {
      return;
    }

    const stillAvailable = specialistsForSelect.some(
      (specialist) => specialist.id === selectedSpecialistId
    );

    if (!stillAvailable) {
      setSelectedSpecialistId("all");
    }
  }, [selectedSpecialistId, specialistsForSelect]);

  const filteredSpecialists = useMemo(() => {
    return catalog.specialists.filter((specialist) => {
      const byCity = selectedCity === "all" || specialist.city === selectedCity;
      const byService =
        selectedServiceId === "all" ||
        specialist.serviceIds.includes(selectedServiceId);
      const bySpecialist =
        selectedSpecialistId === "all" ||
        specialist.id === selectedSpecialistId;
      return byCity && byService && bySpecialist;
    });
  }, [catalog.specialists, selectedCity, selectedServiceId, selectedSpecialistId]);

  const minimalSlotMinutes = selectedService?.durationMin ?? 30;

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">MVP rezerwacji</p>
        <h1>Znajdź specjalistę i pasujący termin w jednym widoku</h1>
        <p>
          Porównuj specjalistów i dostępne godziny równolegle. Koniec z
          wybieraniem jednej osoby tylko po to, by zaczynać szukanie od nowa.
        </p>
        <Link href="/admin" className="secondary-action link-action">
          Przejdź do panelu administratora
        </Link>
      </section>

      <section className="filters">
        <div className="filter-group">
          <label htmlFor="city">Miasto</label>
          <select
            id="city"
            value={selectedCity}
            onChange={(event) => {
              setSelectedCity(event.target.value);
            }}
          >
            <option value="all">Wszystkie miasta</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="service">Usługa</label>
          <select
            id="service"
            value={selectedServiceId}
            onChange={(event) => {
              setSelectedServiceId(event.target.value);
            }}
          >
            <option value="all">Wszystkie usługi</option>
            {catalog.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMin} min)
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="specialist">Specjalista</label>
          <select
            id="specialist"
            value={selectedSpecialistId}
            onChange={(event) => {
              setSelectedSpecialistId(event.target.value);
            }}
          >
            <option value="all">Wszyscy specjaliści</option>
            {specialistsForSelect.map((specialist) => (
              <option key={specialist.id} value={specialist.id}>
                {specialist.fullName}
              </option>
            ))}
          </select>
        </div>

      </section>

      <section className="slots-legend" aria-label="Legenda statusu terminów">
        <p>
          <span className="legend-dot legend-dot-available" aria-hidden="true" />
          Wolne
        </p>
        <p>
          <span className="legend-dot legend-dot-unavailable" aria-hidden="true" />
          Niedostępne
        </p>
      </section>

      <section className="cards-grid">
        {filteredSpecialists.length === 0 ? (
          <article className="empty-state">
            <h2>Nie znaleziono specjalistów</h2>
            <p>Spróbuj usunąć jeden z filtrów.</p>
          </article>
        ) : (
          filteredSpecialists.map((specialist) => {
            const availability = getAvailabilityForSpecialist(
              specialist,
              days,
              catalog.workingHours,
              allBookings,
              minimalSlotMinutes
            );

            const nearest = availability
              .flatMap((day) =>
                day.slots
                  .filter((slot) => slot.isAvailable)
                  .map((slot) => ({
                    dateKey: day.dateKey,
                    dayLabel: day.dayLabel,
                    hourMinute: slot.time,
                    availableMinutes: slot.availableMinutes
                  }))
              )
              .at(0);

            const nearestKey = nearest
              ? `${specialist.id}|${nearest.dateKey}|${nearest.hourMinute}`
              : null;

            return (
              <article key={specialist.id} className="specialist-card">
                <div className="card-top">
                  <header>
                    <p className="role">{specialist.role}</p>
                    <h2>{specialist.fullName}</h2>
                    <p className="city">{specialist.city}</p>
                  </header>

                  <div className="window-controls card-window-controls">
                    <button
                      type="button"
                      onClick={() => {
                        setStartOffset((value) => Math.max(0, value - DAY_WINDOW));
                      }}
                    >
                      Poprzednie dni
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartOffset((value) => value + DAY_WINDOW);
                      }}
                    >
                      Kolejne dni
                    </button>
                  </div>
                </div>

                <p className="first-available">
                  Najbliższy termin: {findFirstAvailable(availability)}
                </p>

                <button
                  type="button"
                  className="secondary-action"
                  disabled={!nearest}
                  onClick={() => {
                    if (!nearest) {
                      return;
                    }

                    setSelectedSlot({
                      specialistId: specialist.id,
                      specialistName: specialist.fullName,
                      dateKey: nearest.dateKey,
                      dayLabel: nearest.dayLabel,
                      hourMinute: nearest.hourMinute,
                      availableMinutes: nearest.availableMinutes
                    });
                    setNearestSlotKey(nearestKey);
                    setErrorMessage("");
                  }}
                >
                  Najbliższy wolny
                </button>

                <div className="day-strip" role="list" aria-label="Dostępne dni">
                  {availability.map((day) => (
                    <section key={day.dateKey} className="day-column" role="listitem">
                      <h3>{day.dayLabel}</h3>
                      <div className="slots">
                        {day.slots.map((slot) => {
                          const slotKey = `${specialist.id}|${day.dateKey}|${slot.time}`;
                          const isSelected =
                            selectedSlot?.specialistId === specialist.id &&
                            selectedSlot?.dateKey === day.dateKey &&
                            selectedSlot?.hourMinute === slot.time;
                          const isNearestSelected =
                            isSelected && nearestSlotKey === slotKey;

                          return (
                            <button
                              type="button"
                              key={`${day.dateKey}-${slot.time}`}
                              className={`${isSelected ? "is-selected" : ""} ${
                                isNearestSelected ? "is-nearest-selected" : ""
                              } ${!slot.isAvailable ? "is-unavailable" : ""}`.trim()}
                              disabled={!slot.isAvailable}
                              onClick={() => {
                                if (!slot.isAvailable) {
                                  return;
                                }

                                setSelectedSlot({
                                  specialistId: specialist.id,
                                  specialistName: specialist.fullName,
                                  dateKey: day.dateKey,
                                  dayLabel: day.dayLabel,
                                  hourMinute: slot.time,
                                  availableMinutes: slot.availableMinutes
                                });
                                setNearestSlotKey(null);
                                setErrorMessage("");
                              }}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                <footer>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => {
                      if (!selectedSlot || selectedSlot.specialistId !== specialist.id) {
                        setErrorMessage("Najpierw wybierz godzinę u tego specjalisty.");
                        return;
                      }

                      const search = new URLSearchParams({
                        specialistId: selectedSlot.specialistId,
                        dateKey: selectedSlot.dateKey,
                        dayLabel: selectedSlot.dayLabel,
                        time: selectedSlot.hourMinute,
                        availableMinutes: String(selectedSlot.availableMinutes),
                        preferredServiceId: selectedServiceId
                      });
                      router.push(`/rezerwacja?${search.toString()}`);
                    }}
                  >
                    Przejdź do rezerwacji
                  </button>
                </footer>
              </article>
            );
          })
        )}
      </section>

    </main>
  );
}